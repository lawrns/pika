import { v4 as uuidv4 } from 'uuid';
import redisClient from '../config/redis.js';

/**
 * Idempotency middleware for payment operations
 * Prevents duplicate transaction processing
 * CRITICAL for payment security and data integrity
 */

class IdempotencyManager {
  constructor() {
    this.defaultTTL = 24 * 60 * 60; // 24 hours in seconds
  }

  /**
   * Validate and process idempotency key
   * @param {string} key - Idempotency key from request
   * @param {string} userId - User ID
   * @param {string} endpoint - Endpoint identifier
   * @returns {Promise<Object>} - Validation result
   */
  async validateKey(key, userId, endpoint) {
    if (!key) {
      return {
        valid: false,
        error: 'Idempotency-Key header is required for this operation'
      };
    }

    // Validate key format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(key)) {
      return {
        valid: false,
        error: 'Idempotency-Key must be a valid UUID v4'
      };
    }

    // Check if key was already used
    const cacheKey = `idempotency:${endpoint}:${userId}:${key}`;
    const existingResponse = await redisClient.get(cacheKey);

    if (existingResponse) {
      return {
        valid: false,
        error: 'This request has already been processed',
        cached: true,
        response: JSON.parse(existingResponse)
      };
    }

    return { valid: true };
  }

  /**
   * Store response for idempotency
   * @param {string} key - Idempotency key
   * @param {string} userId - User ID
   * @param {string} endpoint - Endpoint identifier
   * @param {Object} response - Response to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  async storeResponse(key, userId, endpoint, response, ttl = this.defaultTTL) {
    const cacheKey = `idempotency:${endpoint}:${userId}:${key}`;
    await redisClient.setEx(cacheKey, ttl, JSON.stringify(response));
  }

  /**
   * Generate a new idempotency key
   * @returns {string} - UUID v4
   */
  generateKey() {
    return uuidv4();
  }

  /**
   * Clean up expired idempotency entries
   * Redis handles TTL automatically, but this can be used for manual cleanup
   */
  async cleanup() {
    // Redis automatically handles TTL, no manual cleanup needed
    // This method exists for future enhancements if needed
  }
}

const idempotencyManager = new IdempotencyManager();

/**
 * Middleware to enforce idempotency on critical endpoints
 * @param {string} endpoint - Endpoint identifier for namespacing
 */
export const requireIdempotency = (endpoint = 'default') => {
  return async (req, res, next) => {
    const idempotencyKey = req.headers['idempotency-key'];
    const userId = req.user?.id || 'anonymous';

    const validation = await idempotencyManager.validateKey(
      idempotencyKey,
      userId,
      endpoint
    );

    if (!validation.valid) {
      if (validation.cached) {
        // Return cached response
        return res.status(200).json(validation.response);
      }
      return res.status(400).json({
        error: validation.error,
        hint: 'Include Idempotency-Key header with a UUID v4 value'
      });
    }

    // Store key on request for later use
    req.idempotencyKey = idempotencyKey;

    // Monkey-patch res.json to cache successful responses
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.idempotencyKey) {
        idempotencyManager.storeResponse(
          req.idempotencyKey,
          userId,
          endpoint,
          data
        ).catch(err => {
          console.error('Failed to store idempotent response:', err);
        });
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Middleware to generate and return idempotency key if not provided
 * For client convenience
 */
export const optionalIdempotency = (endpoint = 'default') => {
  return async (req, res, next) => {
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey) {
      const newKey = idempotencyManager.generateKey();
      res.setHeader('Idempotency-Key', newKey);
      req.idempotencyKey = newKey;
    } else {
      req.idempotencyKey = idempotencyKey;
    }

    next();
  };
};

export default idempotencyManager;
