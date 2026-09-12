process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');
const jwt = require('jsonwebtoken');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone, name: user.name },
    process.env.JWT_SECRET || 'kisanflow_super_secret_jwt_key_2026',
    { expiresIn: '1d' }
  );
}

function requestJson(baseUrl, path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = body ? JSON.stringify(body) : null;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runLifecycleVerification() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Lifecycle Test] Testing on ${baseUrl}`);

    try {
      const farmerToken = makeToken({ id: 1, role: 'FARMER', phone: '9876543210', name: 'Ramesh Kumar' });
      const officerToken = makeToken({ id: 2, role: 'OFFICER', phone: '9876543211', name: 'Suresh Sharma' });

      console.log('\n--- Step 1: Farmer Books Slot 1 ---');
      const bookRes = await requestJson(baseUrl, '/api/bookings', 'POST', {
        centre_id: 1,
        slot_id: 1,
        crop: 'Wheat',
        quantity_kg: 2400,
      }, farmerToken);

      console.log('Book status:', bookRes.status);
      const booking = bookRes.body.data;
      console.log('Created Booking ID:', booking.id, 'Token:', booking.token_number, 'Status:', booking.status);
      if (booking.status !== 'BOOKED') {
        throw new Error(`Expected BOOKED status, got ${booking.status}`);
      }

      console.log('\n--- Step 2: Officer checks Dashboard Queue BEFORE farmer arrives ---');
      const queueBeforeRes = await requestJson(baseUrl, '/api/queue/active?status=ALL', 'GET', null, officerToken);
      console.log('Active queue status:', queueBeforeRes.status);
      const allBefore = queueBeforeRes.body.data || [];
      const foundInAll = allBefore.find(b => b.id === booking.id);
      console.log('Is booking visible in scheduled slots?:', !!foundInAll, 'Status:', foundInAll?.status);

      // In Live Physical Queue (arrived farmers), booked farmers should NOT appear
      const physicalQueueBefore = allBefore.filter(b => b.status !== 'BOOKED');
      const inPhysicalQueueBefore = physicalQueueBefore.some(b => b.id === booking.id);
      console.log('Is farmer in live physical gate queue before arrival?:', inPhysicalQueueBefore);
      if (inPhysicalQueueBefore) {
        throw new Error('Farmer should NOT be in physical gate queue before marking arrival!');
      }

      console.log('\n--- Step 3: Farmer reaches Mandi Gate and marks ARRIVED ---');
      const arriveRes = await requestJson(baseUrl, '/api/queue/arrive', 'POST', {
        booking_id: booking.id,
      }, farmerToken);
      console.log('Arrive status:', arriveRes.status, 'New status:', arriveRes.body.data?.status);
      if (arriveRes.body.data?.status !== 'IN_QUEUE') {
        throw new Error(`Expected IN_QUEUE status, got ${arriveRes.body.data?.status}`);
      }

      console.log('\n--- Step 4: Officer Dashboard checks Live Queue AFTER arrival ---');
      const queueAfterRes = await requestJson(baseUrl, '/api/queue/active?status=ALL', 'GET', null, officerToken);
      const allAfter = queueAfterRes.body.data || [];
      const physicalQueueAfter = allAfter.filter(b => b.status !== 'BOOKED');
      const foundInPhysicalQueue = physicalQueueAfter.find(b => b.id === booking.id);
      console.log('Is farmer now in live physical gate queue?:', !!foundInPhysicalQueue);
      console.log('Slot Time:', foundInPhysicalQueue?.slot_time, 'Queue Position:', foundInPhysicalQueue?.queue_position);
      if (!foundInPhysicalQueue) {
        throw new Error('Farmer MUST be in live physical queue after marking arrival!');
      }

      console.log('\n--- Step 5: Officer calls farmer and starts PROCESSING ---');
      const startRes = await requestJson(baseUrl, `/api/queue/${booking.id}/start`, 'POST', null, officerToken);
      console.log('Start processing status:', startRes.status, 'New status:', startRes.body.data?.status);
      if (startRes.body.data?.status !== 'PROCESSING') {
        throw new Error(`Expected PROCESSING status, got ${startRes.body.data?.status}`);
      }

      console.log('\n--- Step 6: Officer records procurement & completes booking ---');
      const procRes = await requestJson(baseUrl, '/api/procurements', 'POST', {
        booking_id: booking.id,
        weight_kg: 2400,
        grade: 'Grade A',
      }, officerToken);
      console.log('Procurement submit status:', procRes.status, 'Total amount:', procRes.body.data?.procurement?.total_amount);

      console.log('\n--- Step 7: Officer Dashboard checks Queue AFTER Completion ---');
      const queueFinalRes = await requestJson(baseUrl, '/api/queue/active?status=ALL', 'GET', null, officerToken);
      const allFinal = queueFinalRes.body.data || [];
      const foundFinal = allFinal.find(b => b.id === booking.id);
      console.log('Is completed farmer present in active queue?:', !!foundFinal);
      if (foundFinal) {
        throw new Error('Completed farmer MUST be removed from active queue!');
      }

      console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Test failed:', err);
      process.exit(1);
    }
  });
}

runLifecycleVerification();
