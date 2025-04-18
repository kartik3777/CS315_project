const pool = require('../../db');

// Create a payment
const createPayment = async (req, res) => {
  const { booking_id, amount, method_id, status_id } = req.body;
  try {
    // Check if the booking exists
    const booking = await pool.query('SELECT * FROM bookings WHERE booking_id = $1', [booking_id]);
    if (booking.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Create the payment
    const newPayment = await pool.query(`
      INSERT INTO payments (booking_id, amount, method_id, status_id)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `, [booking_id, amount, method_id, status_id]);

    res.json(newPayment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Payment error');
  }
};

// Get payment details for a booking
const getPaymentDetails = async (req, res) => {
  const { booking_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.payment_id, p.amount, m.method_name, s.status_name, p.payment_time
      FROM payments p
      JOIN methods m ON p.method_id = m.method_id
      JOIN statuses s ON p.status_id = s.status_id
      WHERE p.booking_id = $1
    `, [booking_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Payment not found for this booking.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  createPayment,
  getPaymentDetails
};
