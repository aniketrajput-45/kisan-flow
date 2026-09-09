const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool(config.pg);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
