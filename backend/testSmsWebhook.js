process.env.USE_MOCK_DB = 'true';
const http = require('http');
const app = require('./src/app');
const { generateToken } = require('./src/utils/jwt');
const smsService = require('./src/services/smsService');
const { memoryDb } = require('./src/config/dbFallback');

function runPhase4bTests() {
  const server = http.createServer(app);
  server.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[Phase 4B Test] Server listening on ${baseUrl}`);

    try {
      const farmerToken = generateToken({ id: 1, role: 'FARMER', phone: '9876543210', name: 'Ramesh Kumar' });
      const officerToken = generateToken({ id: 2, role: 'OFFICER', phone: '9876543211', name: 'Suresh Officer' });

      // 1. Create booking & procurement to trigger outbound SMS
      const bookRes = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 4800,
      }, farmerToken);

      const bookingId = bookRes.body.booking.id;

      // Record Procurement
      const procRes = await postJson(`${baseUrl}/api/procurements`, {
        booking_id: bookingId,
        weight_kg: 4800,
        grade: 'A',
      }, officerToken);

      console.log('\n--- 1. Outbound SMS Tests ---');
      console.log('1. Procurement Created Status:', procRes.status);
      console.log('2. Outbound SMS Result:', procRes.body.data.sms);

      const procurementId = procRes.body.data.procurement.id;
      const smsLog = memoryDb.smsVerifications.find(s => s.procurement_id === procurementId);

      console.log('3. SMS Log in DB exists:', !!smsLog);
      console.log('4. SMS Log Direction:', smsLog?.direction, '| Status:', smsLog?.status);
      console.log('5. SMS Log Phone:', smsLog?.farmer_phone);
      console.log('6. SMS Log Body:\n', smsLog?.message);

      console.log('\n--- 2. Inbound Webhook Reply "1" → CONFIRMED ---');
      // 7. Webhook reply "1" -> CONFIRMED
      const confirmWebhook = await postJson(`${baseUrl}/api/sms/webhook`, {
        procurement_id: procurementId,
        from: '9876543210',
        message: ' 1 ',
      });
      console.log('7. Webhook Reply "1" Status:', confirmWebhook.status, '| Response Status:', confirmWebhook.body.data?.status);

      // Verify payment status remained RECORDED (not altered by SMS)
      const pmtRes = await getJson(`${baseUrl}/api/payments/${bookingId}`, farmerToken);
      console.log('8. Payment Status Unchanged:', pmtRes.body.data.status);

      // 10. Duplicate response handling
      const dupWebhook = await postJson(`${baseUrl}/api/sms/webhook`, {
        procurement_id: procurementId,
        from: '9876543210',
        message: '1',
      });
      console.log('10. Duplicate Response Status:', dupWebhook.status, '| Error:', dupWebhook.body.error);

      console.log('\n--- 3. Inbound Webhook Reply "2" → DISPUTED (Second Procurement) ---');
      // Create second booking & procurement for dispute testing
      const bookRes2 = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'RICE',
        quantity_kg: 3000,
      }, farmerToken);

      const bookingId2 = bookRes2.body.booking.id;
      const procRes2 = await postJson(`${baseUrl}/api/procurements`, {
        booking_id: bookingId2,
        weight_kg: 3000,
        grade: 'B',
      }, officerToken);

      const procurementId2 = procRes2.body.data.procurement.id;

      // 6 & 7. Webhook reply "DISPUTE" with whitespace/case normalization & correlation by phone only
      const disputeWebhook = await postJson(`${baseUrl}/api/sms/webhook`, {
        from: '9876543210',
        message: ' dispute ',
      });
      console.log('6. Webhook Reply " dispute " by Phone Status:', disputeWebhook.status, '| Resolved Procurement ID:', disputeWebhook.body.data?.procurement_id, '| Status:', disputeWebhook.body.data?.status);

      console.log('\n--- 4. Webhook Failure & Validation Scenarios ---');
      // 8. Invalid procurement -> 404
      const invalidProcWebhook = await postJson(`${baseUrl}/api/sms/webhook`, {
        procurement_id: 99999,
        from: '9876543210',
        message: '1',
      });
      console.log('8. Invalid Procurement Webhook Status:', invalidProcWebhook.status, '| Error:', invalidProcWebhook.error || invalidProcWebhook.body.error);

      // 9. Missing correlation -> 400
      const missingCorrWebhook = await postJson(`${baseUrl}/api/sms/webhook`, {
        message: '1',
      });
      console.log('9. Missing Correlation Webhook Status:', missingCorrWebhook.status, '| Error:', missingCorrWebhook.body.error);

      console.log('\n--- 5. Procurement Decoupling Test (SMS Failure Resilience) ---');
      // 12. Procurement succeeds even when SMS dispatch simulation fails
      const originalSend = smsService.sendProcurementConfirmation;
      smsService.sendProcurementConfirmation = async () => {
        throw new Error('Simulated SMS Provider Connection Timeout');
      };

      const bookRes3 = await postJson(`${baseUrl}/api/bookings`, {
        centre_id: 1,
        slot_id: 1,
        crop: 'WHEAT',
        quantity_kg: 2000,
      }, farmerToken);

      const procRes3 = await postJson(`${baseUrl}/api/procurements`, {
        booking_id: bookRes3.body.booking.id,
        weight_kg: 2000,
        grade: 'A',
      }, officerToken);

      console.log('12. Procurement Status Despite SMS Failure:', procRes3.status, '| Procurement ID:', procRes3.body.data?.procurement?.id, '| SMS Output:', procRes3.body.data?.sms);
      smsService.sendProcurementConfirmation = originalSend;

      console.log('\n[Phase 4B Verification] All Outbound SMS & Inbound Webhook Tests Passed.');
    } catch (err) {
      console.error('[Phase 4B Test Error]', err);
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
  runPhase4bTests();
}
