const pool = require('../../db');

// Controller to fetch available vehicles
const getAvailableVehicles = async (req, res) => {
  try {
    const { location } = req.query;
    const query = `
      SELECT v.vehicle_id, v.model, v.price_per_hour, v.status, v.location, b.brand_name, t.type_name
      FROM vehicles v
      JOIN brands b ON v.brand_id = b.brand_id
      JOIN types t ON v.type_id = t.type_id
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
};

// Controller to add a vehicle
const addVehicle = async (req, res) => {
  const { model, price_per_hour, status, location, brand_id, type_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicles (model, price_per_hour, status, location, brand_id, type_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [model, price_per_hour, status, location, brand_id, type_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const getAllVehicles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getVehicleById = async (req, res) => {
  const vehicleId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM Vehicles WHERE vehicle_id = $1', [vehicleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching vehicle by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAvailableVehicles,
  addVehicle,
  getAllVehicles,
  getVehicleById
};
