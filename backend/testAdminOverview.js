process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');
const jwt = require('jsonwebtoken');
const redisClient = require('./src/config/redis');
const { memoryDb } = require('./src/config/dbFallback');

const { generateToken } = require('./src/utils/jwt');

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function runTests() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log('==================================================');
    console.log(`RUNNING PHASE 6 ADMIN OVERVIEW TESTS ON ${baseUrl}`);
    console.log('==================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
      if (condition) {
        console.log(`[PASS] ${message}`);
        passed++;
      } else {
        console.error(`[FAIL] ${message}`);
        failed++;
      }
    }

    try {
      // Reset memory DB state
      memoryDb.reset();
      memoryDb.procurements = [];
      memoryDb.payments = [];
      memoryDb.smsVerifications = [];

      // Create test users in memoryDb
      const farmerUser = { id: 10, name: 'Farmer Ramesh', phone: '9876543210', role: 'FARMER' };
      const officerUser = { id: 20, name: 'Officer Suresh', phone: '9876543211', role: 'OFFICER' };
      const adminUser = { id: 30, name: 'Admin Rajesh', phone: '9876543212', role: 'ADMIN' };
      memoryDb.users.push(farmerUser, officerUser, adminUser);

      const farmerToken = generateToken(farmerUser);
      const officerToken = generateToken(officerUser);
      const adminToken = generateToken(adminUser);

      const today = new Date().toISOString().split('T')[0];

      // Set up test bookings across statuses
      const booking1 = { id: 101, user_id: farmerUser.id, centre_id: 1, slot_id: 1, booking_date: today, token_number: 'BDW-001', crop: 'Paddy', quantity_kg: 1000, status: 'BOOKED' };
      const booking2 = { id: 102, user_id: farmerUser.id, centre_id: 1, slot_id: 1, booking_date: today, token_number: 'BDW-002', crop: 'Wheat', quantity_kg: 2000, status: 'ARRIVED' };
      const booking3 = { id: 103, user_id: farmerUser.id, centre_id: 1, slot_id: 1, booking_date: today, token_number: 'BDW-003', crop: 'Paddy', quantity_kg: 1500, status: 'IN_QUEUE' };
      const booking4 = { id: 104, user_id: farmerUser.id, centre_id: 1, slot_id: 1, booking_date: today, token_number: 'BDW-004', crop: 'Paddy', quantity_kg: 1200, status: 'PROCESSING' };
      const booking5 = { id: 105, user_id: farmerUser.id, centre_id: 1, slot_id: 1, booking_date: today, token_number: 'BDW-005', crop: 'Wheat', quantity_kg: 3000, status: 'COMPLETED' };
      memoryDb.bookings.push(booking1, booking2, booking3, booking4, booking5);

      // Set up procurement and payments for booking5
      const proc1 = { id: 50, booking_id: booking5.id, officer_id: officerUser.id, weight_kg: 3000, grade: 'A', total_amount: 68250, status: 'COMPLETED' };
      memoryDb.procurements.push(proc1);

      const pay1 = { id: 500, procurement_id: proc1.id, booking_id: booking5.id, farmer_id: farmerUser.id, amount: 68250, status: 'CREDITED' };
      memoryDb.payments.push(pay1);

      // Set up Redis Live Queue state using mock redis
      const queueKey = `queue:1:${today}`;
      const processingKey = `processing:1:${today}`;
      await redisClient.rpush(queueKey, 'BDW-003');
      await redisClient.set(processingKey, 'BDW-004');

      // 1. ADMIN can access /api/admin/overview
      const resAdmin = await getJson(`${baseUrl}/api/admin/overview`, adminToken);
      if (resAdmin.status !== 200) {
        console.log('resAdmin error response:', resAdmin.status, resAdmin.body);
      }
      assert(resAdmin.status === 200, 'Test 1: ADMIN can access /api/admin/overview (HTTP 200)');

      // 2. FARMER receives 403
      const resFarmer = await getJson(`${baseUrl}/api/admin/overview`, farmerToken);
      assert(resFarmer.status === 403, 'Test 2: FARMER receives HTTP 403 Forbidden');

      // 3. OFFICER receives 403
      const resOfficer = await getJson(`${baseUrl}/api/admin/overview`, officerToken);
      assert(resOfficer.status === 403, 'Test 3: OFFICER receives HTTP 403 Forbidden');

      // 4. Overview returns farmer count
      const data = resAdmin.body.data || {};
      assert(data.farmers && data.farmers.total === 1, `Test 4: Registered farmers count is correct (expected 1, got ${data.farmers?.total})`);

      // 5. Booking status counts are correct
      const bCounts = data.bookings || {};
      const bookingMatch = (
        bCounts.total === 5 &&
        bCounts.booked === 1 &&
        bCounts.arrived === 1 &&
        bCounts.in_queue === 1 &&
        bCounts.processing === 1 &&
        bCounts.completed === 1
      );
      assert(bookingMatch, `Test 5: Booking status counts are correct (total: ${bCounts.total}, booked: ${bCounts.booked}, arrived: ${bCounts.arrived}, in_queue: ${bCounts.in_queue}, processing: ${bCounts.processing}, completed: ${bCounts.completed})`);

      // 6. Procurement count is correct
      assert(data.procurement && data.procurement.completed_count === 1, `Test 6: Procurement completed count is correct (expected 1, got ${data.procurement?.completed_count})`);

      // 7. Total procurement weight is correct
      assert(data.procurement && data.procurement.total_weight_kg === 3000, `Test 7: Total procurement weight is correct (expected 3000 kg, got ${data.procurement?.total_weight_kg})`);

      // 8. Total procurement amount is correct
      assert(data.procurement && data.procurement.total_amount === 68250, `Test 8: Total procurement amount is correct (expected ₹68250, got ₹${data.procurement?.total_amount})`);

      // 9. Payment status counts are correct
      const pCounts = data.payments || {};
      assert(pCounts.credited === 1 && pCounts.recorded === 0, `Test 9: Payment status counts are correct (credited: ${pCounts.credited}, recorded: ${pCounts.recorded})`);

      // 10. Centre summary is returned
      assert(Array.isArray(data.centres) && data.centres.length >= 1, `Test 10: Centre summary is returned with ${data.centres?.length} centre(s)`);

      // 11. Queue length is correct when Redis is available/mock is available
      const c1 = data.centres.find(c => c.centre_id === 1);
      assert(c1 && c1.queue_length === 1 && c1.currently_processing === 'BDW-004', `Test 11: Redis live queue length and serving token are correct (queue_length: ${c1?.queue_length}, currently_processing: ${c1?.currently_processing})`);

      // 12 & 13. Redis failure does NOT fabricate queue length & PostgreSQL-derived metrics still work
      const originalLrange = redisClient.lrange;
      redisClient.lrange = async () => { throw new Error('Redis connection down'); };

      const resDegraded = await getJson(`${baseUrl}/api/admin/overview`, adminToken);
      const degradedData = resDegraded.body.data || {};
      const c1Degraded = degradedData.centres ? degradedData.centres.find(c => c.centre_id === 1) : {};

      assert(
        degradedData.queue_available === false && c1Degraded.queue_length === null && c1Degraded.currently_processing === null,
        `Test 12: Redis failure correctly returns queue_available = false and null queue metrics (queue_available: ${degradedData.queue_available}, queue_length: ${c1Degraded.queue_length})`
      );

      assert(
        degradedData.farmers.total === 1 && degradedData.bookings.total === 5 && degradedData.procurement.total_amount === 68250,
        `Test 13: PostgreSQL-derived metrics still work when Redis is unavailable`
      );

      // Restore redisClient.lrange
      redisClient.lrange = originalLrange;

      // 14. Overview endpoint does not mutate booking/payment/procurement state
      assert(
        memoryDb.bookings.length === 5 && memoryDb.procurements.length === 1 && memoryDb.payments.length === 1,
        `Test 14: Read-only verification (state remains un-mutated)`
      );

      console.log('\n==================================================');
      console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
      console.log('==================================================');
    } catch (err) {
      console.error('Test execution error:', err);
      failed++;
    } finally {
      server.close();
      if (failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    }
  });
}

runTests();
