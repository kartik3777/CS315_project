const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all available vehicles
router.get('/available', async (req, res) => {
  try {
    const { location } = req.query;
    const query = `
      SELECT v.vehicle_id, v.model, v.price_per_hour, b.brand_name, t.type_name
      FROM vehicles v
      JOIN vehicle_brands b ON v.brand_id = b.brand_id
      JOIN vehicle_types t ON v.type_id = t.type_id
      WHERE v.status = 'available'
      ${location ? 'AND v.location = $1' : ''}
    `;
    const values = location ? [location] : [];
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
