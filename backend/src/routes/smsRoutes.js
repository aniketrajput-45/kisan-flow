const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

// Inbound SMS Gateway Webhook
router.post('/sms/webhook', smsController.handleWebhook);

module.exports = router;
