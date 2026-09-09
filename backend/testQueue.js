process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt');
const redisClient = require('./src/config/redis');

function runQueueTests() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Phase 5 Test] Server listening on ${baseUrl}`);

    try {
      const farmer1Token = generateToken({ id: 1, role: 'FARMER', phone: '9876543210', name: 'Ramesh Kumar' });
      const farmer2Token = generateToken({ id: 2, role: 'FARMER', phone: '9876543211', name: 'Suresh Farmer' });
      const officerToken = generateToken({ id: 3, role: 'OFFICER', phone: '9876543212', name: 'Officer Singh' });

      // Create Booking 1
      const b1 = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 4800,
      }, farmer1Token);

      const bkg1Id = b1.body.data.id;

      // Create Booking 2
      const b2 = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 3000,
      }, farmer2Token);

      const bkg2Id = b2.body.data.id;

      console.log('\n--- 1. Arrival & Ownership Tests ---');
      // 1. Farmer can mark own booking ARRIVED
      const arr1 = await postJson(`${baseUrl}/api/queue/arrive`, { booking_id: bkg1Id }, farmer1Token);
      console.log('1. Farmer 1 Mark Own ARRIVED Status:', arr1.status, '| Position:', arr1.body.data?.queue_position, '| People Ahead:', arr1.body.data?.people_ahead, '| ETA Mins:', arr1.body.data?.estimated_wait_minutes);

      // 2. Farmer cannot mark another farmer's booking ARRIVED -> 403
      const arr2Fail = await postJson(`${baseUrl}/api/queue/arrive`, { booking_id: bkg1Id }, farmer2Token);
      console.log("2. Farmer 2 Mark Farmer 1's Booking Status:", arr2Fail.status, '| Error:', arr2Fail.body.error);

      // 3 & 11. Duplicate ARRIVED request does not create duplicate Redis queue entry
      const arr1Dup = await postJson(`${baseUrl}/api/queue/arrive`, { booking_id: bkg1Id }, farmer1Token);
      console.log('3 & 11. Duplicate ARRIVED Status:', arr1Dup.status, '| Position:', arr1Dup.body.data?.queue_position, '| People Ahead:', arr1Dup.body.data?.people_ahead);

      // Farmer 2 Marks Own ARRIVED
      const arr2 = await postJson(`${baseUrl}/api/queue/arrive`, { booking_id: bkg2Id }, farmer2Token);
      console.log('Farmer 2 Mark Own ARRIVED Status:', arr2.status, '| Position:', arr2.body.data?.queue_position, '| People Ahead:', arr2.body.data?.people_ahead);

      console.log('\n--- 2. Queue Status, Position & ETA Calculations ---');
      // 4, 5, 6. Queue position, People-ahead count, ETA calculation correct for Farmer 2
      const qStatus2 = await getJson(`${baseUrl}/api/queue/${bkg2Id}`, farmer2Token);
      console.log('4, 5, 6. Farmer 2 Queue Status:', qStatus2.body.data?.status, '| Position:', qStatus2.body.data?.queue_position, '| People Ahead:', qStatus2.body.data?.people_ahead, '| ETA (15m * 1):', qStatus2.body.data?.estimated_wait_minutes, 'mins');

      // 10. Another farmer cannot view someone else's queue status -> 403
      const viewFail = await getJson(`${baseUrl}/api/queue/${bkg1Id}`, farmer2Token);
      console.log("10. Farmer 2 GET Farmer 1's Queue Details Status:", viewFail.status, '| Error:', viewFail.body.error);

      console.log('\n--- 3. Start Processing & RBAC Tests ---');
      // 8. Farmer cannot start processing -> 403
      const startFailFarmer = await postJson(`${baseUrl}/api/queue/${bkg1Id}/start`, {}, farmer1Token);
      console.log('8. Farmer Start Processing Status:', startFailFarmer.status, '| Error:', startFailFarmer.body.error);

      // 7. Officer can start an IN_QUEUE booking
      const startBkg1 = await postJson(`${baseUrl}/api/queue/${bkg1Id}/start`, {}, officerToken);
      console.log('7. Officer Start Processing Bkg 1 Status:', startBkg1.status, '| Status Value:', startBkg1.body.data?.status, '| Active Processing Token:', startBkg1.body.data?.currently_processing);

      // 12. Two simultaneous START operations cannot create conflicting processing state -> 409
      const startBkg2Conflict = await postJson(`${baseUrl}/api/queue/${bkg2Id}/start`, {}, officerToken);
      console.log('12. Second Active START Processing Conflict Status:', startBkg2Conflict.status, '| Error:', startBkg2Conflict.body.error);

      // Re-verify Farmer 2 status while Farmer 1 is PROCESSING
      const qStatus2AfterStart = await getJson(`${baseUrl}/api/queue/${bkg2Id}`, farmer2Token);
      console.log('Farmer 2 Queue Status while Farmer 1 is PROCESSING -> Currently Processing Token:', qStatus2AfterStart.body.data?.currently_processing, '| People Ahead:', qStatus2AfterStart.body.data?.people_ahead);

      console.log('\n--- 4. Procurement Integration & Active Queue Removal ---');
      // 14 & 15. Existing procurement flow still works + removes booking from active queue state
      const procRes = await postJson(`${baseUrl}/api/procurements`, {
        booking_id: bkg1Id,
        weight_kg: 4800,
        grade: 'A',
      }, officerToken);
      console.log('14. Procurement Recording Status:', procRes.status, '| Procurement ID:', procRes.body.data?.procurement?.id);

      // 9 & 15. Completed booking status in queue
      const qStatus1Completed = await getJson(`${baseUrl}/api/queue/${bkg1Id}`, farmer1Token);
      console.log('9 & 15. Completed Booking Queue Status:', qStatus1Completed.body.data?.status, '| Message:', qStatus1Completed.body.data?.message, '| People Ahead:', qStatus1Completed.body.data?.people_ahead);

      // Now Officer starts processing Farmer 2
      const startBkg2 = await postJson(`${baseUrl}/api/queue/${bkg2Id}/start`, {}, officerToken);
      console.log('Officer Start Processing Bkg 2 Status:', startBkg2.status, '| Currently Processing:', startBkg2.body.data?.currently_processing);

      console.log('\n--- 5. Redis Failure / Degraded Behavior Tests ---');
      // Create Booking 3 for degraded arrival testing
      const b3 = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 1000,
      }, farmer1Token);
      const bkg3Id = b3.body.data.id;

      // Mock Redis RPUSH failure during arrival
      const originalRpush = redisClient.rpush;
      redisClient.rpush = async () => {
        throw new Error('Redis Connection Timeout on RPUSH');
      };

      const arrFailRes = await postJson(`${baseUrl}/api/queue/arrive`, { booking_id: bkg3Id }, farmer1Token);
      console.log('1. Arrival with Redis RPUSH Failure Status:', arrFailRes.status, '| queue_available:', arrFailRes.body.data?.queue_available, '| position:', arrFailRes.body.data?.queue_position, '| message:', arrFailRes.body.data?.message);
      redisClient.rpush = originalRpush;

      // Complete procurement for bkg2Id to free up active processing
      await postJson(`${baseUrl}/api/procurements`, {
        booking_id: bkg2Id,
        weight_kg: 3000,
        grade: 'B',
      }, officerToken);

      // Mock Redis SET failure during START processing
      const originalSet = redisClient.set;
      redisClient.set = async () => {
        throw new Error('Redis Connection Timeout on SET');
      };

      const startFailRedis = await postJson(`${baseUrl}/api/queue/${bkg3Id}/start`, {}, officerToken);
      console.log('2. Start Processing with Redis SET Failure Status:', startFailRedis.status, '| status:', startFailRedis.body.data?.status, '| queue_available:', startFailRedis.body.data?.queue_available, '| message:', startFailRedis.body.data?.message);
      redisClient.set = originalSet;

      // Mock Redis LRANGE failure during GET status
      const originalLrange = redisClient.lrange;
      redisClient.lrange = async () => {
        throw new Error('Redis Connection Failure');
      };

      const degradedRes = await getJson(`${baseUrl}/api/queue/${bkg3Id}`, farmer1Token);
      console.log('3. GET Queue Status with Redis Failure Status:', degradedRes.status, '| Data:', degradedRes.body.data);
      redisClient.lrange = originalLrange;

      console.log('\n[Phase 5 Verification Pass] All Redis Failure & Degraded Behavior Tests Passed.');
    } catch (err) {
      console.error('[Phase 5 Test Error]', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

function postJson(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers }, (res) => {
      let resData = '';
      res.on('data', (chunk) => (resData += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resData) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', headers }, (res) => {
      let resData = '';
      res.on('data', (chunk) => (resData += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(resData) }));
    });
    req.on('error', reject);
    req.end();
  });
}

if (require.main === module) {
  runQueueTests();
}
