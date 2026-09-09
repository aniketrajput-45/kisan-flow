const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const officerRoutes = require('./routes/officerRoutes');
const smsRoutes = require('./routes/smsRoutes');
const { authenticate, requireRole } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KisanFlow Backend API is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', farmerRoutes);
app.use('/api', officerRoutes);
app.use('/api', smsRoutes);

// Test role guard routes for Phase 2 verification
app.get('/api/test/farmer', authenticate, requireRole('FARMER'), (req, res) => {
  res.json({ success: true, message: 'Farmer access granted', user: req.user });
});

app.get('/api/test/officer', authenticate, requireRole('OFFICER'), (req, res) => {
  res.json({ success: true, message: 'Officer access granted', user: req.user });
});

app.get('/api/test/admin', authenticate, requireRole('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Admin access granted', user: req.user });
});

// Fallback & central error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
