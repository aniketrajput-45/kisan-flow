const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const { authenticate, requireRole } = require('../middleware/auth');

// Public/Farmer endpoints
router.get('/centres', authenticate, farmerController.getCentres);
router.get('/slots', authenticate, farmerController.getSlots);
router.post('/bookings', authenticate, requireRole('FARMER'), farmerController.createBooking);
router.get('/bookings/my', authenticate, requireRole('FARMER'), farmerController.getMyBookings);
router.get('/bookings/:id', authenticate, farmerController.getBookingById);

module.exports = router;
