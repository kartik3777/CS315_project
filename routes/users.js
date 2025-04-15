const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `, [name, email, hashed, role]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Registration failed');
  }
});

module.exports = router;
