const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authenticate, requireRole } = require('../middleware/auth');

// Officer Booking Lookup
router.get('/officer/booking/lookup', authenticate, requireRole('OFFICER', 'ADMIN'), officerController.lookupBooking);
router.get('/officer/booking/:qrToken', authenticate, requireRole('OFFICER', 'ADMIN'), officerController.lookupBooking);

// Procurement Recording
router.post('/procurements', authenticate, requireRole('OFFICER', 'ADMIN'), officerController.recordProcurement);

// Payment Management
router.get('/payments/:bookingId', authenticate, officerController.getPaymentByBooking);
router.patch('/payments/:id/status', authenticate, requireRole('OFFICER', 'ADMIN'), officerController.updatePaymentStatus);

module.exports = router;
