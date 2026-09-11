const farmerService = require('../services/farmerService');

const getCentres = async (req, res, next) => {
  try {
    const data = await farmerService.getCentres();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const getSlots = async (req, res, next) => {
  try {
    const centreId = req.query.centreId || req.query.centre_id || req.query.centreid;
    const date = req.query.date || req.query.slot_date || req.query.slotdate;
    const userId = req.user ? req.user.id : null;
    const data = await farmerService.getSlots(centreId, date, userId);
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const createBooking = async (req, res, next) => {
  try {
    const { centre_id, slot_id, crop, quantity_kg } = req.body;
    const booking = await farmerService.createBooking(req.user.id, {
      centre_id,
      slot_id,
      crop,
      quantity_kg,
    });
    res.status(201).json({
      success: true,
      data: booking,
      booking,
    });
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await farmerService.getBookingById(id, req.user.id);
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await farmerService.getMyBookings(req.user.id);
    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCentres,
  getSlots,
  createBooking,
  getBookingById,
  getMyBookings,
};
