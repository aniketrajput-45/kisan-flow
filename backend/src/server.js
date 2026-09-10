const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`[KisanFlow API] Server running on port ${config.port} (${config.env} mode)`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});
