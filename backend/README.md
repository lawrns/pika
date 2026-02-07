# Pika Backend - Complete Payment Platform API

## Architecture Overview

Pika is a PCI DSS compliant payment platform supporting:
- Wallet-based payments
- Payment links with QR codes
- SPEI/CoDi integration (Mexican payment systems)
- Stripe & Mercado Pago integration

## Tech Stack

- **Runtime:** Node.js 18+ with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Cache:** Redis
- **Security:** Helmet, express-rate-limit, JWT auth
- **Payments:** Stripe, Mercado Pago, STiPago (SPEI/CoDi)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Wallet
- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/transfer` - Transfer to another user

### Payment Links
- `POST /api/payments/links` - Create payment link
- `GET /api/payments/links/:code` - Get payment link
- `GET /api/payments/links/:code/qr` - Get QR code
- `POST /api/payments/pay/:code` - Pay a link

### QR Codes
- `POST /api/qr/generate` - Generate QR code
- `POST /api/qr/scan` - Process QR scan
- `GET /api/qr/:id` - Get QR code details

### Webhooks
- `POST /webhooks/spei` - SPEI webhook
- `POST /webhooks/stripe` - Stripe webhook
- `POST /webhooks/mercadopago` - Mercado Pago webhook

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/pika

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-secret-key

# API
API_BASE_URL=https://api.pika.mx
NODE_ENV=production
PORT=8080

# Payment Providers
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_...

MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...

STIPAGO_API_KEY=...
STIPAGO_SECRET_KEY=...
STIPAGO_WEBHOOK_SECRET=...
SPEI_ENABLED=true

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key

# Session
SESSION_SECRET=your-session-secret
```

## PCI DSS Compliance

This implementation follows PCI DSS requirements:
- All sensitive data encrypted at rest
- HTTPS enforced in production
- Rate limiting on all endpoints
- Webhook signature verification
- Audit logging for all payment operations
- No card data stored (use tokenization)

## Deployment

### Fly.io
```bash
# Setup
fly auth login
fly apps create pika-backend

# Create PostgreSQL
fly postgres create --name pika-db

# Create Redis
fly redis create --name pika-redis

# Deploy
fly deploy
```

## Development

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma generate

# Run development server
npm run dev

# Run tests
npm test
```
