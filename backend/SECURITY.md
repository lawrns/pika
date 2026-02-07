# Pika Backend Security Documentation

This document describes the comprehensive security hardening implemented in the Pika backend.

## Security Features Implemented

### 1. Rate Limiting

All payment endpoints are protected with strict rate limiting to prevent abuse and DoS attacks.

| Endpoint Type | Window | Max Requests |
|---------------|--------|--------------|
| Payment Operations | 15 min | 10 |
| Payment Link Creation | 1 min | 5 |
| Transfers | 5 min | 3 |
| Webhooks | 1 min | 100 |
| Authentication | 15 min | 5 |
| General API | 15 min | 100 |

**Implementation:**
- Uses Redis for distributed rate limiting
- Per-user and per-IP tracking
- Custom headers indicating rate limit status

**Usage:**
```javascript
import { paymentRateLimiter, transferRateLimiter } from './middleware/rateLimiter.js';

router.post('/pay/:referenceCode', paymentRateLimiter, ...);
router.post('/transfer', transferRateLimiter, ...);
```

### 2. Idempotency Keys

Critical payment operations require idempotency keys to prevent duplicate transactions.

**Implementation:**
- UUID v4 format required
- Keys stored in Redis with 24-hour TTL
- Duplicate requests return cached response

**Usage:**
```javascript
import { requireIdempotency } from './middleware/idempotency.js';

router.post('/pay/:referenceCode', requireIdempotency('execute-payment'), ...);
```

**Client Usage:**
```http
POST /api/payments/pay/ABC123
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

### 3. Webhook Signature Verification

All webhooks are verified using HMAC signatures to prevent spoofing.

**Implementation:**
- HMAC-SHA256 signature verification
- Constant-time comparison to prevent timing attacks
- Timestamp validation (max 5 min age)
- Nonce tracking for replay attack prevention

**Usage:**
```javascript
import { verifyWebhook, captureRawBody } from './middleware/webhookSecurity.js';

router.post('/webhooks/spei',
  captureRawBody,  // Must be before express.json()
  verifyWebhook(process.env.STIPAGO_WEBHOOK_SECRET),
  ...
);
```

**Webhook Signature Format:**
```http
POST /webhooks/spei
X-Signature: sha256=abc123...
X-Timestamp: 1699999999
X-Nonce: unique-nonce-value
```

### 4. Encryption (RFC-Compliant)

Sensitive data is encrypted at rest using AES-256-GCM with authentication tags.

**Implementation:**
- Algorithm: AES-256-GCM
- Key derived from `ENCRYPTION_KEY` environment variable
- 128-bit IV and 128-bit authentication tag
- Transparent encryption/decryption in model layer

**Sensitive Fields (automatically encrypted):**
- CLABE numbers
- Card numbers (if stored)
- CVV/CVC (if stored)
- Account numbers
- Routing numbers
- Tax IDs

**Usage:**
```javascript
import encryptionManager from './utils/encryption.js';

// Encrypt data
const encrypted = encryptionManager.encrypt('sensitive-data');

// Decrypt data
const decrypted = encryptionManager.decrypt(
  encrypted.encrypted,
  encrypted.iv,
  encrypted.authTag
);
```

### 5. PCI Compliance Headers

All responses include security headers required for PCI DSS compliance.

**Headers Implemented:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
X-Request-ID: <uuid>
Cache-Control: no-store, no-cache, must-revalidate, private
```

**Implementation:**
```javascript
import { pciComplianceHeaders, requestId } from './middleware/securityHeaders.js';

app.use(requestId);
app.use(pciComplianceHeaders);
```

## Security Configuration

All security settings are centralized in `config/security.js`.

### Key Settings:

```javascript
export default {
  rateLimits: { /* ... */ },
  idempotency: {
    defaultTTL: 86400 // 24 hours
  },
  webhooks: {
    maxAgeSeconds: 300, // 5 minutes
    requireTimestamp: true,
    requireNonce: true
  },
  encryption: {
    algorithm: 'aes-256-gcm'
  },
  pciCompliance: {
    enforceHttps: true,
    sessionTimeout: 900, // 15 minutes
    retainLogsDays: 365
  }
};
```

## Environment Variables

Required environment variables for security:

```bash
# Encryption
ENCRYPTION_KEY=<256-bit-key>
SESSION_SECRET=<session-secret>

# Rate Limiting (Redis required)
REDIS_URL=redis://localhost:6379

# Webhook Secrets
STIPAGO_WEBHOOK_SECRET=<secret>
STRIPE_WEBHOOK_SECRET=<secret>
MERCADOPAGO_WEBHOOK_SECRET=<secret>

# PCI Compliance
PCI_ENFORCE_HTTPS=true
PCI_ENABLE_AUDIT_LOGS=true
```

## Audit Logging

All payment operations are logged for compliance:

```javascript
import { auditLog } from './middleware/securityHeaders.js';

router.post('/pay', auditLog('payment_operation'), ...);
```

Log format:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "eventType": "payment_operation",
  "userId": "user-123",
  "ip": "192.168.1.1",
  "path": "/api/payments/pay/ABC123",
  "method": "POST",
  "statusCode": 200,
  "requestId": "uuid-v4"
}
```

## Security Best Practices

### For Developers:

1. **Always use idempotency keys** for payment operations
2. **Never log sensitive data** (encryption module provides masking)
3. **Use transaction locking** for all balance updates
4. **Validate all inputs** using the validation middleware
5. **Enable audit logging** for compliance

### For Operations:

1. **Rotate encryption keys** periodically (requires migration script)
2. **Monitor rate limit violations** for attack detection
3. **Review security logs** daily
4. **Enable HTTPS** in production (PCI requirement)
5. **Use strong passwords** (enforced by auth middleware)

## Security Checklist

Before deploying to production:

- [ ] ENCRYPTION_KEY is set (256-bit minimum)
- [ ] All webhook secrets are configured
- [ ] Redis is configured for distributed rate limiting
- [ ] HTTPS is enforced (PCI requirement)
- [ ] Security headers are enabled
- [ ] Audit logging is enabled
- [ ] Rate limits are appropriate for your traffic
- [ ] Database migrations for encrypted fields are applied

## Testing Security

Run security tests:

```bash
# Test rate limiting
npm run test:security:rate-limit

# Test encryption
npm run test:security:encryption

# Test webhooks
npm run test:security:webhooks
```

## Security Contacts

For security issues or questions:
- Email: security@pika.io
- Security Policy: https://pika.io/security
