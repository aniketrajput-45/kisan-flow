const pool = require('../config/db');
const redisClient = require('../config/redis');

class AdminService {
  /**
   * Get real-time operational overview summary for Admin dashboard
   * @param {string} [targetDate] - Optional date parameter (YYYY-MM-DD), defaults to today
   */
  async getOverview(targetDate) {
    // Default date to today's server date if not provided or invalid
    let dateStr = targetDate;
    if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    // 1. PostgreSQL: Count registered farmers
    const farmersRes = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE role = 'FARMER'`
    );
    const totalFarmers = parseInt(farmersRes.rows[0]?.total || 0, 10);

    // 2. PostgreSQL: Count bookings by status for the target operational date
    const bookingsRes = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM bookings
       WHERE booking_date = $1
       GROUP BY status`,
      [dateStr]
    );

    const bookingStatusCounts = {
      total: 0,
      booked: 0,
      arrived: 0,
      in_queue: 0,
      processing: 0,
      completed: 0,
    };

    bookingsRes.rows.forEach(row => {
      const cnt = parseInt(row.count, 10);
      bookingStatusCounts.total += cnt;
      const key = row.status ? row.status.toLowerCase() : '';
      if (key in bookingStatusCounts) {
        bookingStatusCounts[key] = cnt;
      }
    });

    // 3. PostgreSQL: Summary of completed procurements for the operational date
    const procurementsRes = await pool.query(
      `SELECT COUNT(p.id) AS completed_count,
              COALESCE(SUM(p.weight_kg), 0) AS total_weight_kg,
              COALESCE(SUM(p.total_amount), 0) AS total_amount
       FROM procurements p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.booking_date = $1 AND p.status = 'COMPLETED'`,
      [dateStr]
    );

    const procRow = procurementsRes.rows[0] || {};
    const procurementSummary = {
      completed_count: parseInt(procRow.completed_count || 0, 10),
      total_weight_kg: parseFloat(procRow.total_weight_kg || 0),
      total_amount: parseFloat(procRow.total_amount || 0),
    };

    // 4. PostgreSQL: Summary of payments by current status for the operational date
    const paymentsRes = await pool.query(
      `SELECT pm.status, COUNT(*) AS count
       FROM payments pm
       JOIN bookings b ON pm.booking_id = b.id
       WHERE b.booking_date = $1
       GROUP BY pm.status`,
      [dateStr]
    );

    const paymentStatusCounts = {
      recorded: 0,
      initiated: 0,
      processing: 0,
      credited: 0,
    };

    paymentsRes.rows.forEach(row => {
      const cnt = parseInt(row.count, 10);
      const key = row.status ? row.status.toLowerCase() : '';
      if (key in paymentStatusCounts) {
        paymentStatusCounts[key] = cnt;
      }
    });

    // 5. PostgreSQL + Redis: Active Procurement Centres summary with live queue length and serving token
    const centresRes = await pool.query(
      `SELECT id, name, code, district, state
       FROM centres
       WHERE is_active = true
       ORDER BY name ASC`
    );

    let redisHealthy = true;
    const centresSummary = await Promise.all(
      centresRes.rows.map(async (c) => {
        const queueKey = `queue:${c.id}:${dateStr}`;
        const processingKey = `processing:${c.id}:${dateStr}`;

        let queueLength = null;
        let currentlyProcessing = null;

        if (redisHealthy) {
          try {
            const list = await redisClient.lrange(queueKey, 0, -1);
            queueLength = Array.isArray(list) ? list.length : 0;

            const servingToken = await redisClient.get(processingKey);
            currentlyProcessing = servingToken || null;
          } catch (rErr) {
            redisHealthy = false;
            console.error(`[Admin Overview - Redis Error for Centre #${c.id}]`, rErr.message);
            queueLength = null;
            currentlyProcessing = null;
          }
        }

        return {
          centre_id: c.id,
          centre_name: c.name,
          centre_code: c.code,
          queue_length: queueLength,
          currently_processing: currentlyProcessing,
        };
      })
    );

    return {
      date: dateStr,
      queue_available: redisHealthy,
      farmers: {
        total: totalFarmers,
      },
      bookings: bookingStatusCounts,
      procurement: procurementSummary,
      payments: paymentStatusCounts,
      centres: centresSummary,
    };
  }
}

module.exports = new AdminService();
