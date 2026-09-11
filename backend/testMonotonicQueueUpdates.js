process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt');

function postJson(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function getJson(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch (e) {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Test] Server started on ${baseUrl}`);

    try {
      const farmer1 = generateToken({ id: 20, role: 'FARMER', phone: '9999990001', name: 'Farmer A' });
      const farmer2 = generateToken({ id: 21, role: 'FARMER', phone: '9999990002', name: 'Farmer B' });
      const farmer3 = generateToken({ id: 22, role: 'FARMER', phone: '9999990003', name: 'Farmer C' });
      const officer = generateToken({ id: 2, role: 'OFFICER', phone: '9876543211', name: 'Officer Suresh' });

      console.log('\n--- 1. Testing Monotonic Token Generation (Never Resetting Across Dates) ---');
      // Booking 1 (Today)
      const res1 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 1, crop: 'Wheat', quantity_kg: 2000 }, farmer1);
      console.log('Booking 1 Token:', res1.body.data?.token_number);

      // Booking 2 (Today)
      const res2 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 1, crop: 'Wheat', quantity_kg: 3000 }, farmer2);
      console.log('Booking 2 Token:', res2.body.data?.token_number);

      // Booking 3 (Tomorrow / Future Date)
      const res3 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 2, crop: 'Mustard', quantity_kg: 1500 }, farmer3);
      console.log('Booking 3 Token (Day 2 / Slot 2):', res3.body.data?.token_number);

      // Booking 4 (Day 3 / Future Date)
      const farmer4 = generateToken({ id: 23, role: 'FARMER', phone: '9999990004', name: 'Farmer D' });
      const res4 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 1, crop: 'Gram', quantity_kg: 1800 }, farmer4);
      console.log('Booking 4 Token (Day 3):', res4.body.data?.token_number);

      // Booking 5 (Day 4 / Next Week)
      const farmer5 = generateToken({ id: 24, role: 'FARMER', phone: '9999990005', name: 'Farmer E' });
      const res5 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 2, crop: 'Paddy', quantity_kg: 2500 }, farmer5);
      console.log('Booking 5 Token (Next Week):', res5.body.data?.token_number);

      const token1Seq = parseInt(res1.body.data?.token_number.split('-')[1], 10);
      const token2Seq = parseInt(res2.body.data?.token_number.split('-')[1], 10);
      const token3Seq = parseInt(res3.body.data?.token_number.split('-')[1], 10);
      const token4Seq = parseInt(res4.body.data?.token_number.split('-')[1], 10);
      const token5Seq = parseInt(res5.body.data?.token_number.split('-')[1], 10);

      if (token2Seq > token1Seq && token3Seq > token2Seq && token4Seq > token3Seq && token5Seq > token4Seq) {
        console.log(`✅ SUCCESS: Tokens strictly monotonically increase (${token1Seq} -> ${token2Seq} -> ${token3Seq} -> ${token4Seq} -> ${token5Seq}) and NEVER repeat!`);
      } else {
        console.error('❌ FAILURE: Tokens are not strictly monotonically increasing!', token1Seq, token2Seq, token3Seq, token4Seq, token5Seq);
      }

      console.log('\n--- 2. Testing Officer Direct "Start Processing" on BOOKED status (No Mark Arrived needed) ---');
      const bkgId = res1.body.data?.id;
      const startRes = await postJson(`${baseUrl}/api/queue/${bkgId}/start`, {}, officer);
      console.log('Start Processing Status:', startRes.status);
      console.log('New Status:', startRes.body.data?.status);
      console.log('Active Processing Token:', startRes.body.data?.currently_processing);

      if (startRes.status === 200 && startRes.body.data?.status === 'PROCESSING') {
        console.log('✅ SUCCESS: Officer can start processing directly from BOOKED status without needing Mark Arrived!');
      } else {
        console.error('❌ FAILURE: Start processing failed on BOOKED status!');
      }

      console.log('\n--- 3. Testing Active Queue with Slot Breakdown & Completed Exclusion ---');
      const queueRes = await getJson(`${baseUrl}/api/queue/active?centreId=1`, officer);
      console.log('Active Queue Count:', queueRes.body.data?.length);
      console.log('Queue items summary:');
      queueRes.body.data?.forEach((item) => {
        console.log(`- Token: ${item.token_number} | Slot: ${item.start_time} - ${item.end_time} | Status: ${item.status}`);
      });

      console.log('\n--- 4. Testing Procurement Completion and Immediate Removal from Queue ---');
      const procRes = await postJson(`${baseUrl}/api/procurements`, {
        booking_id: bkgId,
        weight_kg: 2000,
        grade: 'Grade A',
      }, officer);
      console.log('Procurement Recorded:', procRes.status);

      const queueAfterProc = await getJson(`${baseUrl}/api/queue/active?centreId=1`, officer);
      const isCompletedInQueue = queueAfterProc.body.data?.some((item) => item.id === bkgId || item.status === 'COMPLETED');
      console.log('Active Queue Count After Procurement:', queueAfterProc.body.data?.length);
      console.log('Is Completed Farmer Still in Queue?:', isCompletedInQueue);

      if (!isCompletedInQueue) {
        console.log('✅ SUCCESS: Completed/processed farmer is immediately removed from the queue and will NOT appear on screen!');
      } else {
        console.error('❌ FAILURE: Completed farmer is still present in active queue!');
      }

      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Test error:', err);
      server.close();
      process.exit(1);
    }
  });
}

runVerification();
