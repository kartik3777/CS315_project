const pool = require('../../db');

// Create a new booking
const createBooking = async (req, res) => {
  const { user_id, vehicle_id, start_time, end_time } = req.body;
  try {
    // Check if the vehicle is already booked for the specified time range
    const existingBooking = await pool.query(`
      SELECT 1 FROM bookings
      WHERE vehicle_id = $1 AND tstzrange(start_time, end_time) && tstzrange($2, $3)
    `, [vehicle_id, start_time, end_time]);

    if (existingBooking.rowCount > 0) {
      return res.status(409).json({ error: 'Vehicle already booked for this time range.' });
    }

    // Insert the new booking
    const newBooking = await pool.query(`
      INSERT INTO bookings (user_id, vehicle_id, start_time, end_time, status_id)
      VALUES ($1, $2, $3, $4, 1) RETURNING *;
    `, [user_id, vehicle_id, start_time, end_time]);

    // Update vehicle status to "booked"
    await pool.query(`UPDATE vehicles SET status = 'booked' WHERE vehicle_id = $1`, [vehicle_id]);

    res.json(newBooking.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Get all bookings by user
const getBookingsByUser = async (req, res) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT b.booking_id, b.start_time, b.end_time, b.status_id, v.model, v.location
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      WHERE b.user_id = $1
    `, [user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  createBooking,
  getBookingsByUser
};
