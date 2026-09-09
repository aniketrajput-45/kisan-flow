const express = require('express');
const cors = require('cors');
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

// Fallback & central error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
