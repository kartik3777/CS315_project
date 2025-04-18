const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../src/config/.env') });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.stack);
  });

module.exports = pool;
