/**
 * Security Middleware Index
 * Centralized exports for all security middleware
 */

// Rate Limiting
export {
  paymentRateLimiter,
  paymentLinkCreationLimiter,
  transferRateLimiter,
  webhookRateLimiter,
  generalApiLimiter,
  authRateLimiter
} from './rateLimiter.js';

// Idempotency
export {
  requireIdempotency,
  optionalIdempotency,
  default as idempotencyManager
} from './idempotency.js';

// Webhook Security
export {
  verifyWebhook,
  captureRawBody,
  default as webhookVerifier
} from './webhookSecurity.js';

// PCI Compliance Headers
export {
  pciComplianceHeaders,
  paymentSecurityHeaders,
  webhookSecurityHeaders,
  rateLimitHeaders,
  pciComplianceCheck,
  auditLog,
  requestId,
  maskErrorData
} from './securityHeaders.js';

// Default export with all security middleware
export default {
  rateLimiter: {
    payment: require('./rateLimiter.js').paymentRateLimiter,
    paymentLink: require('./rateLimiter.js').paymentLinkCreationLimiter,
    transfer: require('./rateLimiter.js').transferRateLimiter,
    webhook: require('./rateLimiter.js').webhookRateLimiter,
    general: require('./rateLimiter.js').generalApiLimiter,
    auth: require('./rateLimiter.js').authRateLimiter
  },
  idempotency: {
    require: require('./idempotency.js').requireIdempotency,
    optional: require('./idempotency.js').optionalIdempotency
  },
  webhook: {
    verify: require('./webhookSecurity.js').verifyWebhook,
    captureRawBody: require('./webhookSecurity.js').captureRawBody
  },
  headers: {
    pci: require('./securityHeaders.js').pciComplianceHeaders,
    payment: require('./securityHeaders.js').paymentSecurityHeaders,
    webhook: require('./securityHeaders.js').webhookSecurityHeaders,
    audit: require('./securityHeaders.js').auditLog,
    requestId: require('./securityHeaders.js').requestId
  }
};
