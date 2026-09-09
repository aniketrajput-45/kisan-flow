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
    const data = await queueService.getQueueStatus(req.user, bookingId);
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
    const data = await queueService.startProcessing(bookingId);
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
