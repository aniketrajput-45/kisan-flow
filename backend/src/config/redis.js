// Mockable Redis interface for KisanFlow live queue management

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

  async del(key) {
    this.store.delete(key);
    return 1;
  }

  async rpush(key, ...values) {
    let list = this.store.get(key);
    if (!Array.isArray(list)) {
      list = [];
    }
    for (const val of values) {
      list.push(String(val));
    }
    this.store.set(key, list);
    return list.length;
  }

  async lrange(key, start, stop) {
    const list = this.store.get(key);
    if (!Array.isArray(list)) return [];
    
    let s = start;
    let e = stop;
    if (s < 0) s = Math.max(0, list.length + s);
    if (e < 0) e = list.length + e;
    
    return list.slice(s, e === -1 ? undefined : e + 1);
  }

  async lrem(key, count, value) {
    const list = this.store.get(key);
    if (!Array.isArray(list)) return 0;
    
    const target = String(value);
    let removed = 0;
    
    const newList = list.filter(item => {
      if (item === target && (count === 0 || removed < Math.abs(count))) {
        removed++;
        return false;
      }
      return true;
    });
    
    this.store.set(key, newList);
    return removed;
  }
}

const redisClient = new MockRedisClient();
module.exports = redisClient;

