// Mockable Redis interface stub for live queue management
const config = require('./env');

class MockRedisClient {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, String(value));
    return 'OK';
  }

  async incr(key) {
    const val = parseInt(this.store.get(key) || '0', 10) + 1;
    this.store.set(key, String(val));
    return val;
  }
}

const redisClient = new MockRedisClient();
module.exports = redisClient;
