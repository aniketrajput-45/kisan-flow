const queueService = require('../services/queueService');

const markArrived = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    const data = await queueService.markArrived(req.user, booking_id);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getQueueStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const numId = Number(bookingId);
    if (!bookingId || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
    }
    const data = await queueService.getQueueStatus(req.user, numId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const startProcessing = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const numId = Number(bookingId);
    if (!bookingId || isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID',
      });
    }
    const data = await queueService.startProcessing(numId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  markArrived,
  getQueueStatus,
  startProcessing,
};
