// In-memory database store for testing/verification when local Postgres is not running
class MemoryDb {
  constructor() {
    this.users = [];
    this.centres = [
      { id: 1, name: 'Burdwan Central Procurement Centre', code: 'BDW-01', district: 'Burdwan', state: 'West Bengal', capacity: 500, is_active: true },
      { id: 2, name: 'Durgapur Sub-Division Procurement Centre', code: 'DGP-01', district: 'Paschim Bardhaman', state: 'West Bengal', capacity: 400, is_active: true },
    ];
    this.slots = [
      { id: 1, centre_id: 1, slot_date: '2026-09-10', start_time: '09:00:00', end_time: '11:00:00', capacity: 50, booked_count: 0 },
      { id: 2, centre_id: 1, slot_date: '2026-09-10', start_time: '11:00:00', end_time: '13:00:00', capacity: 1, booked_count: 0 }, // Capacity 1 for concurrency test
    ];
    this.bookings = [];
    this.nextUserId = 1;
    this.nextBookingId = 100;
  }

  reset() {
    this.users = [];
    this.bookings = [];
    this.slots[1].booked_count = 0;
    this.nextUserId = 1;
    this.nextBookingId = 100;
  }
}

const memoryDb = new MemoryDb();

function setupDbFallback(pool) {
  const originalQuery = pool.query.bind(pool);
  const originalConnect = pool.connect.bind(pool);

  pool.connect = async () => {
    try {
      return await originalConnect();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED') || process.env.USE_MOCK_DB === 'true') {
        return {
          query: pool.query,
          release: () => {},
        };
      }
      throw err;
    }
  };

  pool.query = (text, params) => {
    return new Promise((resolve, reject) => {
      try {
        const queryStr = typeof text === 'string' ? text : text.text;

        if (queryStr.includes('SELECT id FROM users WHERE phone = $1')) {
          const phone = params[0];
          const existing = memoryDb.users.filter(u => u.phone === phone);
          return resolve({ rows: existing });
        }

        if (queryStr.includes('SELECT id, name, phone, role, password_hash FROM users WHERE phone = $1')) {
          const phone = params[0];
          const existing = memoryDb.users.filter(u => u.phone === phone);
          return resolve({ rows: existing });
        }

        if (queryStr.includes('INSERT INTO users')) {
          const [name, phone, role, passwordHash] = params;
          const user = {
            id: memoryDb.nextUserId++,
            name,
            phone,
            role,
            password_hash: passwordHash,
            created_at: new Date(),
          };
          memoryDb.users.push(user);
          return resolve({ rows: [user] });
        }

        if (queryStr.includes('FROM centres') && queryStr.includes('SELECT id, name')) {
          return resolve({ rows: memoryDb.centres });
        }

        if (queryStr.includes('SELECT id, centre_id, slot_date, start_time, end_time, capacity, booked_count')) {
          const [centreId, date] = params;
          const filtered = memoryDb.slots
            .filter(s => String(s.centre_id) === String(centreId) && String(s.slot_date) === String(date))
            .map(s => ({ ...s, available_count: s.capacity - s.booked_count }));
          return resolve({ rows: filtered });
        }

        if (queryStr.includes('SELECT id, centre_id, slot_date, capacity, booked_count')) {
          const [slotId] = params;
          const slot = memoryDb.slots.find(s => String(s.id) === String(slotId));
          // Enforce capacity limit in mock DB adapter
          if (slot && slot.booked_count >= slot.capacity) {
            return resolve({ rows: [{ ...slot, booked_count: slot.capacity }] });
          }
          return resolve({ rows: slot ? [slot] : [] });
        }

        if (queryStr.includes('SELECT id FROM bookings') && queryStr.includes('WHERE user_id = $1 AND slot_id = $2')) {
          const [userId, slotId] = params;
          const active = memoryDb.bookings.filter(b => String(b.user_id) === String(userId) && String(b.slot_id) === String(slotId) && ['BOOKED','ARRIVED','IN_QUEUE','PROCESSING'].includes(b.status));
          return resolve({ rows: active });
        }

        if (queryStr.includes('SELECT code FROM centres WHERE id = $1')) {
          const [centreId] = params;
          const centre = memoryDb.centres.find(c => String(c.id) === String(centreId));
          return resolve({ rows: centre ? [{ code: centre.code }] : [] });
        }

        if (queryStr.includes('SELECT COUNT(*) AS total FROM bookings WHERE centre_id = $1')) {
          const [centreId, date] = params;
          const total = memoryDb.bookings.filter(b => String(b.centre_id) === String(centreId) && String(b.booking_date) === String(date)).length;
          return resolve({ rows: [{ total }] });
        }

        if (queryStr.includes('INSERT INTO bookings')) {
          const [userId, centre_id, slot_id, bookingDate, tokenNumber, qrString, crop, quantity_kg] = params;
          const booking = {
            id: memoryDb.nextBookingId++,
            user_id: userId,
            centre_id,
            slot_id,
            booking_date: bookingDate,
            token_number: tokenNumber,
            qr_code: qrString,
            crop,
            quantity_kg,
            status: 'BOOKED',
            created_at: new Date().toISOString(),
          };
          memoryDb.bookings.push(booking);
          return resolve({ rows: [booking] });
        }

        if (queryStr.includes('UPDATE slots SET booked_count = booked_count + 1')) {
          const [slotId] = params;
          const slot = memoryDb.slots.find(s => String(s.id) === String(slotId));
          if (slot) slot.booked_count += 1;
          return resolve({ rows: [] });
        }

        if (queryStr.includes('FROM bookings b') && queryStr.includes('JOIN users') && queryStr.includes('WHERE b.id = $1')) {
          const [bookingId] = params;
          const booking = memoryDb.bookings.find(b => String(b.id) === String(bookingId));
          if (!booking) return resolve({ rows: [] });
          const farmer = memoryDb.users.find(u => String(u.id) === String(booking.user_id)) || {};
          const centre = memoryDb.centres.find(c => String(c.id) === String(booking.centre_id)) || {};
          const slot = memoryDb.slots.find(s => String(s.id) === String(booking.slot_id)) || {};
          return resolve({
            rows: [{
              ...booking,
              farmer_name: farmer.name || 'Ramesh Kumar',
              farmer_phone: farmer.phone || '9876543210',
              centre_name: centre.name,
              district: centre.district,
              state: centre.state,
              start_time: slot.start_time,
              end_time: slot.end_time,
            }],
          });
        }

        if (queryStr.includes('FROM bookings b') && queryStr.includes('WHERE b.user_id = $1')) {
          const [userId] = params;
          const userBookings = memoryDb.bookings
            .filter(b => String(b.user_id) === String(userId))
            .map(b => {
              const centre = memoryDb.centres.find(c => String(c.id) === String(b.centre_id)) || {};
              const slot = memoryDb.slots.find(s => String(s.id) === String(b.slot_id)) || {};
              return {
                ...b,
                centre_name: centre.name,
                start_time: slot.start_time,
                end_time: slot.end_time,
              };
            });
          return resolve({ rows: userBookings });
        }

        if (queryStr.includes('FROM bookings b') && queryStr.includes('WHERE b.qr_code = $1 OR b.token_number = $1 OR u.phone = $1')) {
          const [criteria] = params;
          const booking = memoryDb.bookings.find(b => b.qr_code === criteria || b.token_number === criteria);
          if (!booking) return resolve({ rows: [] });
          const farmer = memoryDb.users.find(u => u.id === booking.user_id) || {};
          const centre = memoryDb.centres.find(c => c.id === booking.centre_id) || {};
          const slot = memoryDb.slots.find(s => s.id === booking.slot_id) || {};
          return resolve({
            rows: [{
              booking_id: booking.id,
              token_number: booking.token_number,
              qr_code: booking.qr_code,
              crop: booking.crop,
              booked_quantity: booking.quantity_kg,
              booking_status: booking.status,
              created_at: booking.created_at,
              farmer_name: farmer.name || 'Ramesh Kumar',
              farmer_phone: farmer.phone || '9876543210',
              centre_id: centre.id,
              centre_name: centre.name,
              centre_code: centre.code,
              slot_id: slot.id,
              slot_date: slot.slot_date,
              start_time: slot.start_time,
              end_time: slot.end_time,
            }],
          });
        }

        if (queryStr.includes('SELECT id, token_number FROM bookings') && queryStr.includes("status = 'PROCESSING'")) {
          const [centreId, bookingDate] = params;
          const activeProcessing = memoryDb.bookings.filter(b => String(b.centre_id) === String(centreId) && String(b.booking_date) === String(bookingDate) && b.status === 'PROCESSING');
          return resolve({ rows: activeProcessing });
        }

        if (queryStr.includes('FROM bookings') && !queryStr.includes('JOIN') && (queryStr.includes('WHERE b.id = $1') || queryStr.includes('WHERE id = $1'))) {
          const [bookingId] = params;
          const booking = memoryDb.bookings.find(b => String(b.id) === String(bookingId));
          return resolve({ rows: booking ? [booking] : [] });
        }

        if (queryStr.includes('SELECT id FROM procurements WHERE booking_id = $1')) {
          const [bookingId] = params;
          if (!memoryDb.procurements) memoryDb.procurements = [];
          const existing = memoryDb.procurements.filter(p => String(p.booking_id) === String(bookingId));
          return resolve({ rows: existing });
        }

        if (queryStr.includes('INSERT INTO procurements')) {
          const [booking_id, officerId, weight_kg, grade, totalAmount] = params;
          if (!memoryDb.procurements) memoryDb.procurements = [];
          const procurement = {
            id: (memoryDb.procurements.length + 1) * 10,
            booking_id,
            officer_id: officerId,
            weight_kg,
            grade,
            total_amount: totalAmount,
            status: 'COMPLETED',
            created_at: new Date().toISOString(),
          };
          memoryDb.procurements.push(procurement);
          return resolve({ rows: [procurement] });
        }

        if (queryStr.includes('INSERT INTO payments')) {
          const [procurement_id, booking_id, farmer_id, amount, referenceNumber] = params;
          if (!memoryDb.payments) memoryDb.payments = [];
          const payment = {
            id: (memoryDb.payments.length + 1) * 100,
            procurement_id,
            booking_id,
            farmer_id,
            amount,
            status: 'RECORDED',
            reference_number: referenceNumber,
            updated_at: new Date().toISOString(),
          };
          memoryDb.payments.push(payment);
          return resolve({ rows: [payment] });
        }

        if (queryStr.includes("UPDATE bookings SET status = 'COMPLETED' WHERE id = $1")) {
          const [bookingId] = params;
          const booking = memoryDb.bookings.find(b => String(b.id) === String(bookingId));
          if (booking) booking.status = 'COMPLETED';
          return resolve({ rows: [] });
        }

        if (queryStr.includes("UPDATE bookings SET status = 'IN_QUEUE' WHERE id = $1")) {
          const [bookingId] = params;
          const booking = memoryDb.bookings.find(b => String(b.id) === String(bookingId));
          if (booking) booking.status = 'IN_QUEUE';
          return resolve({ rows: [] });
        }

        if (queryStr.includes("UPDATE bookings SET status = 'PROCESSING' WHERE id = $1")) {
          const [bookingId] = params;
          const booking = memoryDb.bookings.find(b => String(b.id) === String(bookingId));
          if (booking) booking.status = 'PROCESSING';
          return resolve({ rows: [] });
        }

        if (queryStr.includes('FROM payments') && (queryStr.includes('WHERE id = $1') || queryStr.includes('WHERE booking_id = $1') || queryStr.includes('WHERE pm.id = $1'))) {
          const [id] = params;
          if (!memoryDb.payments) memoryDb.payments = [];
          const payment = memoryDb.payments.find(p => String(p.booking_id) === String(id) || String(p.id) === String(id));
          return resolve({ rows: payment ? [{ ...payment, payment_id: payment.id }] : [] });
        }

        if (queryStr.includes('UPDATE payments') && queryStr.includes('SET status = $1')) {
          const [nextStatus, paymentId] = params;
          if (!memoryDb.payments) memoryDb.payments = [];
          const payment = memoryDb.payments.find(p => String(p.id) === String(paymentId));
          if (payment) {
            payment.status = nextStatus;
            payment.updated_at = new Date().toISOString();
          }
          return resolve({ rows: payment ? [{ ...payment, payment_id: payment.id }] : [] });
        }

        if (queryStr.includes('INSERT INTO sms_verifications')) {
          const [procurementId, phone, message] = params;
          if (!memoryDb.smsVerifications) memoryDb.smsVerifications = [];
          const sms = {
            id: memoryDb.smsVerifications.length + 1,
            procurement_id: procurementId,
            farmer_phone: phone,
            message,
            direction: 'OUTBOUND',
            response: null,
            status: 'SENT',
            created_at: new Date().toISOString(),
          };
          memoryDb.smsVerifications.push(sms);
          return resolve({ rows: [sms] });
        }

        if (queryStr.includes('SELECT procurement_id') && queryStr.includes('FROM sms_verifications')) {
          const [phone] = params;
          if (!memoryDb.smsVerifications) memoryDb.smsVerifications = [];
          const match = memoryDb.smsVerifications
            .slice()
            .reverse()
            .find(s => s.farmer_phone === phone && s.direction === 'OUTBOUND' && s.status === 'SENT');
          return resolve({ rows: match ? [{ procurement_id: match.procurement_id }] : [] });
        }

        if (queryStr.includes('SELECT id FROM procurements WHERE id = $1')) {
          const [procId] = params;
          if (!memoryDb.procurements) memoryDb.procurements = [];
          const proc = memoryDb.procurements.find(p => String(p.id) === String(procId));
          return resolve({ rows: proc ? [proc] : [] });
        }

        if (queryStr.includes('SELECT id, status, response FROM sms_verifications')) {
          const [procId] = params;
          if (!memoryDb.smsVerifications) memoryDb.smsVerifications = [];
          const match = memoryDb.smsVerifications
            .slice()
            .reverse()
            .find(s => String(s.procurement_id) === String(procId) && s.direction === 'OUTBOUND');
          return resolve({ rows: match ? [match] : [] });
        }

        if (queryStr.includes('UPDATE sms_verifications')) {
          const [nextStatus, responseCode, id] = params;
          if (!memoryDb.smsVerifications) memoryDb.smsVerifications = [];
          const sms = memoryDb.smsVerifications.find(s => String(s.id) === String(id));
          if (sms) {
            sms.status = nextStatus;
            sms.response = responseCode;
          }
          return resolve({ rows: sms ? [sms] : [] });
        }

        if (queryStr.includes("SELECT COUNT(*) AS total FROM users WHERE role = 'FARMER'")) {
          const total = memoryDb.users.filter(u => u.role === 'FARMER').length;
          return resolve({ rows: [{ total }] });
        }

        if (queryStr.includes('SELECT status, COUNT(*) AS count') && queryStr.includes('FROM bookings')) {
          const [date] = params;
          const statusCounts = {};
          memoryDb.bookings
            .filter(b => String(b.booking_date) === String(date))
            .forEach(b => {
              statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
            });
          const rows = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
          return resolve({ rows });
        }

        if (queryStr.includes('SELECT COUNT(p.id) AS completed_count') && queryStr.includes('FROM procurements p')) {
          const [date] = params;
          const procs = (memoryDb.procurements || []).filter(p => {
            const booking = memoryDb.bookings.find(b => String(b.id) === String(p.booking_id));
            return booking && String(booking.booking_date) === String(date) && p.status === 'COMPLETED';
          });
          const completed_count = procs.length;
          const total_weight_kg = procs.reduce((sum, p) => sum + (parseFloat(p.weight_kg) || 0), 0);
          const total_amount = procs.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
          return resolve({ rows: [{ completed_count, total_weight_kg, total_amount }] });
        }

        if (queryStr.includes('SELECT pm.status, COUNT(*) AS count') && queryStr.includes('FROM payments pm')) {
          const [date] = params;
          const statusCounts = {};
          (memoryDb.payments || []).forEach(pm => {
            const booking = memoryDb.bookings.find(b => String(b.id) === String(pm.booking_id));
            if (booking && String(booking.booking_date) === String(date)) {
              statusCounts[pm.status] = (statusCounts[pm.status] || 0) + 1;
            }
          });
          const rows = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
          return resolve({ rows });
        }

        if (queryStr.includes('SELECT id, name, code, district, state FROM centres WHERE is_active = true')) {
          return resolve({ rows: memoryDb.centres });
        }

        return resolve({ rows: [] });
      } catch (e) {
        reject(e);
      }
    });
  };
}

module.exports = setupDbFallback;
module.exports.memoryDb = memoryDb;
