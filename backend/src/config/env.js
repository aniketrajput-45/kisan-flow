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
};

module.exports = config;
