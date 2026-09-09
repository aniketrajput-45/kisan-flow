const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function migrate() {
  console.log('[Migration] Starting database migration...');
  const migrationPath = path.join(__dirname, '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[Migration] Migration executed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Migration Error]', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;
