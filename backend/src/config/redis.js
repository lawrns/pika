import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;
let redisAvailable = false;

try {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
    redisAvailable = true;
  });

  redisClient.on('error', (err) => {
    // Only log errors in production or when not ECONNREFUSED
    if (err.code !== 'ECONNREFUSED') {
      console.error('❌ Redis error:', err.message);
    }
    redisAvailable = false;
  });
} catch (error) {
  console.warn('Redis client creation failed:', error.message);
  redisClient = null;
}

// Connect to Redis
export async function connectRedis() {
  if (!redisClient) {
    console.warn('⚠️  Redis not configured, continuing without caching');
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('⚠️  Redis connection failed, continuing without caching');
  }
}

// Safe wrapper for Redis operations
const safeRedisOperation = (operation) => {
  return async (...args) => {
    if (!redisClient || !redisAvailable) {
      return null;
    }
    try {
      return await operation(...args);
    } catch (error) {
      return null;
    }
  };
};

// Export safe Redis client
const safeRedisClient = redisClient ? {
  get: safeRedisOperation(redisClient.get.bind(redisClient)),
  set: safeRedisOperation(redisClient.set.bind(redisClient)),
  setEx: safeRedisOperation(redisClient.setEx.bind(redisClient)),
  del: safeRedisOperation(redisClient.del.bind(redisClient)),
  on: redisClient.on.bind(redisClient),
  connect: redisClient.connect.bind(redisClient),
} : {
  get: async () => null,
  set: async () => null,
  setEx: async () => null,
  del: async () => null,
  on: () => {},
  connect: async () => {},
};

export default safeRedisClient;
export { redisAvailable };
