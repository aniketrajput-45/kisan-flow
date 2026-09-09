const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/admin/overview - ADMIN role only
router.get('/admin/overview', authenticate, requireRole('ADMIN'), adminController.getOverview);

module.exports = router;
