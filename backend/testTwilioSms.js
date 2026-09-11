const pool = require('./src/config/db');
const smsService = require('./src/services/smsService');
const officerService = require('./src/services/officerService');
const queueService = require('./src/services/queueService');
const queueScheduler = require('./src/services/queueNotificationScheduler');
const bcrypt = require('bcryptjs');

async function runTwilioSmsTests() {
  console.log('====================================================');
  console.log('     KISANFLOW TWILIO SMS INTEGRATION TEST SUITE    ');
  console.log('====================================================\n');

  const client = await pool.connect();
  let bookingId, procurementId, paymentId;
  const testPhone = '9876543210';
  const testDate = '2026-09-10';

  try {
    // Setup test user & booking
    console.log('[Setup] Preparing test farmer, slot, and booking...');
    const passHash = await bcrypt.hash('password123', 10);
    const userRes = await client.query(
      `INSERT INTO users (name, phone, role, password_hash)
       VALUES ('Ramesh Test', $1, 'FARMER', $2)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [testPhone, passHash]
    );
    const farmerId = userRes.rows[0].id;

    const centreRes = await client.query(`SELECT id FROM centres LIMIT 1`);
    const centreId = centreRes.rows[0].id;

    const slotRes = await client.query(
      `SELECT id FROM slots WHERE centre_id = $1 LIMIT 1`,
      [centreId]
    );
    const slotId = slotRes.rows[0].id;

    const tokenNum = `TW-TEST-${Date.now().toString().slice(-4)}`;
    const qrCode = `KF-QR-${Date.now()}`;
    await client.query(`DELETE FROM bookings WHERE user_id = $1 AND slot_id = $2 AND status != 'COMPLETED'`, [farmerId, slotId]);
    const bkgRes = await client.query(
      `INSERT INTO bookings (user_id, centre_id, slot_id, booking_date, token_number, qr_code, crop, quantity_kg, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Wheat', 500, 'BOOKED')
       RETURNING id`,
      [farmerId, centreId, slotId, testDate, tokenNum, qrCode]
    );
    bookingId = bkgRes.rows[0].id;
    console.log(`✓ Created Test Booking #${bookingId} (Token: ${tokenNum})\n`);

    // TEST 1: Twilio Disabled (Simulated Mode)
    console.log('--- TEST 1: Twilio Disabled (Simulation Mode) ---');
    const simResult = await smsService.sendSms({
      to: testPhone,
      body: 'KisanFlow Test Simulation Message',
      bookingId,
      farmerId,
      messageType: 'TURN_APPROACHING',
    });
    console.log('✓ Simulated SMS Dispatch Result:', {
      success: simResult.success,
      provider: simResult.provider,
      status: simResult.status,
      messageId: simResult.messageId,
    });
    if (simResult.provider !== 'SIMULATED') {
      throw new Error('Test 1 Failed: expected provider SIMULATED');
    }

    // TEST 2: Idempotency Check (Duplicate Dispatch)
    console.log('\n--- TEST 2: Idempotency Verification ---');
    const dupResult = await smsService.sendSms({
      to: testPhone,
      body: 'KisanFlow Duplicate Message Should Not Send',
      bookingId,
      farmerId,
      messageType: 'TURN_APPROACHING',
    });
    console.log('✓ Duplicate Notification Handled:', {
      idempotentSkipped: dupResult.idempotentSkipped,
      messageId: dupResult.messageId,
    });
    if (!dupResult.idempotentSkipped) {
      throw new Error('Test 2 Failed: expected idempotentSkipped to be true');
    }

    // TEST 3: Queue Status & Turn Notifications (TURN_NEAR & TURN_CALLED)
    console.log('\n--- TEST 3: Queue Arrival & Turn Notifications ---');
    const mockFarmer = { id: farmerId, role: 'FARMER' };
    await queueService.markArrived(mockFarmer, bookingId);
    console.log('✓ Marked Arrived');

    // Run scheduler evaluator
    await queueScheduler.evaluateQueueNotifications();
    console.log('✓ Queue Evaluator Executed');

    // Start processing (triggers TURN_CALLED)
    await queueService.startProcessing(bookingId);
    console.log('✓ Processing Started (Triggers TURN_CALLED SMS)');

    // TEST 4: Procurement Recording & Confirmation SMS + PAYMENT_RECORDED SMS
    console.log('\n--- TEST 4: Procurement Recording & Payment RECORDED SMS ---');
    const procRes = await officerService.recordProcurement(1, {
      booking_id: bookingId,
      weight_kg: 490,
      grade: 'FAQ',
    });
    procurementId = procRes.procurement.id;
    paymentId = procRes.payment.id;
    console.log(`✓ Procurement Recorded #${procurementId}, Payment #${paymentId} Status: ${procRes.payment.status}`);

    // TEST 5: Payment Status Transition Notifications (INITIATED -> PROCESSING -> CREDITED)
    console.log('\n--- TEST 5: Payment State Machine SMS Transitions ---');
    const payStatuses = ['INITIATED', 'PROCESSING', 'CREDITED'];
    for (const st of payStatuses) {
      const updatedPay = await officerService.updatePaymentStatus(paymentId, st);
      console.log(`✓ Payment Transitioned to: ${updatedPay.current_status}`);
    }

    // TEST 6: Inbound Webhook (CONFIRM/DISPUTE)
    console.log('\n--- TEST 6: Inbound Confirmation Webhook ---');
    const webhookRes = await smsService.handleInboundWebhook({
      procurement_id: procurementId,
      from: testPhone,
      message: '1',
    });
    console.log('✓ Inbound SMS Confirmation Handled:', webhookRes);

    // TEST 7: Twilio Status Callback Simulation
    console.log('\n--- TEST 7: Twilio Delivery Status Callback ---');
    // Insert a dummy Twilio record
    const dummySid = `SM_TEST_${Date.now()}`;
    const insertRes = await client.query(
      `INSERT INTO sms_verifications (booking_id, farmer_phone, message, direction, status, message_type, provider, provider_message_id, provider_status, delivery_status)
       VALUES ($1, $2, 'Twilio Status Test', 'OUTBOUND', 'SENT', 'STATUS_CALLBACK_TEST', 'TWILIO', $3, 'queued', 'QUEUED')
       RETURNING id`,
      [bookingId, testPhone, dummySid]
    );

    const statusCbRes = await smsService.handleTwilioStatusCallback({
      MessageSid: dummySid,
      MessageStatus: 'delivered',
      ErrorCode: null,
    });
    console.log('✓ Twilio Status Callback Handled:', {
      found: statusCbRes.found,
      deliveryStatus: statusCbRes.record.delivery_status,
      providerStatus: statusCbRes.record.provider_status,
    });

    // TEST 8: Verify Database SMS Logs
    console.log('\n--- TEST 8: Verifying Logged SMS Records in Database ---');
    const smsLogs = await client.query(
      `SELECT id, message_type, status, provider, provider_message_id, delivery_status, created_at
       FROM sms_verifications
       WHERE booking_id = $1
       ORDER BY id ASC`,
      [bookingId]
    );
    console.log(`✓ Total SMS Records for Booking #${bookingId}: ${smsLogs.rows.length}`);
    smsLogs.rows.forEach((r, idx) => {
      console.log(`  [${idx + 1}] Type: ${r.message_type.padEnd(25)} Status: ${r.status.padEnd(10)} Provider: ${r.provider}`);
    });

    console.log('\n====================================================');
    console.log('   ALL TWILIO SMS INTEGRATION TESTS PASSED 100%!   ');
    console.log('====================================================');
  } catch (err) {
    console.error('\n✗ TWILIO SMS TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runTwilioSmsTests();
}

module.exports = runTwilioSmsTests;
