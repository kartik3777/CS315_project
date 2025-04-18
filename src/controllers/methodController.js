const pool = require('../../db');

// Get all payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM methods');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Get payment method by ID
const getPaymentMethodById = async (req, res) => {
  const { method_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM methods WHERE method_id = $1', [method_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Payment method not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  getPaymentMethods,
  getPaymentMethodById
};
