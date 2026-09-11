const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'kisanflow_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT, 10) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'kisanflow',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    statusCallbackUrl: process.env.TWILIO_STATUS_CALLBACK_URL || '',
    enabled: process.env.TWILIO_ENABLED === 'true',
    validateSignature: process.env.TWILIO_VALIDATE_SIGNATURE === 'true',
    verifiedRecipients: process.env.TWILIO_VERIFIED_RECIPIENTS || '+919430063719',
  },
};

module.exports = config;
