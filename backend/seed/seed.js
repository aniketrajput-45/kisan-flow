const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seed() {
  console.log('[Seed] Starting demo data seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Farmer
    await client.query(`
      INSERT INTO users (name, phone, role, password_hash)
      VALUES ('Ramesh Kumar', '9876543210', 'FARMER', $1)
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);

    // Officer
    await client.query(`
      INSERT INTO users (name, phone, role, password_hash)
      VALUES ('Suresh Sharma', '9876543211', 'OFFICER', $1)
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);

    // Admin
    await client.query(`
      INSERT INTO users (name, phone, role, password_hash)
      VALUES ('Anita Roy', '9876543212', 'ADMIN', $1)
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);

    // 2. Seed Centres
    const centre1Res = await client.query(`
      INSERT INTO centres (name, code, district, state, capacity, is_active)
      VALUES ('Burdwan Central Procurement Centre', 'BDW-01', 'Burdwan', 'West Bengal', 500, true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);

    const centre2Res = await client.query(`
      INSERT INTO centres (name, code, district, state, capacity, is_active)
      VALUES ('Durgapur Sub-Division Procurement Centre', 'DGP-01', 'Paschim Bardhaman', 'West Bengal', 400, true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);

    const centre1Id = centre1Res.rows[0].id;
    const centre2Id = centre2Res.rows[0].id;

    // 3. Seed Slots for Today & Upcoming Demo Dates
    const todayStr = new Date().toISOString().split('T')[0];
    const demoDates = Array.from(new Set([
      '2026-09-10',
      '2026-09-11',
      todayStr,
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
    ]));

    const standardSlots = [
      { start: '09:00:00', end: '11:00:00', capacity: 50 },
      { start: '11:00:00', end: '13:00:00', capacity: 50 },
      { start: '14:00:00', end: '16:00:00', capacity: 50 },
      { start: '16:00:00', end: '18:00:00', capacity: 50 },
    ];

    for (const dDate of demoDates) {
      for (const slot of standardSlots) {
        // Centre 1
        await client.query(`
          INSERT INTO slots (centre_id, slot_date, start_time, end_time, capacity, booked_count)
          VALUES ($1, $2, $3, $4, $5, 0)
          ON CONFLICT DO NOTHING;
        `, [centre1Id, dDate, slot.start, slot.end, slot.capacity]);

        // Centre 2
        await client.query(`
          INSERT INTO slots (centre_id, slot_date, start_time, end_time, capacity, booked_count)
          VALUES ($1, $2, $3, $4, $5, 0)
          ON CONFLICT DO NOTHING;
        `, [centre2Id, dDate, slot.start, slot.end, slot.capacity]);
      }
    }

    await client.query('COMMIT');
    console.log('[Seed] Seeding completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
