const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

const { authenticate, requireRole } = require('../middleware/auth');

// Inbound SMS Gateway Webhook
router.post('/sms/webhook', smsController.handleWebhook);

// Twilio Delivery Status Webhooks
router.post('/twilio/status', smsController.handleTwilioStatus);
router.post('/sms/twilio/status', smsController.handleTwilioStatus);

// SMS Inspection Logs (Admin / Nodal Officer)
router.get('/admin/sms-logs', authenticate, requireRole('ADMIN', 'OFFICER'), smsController.getSmsLogs);
router.get('/sms/logs', authenticate, requireRole('ADMIN', 'OFFICER'), smsController.getSmsLogs);

module.exports = router;
