const pool = require('../../db');

// Get all statuses (vehicle statuses, payment statuses)
const getStatuses = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM statuses');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Get status by ID
const getStatusById = async (req, res) => {
  const { status_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM statuses WHERE status_id = $1', [status_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Status not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = {
  getStatuses,
  getStatusById
};
