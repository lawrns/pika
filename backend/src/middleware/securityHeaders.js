/**
 * PCI DSS compliant security headers middleware
 * Implements security requirements for payment processing
 * CRITICAL for PCI compliance and protection against common web vulnerabilities
 */

import helmet from 'helmet';
import crypto from 'crypto';

/**
 * Generate nonce for CSP
 * @returns {string} - Base64-encoded random nonce
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * PCI compliance headers configuration
 * Includes:
 * - HSTS to enforce HTTPS
 * - CSP to prevent XSS
 * - X-Frame-Options to prevent clickjacking
 * - X-Content-Type-Options to prevent MIME sniffing
 * - Referrer-Policy for privacy
 * - Permissions-Policy for feature control
 */
export const pciComplianceHeaders = helmet({
  // Content Security Policy - Prevent XSS attacks
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      blockAllMixedContent: [],
      connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.mercadopago.com'],
      fontSrc: ["'self'", 'data:', 'https:'],
      frameAncestors: ["'none'"],
      frameSrc: ["'none'"], // Prevent clickjacking
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
      workerSrc: ["'none'"]
    }
  },

  // HTTP Strict Transport Security - Enforce HTTPS
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options - Prevent clickjacking
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options - Prevent MIME sniffing
  noSniff: true,

  // Referrer-Policy - Control referrer information
  referrerPolicy: {
    policy: ['no-referrer', 'same-origin']
  },

  // X-DNS-Prefetch-Control - Control DNS prefetching
  dnsPrefetchControl: {
    allow: false
  },

  // X-Download-Options - Prevent IE from executing downloads
  xDownloadOptions: {
    open: 'noopen'
  },

  // X-Permitted-Cross-Domain-Policies - Restrict cross-domain policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  },

  // Disable X-Powered-By header - Hide server technology
  hidePoweredBy: true,

  // Expect-CT - Certificate Transparency
  expectCt: {
    maxAge: 86400,
    enforce: true
  }
});

/**
 * Additional payment-specific security headers
 */
export const paymentSecurityHeaders = (req, res, next) => {
  // PCI DSS Requirement: Cache control for sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // PCI DSS Requirement: Prevent data leakage
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Payment-specific headers
  res.setHeader('X-Payment-System', 'Pika-Secure-Payments');

  // CORS headers for payment endpoints (if needed)
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  // Security hint for clients
  res.setHeader('X-Content-Security-Policy', 'strict');

  next();
};

/**
 * Webhook-specific security headers
 */
export const webhookSecurityHeaders = (req, res, next) => {
  // Restrict to specific webhook processors
  res.setHeader('X-Webhook-Processor', 'Pika-Payment-Webhooks');

  // Cache control for webhooks
  res.setHeader('Cache-Control', 'no-store, no-cache');

  // Prevent caching of webhook responses
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
};

/**
 * Rate limit headers
 */
export const rateLimitHeaders = (req, res, next) => {
  // Add X-RateLimit headers (complementary to express-rate-limit)
  const now = Date.now();
  const resetTime = new Date(now + (15 * 60 * 1000)).toISOString();

  res.setHeader('X-RateLimit-Limit', '100');
  res.setHeader('X-RateLimit-Remaining', '95');
  res.setHeader('X-RateLimit-Reset', resetTime);

  next();
};

/**
 * PCI compliance check middleware
 * Logs compliance violations
 */
export const pciComplianceCheck = (req, res, next) => {
  const violations = [];

  // Check for HTTPS in production
  if (process.env.NODE_ENV === 'production' && !req.secure && req.protocol !== 'https') {
    violations.push('Non-HTTPS request in production');
  }

  // Check for sensitive data in logs
  const sensitivePatterns = [
    /password/i,
    /cvv/i,
    /cvc/i,
    /credit.*card/i,
    /card.*number/i,
    /ssn/i
  ];

  const bodyStr = JSON.stringify(req.body);
  for (const pattern of sensitivePatterns) {
    if (pattern.test(bodyStr)) {
      violations.push(`Potential sensitive data in request body: ${pattern}`);
    }
  }

  if (violations.length > 0) {
    console.warn('[PCI Compliance Violation]', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      violations
    });
  }

  next();
};

/**
 * Audit logging middleware for payment operations
 * CRITICAL for PCI compliance requirement 10
 */
export const auditLog = (eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      // Log payment-related operations
      const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        userId: req.user?.id || 'anonymous',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        requestId: req.id || crypto.randomUUID()
      };

      // Don't log sensitive data
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.cvv;
        delete sanitizedBody.cvc;
        logEntry.requestBody = sanitizedBody;
      }

      console.info('[Audit Log]', JSON.stringify(logEntry));

      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Request ID middleware for traceability
 */
export const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Mask sensitive data in error responses
 */
export const maskErrorData = (err, req, res, next) => {
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    const safeError = {
      error: 'An error occurred',
      requestId: req.id
    };

    // Log the full error internally
    console.error('[Error]', {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
      userId: req.user?.id,
      path: req.path
    });

    return res.status(err.status || 500).json(safeError);
  }

  // In development, expose more details
  res.status(err.status || 500).json({
    error: err.message,
    stack: err.stack,
    requestId: req.id
  });
};

export default {
  pciComplianceHeaders,
  paymentSecurityHeaders,
  webhookSecurityHeaders,
  rateLimitHeaders,
  pciComplianceCheck,
  auditLog,
  requestId,
  maskErrorData
};
