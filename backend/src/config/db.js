const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
  pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT DEFAULT 1')
    .catch(err => console.error('Auto-migration error:', err));
  pool.query('ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT \'viewer\'')
    .catch(err => console.error('Auto-migration error:', err));
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
