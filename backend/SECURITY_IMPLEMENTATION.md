# Pika Backend Security Hardening - Implementation Summary

## Overview
Comprehensive security hardening has been implemented for the Pika payment backend to ensure PCI compliance and protect against common security threats.

## Security Features Implemented

### 1. Rate Limiting (`src/middleware/rateLimiter.js`)
- **Payment operations**: 10 requests per 15 minutes
- **Payment link creation**: 5 requests per minute
- **Transfers**: 3 requests per 5 minutes (strictest - financial risk)
- **Webhooks**: 100 requests per minute
- **Authentication**: 5 requests per 15 minutes (brute force protection)
- **General API**: 100 requests per 15 minutes

**Key Features:**
- Redis-backed distributed rate limiting
- Per-user and per-IP tracking
- Custom key generators for different endpoint types
- Configurable via environment variables

**Applied To:**
- `POST /api/payments/links` - paymentLinkCreationLimiter
- `POST /api/payments/pay/:referenceCode` - paymentRateLimiter
- `POST /api/payments/spei/create` - paymentRateLimiter
- `POST /api/payments/webhooks/spei` - webhookRateLimiter
- `POST /api/wallet/transfer` - transferRateLimiter

### 2. Idempotency Keys (`src/middleware/idempotency.js`)
- **UUID v4** format required for idempotency keys
- **24-hour TTL** in Redis for idempotency cache
- Duplicate requests return **cached responses** automatically
- Prevents double-charging and duplicate transactions

**Applied To:**
- `POST /api/payments/links` - `requireIdempotency('create-payment-link')`
- `POST /api/payments/pay/:referenceCode` - `requireIdempotency('execute-payment')`
- `POST /api/payments/spei/create` - `requireIdempotency('create-spei-order')`
- `POST /api/wallet/transfer` - `requireIdempotency('user-transfer')`

**Usage:**
```http
POST /api/payments/pay/ABC123
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

### 3. Webhook Signature Verification (`src/middleware/webhookSecurity.js`)
- **HMAC-SHA256** signature verification
- **Constant-time comparison** to prevent timing attacks
- **Timestamp validation** (max 5 minutes age)
- **Nonce tracking** with Redis for replay attack prevention
- Extracts and validates signatures from custom headers

**Applied To:**
- `POST /api/payments/webhooks/spei` - Full signature verification

**Required Headers:**
```http
X-Signature: sha256=abc123...
X-Timestamp: 1699999999
X-Nonce: unique-nonce-value
```

### 4. Encryption for Sensitive Data (`src/utils/encryption.js`)
Implements **AES-256-GCM** encryption for sensitive data at rest:
- 256-bit encryption key derived from environment variable
- 128-bit initialization vector (IV)
- 128-bit authentication tag (GCM mode)
- Automatic encryption/decryption in Transaction model

**Sensitive Fields Encrypted:**
- CLABE numbers (bank accounts)
- Card numbers (if stored)
- CVV/CVC (if stored)
- Account numbers
- Routing numbers
- Tax IDs

**Implementation in Transaction Model:**
- `encryptSensitiveMetadata()` - encrypts before database storage
- `decryptSensitiveMetadata()` - decrypts after database retrieval
- All CRUD operations automatically handle encryption

### 5. PCI Compliance Headers (`src/middleware/securityHeaders.js`)
Comprehensive security headers for PCI DSS compliance:

**Headers Added:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; object-src 'none'
X-Request-ID: <uuid>
Cache-Control: no-store, no-cache, must-revalidate, private
Pragma: no-cache
Expires: 0
X-Payment-System: Pika-Secure-Payments
```

**Additional Features:**
- Request ID tracking for audit trails
- Audit logging middleware for payment operations
- Error data masking in production (prevents information leakage)
- Sensitive data detection and logging

**Applied To:**
- All payment endpoints via `paymentSecurityHeaders`
- All webhook endpoints via `webhookSecurityHeaders`
- Global application via `pciComplianceHeaders`

## Configuration (`src/config/security.js`)
Centralized security configuration including:
- Rate limit settings
- Idempotency TTL
- Webhook verification options
- Encryption algorithm settings
- PCI compliance settings
- Sensitive field definitions
- Audit logging configuration

## Environment Variables (`.env.example`)
New environment variables required:

```bash
# Critical Security Keys
ENCRYPTION_KEY=<256-bit-key>
SESSION_SECRET=<min-32-characters>

# Rate Limiting & Caching
REDIS_URL=redis://localhost:6379

# Webhook Secrets
STIPAGO_WEBHOOK_SECRET=<secret>
STRIPE_WEBHOOK_SECRET=<secret>
MERCADOPAGO_WEBHOOK_SECRET=<secret>

# PCI Compliance
PCI_ENFORCE_HTTPS=true
PCI_ENABLE_AUDIT_LOGS=true
AUDIT_ENABLED=true
```

## Package Dependencies Updated
Added to `package.json`:
- `express-rate-limit: ^7.1.5` - Rate limiting middleware
- `redis: ^4.6.11` - Redis client for distributed rate limiting and idempotency

## Updated Files Summary

### New Files Created:
1. `src/middleware/rateLimiter.js` - Rate limiting configurations
2. `src/middleware/idempotency.js` - Idempotency key handling
3. `src/middleware/webhookSecurity.js` - Webhook signature verification
4. `src/middleware/securityHeaders.js` - PCI compliance headers
5. `src/utils/encryption.js` - Data encryption utilities
6. `src/config/security.js` - Centralized security configuration
7. `src/middleware/index.js` - Security middleware exports
8. `.env.example` - Environment variable template
9. `SECURITY.md` - Security documentation

### Modified Files:
1. `src/server.js` - Added security middleware integration
2. `src/routes/payments.js` - Applied rate limiting, idempotency, webhook verification
3. `src/routes/wallet.js` - Applied rate limiting, idempotency for transfers
4. `src/models/Transaction.js` - Added encryption for sensitive fields
5. `package.json` - Added required dependencies

## Security Checklist for Production

Before deploying to production:

- [ ] Set `ENCRYPTION_KEY` to a 256-bit cryptographically random value
- [ ] Configure all webhook secrets (`STIPAGO_WEBHOOK_SECRET`, etc.)
- [ ] Set up Redis for distributed rate limiting
- [ ] Enable HTTPS enforcement (`PCI_ENFORCE_HTTPS=true`)
- [ ] Enable audit logging (`PCI_ENABLE_AUDIT_LOGS=true`)
- [ ] Review and adjust rate limits based on expected traffic
- [ ] Verify encryption keys are stored securely (not in version control)
- [ ] Test webhook signature verification with provider
- [ ] Run security tests for all payment flows
- [ ] Review logs for any PCI compliance violations

## Testing

Run syntax validation:
```bash
cd /home/laurence/pika/backend
node -c src/routes/payments.js
node -c src/routes/wallet.js
node -c src/server.js
```

Install dependencies:
```bash
npm install
```

## Compliance Notes

This implementation addresses:
- **PCI DSS Requirement 2**: Encryption of sensitive data
- **PCI DSS Requirement 4**: Strong cryptography for transmission
- **PCI DSS Requirement 6**: Security systems and processes
- **PCI DSS Requirement 8**: Strong access control measures
- **PCI DSS Requirement 10**: Audit trails and logging

## Future Enhancements

1. Implement request signing for internal service communication
2. Add IP allowlisting for admin endpoints
3. Implement anomaly detection for suspicious transaction patterns
4. Add automated security scanning in CI/CD pipeline
5. Implement key rotation strategy for encryption keys
