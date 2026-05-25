/**
 * Security configuration
 * Centralizes all security-related settings
 */

export default {
  /**
   * Rate limiting configuration
   */
  rateLimits: {
    payment: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10
    },
    paymentLink: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5
    },
    transfer: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3
    },
    webhook: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5
    },
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },

  /**
   * Idempotency configuration
   */
  idempotency: {
    defaultTTL: 24 * 60 * 60, // 24 hours in seconds
    keyPrefix: 'idempotency'
  },

  /**
   * Webhook security configuration
   */
  webhooks: {
    maxAgeSeconds: 300, // 5 minutes
    requireTimestamp: true,
    requireNonce: true,
    signatureAlgorithm: 'sha256',
    signatureHeader: 'x-signature',
    timestampHeader: 'x-timestamp',
    nonceHeader: 'x-nonce'
  },

  /**
   * Encryption configuration
   */
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32, // 256 bits
    ivLength: 16, // 128 bits
    authTagLength: 16 // 128 bits
  },

  /**
   * PCI DSS compliance settings
   */
  pciCompliance: {
    enforceHttps: true,
    logSensitiveData: false,
    requireStrongPasswords: true,
    sessionTimeout: 15 * 60, // 15 minutes
    maxFailedLogins: 5,
    lockoutDuration: 30 * 60, // 30 minutes
    maskCardNumbers: true,
    retainLogsDays: 365
  },

  /**
   * Security headers configuration
   */
  headers: {
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    csp: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },

  /**
   * Sensitive data fields that require encryption
   */
  sensitiveFields: [
    'clabe',
    'cardNumber',
    'cvv',
    'cvc',
    'accountNumber',
    'routingNumber',
    'ssn',
    'taxId'
  ],

  /**
   * Webhook providers and their secrets
   * Secrets should be loaded from environment variables
   */
  webhookProviders: {
    stripe: {
      secretName: 'STRIPE_WEBHOOK_SECRET',
      signatureHeader: 'stripe-signature'
    },
    stipago: {
      secretName: 'STIPAGO_WEBHOOK_SECRET',
      signatureHeader: 'x-signature'
    },
    mercadopago: {
      secretName: 'MERCADOPAGO_WEBHOOK_SECRET',
      signatureHeader: 'x-signature'
    }
  },

  /**
   * Audit logging configuration
   */
  audit: {
    logPaymentOperations: true,
    logAuthOperations: true,
    logWebhooks: true,
    logErrors: true,
    maskSensitiveData: true,
    retentionDays: 365
  },

  /**
   * Session security
   */
  session: {
    cookieName: 'pika_session',
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    }
  },

  /**
   * CORS configuration
   */
  cors: {
    origin: (origin, callback) => {
      // Dynamically allow any origin to support Netlify preview branches, localhost, and custom domains with credentials
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
  },

  /**
   * Password requirements
   */
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfo: true
  },

  /**
   * Security event logging
   */
  securityEvents: {
    logLevel: 'info',
    logToFile: true,
    logToDatabase: true,
    alertOnCriticalEvents: true,
    criticalEvents: [
      'multiple_failed_logins',
      'suspicious_transaction',
      'rate_limit_exceeded',
      'webhook_signature_failed',
      'unauthorized_access_attempt'
    ]
  }
};
