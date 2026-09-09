const smsService = require('../services/smsService');

const handleWebhook = async (req, res, next) => {
  try {
    const { procurement_id, from, message } = req.body;
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

module.exports = {
  handleWebhook,
};
