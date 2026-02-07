import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

/**
 * Rate limiter configurations for different endpoint types
 * Implements security requirements for payment endpoints
 */

// Check if Redis URL is configured and valid
const redisUrl = process.env.REDIS_URL;
const useRedis = redisUrl && !redisUrl.includes('localhost');

// Create Redis client if Redis is available
let redisClient = undefined;

if (useRedis) {
  try {
    redisClient = new Redis(redisUrl);
  } catch (error) {
    console.warn('Redis client initialization failed:', error.message);
  }
}

// Helper to create Redis store with unique prefix
function createRedisStore(prefix) {
  if (!redisClient) return undefined;
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl:${prefix}:`,
  });
}

/**
 * Strict rate limiter for payment operations
 * - 10 requests per 15 minutes per IP
 * - Used for: creating payments, transfers, wallet operations
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many payment attempts. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('payment'),
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

/**
 * Moderate rate limiter for payment link creation
 * - 5 requests per minute per user
 * - Prevents spam creation of payment links
 */
export const paymentLinkCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Too many payment links created. Please wait a moment.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('paymentlink'),
  keyGenerator: (req) => `payment-link:${req.user?.id || req.ip}`
});

/**
 * Strict rate limiter for transfers
 * - 3 transfers per 5 minutes per user
 * - Prevents rapid unauthorized transfers
 */
export const transferRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: {
    error: 'Too many transfer attempts. For security, please wait before trying again.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('transfer'),
  keyGenerator: (req) => `transfer:${req.user?.id || req.ip}`
});

/**
 * Webhook rate limiter
 * - 100 requests per minute per IP
 * - Allows legitimate webhooks but prevents abuse
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Webhook rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('webhook'),
  skipFailedRequests: true
});

/**
 * General API rate limiter
 * - 100 requests per 15 minutes per IP
 * - Applied to all non-payment endpoints
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('api')
});

/**
 * Authentication rate limiter
 * - 5 attempts per 15 minutes per IP
 * - Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    error: 'Too many authentication attempts. Account temporarily locked.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
  skipSuccessfulRequests: true
});

export default {
  paymentRateLimiter,
  paymentLinkCreationLimiter,
  transferRateLimiter,
  webhookRateLimiter,
  generalApiLimiter,
  authRateLimiter
};
