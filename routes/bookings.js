const express = require('express');
const router = express.Router();
const pool = require('../db');

// Book a vehicle
router.post('/', async (req, res) => {
  const { user_id, vehicle_id, start_time, end_time } = req.body;
  try {
    await pool.query('BEGIN');

    // Check availability
    const existing = await pool.query(`
      SELECT 1 FROM bookings
      WHERE vehicle_id = $1 AND tstzrange(start_time, end_time) && tstzrange($2, $3)
    `, [vehicle_id, start_time, end_time]);

    if (existing.rowCount > 0) {
      await pool.query('ROLLBACK');
      return res.status(409).json({ error: 'Vehicle already booked in this time range.' });
    }

    // Insert booking
    const insertBooking = await pool.query(`
      INSERT INTO bookings (user_id, vehicle_id, start_time, end_time, status_id)
      VALUES ($1, $2, $3, $4, 1) RETURNING *;
    `, [user_id, vehicle_id, start_time, end_time]);

    // Update vehicle status
    await pool.query(`UPDATE vehicles SET status = 'booked' WHERE vehicle_id = $1`, [vehicle_id]);

    await pool.query('COMMIT');
    res.json(insertBooking.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
