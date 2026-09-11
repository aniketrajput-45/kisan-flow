const pool = require('../config/db');
const redisClient = require('../config/redis');

const DEMO_AVG_PROCESSING_MINUTES = 15;

class QueueService {
  /**
   * Helper to format Redis queue key
   */
  getQueueKey(centreId, date) {
    const formattedDate = typeof date === 'string' ? date.split('T')[0] : date;
    return `queue:${centreId}:${formattedDate}`;
  }

  /**
   * Helper to format Redis active processing key
   */
  getProcessingKey(centreId, date) {
    const formattedDate = typeof date === 'string' ? date.split('T')[0] : date;
    return `processing:${centreId}:${formattedDate}`;
  }

  /**
   * Get Live Queue for Officer
   */
  async getLiveQueue(centreId, dateStr) {
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    }
    const queueKey = this.getQueueKey(centreId, dateStr);
    const processingKey = this.getProcessingKey(centreId, dateStr);

    let redisHealthy = true;
    let currentlyProcessingToken = null;
    let waitingIds = [];

    try {
      currentlyProcessingToken = await redisClient.get(processingKey);
      const list = await redisClient.lrange(queueKey, 0, -1);
      waitingIds = Array.isArray(list) ? list : [];
    } catch (err) {
      redisHealthy = false;
      console.error('[Redis Degraded Mode in getLiveQueue]', err.message);
    }

    // Get ALL active bookings for this centre/date
    const activeBookingsRes = await pool.query(
      `SELECT b.id, b.token_number, b.status, b.quantity_kg AS booked_quantity_kg, b.crop, b.booking_date,
              u.name AS farmer_name, u.phone AS farmer_phone,
              s.start_time, s.end_time
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN slots s ON b.slot_id = s.id
       WHERE b.centre_id = $1 AND b.booking_date = $2 AND b.status IN ('BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING')`,
       [centreId, dateStr]
    );

    const activeBookings = activeBookingsRes.rows;
    
    let currentFarmer = null;
    let waitingFarmers = [];

    // Find currently processing
    if (currentlyProcessingToken) {
      currentFarmer = activeBookings.find(b => b.token_number === currentlyProcessingToken && b.status === 'PROCESSING') || null;
    }
    if (!currentFarmer) {
       // fallback if Redis token not set but DB has PROCESSING
       currentFarmer = activeBookings.find(b => b.status === 'PROCESSING') || null;
    }

    if (redisHealthy && waitingIds.length > 0) {
      // Order waiting farmers by Redis list order
      waitingFarmers = waitingIds.map(idStr => {
         const booking = activeBookings.find(b => String(b.id) === String(idStr));
         return booking;
      }).filter(Boolean); // remove any nulls
    } else {
      // Degraded mode or Redis empty but DB has IN_QUEUE/ARRIVED
      waitingFarmers = activeBookings.filter(b => b.status === 'IN_QUEUE' || b.status === 'ARRIVED');
      // Fallback sort
      waitingFarmers.sort((a,b) => a.id - b.id);
    }

    // Prepend farmers that are 'BOOKED' but not arrived? No, BOOKED means they haven't arrived.
    // The requirement is that waitings should be IN_QUEUE/ARRIVED.
    // But wait, the user said "New Farmer Appears in Live Queue" (status BOOKED). 
    // If the backend queueService ONLY adds to Redis on `markArrived`, then `BOOKED` farmers aren't in Redis.
    // Wait, let me add BOOKED farmers at the bottom of the list if they are not in the Redis queue!
    const bookedFarmers = activeBookings.filter(b => b.status === 'BOOKED');
    waitingFarmers = [...waitingFarmers, ...bookedFarmers];

    return {
      queue_available: redisHealthy,
      currentFarmer,
      waitingFarmers
    };
  }

  /**
   * Farmer or Officer marks booking as ARRIVED
   */
  async markArrived(reqUser, bookingId) {
    if (!bookingId) {
      const err = new Error('booking_id is required');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Lock and read booking record from PostgreSQL
      const bookingRes = await client.query(
        `SELECT b.id, b.user_id, b.centre_id, b.slot_id, b.booking_date, b.token_number, b.status
         FROM bookings b
         WHERE b.id = $1
         FOR UPDATE`,
        [bookingId]
      );

      if (bookingRes.rows.length === 0) {
        const err = new Error(`Booking #${bookingId} not found`);
        err.statusCode = 404;
        throw err;
      }

      const booking = bookingRes.rows[0];

      // Ownership check for FARMER
      if (reqUser.role === 'FARMER' && parseInt(booking.user_id, 10) !== parseInt(reqUser.id, 10)) {
        const err = new Error('Access denied. You can only mark your own booking as arrived.');
        err.statusCode = 403;
        throw err;
      }

      // Check eligibility for arrival
      if (booking.status === 'COMPLETED') {
        const err = new Error('Booking is already completed and cannot be re-queued.');
        err.statusCode = 400;
        throw err;
      }

      const queueKey = this.getQueueKey(booking.centre_id, booking.booking_date);
      const bookingIdStr = String(booking.id);

      // Handle duplicate arrival idempotently
      if (booking.status === 'ARRIVED' || booking.status === 'IN_QUEUE') {
        await client.query('COMMIT');

        let positionInfo = { position: 1, peopleAhead: 0 };
        try {
          const list = await redisClient.lrange(queueKey, 0, -1);
          const idx = list.indexOf(bookingIdStr);
          if (idx !== -1) {
            positionInfo.position = idx + 1;
            positionInfo.peopleAhead = idx;
          }
        } catch (rErr) {
          console.error('[Redis Degraded Mode]', rErr.message);
        }

        return {
          booking_id: booking.id,
          token: booking.token_number,
          centre_id: booking.centre_id,
          status: booking.status,
          queue_position: positionInfo.position,
          people_ahead: positionInfo.peopleAhead,
          estimated_wait_minutes: positionInfo.peopleAhead * DEMO_AVG_PROCESSING_MINUTES,
        };
      }

      if (booking.status !== 'BOOKED') {
        const err = new Error(`Booking status '${booking.status}' is not eligible for arrival.`);
        err.statusCode = 400;
        throw err;
      }

      // Update PostgreSQL status to IN_QUEUE (or ARRIVED)
      await client.query(
        `UPDATE bookings SET status = 'IN_QUEUE' WHERE id = $1`,
        [booking.id]
      );

      await client.query('COMMIT');

      // Update Redis queue atomically/idempotently
      let position = 1;
      let peopleAhead = 0;

      try {
        const existingList = await redisClient.lrange(queueKey, 0, -1);
        if (!existingList.includes(bookingIdStr)) {
          await redisClient.rpush(queueKey, bookingIdStr);
          position = existingList.length + 1;
          peopleAhead = existingList.length;
        } else {
          const idx = existingList.indexOf(bookingIdStr);
          position = idx + 1;
          peopleAhead = idx;
        }
      } catch (redisErr) {
        console.error('[Redis Error - Degraded Queue Response on Arrival]', redisErr.message);
        return {
          booking_id: booking.id,
          token: booking.token_number,
          centre_id: booking.centre_id,
          status: 'IN_QUEUE',
          queue_available: false,
          message: 'Live queue temporarily unavailable',
          queue_position: null,
          people_ahead: null,
          estimated_wait_minutes: null,
        };
      }

      return {
        booking_id: booking.id,
        token: booking.token_number,
        centre_id: booking.centre_id,
        status: 'IN_QUEUE',
        queue_position: position,
        people_ahead: peopleAhead,
        estimated_wait_minutes: peopleAhead * DEMO_AVG_PROCESSING_MINUTES,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get Live Queue Status & ETA for a specific booking
   */
  async getQueueStatus(reqUser, bookingId) {
    const bookingRes = await pool.query(
      `SELECT b.id, b.user_id, b.centre_id, b.booking_date, b.token_number, b.status
       FROM bookings b
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      const err = new Error(`Booking #${bookingId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const booking = bookingRes.rows[0];

    // Ownership check for FARMER
    if (reqUser.role === 'FARMER' && parseInt(booking.user_id, 10) !== parseInt(reqUser.id, 10)) {
      const err = new Error('Access denied. You can only view queue details for your own booking.');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status === 'BOOKED') {
      return {
        booking_id: booking.id,
        token: booking.token_number,
        centre_id: booking.centre_id,
        status: 'BOOKED',
        message: 'Booking active, but farmer has not arrived at the centre yet.',
        queue_position: null,
        people_ahead: null,
        estimated_wait_minutes: null,
        currently_processing: null,
      };
    }

    if (booking.status === 'COMPLETED') {
      return {
        booking_id: booking.id,
        token: booking.token_number,
        centre_id: booking.centre_id,
        status: 'COMPLETED',
        message: 'Procurement completed. Booking is no longer in queue.',
        queue_position: null,
        people_ahead: 0,
        estimated_wait_minutes: 0,
        currently_processing: null,
      };
    }

    const queueKey = this.getQueueKey(booking.centre_id, booking.booking_date);
    const processingKey = this.getProcessingKey(booking.centre_id, booking.booking_date);

    try {
      const currentlyProcessingToken = await redisClient.get(processingKey);

      if (booking.status === 'PROCESSING') {
        return {
          booking_id: booking.id,
          token: booking.token_number,
          centre_id: booking.centre_id,
          status: 'PROCESSING',
          queue_position: 0,
          people_ahead: 0,
          estimated_wait_minutes: 0,
          currently_processing: currentlyProcessingToken || booking.token_number,
        };
      }

      // Status is IN_QUEUE / ARRIVED
      const list = await redisClient.lrange(queueKey, 0, -1);
      const bookingIdStr = String(booking.id);
      const idx = list.indexOf(bookingIdStr);

      let position = idx !== -1 ? idx + 1 : 1;
      let peopleAhead = idx !== -1 ? idx : list.length;

      return {
        booking_id: booking.id,
        token: booking.token_number,
        centre_id: booking.centre_id,
        status: booking.status,
        queue_position: position,
        people_ahead: peopleAhead,
        estimated_wait_minutes: peopleAhead * DEMO_AVG_PROCESSING_MINUTES,
        currently_processing: currentlyProcessingToken || null,
      };
    } catch (redisErr) {
      console.error('[Redis Degraded Mode]', redisErr.message);
      return {
        booking_id: booking.id,
        status: booking.status,
        queue_available: false,
        message: 'Live queue temporarily unavailable',
      };
    }
  }

  /**
   * Officer/Admin starts processing an IN_QUEUE booking
   */
  async startProcessing(bookingId) {
    if (!bookingId) {
      const err = new Error('booking_id is required');
      err.statusCode = 400;
      throw err;
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Lock and read booking
      const bookingRes = await client.query(
        `SELECT id, user_id, centre_id, booking_date, token_number, status
         FROM bookings
         WHERE id = $1
         FOR UPDATE`,
        [bookingId]
      );

      if (bookingRes.rows.length === 0) {
        const err = new Error(`Booking #${bookingId} not found`);
        err.statusCode = 404;
        throw err;
      }

      const booking = bookingRes.rows[0];

      if (booking.status === 'PROCESSING') {
        const err = new Error(`Booking #${bookingId} is already currently processing.`);
        err.statusCode = 409;
        throw err;
      }

      if (booking.status === 'COMPLETED') {
        const err = new Error(`Booking #${bookingId} is already completed.`);
        err.statusCode = 400;
        throw err;
      }

      if (booking.status === 'BOOKED') {
        const err = new Error(`Booking #${bookingId} must be ARRIVED or IN_QUEUE before starting processing.`);
        err.statusCode = 400;
        throw err;
      }

      // Enforce single active processing booking per centre/date
      const activeProcessingCheck = await client.query(
        `SELECT id, token_number FROM bookings
         WHERE centre_id = $1 AND booking_date = $2 AND status = 'PROCESSING'`,
        [booking.centre_id, booking.booking_date]
      );

      if (activeProcessingCheck.rows.length > 0) {
        const activeBkg = activeProcessingCheck.rows[0];
        const err = new Error(`Centre already has an active processing booking: Token ${activeBkg.token_number} (#${activeBkg.id}). Finish or complete it first.`);
        err.statusCode = 409;
        throw err;
      }

      // Update PostgreSQL status to PROCESSING
      await client.query(
        `UPDATE bookings SET status = 'PROCESSING' WHERE id = $1`,
        [booking.id]
      );

      await client.query('COMMIT');

      // Update Redis: Remove from waiting list & set active processing key
      const queueKey = this.getQueueKey(booking.centre_id, booking.booking_date);
      const processingKey = this.getProcessingKey(booking.centre_id, booking.booking_date);

      let redisHealthy = true;
      try {
        await redisClient.lrem(queueKey, 0, String(booking.id));
        await redisClient.set(processingKey, booking.token_number);
      } catch (rErr) {
        redisHealthy = false;
        console.error('[Redis Update Failure on Start Processing]', rErr.message);
      }

      return {
        booking_id: booking.id,
        token: booking.token_number,
        centre_id: booking.centre_id,
        status: 'PROCESSING',
        currently_processing: booking.token_number,
        queue_available: redisHealthy,
        ...(redisHealthy ? {} : { message: 'Booking is PROCESSING in PostgreSQL, but live queue update to Redis failed' }),
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Helper called upon procurement completion to remove booking from Redis queue & clear active processing
   */
  async removeFromQueue(centreId, bookingDate, bookingId) {
    const queueKey = this.getQueueKey(centreId, bookingDate);
    const processingKey = this.getProcessingKey(centreId, bookingDate);

    try {
      await redisClient.lrem(queueKey, 0, String(bookingId));
      
      // Clear processing key if this booking was the active processing token
      const bookingRes = await pool.query('SELECT token_number FROM bookings WHERE id = $1', [bookingId]);
      if (bookingRes.rows.length > 0) {
        const token = bookingRes.rows[0].token_number;
        const currentProcToken = await redisClient.get(processingKey);
        if (currentProcToken === token) {
          await redisClient.del(processingKey);
        }
      }
    } catch (err) {
      console.error('[Redis removeFromQueue Error]', err.message);
    }
  }
}

module.exports = new QueueService();
