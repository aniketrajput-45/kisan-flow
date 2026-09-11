const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function initDb() {
  console.log('[InitDB] Connecting to PostgreSQL database...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'FARMER',
        password_hash VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS centres (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        district VARCHAR(100),
        state VARCHAR(100),
        capacity INT DEFAULT 500,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        centre_id INT REFERENCES centres(id) ON DELETE CASCADE,
        slot_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        capacity INT DEFAULT 50,
        booked_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_centre_slot UNIQUE (centre_id, slot_date, start_time)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        centre_id INT REFERENCES centres(id) ON DELETE CASCADE,
        slot_id INT REFERENCES slots(id) ON DELETE CASCADE,
        token_number VARCHAR(50) UNIQUE NOT NULL,
        qr_code TEXT NOT NULL,
        crop VARCHAR(100) NOT NULL,
        quantity_kg NUMERIC(10, 2) NOT NULL,
        booking_date DATE NOT NULL,
        slot_time VARCHAR(50),
        status VARCHAR(30) DEFAULT 'BOOKED',
        actual_quantity_kg NUMERIC(10, 2),
        quality_grade VARCHAR(50),
        procurement_officer_id INT REFERENCES users(id),
        procurement_timestamp TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        booking_id INT UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        status VARCHAR(30) DEFAULT 'RECORDED',
        reference_number VARCHAR(100) UNIQUE,
        payment_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (name, phone, role, password_hash)
      VALUES 
        ('Ramesh Kumar', '9876543210', 'FARMER', $1),
        ('Suresh Sharma', '9876543211', 'OFFICER', $1),
        ('Anita Roy', '9876543212', 'ADMIN', $1)
      ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);

    // Seed Centres
    await client.query(`
      INSERT INTO centres (id, name, code, district, state, capacity, is_active)
      VALUES 
        (1, 'Burdwan Central Procurement Centre', 'BDW-01', 'Burdwan', 'West Bengal', 500, true),
        (2, 'Durgapur Sub-Division Procurement Centre', 'DGP-01', 'Paschim Bardhaman', 'West Bengal', 400, true)
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
    `);

    // Seed Slots matching user spec:
    // Slots for 2026-09-10
    // 1 | centre 1 | 2026-09-10 | 09:00-11:00 | capacity 8
    // 2 | centre 1 | 2026-09-10 | 11:00-13:00 | capacity 8
    // 3 | centre 1 | 2026-09-10 | 14:00-16:00 | capacity 8
    // 4 | centre 2 | 2026-09-10 | 09:00-11:00 | capacity 8
    // 5 | centre 2 | 2026-09-10 | 11:00-13:00 | capacity 8
    // 6 | centre 2 | 2026-09-10 | 14:00-16:00 | capacity 8

    await client.query(`
      INSERT INTO slots (id, centre_id, slot_date, start_time, end_time, capacity, booked_count)
      VALUES 
        (1, 1, '2026-09-10', '09:00:00', '11:00:00', 8, 0),
        (2, 1, '2026-09-10', '11:00:00', '13:00:00', 8, 0),
        (3, 1, '2026-09-10', '14:00:00', '16:00:00', 8, 0),
        (4, 2, '2026-09-10', '09:00:00', '11:00:00', 8, 0),
        (5, 2, '2026-09-10', '11:00:00', '13:00:00', 8, 0),
        (6, 2, '2026-09-10', '14:00:00', '16:00:00', 8, 0)
      ON CONFLICT (centre_id, slot_date, start_time) DO UPDATE SET capacity = 8, booked_count = EXCLUDED.booked_count;
    `);

    // Reset slot id sequence if needed
    await client.query(`SELECT setval('slots_id_seq', (SELECT MAX(id) FROM slots));`);
    await client.query(`SELECT setval('centres_id_seq', (SELECT MAX(id) FROM centres));`);
    await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);

    await client.query('COMMIT');
    console.log('[InitDB] PostgreSQL Database successfully initialized and seeded!');

    const usersRes = await client.query('SELECT id, name, phone, role FROM users');
    console.log('\n--- USERS ---');
    console.table(usersRes.rows);

    const slotsRes = await client.query('SELECT id, centre_id, slot_date::text, start_time, end_time, capacity, booked_count FROM slots');
    console.log('\n--- SLOTS ---');
    console.table(slotsRes.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[InitDB Error]', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

initDb();
