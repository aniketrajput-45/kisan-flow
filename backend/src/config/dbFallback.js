// In-memory database store for testing/verification when local Postgres is not running
class MemoryDb {
  constructor() {
    this.centres = [
      { id: 1, name: 'Burdwan Central Procurement Centre', code: 'BDW-01', district: 'Burdwan', state: 'West Bengal', capacity: 500, is_active: true },
      { id: 2, name: 'Durgapur Sub-Division Procurement Centre', code: 'DGP-01', district: 'Paschim Bardhaman', state: 'West Bengal', capacity: 400, is_active: true },
    ];
    this.slots = [
      { id: 1, centre_id: 1, slot_date: new Date().toISOString().split('T')[0], start_time: '09:00:00', end_time: '11:00:00', capacity: 50, booked_count: 2 },
      { id: 2, centre_id: 1, slot_date: new Date().toISOString().split('T')[0], start_time: '11:00:00', end_time: '13:00:00', capacity: 50, booked_count: 1 },
    ];
    this.nextUserId = 10;
    this.nextBookingId = 104;
    this.seedDefaults();
  }

  seedDefaults() {
    const today = new Date().toISOString().split('T')[0];
    this.users = [
      { id: 1, name: 'Ramesh Kumar', phone: '9876543210', role: 'FARMER' },
      { id: 2, name: 'Suresh Sharma', phone: '9876543211', role: 'OFFICER' },
      { id: 3, name: 'Anita Roy', phone: '9876543212', role: 'ADMIN' },
      { id: 4, name: 'Gurpreet Singh', phone: '9876543213', role: 'FARMER' },
      { id: 5, name: 'Rajendra Verma', phone: '9876543214', role: 'FARMER' },
    ];
    this.bookings = [
      {
        id: 101,
        user_id: 1,
        centre_id: 1,
        slot_id: 1,
        booking_date: today,
        token_number: 'BDW-001',
        qr_code: 'KF-BKG-101-BDW-001',
        crop: 'Wheat',
        quantity_kg: 4800,
        status: 'IN_QUEUE',
        created_at: new Date().toISOString(),
      },
      {
        id: 102,
        user_id: 4,
        centre_id: 1,
        slot_id: 1,
        booking_date: today,
        token_number: 'BDW-002',
        qr_code: 'KF-BKG-102-BDW-002',
        crop: 'Mustard',
        quantity_kg: 4200,
        status: 'IN_QUEUE',
        created_at: new Date().toISOString(),
      },
      {
        id: 103,
        user_id: 5,
        centre_id: 1,
        slot_id: 2,
        booking_date: today,
        token_number: 'BDW-003',
        qr_code: 'KF-BKG-103-BDW-003',
        crop: 'Gram',
        quantity_kg: 3500,
        status: 'ARRIVED',
        created_at: new Date().toISOString(),
      },
    ];
  }

  reset() {
    this.seedDefaults();
    this.slots[1].booked_count = 0;
    this.nextUserId = 10;
    this.nextBookingId = 104;
  }
}

const memoryDb = new MemoryDb();

function setupDbFallback(pool) {
  const originalQuery = pool.query.bind(pool);
  const originalConnect = pool.connect.bind(pool);

  pool.connect = async () => {
    try {
      const client = await originalConnect();
      pool._useRealPostgres = true;
      seedDefaultUsers(pool);
      return client;
    } catch (err) {
      pool._useRealPostgres = false;
      if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED') || process.env.USE_MOCK_DB === 'true') {
        return {
          query: pool.query,
          release: () => {},
        };
      }
      throw err;
    }
  };

async function seedDefaultUsers(pool) {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE phone = $1', ['9876543210']);
    if (existing.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      await pool.query(
        `INSERT INTO users (name, phone, role, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (phone) DO NOTHING`,
        ['Ramesh Kumar', '9876543210', 'FARMER', hash]
      );
    }
  } catch (e) {
    // Non-fatal
  }
}

  pool.query = (text, params) => {
    if (pool._useRealPostgres) {
      return originalQuery(text, params);
    }
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

        if (queryStr.includes('WHERE centre_id = $1 AND slot_date = $2')) {
          const centreId = params[0];
          const date = params[1] ? String(params[1]).split('T')[0] : new Date().toISOString().split('T')[0];
          
          let filtered = memoryDb.slots.filter(
            s => String(s.centre_id) === String(centreId) && String(s.slot_date).split('T')[0] === date
          );

          if (filtered.length === 0) {
            // Auto-generate 4 standard slots for any date requested
            const defaultTimes = [
              ['09:00:00', '11:00:00'],
              ['11:00:00', '13:00:00'],
              ['14:00:00', '16:00:00'],
              ['16:00:00', '18:00:00'],
            ];
            filtered = defaultTimes.map(([st, et]) => {
              const newSlot = {
                id: memoryDb.slots.length + 1,
                centre_id: Number(centreId),
                slot_date: date,
                start_time: st,
                end_time: et,
                capacity: 50,
                booked_count: 0,
              };
              memoryDb.slots.push(newSlot);
              return newSlot;
            });
          }

          const rows = filtered.map(s => ({
            ...s,
            slot_date: String(s.slot_date).split('T')[0],
            available_count: s.capacity - s.booked_count,
          }));
          return resolve({ rows });
        }

        if (queryStr.includes('INSERT INTO slots')) {
          const centreId = params[0];
          const date = params[1] ? String(params[1]).split('T')[0] : new Date().toISOString().split('T')[0];
          const defaultTimes = [
            ['09:00:00', '11:00:00'],
            ['11:00:00', '13:00:00'],
            ['14:00:00', '16:00:00'],
            ['16:00:00', '18:00:00'],
          ];
          const inserted = defaultTimes.map(([st, et]) => {
            const newSlot = {
              id: memoryDb.slots.length + 1,
              centre_id: Number(centreId),
              slot_date: date,
              start_time: st,
              end_time: et,
              capacity: 50,
              booked_count: 0,
            };
            memoryDb.slots.push(newSlot);
            return newSlot;
          });
          return resolve({ rows: inserted });
        }

        if (queryStr.includes('FROM slots') && queryStr.includes('WHERE id = $1')) {
          const [slotId] = params;
          const slot = memoryDb.slots.find(s => String(s.id) === String(slotId));
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

        if (queryStr.includes('COUNT(*)') && queryStr.includes('FROM bookings') && queryStr.includes('WHERE centre_id = $1 AND booking_date = $2')) {
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

        if (queryStr.includes('FROM bookings') && (queryStr.includes('WHERE b.id = $1') || queryStr.includes('WHERE id = $1'))) {
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
              centre_name: centre.name || 'Burdwan Central Procurement Centre',
              start_time: slot.start_time || '09:00:00',
              end_time: slot.end_time || '11:00:00',
            }],
          });
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

        if (queryStr.includes('FROM bookings b') && queryStr.includes("status IN ('ARRIVED', 'IN_QUEUE', 'PROCESSING')")) {
          const centreParam = params[0];
          const active = memoryDb.bookings
            .filter(b => {
              const matchesCentre = !centreParam || String(b.centre_id) === String(centreParam);
              const isStatusActive = ['ARRIVED', 'IN_QUEUE', 'PROCESSING'].includes(b.status);
              return matchesCentre && isStatusActive;
            })
            .map(b => {
              const farmer = memoryDb.users.find(u => String(u.id) === String(b.user_id)) || {};
              const centre = memoryDb.centres.find(c => String(c.id) === String(b.centre_id)) || {};
              const slot = memoryDb.slots.find(s => String(s.id) === String(b.slot_id)) || {};
              return {
                id: b.id,
                user_id: b.user_id,
                centre_id: b.centre_id,
                slot_id: b.slot_id,
                booking_date: b.booking_date,
                token_number: b.token_number,
                qr_code: b.qr_code,
                crop: b.crop,
                quantity_kg: b.quantity_kg,
                status: b.status,
                created_at: b.created_at,
                farmer_name: farmer.name || 'Ramesh Kumar',
                farmer_phone: farmer.phone || '9876543210',
                centre_name: centre.name || 'Burdwan Central Procurement Centre',
                centre_code: centre.code || 'BDW-01',
                start_time: slot.start_time || '09:00:00',
                end_time: slot.end_time || '11:00:00',
              };
            })
            .sort((a, b) => {
              if (a.status === 'PROCESSING' && b.status !== 'PROCESSING') return -1;
              if (b.status === 'PROCESSING' && a.status !== 'PROCESSING') return 1;
              return a.id - b.id;
            });

          return resolve({ rows: active });
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
