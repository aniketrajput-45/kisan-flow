const pool = require('../config/db');

const DEMO_RATE_PER_KG = 22.75;

class OfficerService {
  async lookupBooking(queryOrToken) {
    if (!queryOrToken) {
      const err = new Error('Lookup query or QR token is required');
      err.statusCode = 400;
      throw err;
    }

    const result = await pool.query(
      `SELECT b.id AS booking_id, b.token_number, b.qr_code, b.crop, b.quantity_kg AS booked_quantity, b.status AS booking_status, b.created_at,
              u.name AS farmer_name, u.phone AS farmer_phone,
              c.id AS centre_id, c.name AS centre_name, c.code AS centre_code,
              s.id AS slot_id, s.slot_date, s.start_time, s.end_time
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN centres c ON b.centre_id = c.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.qr_code = $1 OR b.token_number = $1 OR u.phone = $1`,
      [queryOrToken]
    );

    if (result.rows.length === 0) {
      const err = new Error('No booking found matching the provided lookup criteria');
      err.statusCode = 404;
      throw err;
    }

    return result.rows[0];
  }

  async recordProcurement(officerId, { booking_id, weight_kg, grade }) {
    if (!booking_id || !weight_kg || !grade) {
      const err = new Error('booking_id, weight_kg, and grade are required');
      err.statusCode = 400;
      throw err;
    }

    if (weight_kg <= 0) {
      const err = new Error('weight_kg must be greater than 0');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Lock and read booking with user & centre info
      const bookingRes = await client.query(
        `SELECT b.id, b.user_id, b.centre_id, b.slot_id, b.crop, b.status,
                u.name AS farmer_name, u.phone AS farmer_phone,
                c.name AS centre_name
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         JOIN centres c ON b.centre_id = c.id
         WHERE b.id = $1
         FOR UPDATE`,
        [booking_id]
      );

      if (bookingRes.rows.length === 0) {
        const err = new Error('Booking not found');
        err.statusCode = 404;
        throw err;
      }

      const booking = bookingRes.rows[0];

      // 2. Validate booking state
      const processableStates = ['BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING'];
      if (!processableStates.includes(booking.status)) {
        const err = new Error(`Booking is in '${booking.status}' state and cannot be processed for procurement`);
        err.statusCode = 400;
        throw err;
      }

      // 3. Verify no duplicate procurement exists
      const existingProcurement = await client.query(
        'SELECT id FROM procurements WHERE booking_id = $1',
        [booking_id]
      );

      if (existingProcurement.rows.length > 0) {
        const err = new Error('Procurement record already exists for this booking');
        err.statusCode = 409;
        throw err;
      }

      // Calculate total procurement amount using prototype DEMO_RATE_PER_KG (₹22.75/kg)
      const totalAmount = parseFloat((parseFloat(weight_kg) * DEMO_RATE_PER_KG).toFixed(2));

      // 4. Insert procurement
      const procurementRes = await client.query(
        `INSERT INTO procurements (booking_id, officer_id, weight_kg, grade, total_amount, status)
         VALUES ($1, $2, $3, $4, $5, 'COMPLETED')
         RETURNING id, booking_id, officer_id, weight_kg, grade, total_amount, status, created_at`,
        [booking_id, officerId, weight_kg, grade, totalAmount]
      );
      const procurement = procurementRes.rows[0];

      // 5. Insert payment with RECORDED status
      const referenceNumber = `PAY-2026-${booking_id}-${Date.now()}`;
      const paymentRes = await client.query(
        `INSERT INTO payments (procurement_id, booking_id, farmer_id, amount, status, reference_number)
         VALUES ($1, $2, $3, $4, 'RECORDED', $5)
         RETURNING id, procurement_id, booking_id, farmer_id, amount, status, reference_number, updated_at`,
        [procurement.id, booking_id, booking.user_id, totalAmount, referenceNumber]
      );
      const payment = paymentRes.rows[0];

      // 6. Update booking status to COMPLETED
      await client.query(
        `UPDATE bookings SET status = 'COMPLETED' WHERE id = $1`,
        [booking_id]
      );

      await client.query('COMMIT');

      // Decoupled Redis Queue cleanup: remove booking from active queue & clear processing token
      try {
        const queueService = require('./queueService');
        await queueService.removeFromQueue(booking.centre_id, booking.booking_date, booking.id);
      } catch (qErr) {
        console.error('[Procurement Queue Cleanup Error - Non-fatal]', qErr.message);
      }

      // Decoupled Outbound SMS dispatch: attempt after DB commit so SMS failure never rolls back procurement/payment
      let smsResult = null;
      try {
        const smsService = require('./smsService');
        smsResult = await smsService.sendProcurementConfirmation({
          farmerName: booking.farmer_name,
          phone: booking.farmer_phone,
          crop: booking.crop,
          weightKg: weight_kg,
          grade: grade,
          centreName: booking.centre_name,
          procurementId: procurement.id,
        });
      } catch (smsErr) {
        console.error('[Procurement SMS Error - Non-fatal]', smsErr.message);
      }

      return {
        procurement,
        payment,
        sms: smsResult,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getPaymentByBooking(bookingId, reqUser) {
    const result = await pool.query(
      `SELECT p.id AS payment_id, p.procurement_id, p.booking_id, p.farmer_id, p.amount, p.status, p.reference_number, p.updated_at
       FROM payments p
       WHERE p.booking_id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Payment record not found for this booking');
      err.statusCode = 404;
      throw err;
    }

    const payment = result.rows[0];

    // Ownership check: Farmers can only view their own payment records
    if (reqUser.role === 'FARMER' && parseInt(payment.farmer_id, 10) !== parseInt(reqUser.id, 10)) {
      const err = new Error('Access denied. You can only view your own payment details.');
      err.statusCode = 403;
      throw err;
    }

    return payment;
  }

  async updatePaymentStatus(paymentId, nextStatus) {
    const validStatuses = ['RECORDED', 'INITIATED', 'PROCESSING', 'CREDITED'];
    if (!validStatuses.includes(nextStatus)) {
      const err = new Error(`Invalid target payment status: ${nextStatus}`);
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const paymentRes = await client.query(
        `SELECT id, status, amount FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );

      if (paymentRes.rows.length === 0) {
        const err = new Error('Payment record not found');
        err.statusCode = 404;
        throw err;
      }

      const payment = paymentRes.rows[0];
      const currentStatus = payment.status;

      // Define strict valid state transitions
      const validTransitions = {
        'RECORDED': ['INITIATED'],
        'INITIATED': ['PROCESSING'],
        'PROCESSING': ['CREDITED'],
        'CREDITED': [], // Terminal state
      };

      const allowedNext = validTransitions[currentStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        const err = new Error(`Invalid payment state transition from '${currentStatus}' to '${nextStatus}'. Allowed transition: ${allowedNext.join(', ') || 'None'}`);
        err.statusCode = 409;
        throw err;
      }

      const updateRes = await client.query(
        `UPDATE payments
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, status, amount, reference_number, updated_at`,
        [nextStatus, paymentId]
      );

      await client.query('COMMIT');

      const updatedRow = updateRes.rows && updateRes.rows[0] ? updateRes.rows[0] : { id: paymentId, status: nextStatus, amount: payment.amount, updated_at: new Date() };

      return {
        payment_id: paymentId,
        previous_status: currentStatus,
        current_status: updatedRow.status,
        amount: updatedRow.amount,
        reference_number: updatedRow.reference_number,
        updated_at: updatedRow.updated_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new OfficerService();
