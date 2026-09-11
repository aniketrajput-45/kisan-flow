const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function migrate() {
  console.log('[Migration] Starting database migration...');
  const files = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    for (const file of files) {
      console.log(`[Migration] Executing ${file}...`);
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    }
    console.log('[Migration] All migrations executed successfully.');
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
