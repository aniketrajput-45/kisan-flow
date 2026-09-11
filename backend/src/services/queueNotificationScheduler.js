const pool = require('../config/db');
const queueService = require('./queueService');

class QueueNotificationScheduler {
  constructor() {
    this.intervalHandle = null;
    this.isEvaluating = false;
  }

  start(intervalMs = 60000) {
    if (this.intervalHandle) return;

    // Delayed initial evaluation run after 5s
    setTimeout(() => this.evaluateQueueNotifications(), 5000);

    this.intervalHandle = setInterval(() => {
      this.evaluateQueueNotifications();
    }, intervalMs);

    console.log(`[Queue Notification Scheduler] Periodic queue evaluator started (${intervalMs / 1000}s interval)`);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[Queue Notification Scheduler] Periodic queue evaluator stopped');
    }
  }

  async evaluateQueueNotifications() {
    if (this.isEvaluating) return;
    this.isEvaluating = true;

    try {
      const todayDate = new Date().toISOString().split('T')[0];

      // Query active bookings currently IN_QUEUE or ARRIVED for today
      const activeBookingsRes = await pool.query(
        `SELECT b.id, b.token_number, b.user_id, b.centre_id, b.booking_date, u.phone AS farmer_phone, u.id AS farmer_id
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         WHERE b.booking_date = $1 AND b.status IN ('ARRIVED', 'IN_QUEUE')`,
        [todayDate]
      );

      if (activeBookingsRes.rows.length === 0) {
        this.isEvaluating = false;
        return;
      }

      const smsService = require('./smsService');

      for (const booking of activeBookingsRes.rows) {
        try {
          const mockUser = { id: booking.farmer_id, role: 'FARMER' };
          const queueInfo = await queueService.getQueueStatus(mockUser, booking.id);

          if (queueInfo && queueInfo.estimated_wait_minutes !== null && queueInfo.estimated_wait_minutes !== undefined) {
            const eta = queueInfo.estimated_wait_minutes;

            // Threshold 1: ETA <= 60 mins -> TURN_APPROACHING
            if (eta <= 60 && eta > 15) {
              await smsService.sendQueueNotification({
                bookingId: booking.id,
                farmerPhone: booking.farmer_phone,
                tokenNumber: booking.token_number,
                messageType: 'TURN_APPROACHING',
                estimatedWaitMinutes: eta,
                farmerId: booking.farmer_id,
              });
            }

            // Threshold 2: ETA <= 15 mins -> TURN_NEAR
            if (eta <= 15) {
              await smsService.sendQueueNotification({
                bookingId: booking.id,
                farmerPhone: booking.farmer_phone,
                tokenNumber: booking.token_number,
                messageType: 'TURN_NEAR',
                estimatedWaitMinutes: eta,
                farmerId: booking.farmer_id,
              });
            }
          }
        } catch (bErr) {
          console.error(`[Queue Notification Evaluator Error for Booking #${booking.id}]`, bErr.message);
        }
      }
    } catch (err) {
      console.error('[Queue Notification Evaluator Error]', err.message);
    } finally {
      this.isEvaluating = false;
    }
  }
}

const schedulerInstance = new QueueNotificationScheduler();
module.exports = schedulerInstance;
