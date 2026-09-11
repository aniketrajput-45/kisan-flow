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
    return result.rows;
  }

  async getSlots(centreId, date) {
    if (!centreId || !date) {
      const err = new Error('centreId and date query parameters are required');
      err.statusCode = 400;
      throw err;
    }

    const cleanDate = String(date).split('T')[0];

    let result = await pool.query(
      `SELECT id, centre_id, slot_date::text AS slot_date, start_time, end_time, capacity, booked_count,
              (capacity - booked_count) AS available_count
       FROM slots
       WHERE centre_id = $1 AND slot_date = $2
       ORDER BY start_time ASC`,
      [centreId, cleanDate]
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
                  (capacity - booked_count) AS available_count
           FROM slots
           WHERE centre_id = $1 AND slot_date = $2
           ORDER BY start_time ASC`,
          [centreId, cleanDate]
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

      // 5. Generate Strictly Monotonic Unique Token Number (Never Reused Across Dates)
      const centreCodeRes = await client.query(
        'SELECT code FROM centres WHERE id = $1',
        [centre_id]
      );
      const centreCodePrefix = centreCodeRes.rows[0]?.code ? centreCodeRes.rows[0].code.split('-')[0] : 'TKN';

      // Find the highest sequence number ever issued for this centre
      const lastTokenRes = await client.query(
        `SELECT token_number
         FROM bookings
         WHERE centre_id = $1
         ORDER BY id DESC
         LIMIT 1`,
        [centre_id]
      );

      let maxSeq = 0;
      if (lastTokenRes.rows && lastTokenRes.rows.length > 0) {
        const lastToken = lastTokenRes.rows[0].token_number;
        const match = String(lastToken).match(/(\d+)$/);
        if (match) {
          maxSeq = parseInt(match[1], 10);
        }
      }

      const totalCountRes = await client.query(
        `SELECT COUNT(*) AS total FROM bookings WHERE centre_id = $1`,
        [centre_id]
      );
      const totalCount = totalCountRes.rows && totalCountRes.rows[0] ? parseInt(totalCountRes.rows[0].total, 10) : 0;
      const nextSeq = Math.max(maxSeq, totalCount) + 1;
      const tokenNumber = `${centreCodePrefix}-${String(nextSeq).padStart(3, '0')}`;

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
