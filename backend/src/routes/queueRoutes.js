const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/queue/arrive - Farmer, Officer, Admin
router.post('/queue/arrive', authenticate, queueController.markArrived);

// GET /api/queue/active - List all farmers currently waiting in queue
router.get('/queue/active', authenticate, queueController.getActiveQueue);
router.get('/queue/centre/:centreId?', authenticate, queueController.getActiveQueue);

// GET /api/queue/:bookingId - Farmer (own booking), Officer, Admin
router.get('/queue/:bookingId', authenticate, queueController.getQueueStatus);

// POST /api/queue/:bookingId/start - Officer, Admin only
router.post('/queue/:bookingId/start', authenticate, requireRole('OFFICER', 'ADMIN'), queueController.startProcessing);

module.exports = router;
