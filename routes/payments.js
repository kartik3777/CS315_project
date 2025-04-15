const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  const { booking_id, amount, method_id, status_id } = req.body;
  try {
    const payment = await pool.query(`
      INSERT INTO payments (booking_id, amount, method_id, status_id)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `, [booking_id, amount, method_id, status_id]);

    res.json(payment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Payment error');
  }
});

module.exports = router;
