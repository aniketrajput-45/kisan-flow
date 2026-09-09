// Mock SMS Service abstraction for KisanFlow prototype

class SmsService {
  /**
   * Dispatches outbound procurement details SMS to farmer
   * @param {Object} params
   * @param {string} params.farmerName
   * @param {string} params.phone
   * @param {string} params.crop
   * @param {number} params.weightKg
   * @param {string} params.grade
   * @param {string} params.centreName
   * @param {string} params.procurementId
   */
  async sendProcurementConfirmation({ farmerName, phone, crop, weightKg, grade, centreName, procurementId }) {
    const message = `Your procurement details:\nFarmer: ${farmerName}\nCrop: ${crop}\nWeight: ${weightKg} kg\nGrade: ${grade}\nCentre: ${centreName}\n\nReply 1 to CONFIRM\nReply 2 to DISPUTE`;
    
    console.log(`[SMS Service Outbound] To: ${phone} (Procurement #${procurementId})\nBody:\n${message}`);

    return {
      success: true,
      status: 'SENT',
      messageId: `msg_${Date.now()}`,
    };
  }
}

module.exports = new SmsService();
