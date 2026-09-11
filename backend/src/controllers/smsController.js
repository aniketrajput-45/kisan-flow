const smsService = require('../services/smsService');
const pool = require('../config/db');
const config = require('../config/env');

const handleWebhook = async (req, res, next) => {
  try {
    const procurement_id = req.body.procurement_id || req.body.ProcurementId;
    const from = req.body.from || req.body.From;
    const message = req.body.message || req.body.Body;

    const result = await smsService.handleInboundWebhook({
      procurement_id,
      from,
      message,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const handleTwilioStatus = async (req, res, next) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = req.body;
    
    // Mandatory Twilio signature validation when enabled
    if (config.twilio && config.twilio.validateSignature && config.twilio.authToken) {
      try {
        const twilio = require('twilio');
        const signature = req.headers['x-twilio-signature'] || '';
        const url = config.twilio.statusCallbackUrl || `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const isValid = twilio.validateRequest(config.twilio.authToken, signature, url, req.body || {});
        if (!isValid) {
          console.warn('[Twilio Webhook Security] Invalid Twilio Signature received');
          return res.status(403).json({ success: false, error: 'Invalid Twilio Signature' });
        }
      } catch (vErr) {
        console.error('[Twilio Signature Validation Error]', vErr.message);
        return res.status(403).json({ success: false, error: 'Twilio signature validation error' });
      }
    }

    const result = await smsService.handleTwilioStatusCallback({
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getSmsLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const result = await pool.query(
      `SELECT s.id, s.procurement_id, s.booking_id, s.farmer_id, s.farmer_phone, s.message, s.direction, s.response, s.status, s.message_type, s.provider, s.provider_message_id, s.provider_status, s.delivery_status, s.error_code, s.sent_at, s.created_at
       FROM sms_verifications s
       ORDER BY s.id DESC
       LIMIT $1`,
      [limit]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  handleWebhook,
  handleTwilioStatus,
  getSmsLogs,
};
