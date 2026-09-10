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
    await client.query(`
      INSERT INTO centres (name, code, district, state, capacity, is_active)
      VALUES ('Burdwan Central Procurement Centre', 'BDW-01', 'Burdwan', 'West Bengal', 500, true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    `);

    await client.query(`
      INSERT INTO centres (name, code, district, state, capacity, is_active)
      VALUES ('Durgapur Sub-Division Procurement Centre', 'DGP-01', 'Paschim Bardhaman', 'West Bengal', 400, true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    `);

    const centre1Res = await client.query(`SELECT id FROM centres WHERE code = 'BDW-01'`);
    const centre2Res = await client.query(`SELECT id FROM centres WHERE code = 'DGP-01'`);

    const centre1Id = centre1Res.rows[0].id;
    const centre2Id = centre2Res.rows[0].id;

    // 3. Seed Slots for Demo Date (Tomorrow)
    const demoDate = '2026-09-10';

    // Slots for Centre 1
    const slotsCentre1 = [
      { start: '09:00:00', end: '11:00:00', capacity: 50 },
      { start: '11:00:00', end: '13:00:00', capacity: 50 },
      { start: '14:00:00', end: '16:00:00', capacity: 50 },
    ];

    for (const slot of slotsCentre1) {
      await client.query(`
        INSERT INTO slots (centre_id, slot_date, start_time, end_time, capacity, booked_count)
        VALUES ($1, $2, $3, $4, $5, 0)
        ON CONFLICT (id, centre_id) DO NOTHING;
      `, [centre1Id, demoDate, slot.start, slot.end, slot.capacity]);
    }

    // Slots for Centre 2
    for (const slot of slotsCentre1) {
      await client.query(`
        INSERT INTO slots (centre_id, slot_date, start_time, end_time, capacity, booked_count)
        VALUES ($1, $2, $3, $4, $5, 0)
        ON CONFLICT (id, centre_id) DO NOTHING;
      `, [centre2Id, demoDate, slot.start, slot.end, slot.capacity]);
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
