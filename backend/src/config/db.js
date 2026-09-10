const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.pg);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Enable mock db fallback automatically when local Postgres is unavailable or USE_MOCK_DB is set
const setupDbFallback = require('./dbFallback');
setupDbFallback(pool);

module.exports = pool;



