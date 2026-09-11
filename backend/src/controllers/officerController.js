const officerService = require('../services/officerService');

const lookupBooking = async (req, res, next) => {
  try {
    const query = req.query.query || req.params.qrToken;
    const data = await officerService.lookupBooking(query);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const recordProcurement = async (req, res, next) => {
  try {
    const { booking_id, weight_kg, grade } = req.body;
    const data = await officerService.recordProcurement(req.user.id, {
      booking_id,
      weight_kg,
      grade,
    });
    res.status(201).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getPaymentByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const data = await officerService.getPaymentByBooking(bookingId, req.user);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const data = await officerService.updatePaymentStatus(id, status);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getMspRate = async (req, res, next) => {
  try {
    const { crop, grade, state } = req.query;
    const mspService = require('../services/mspService');
    const data = await mspService.getMspForCrop(crop, grade, state);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  lookupBooking,
  recordProcurement,
  getPaymentByBooking,
  updatePaymentStatus,
  getMspRate,
};
