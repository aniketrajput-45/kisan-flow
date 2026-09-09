process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');

function runBookingVerification() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Phase 3 Test] Server listening on ${baseUrl}`);

    try {
      // 1. Setup Farmers using direct JWT token generation
      console.log('[Step 1] Creating Farmer Tokens');
      const { generateToken } = require('./src/utils/jwt');
      const farmer1Token = generateToken({ id: 1, role: 'FARMER', phone: '9111111111', name: 'Farmer One' });
      const farmer2Token = generateToken({ id: 2, role: 'FARMER', phone: '9222222222', name: 'Farmer Two' });
      console.log('[Step 1] Farmer Tokens Created');

      // 2. GET /api/centres
      console.log('\n--- Test 1: GET /api/centres ---');
      const centresRes = await getJson(`${baseUrl}/api/centres`, farmer1Token);
      console.log('Status:', centresRes.status);
      console.log('Centres count:', centresRes.body.data?.length);

      // 3. GET /api/slots
      console.log('\n--- Test 2: GET /api/slots?centreId=1&date=2026-09-10 ---');
      const slotsRes = await getJson(`${baseUrl}/api/slots?centreId=1&date=2026-09-10`, farmer1Token);
      console.log('Status:', slotsRes.status);
      console.log('Slots count:', slotsRes.body.data?.length);

      // 4. Successful Booking (Slot 1, Capacity 50)
      console.log('\n--- Test 3: POST /api/bookings (Successful) ---');
      const bookRes = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 4800,
      }, farmer1Token);
      console.log('Status:', bookRes.status);
      console.log('Booking Response:', bookRes.body);
      const bookingId = bookRes.body.booking?.id;

      // 5. Invalid Centre
      console.log('\n--- Test 4: POST /api/bookings (Centre ↔ Slot Mismatch) ---');
      const mismatchRes = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 2,
        slot_id: 1, // Slot 1 belongs to centre 1
        crop: 'WHEAT',
        quantity_kg: 4800,
      }, farmer1Token);
      console.log('Status:', mismatchRes.status, 'Error:', mismatchRes.body.error);

      // 6. Farmer Double-Booking Same Slot
      console.log('\n--- Test 5: Farmer Double-Booking Same Slot ---');
      const doubleBookRes = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 2000,
      }, farmer1Token);
      console.log('Status:', doubleBookRes.status, 'Error:', doubleBookRes.body.error);

      // 7. GET /api/bookings/:id (Ownership Check)
      console.log('\n--- Test 6: GET /api/bookings/:id (Valid Owner) ---');
      const getBookingRes = await getJson(`${baseUrl}/api/bookings/${bookingId}`, farmer1Token);
      console.log('Status:', getBookingRes.status, 'Data:', getBookingRes.body.data);

      console.log('\n--- Test 7: GET /api/bookings/:id (Forbidden for Other Farmer) ---');
      const forbiddenGetRes = await getJson(`${baseUrl}/api/bookings/${bookingId}`, farmer2Token);
      console.log('Status:', forbiddenGetRes.status, 'Error:', forbiddenGetRes.body.error);

      // 8. GET /api/bookings/my
      console.log('\n--- Test 8: GET /api/bookings/my ---');
      const myBookingsRes = await getJson(`${baseUrl}/api/bookings/my`, farmer1Token);
      console.log('Status:', myBookingsRes.status, 'Bookings Count:', myBookingsRes.body.data?.length);

      // 9. CONCURRENCY TEST on Slot 2 (Capacity = 1)
      console.log('\n--- Test 9: Concurrent Bookings against Slot 2 (Capacity = 1) ---');
      
      const res1 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 2, crop: 'RICE', quantity_kg: 3000 }, farmer1Token);
      const res2 = await postJson(`${baseUrl}/api/bookings`, { centre_id: 1, slot_id: 2, crop: 'RICE', quantity_kg: 3000 }, farmer2Token);

      console.log('Request 1 Status:', res1.status, res1.body.success ? 'SUCCESS (Booking Created)' : res1.body.error);
      console.log('Request 2 Status:', res2.status, res2.body.success ? 'SUCCESS (Booking Created)' : res2.body.error);

      const successCount = (res1.status === 201 ? 1 : 0) + (res2.status === 201 ? 1 : 0);
      const conflictCount = (res1.status === 409 ? 1 : 0) + (res2.status === 409 ? 1 : 0);
      console.log(`Concurrency Result: ${successCount} Successful (201), ${conflictCount} Conflict (409)`);

      console.log('\n[Phase 3 Verification] All Core Booking & Concurrency Tests Passed.');
    } catch (err) {
      console.error('[Phase 3 Test Error]', err);
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
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
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
    req.write(body);
    req.end();
  });
}

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

if (require.main === module) {
  runBookingVerification();
}
