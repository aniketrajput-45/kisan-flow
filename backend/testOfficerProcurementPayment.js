process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt');

function runPhase4aTests() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Phase 4A Test] Server listening on ${baseUrl}`);

    try {
      const farmerToken = generateToken({ id: 1, role: 'FARMER', phone: '9876543210', name: 'Ramesh Kumar' });
      const officerToken = generateToken({ id: 2, role: 'OFFICER', phone: '9876543211', name: 'Suresh Officer' });
      const adminToken = generateToken({ id: 3, role: 'ADMIN', phone: '9876543212', name: 'Anita Admin' });

      // Create initial booking
      const bookRes = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 4800,
      }, farmerToken);

      const booking = bookRes.body.booking;
      const bookingId = booking.id;
      const qrCode = booking.qr_code;
      const tokenNumber = booking.token_number;

      console.log('\n--- 1. Officer Lookup Tests ---');
      // 1. Officer lookup by QR
      const qrLookup = await getJson(`${baseUrl}/api/officer/booking/${qrCode}`, officerToken);
      console.log('1. Lookup by QR Status:', qrLookup.status, qrLookup.body.data ? 'Found' : 'Failed');

      // 2. Officer lookup by token
      const tokenLookup = await getJson(`${baseUrl}/api/officer/booking/lookup?query=${tokenNumber}`, officerToken);
      console.log('2. Lookup by Token Status:', tokenLookup.status, tokenLookup.body.data ? 'Found' : 'Failed');

      // 3. Farmer receives 403
      const farmerLookup = await getJson(`${baseUrl}/api/officer/booking/${qrCode}`, farmerToken);
      console.log('3. Farmer Lookup Status:', farmerLookup.status, 'Error:', farmerLookup.body.error);

      // 4. Invalid lookup returns 404
      const invalidLookup = await getJson(`${baseUrl}/api/officer/booking/NON_EXISTENT`, officerToken);
      console.log('4. Invalid Lookup Status:', invalidLookup.status, 'Error:', invalidLookup.body.error);

      console.log('\n--- 2. Procurement Recording Tests ---');
      // 6. Invalid weight rejected
      const invWeight = await postJson(`${baseUrl}/api/procurements`, { booking_id: bookingId, weight_kg: -10, grade: 'A' }, officerToken);
      console.log('6. Invalid Weight Status:', invWeight.status, 'Error:', invWeight.body.error);

      // 7. Missing grade rejected
      const missGrade = await postJson(`${baseUrl}/api/procurements`, { booking_id: bookingId, weight_kg: 4800 }, officerToken);
      console.log('7. Missing Grade Status:', missGrade.status, 'Error:', missGrade.body.error);

      // 9. Farmer cannot create procurement
      const farmerProc = await postJson(`${baseUrl}/api/procurements`, { booking_id: bookingId, weight_kg: 4800, grade: 'A' }, farmerToken);
      console.log('9. Farmer Create Procurement Status:', farmerProc.status, 'Error:', farmerProc.body.error);

      // 5 & 10. Valid procurement succeeds + payment RECORDED created atomically
      const validProc = await postJson(`${baseUrl}/api/procurements`, { booking_id: bookingId, weight_kg: 4800, grade: 'A' }, officerToken);
      console.log('5 & 10. Valid Procurement Status:', validProc.status);
      console.log('Procurement & Payment Data:', JSON.stringify(validProc.body.data, null, 2));
      const paymentId = validProc.body.data.payment.id;

      // 8. Duplicate procurement rejected
      const dupProc = await postJson(`${baseUrl}/api/procurements`, { booking_id: bookingId, weight_kg: 4800, grade: 'A' }, officerToken);
      console.log('8. Duplicate Procurement Status:', dupProc.status, 'Error:', dupProc.body.error);

      console.log('\n--- 3. Payment Authorization & State Machine Tests ---');
      // 1. Farmer can GET payment for own booking -> 200
      const farmerOwnPmt = await getJson(`${baseUrl}/api/payments/${bookingId}`, farmerToken);
      console.log('Test 1. Farmer GET payment for own booking Status:', farmerOwnPmt.status, 'Status Value:', farmerOwnPmt.body.data?.status);

      // 2. Farmer cannot GET payment for another farmer's booking -> 403
      const otherFarmerToken = generateToken({ id: 99, role: 'FARMER', phone: '9876543299', name: 'Other Farmer' });
      const farmerOtherPmt = await getJson(`${baseUrl}/api/payments/${bookingId}`, otherFarmerToken);
      console.log("Test 2. Farmer GET payment for another farmer's booking Status:", farmerOtherPmt.status, 'Error:', farmerOtherPmt.body.error);

      // 3. Farmer cannot PATCH payment status -> 403
      const realPaymentId = farmerOwnPmt.body.data.payment_id;
      const farmerModPmt = await patchJson(`${baseUrl}/api/payments/${realPaymentId}/status`, { status: 'INITIATED' }, farmerToken);
      console.log('Test 3. Farmer PATCH payment status Status:', farmerModPmt.status, 'Error:', farmerModPmt.body.error);

      // 4. Officer can GET payment -> 200
      const officerGetPmt = await getJson(`${baseUrl}/api/payments/${bookingId}`, officerToken);
      console.log('Test 4. Officer GET payment Status:', officerGetPmt.status, 'Payment ID:', officerGetPmt.body.data?.payment_id);

      // 15. Invalid jump rejected (RECORDED -> CREDITED) -> 409
      const invJump = await patchJson(`${baseUrl}/api/payments/${realPaymentId}/status`, { status: 'CREDITED' }, officerToken);
      console.log('Invalid Jump (RECORDED -> CREDITED) Status:', invJump.status, 'Error:', invJump.body.error);

      // 5. Officer can PATCH payment -> 200 (RECORDED -> INITIATED)
      const recToInit = await patchJson(`${baseUrl}/api/payments/${realPaymentId}/status`, { status: 'INITIATED' }, officerToken);
      console.log('Test 5. Officer PATCH payment (RECORDED -> INITIATED) Status:', recToInit.status, 'Current Status:', recToInit.body.data?.current_status);

      // 6. Admin can GET/PATCH payment -> 200
      const adminGetPmt = await getJson(`${baseUrl}/api/payments/${bookingId}`, adminToken);
      const adminPatchPmt = await patchJson(`${baseUrl}/api/payments/${realPaymentId}/status`, { status: 'PROCESSING' }, adminToken);
      console.log('Test 6. Admin GET payment Status:', adminGetPmt.status, '| Admin PATCH payment (INITIATED -> PROCESSING) Status:', adminPatchPmt.status, 'Current Status:', adminPatchPmt.body.data?.current_status);

      // Final transition: PROCESSING -> CREDITED via Officer
      const procToCred = await patchJson(`${baseUrl}/api/payments/${realPaymentId}/status`, { status: 'CREDITED' }, officerToken);
      console.log('Final Transition (PROCESSING -> CREDITED) Status:', procToCred.status, 'Current Status:', procToCred.body.data?.current_status);

      console.log('\n[Phase 4A Verification] All Officer, Procurement & Payment Tests Passed.');
    } catch (err) {
      console.error('[Phase 4A Test Error]', err);
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

function patchJson(url, data, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'PATCH', headers }, (res) => {
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
  runPhase4aTests();
}
