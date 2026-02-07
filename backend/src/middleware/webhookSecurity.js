import crypto from 'crypto';
import redisClient from '../config/redis.js';

/**
 * Webhook signature verification middleware
 * CRITICAL for payment webhook security
 * Prevents webhook spoofing and unauthorized payment updates
 */

class WebhookVerifier {
  constructor() {
    this.algorithms = {
      'sha256': crypto.createHash.bind(crypto, 'sha256'),
      'sha512': crypto.createHash.bind(crypto, 'sha512')
    };
  }

  /**
   * Verify webhook signature using HMAC
   * @param {string} payload - Raw request body
   * @param {string} signature - Signature from header
   * @param {string} secret - Webhook secret
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {boolean}
   */
  verifySignature(payload, signature, secret, algorithm = 'sha256') {
    if (!signature || !secret) {
      return false;
    }

    // Remove any hash algorithm prefix if present (e.g., "sha256=")
    const cleanSignature = signature.replace(/^[a-z0-9]+=/i, '');

    // Create HMAC
    const hmac = crypto.createHmac(algorithm, secret);
    hmac.update(payload, 'utf8');
    const digest = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'utf8'),
      Buffer.from(digest, 'utf8')
    );
  }

  /**
   * Extract signature from various header formats
   * @param {Object} headers - Request headers
   * @param {string} headerName - Name of signature header
   * @returns {string|null}
   */
  extractSignature(headers, headerName = 'x-signature') {
    const signature = headers[headerName] || headers[headerName.toLowerCase()];
    return signature || null;
  }

  /**
   * Check for replay attacks using nonce/timestamp
   * @param {string} webhookId - Unique webhook identifier
   * @param {string} nonce - Unique nonce from webhook
   * @param {number} timestamp - Webhook timestamp
   * @param {number} maxAgeSeconds - Maximum age for webhook (default: 5 minutes)
   * @returns {Promise<Object>}
   */
  async checkReplayAttack(webhookId, nonce, timestamp, maxAgeSeconds = 300) {
    const now = Math.floor(Date.now() / 1000);
    const age = now - timestamp;

    // Check timestamp freshness
    if (age > maxAgeSeconds || age < -maxAgeSeconds) {
      return {
        valid: false,
        error: 'Webhook timestamp too old or in the future',
        age
      };
    }

    // Check for replay using nonce
    const nonceKey = `webhook:nonce:${webhookId}:${nonce}`;
    const existingNonce = await redisClient.get(nonceKey);

    if (existingNonce) {
      return {
        valid: false,
        error: 'Duplicate webhook detected (replay attack)',
        nonce
      };
    }

    // Store nonce with expiration
    await redisClient.setEx(nonceKey, maxAgeSeconds + 60, '1');

    return { valid: true };
  }

  /**
   * Verify webhook with comprehensive security checks
   * @param {Object} req - Express request object
   * @param {string} secret - Webhook secret
   * @param {Object} options - Verification options
   * @returns {Promise<Object>}
   */
  async verifyWebhook(req, secret, options = {}) {
    const {
      signatureHeader = 'x-signature',
      timestampHeader = 'x-timestamp',
      nonceHeader = 'x-nonce',
      algorithm = 'sha256',
      maxAgeSeconds = 300,
      requireTimestamp = true,
      requireNonce = true
    } = options;

    // Get raw body for signature verification
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // Extract signature
    const signature = this.extractSignature(req.headers, signatureHeader);
    if (!signature) {
      return {
        valid: false,
        error: 'Missing signature header',
        header: signatureHeader
      };
    }

    // Verify signature
    const signatureValid = this.verifySignature(
      rawBody,
      signature,
      secret,
      algorithm
    );

    if (!signatureValid) {
      return {
        valid: false,
        error: 'Invalid signature',
        hint: 'Signature verification failed'
      };
    }

    // Check timestamp if required
    if (requireTimestamp) {
      const timestamp = req.headers[timestampHeader] || req.headers[timestampHeader.toLowerCase()];
      if (!timestamp) {
        return {
          valid: false,
          error: 'Missing timestamp header',
          header: timestampHeader
        };
      }

      const timestampNum = parseInt(timestamp);
      if (isNaN(timestampNum)) {
        return {
          valid: false,
          error: 'Invalid timestamp format'
        };
      }

      const now = Math.floor(Date.now() / 1000);
      const age = now - timestampNum;

      if (age > maxAgeSeconds || age < -maxAgeSeconds) {
        return {
          valid: false,
          error: 'Timestamp too old or in the future',
          age,
          maxAge: maxAgeSeconds
        };
      }
    }

    // Check nonce if required
    if (requireNonce) {
      const nonce = req.headers[nonceHeader] || req.headers[nonceHeader.toLowerCase()];
      if (!nonce) {
        return {
          valid: false,
          error: 'Missing nonce header',
          header: nonceHeader
        };
      }

      const webhookId = options.webhookId || 'default';
      const replayCheck = await this.checkReplayAttack(
        webhookId,
        nonce,
        parseInt(req.headers[timestampHeader] || req.headers[timestampHeader.toLowerCase()]),
        maxAgeSeconds
      );

      if (!replayCheck.valid) {
        return replayCheck;
      }
    }

    return { valid: true };
  }
}

const webhookVerifier = new WebhookVerifier();

/**
 * Middleware factory for webhook verification
 * @param {string} secretProvider - Secret or function that returns secret
 * @param {Object} options - Verification options
 */
export const verifyWebhook = (secretProvider, options = {}) => {
  return async (req, res, next) => {
    try {
      // Get secret (can be a string or a function)
      const secret = typeof secretProvider === 'function'
        ? await secretProvider(req)
        : secretProvider;

      if (!secret) {
        return res.status(500).json({
          error: 'Webhook verification not configured'
        });
      }

      // Verify webhook
      const result = await webhookVerifier.verifyWebhook(req, secret, options);

      if (!result.valid) {
        console.warn('Webhook verification failed:', result.error);
        return res.status(401).json({
          error: 'Webhook verification failed',
          details: process.env.NODE_ENV === 'development' ? result : undefined
        });
      }

      // Store verified flag
      req.webhookVerified = true;
      next();
    } catch (error) {
      console.error('Webhook verification error:', error);
      return res.status(500).json({
        error: 'Webhook verification failed'
      });
    }
  };
};

/**
 * Middleware to capture raw body for signature verification
 * Must be used before express.json()
 */
export const captureRawBody = (req, res, next) => {
  let data = '';

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

export default webhookVerifier;
