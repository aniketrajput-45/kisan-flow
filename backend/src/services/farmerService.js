const pool = require('../config/db');
const { generateQrData } = require('../utils/qr');

class FarmerService {
  async getCentres() {
    const result = await pool.query(
      `SELECT id, name, code, district, state, capacity
       FROM centres
       WHERE is_active = true
       ORDER BY name ASC`
    );
    if (!result.rows || result.rows.length === 0) {
      return [
        { id: 1, name: 'Burdwan Central Procurement Centre', code: 'BDW-01', district: 'Burdwan', state: 'West Bengal', capacity: 500 },
        { id: 2, name: 'Durgapur Sub-Division Procurement Centre', code: 'DGP-01', district: 'Paschim Bardhaman', state: 'West Bengal', capacity: 400 },
        { id: 3, name: 'Asansol Regional Procurement Centre', code: 'ASN-01', district: 'Paschim Bardhaman', state: 'West Bengal', capacity: 450 }
      ];
    }
    return result.rows;
  }

  async getSlots(centreId, date, userId = null) {
    if (!centreId || !date) {
      const err = new Error('centreId and date query parameters are required');
      err.statusCode = 400;
      throw err;
    }

    const cleanDate = String(date).split('T')[0];
    const parsedUserId = userId ? parseInt(userId, 10) : null;

    let result = await pool.query(
      `SELECT id, centre_id, slot_date::text AS slot_date, start_time, end_time, capacity, booked_count,
              (capacity - booked_count) AS available_count,
              EXISTS (
                SELECT 1 FROM bookings b
                WHERE b.slot_id = slots.id
                  AND ($3::int IS NOT NULL AND b.user_id = $3::int)
                  AND b.status IN ('BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING')
              ) AS is_already_booked
       FROM slots
       WHERE centre_id = $1 AND slot_date = $2
       ORDER BY start_time ASC`,
      [centreId, cleanDate, parsedUserId]
    );

    if (result.rows.length === 0) {
      try {
        await pool.query(
          `INSERT INTO slots (centre_id, slot_date, start_time, end_time, capacity, booked_count)
           VALUES 
             ($1, $2, '09:00:00', '11:00:00', 50, 0),
             ($1, $2, '11:00:00', '13:00:00', 50, 0),
             ($1, $2, '14:00:00', '16:00:00', 50, 0),
             ($1, $2, '16:00:00', '18:00:00', 50, 0)`,
          [centreId, cleanDate]
        );
        result = await pool.query(
          `SELECT id, centre_id, slot_date::text AS slot_date, start_time, end_time, capacity, booked_count,
                  (capacity - booked_count) AS available_count,
                  EXISTS (
                    SELECT 1 FROM bookings b
                    WHERE b.slot_id = slots.id
                      AND ($3::int IS NOT NULL AND b.user_id = $3::int)
                      AND b.status IN ('BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING')
                  ) AS is_already_booked
           FROM slots
           WHERE centre_id = $1 AND slot_date = $2
           ORDER BY start_time ASC`,
          [centreId, cleanDate, parsedUserId]
        );
      } catch (e) {
        // Non-fatal if concurrency collision
      }
    }

    return result.rows;
  }

  async createBooking(userId, { centre_id, slot_id, crop, quantity_kg }) {
    if (!centre_id || !slot_id || !crop || !quantity_kg) {
      const err = new Error('centre_id, slot_id, crop, and quantity_kg are required');
      err.statusCode = 400;
      throw err;
    }

    if (quantity_kg <= 0) {
      const err = new Error('quantity_kg must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 0. Validate user existence in database
      const userCheck = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        const err = new Error('User session invalid or user account no longer exists. Please log in again.');
        err.statusCode = 401;
        throw err;
      }

      // 1. SELECT slot FOR UPDATE to lock the row and prevent race conditions
      const slotRes = await client.query(
        `SELECT id, centre_id, slot_date, capacity, booked_count
         FROM slots
         WHERE id = $1
         FOR UPDATE`,
        [slot_id]
      );

      if (slotRes.rows.length === 0) {
        const err = new Error('Requested slot does not exist');
        err.statusCode = 404;
        throw err;
      }

      const slot = slotRes.rows[0];

      // 2. Validate centre ↔ slot consistency
      if (parseInt(slot.centre_id, 10) !== parseInt(centre_id, 10)) {
        const err = new Error('Slot does not belong to the specified procurement centre');
        err.statusCode = 400;
        throw err;
      }

      // 3. Validate capacity
      if (slot.booked_count >= slot.capacity) {
        const err = new Error('Slot capacity reached. Please select a different slot.');
        err.statusCode = 409;
        throw err;
      }

      // 4. Check for active double booking by the farmer for this slot
      const activeBookingCheck = await client.query(
        `SELECT id FROM bookings
         WHERE user_id = $1 AND slot_id = $2
           AND status IN ('BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING')`,
        [userId, slot_id]
      );

      if (activeBookingCheck.rows.length > 0) {
        const err = new Error('You already have an active booking for this slot');
        err.statusCode = 400;
        throw err;
      }

      // Derive booking_date from slot.slot_date
      const bookingDate = slot.slot_date;

      // 5. Generate Centre + Date scoped token number (e.g. BDW-001)
      const centreCodeRes = await client.query(
        'SELECT code FROM centres WHERE id = $1',
        [centre_id]
      );
      const centreCodePrefix = centreCodeRes.rows[0]?.code ? centreCodeRes.rows[0].code.split('-')[0] : 'TKN';

      const tokenCountRes = await client.query(
        `SELECT COUNT(*) AS total
         FROM bookings
         WHERE centre_id = $1 AND booking_date = $2`,
        [centre_id, bookingDate]
      );
      const tokenSeq = (tokenCountRes.rows && tokenCountRes.rows[0] ? parseInt(tokenCountRes.rows[0].total, 10) : 0) + 1;
      const tokenNumber = `${centreCodePrefix}-${String(tokenSeq).padStart(3, '0')}`;

      // 6. Generate QR code identifier
      const qrIdentifier = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const { qrString } = await generateQrData(qrIdentifier);

      // 7. Insert booking record
      const insertRes = await client.query(
        `INSERT INTO bookings
         (user_id, centre_id, slot_id, booking_date, token_number, qr_code, crop, quantity_kg, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'BOOKED')
         RETURNING id, user_id, centre_id, slot_id, booking_date, token_number, qr_code, crop, quantity_kg, status, created_at`,
        [userId, centre_id, slot_id, bookingDate, tokenNumber, qrString, crop, quantity_kg]
      );

      // 8. Increment booked_count on slots table
      await client.query(
        `UPDATE slots
         SET booked_count = booked_count + 1
         WHERE id = $1`,
        [slot_id]
      );

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getBookingById(bookingId, userId) {
    const result = await pool.query(
      `SELECT b.id, b.user_id, b.centre_id, b.slot_id, b.booking_date, b.token_number, b.qr_code,
              b.crop, b.quantity_kg, b.status, b.created_at,
              c.name AS centre_name, c.district, c.state,
              s.start_time, s.end_time
       FROM bookings b
       JOIN centres c ON b.centre_id = c.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const booking = result.rows[0];

    // Enforce ownership check: Farmer can only access their own booking
    if (parseInt(booking.user_id, 10) !== parseInt(userId, 10)) {
      const err = new Error('Access denied. You can only view your own bookings.');
      err.statusCode = 403;
      throw err;
    }

    return booking;
  }

  async getMyBookings(userId) {
    const result = await pool.query(
      `SELECT b.id, b.user_id, b.centre_id, b.slot_id, b.booking_date, b.token_number, b.qr_code,
              b.crop, b.quantity_kg, b.status, b.created_at,
              c.name AS centre_name, s.start_time, s.end_time
       FROM bookings b
       JOIN centres c ON b.centre_id = c.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return result.rows;
  }
}

module.exports = new FarmerService();
