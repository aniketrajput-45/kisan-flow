const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.pg);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Enable mock db fallback strictly when process.env.USE_MOCK_DB === 'true'
if (process.env.USE_MOCK_DB === 'true') {
  console.log('[DB] USE_MOCK_DB is enabled. Initializing test memory database adapter.');
  const setupDbFallback = require('./dbFallback');
  setupDbFallback(pool);
}

module.exports = pool;


