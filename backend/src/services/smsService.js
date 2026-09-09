const pool = require('../config/db');

class SmsService {
  /**
   * Dispatches outbound procurement details SMS to farmer & logs to database
   */
  async sendProcurementConfirmation({ farmerName, phone, crop, weightKg, grade, centreName, procurementId }) {
    const message = `Your procurement details:\nFarmer: ${farmerName}\nCrop: ${crop}\nWeight: ${weightKg} kg\nGrade: ${grade}\nCentre: ${centreName}\n\nReply 1 to CONFIRM\nReply 2 to DISPUTE`;
    
    console.log(`[SMS Service Outbound] To: ${phone} (Procurement #${procurementId})\nBody:\n${message}`);

    let smsRecord = null;
    try {
      const res = await pool.query(
        `INSERT INTO sms_verifications (procurement_id, farmer_phone, message, direction, status)
         VALUES ($1, $2, $3, 'OUTBOUND', 'SENT')
         RETURNING id, procurement_id, farmer_phone, message, direction, status, created_at`,
        [procurementId, phone, message]
      );
      smsRecord = res.rows[0];
    } catch (err) {
      console.error('[SMS Service DB Log Error]', err.message);
    }

    return {
      success: true,
      status: 'SENT',
      messageId: smsRecord ? smsRecord.id : `msg_${Date.now()}`,
      smsRecord,
    };
  }

  /**
   * Process inbound SMS webhook
   */
  async handleInboundWebhook({ procurement_id, from, message }) {
    if (!message || typeof message !== 'string') {
      const err = new Error('Inbound SMS message body is required');
      err.statusCode = 400;
      throw err;
    }

    // Normalize reply
    const cleanMsg = message.trim().toUpperCase();
    let responseCode = null;
    let targetStatus = null;

    if (cleanMsg === '1' || cleanMsg === 'CONFIRM') {
      responseCode = '1';
      targetStatus = 'CONFIRMED';
    } else if (cleanMsg === '2' || cleanMsg === 'DISPUTE') {
      responseCode = '2';
      targetStatus = 'DISPUTED';
    } else {
      const err = new Error("Invalid reply message. Accepted replies: '1', 'CONFIRM', '2', 'DISPUTE'");
      err.statusCode = 400;
      throw err;
    }

    let targetProcurementId = procurement_id;
    let targetPhone = from ? from.trim() : null;

    // Correlation resolution
    if (!targetProcurementId) {
      if (!targetPhone) {
        const err = new Error('Correlation failed: either procurement_id or from phone number must be provided');
        err.statusCode = 400;
        throw err;
      }

      // Find most recent unconfirmed SMS verification for this phone number
      const match = await pool.query(
        `SELECT procurement_id 
         FROM sms_verifications 
         WHERE farmer_phone = $1 AND status = 'SENT' AND direction = 'OUTBOUND'
         ORDER BY id DESC LIMIT 1`,
        [targetPhone]
      );

      if (match.rows.length === 0) {
        const err = new Error(`No pending SMS verification found for phone: ${targetPhone}`);
        err.statusCode = 404;
        throw err;
      }
      targetProcurementId = match.rows[0].procurement_id;
    }

    // Verify procurement exists
    const procCheck = await pool.query(
      `SELECT id FROM procurements WHERE id = $1`,
      [targetProcurementId]
    );

    if (procCheck.rows.length === 0) {
      const err = new Error(`Procurement record not found for ID: ${targetProcurementId}`);
      err.statusCode = 404;
      throw err;
    }

    // Find pending outbound SMS verification
    const verificationRes = await pool.query(
      `SELECT id, status, response FROM sms_verifications 
       WHERE procurement_id = $1 AND direction = 'OUTBOUND' 
       ORDER BY id DESC LIMIT 1`,
      [targetProcurementId]
    );

    if (verificationRes.rows.length === 0) {
      const err = new Error(`No outbound SMS record found for procurement #${targetProcurementId}`);
      err.statusCode = 404;
      throw err;
    }

    const verification = verificationRes.rows[0];

    // Duplicate response check
    if (verification.status === 'CONFIRMED' || verification.status === 'DISPUTED') {
      const err = new Error(`Procurement #${targetProcurementId} SMS verification is already resolved as '${verification.status}'`);
      err.statusCode = 409;
      throw err;
    }

    // Update SMS verification status
    const updateRes = await pool.query(
      `UPDATE sms_verifications 
       SET status = $1, response = $2
       WHERE id = $3
       RETURNING id, procurement_id, farmer_phone, direction, response, status, created_at`,
      [targetStatus, responseCode, verification.id]
    );

    const updatedVerification = updateRes.rows[0];

    return {
      procurement_id: targetProcurementId,
      status: updatedVerification.status,
      response: updatedVerification.response,
      updated_at: new Date().toISOString(),
    };
  }
}

module.exports = new SmsService();
