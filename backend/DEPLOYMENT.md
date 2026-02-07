# Pika Backend - Quick Deployment Guide

## 🚀 Production Deployment to Fly.io

### Prerequisites

- Node.js 18+ installed locally
- Fly.io CLI installed (`curl -L https://fly.io/install.sh | sh`)
- Fly.io account (sign up at https://fly.io)

### Step 1: Initial Setup (Run Once)

```bash
# Navigate to backend directory
cd /home/laurence/pika/backend

# Run the setup script
./setup-fly.sh
```

This will:
- Create the Fly.io app
- Set up PostgreSQL database
- Set up Redis cache
- Generate required secrets

### Step 2: Configure Payment Providers

Set your payment provider secrets:

```bash
# Stripe
fly secrets set STRIPE_SECRET_KEY=sk_live_...
fly secrets set STRIPE_WEBHOOK_SECRET=whsec_...
fly secrets set STRIPE_PUBLISHABLE_KEY=pk_live_...

# Mercado Pago
fly secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
fly secrets set MERCADOPAGO_WEBHOOK_SECRET=...

# SPEI/CoDi (STiPago)
fly secrets set STIPAGO_API_KEY=...
fly secrets set STIPAGO_SECRET_KEY=...
fly secrets set STIPAGO_WEBHOOK_SECRET=...
fly secrets set SPEI_ENABLED=true
```

### Step 3: Deploy

```bash
# Deploy the application
./deploy.sh

# Or manually:
fly deploy

# Run database migrations
fly ssh console -C "npm run db:migrate"

# (Optional) Seed database with sample data
fly ssh console -C "npm run prisma:seed"
```

### Step 4: Verify Deployment

```bash
# Check app status
fly status

# View logs
fly logs

# Test health endpoint
curl https://pika-backend.fly.dev/health
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your local database credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js              # Main entry point
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── wallet.js          # Wallet & transaction endpoints
│   │   ├── payments.js        # Payment links & processing
│   │   ├── qr.js              # QR code generation & scanning
│   │   └── webhooks.js        # Payment provider webhooks
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Wallet.js          # Wallet model
│   │   ├── Transaction.js     # Transaction model
│   │   └── PaymentLink.js     # Payment link model
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── validation.js      # Request validation
│   │   ├── rateLimiter.js     # Rate limiting
│   │   ├── securityHeaders.js # Security headers
│   │   ├── webhookSecurity.js # Webhook verification
│   │   └── idempotency.js     # Idempotency handling
│   ├── config/
│   │   ├── database.js        # PostgreSQL config
│   │   ├── redis.js           # Redis config
│   │   └── security.js        # Security settings
│   └── utils/
│       ├── encryption.js      # Data encryption
│       ├── transaction.js     # Transaction utilities
│       ├── qrCode.js          # QR code generation
│       └── stipago.js         # SPEI/CoDi integration
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Seed data
├── Dockerfile                 # Container definition
├── fly.toml                   # Fly.io configuration
├── deploy.sh                  # Deployment script
├── setup-fly.sh               # Initial setup script
└── package.json               # Dependencies
```

## 🔐 Security Features

- ✅ PCI DSS compliant headers
- ✅ AES-256-GCM encryption for sensitive data
- ✅ Rate limiting on all endpoints
- ✅ Webhook signature verification
- ✅ JWT authentication with Redis session store
- ✅ Idempotency keys for payment operations
- ✅ SQL injection protection via parameterized queries
- ✅ XSS protection via Helmet

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Wallet
- `POST /api/wallet/create` - Create wallet
- `GET /api/wallet` - Get balance
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/wallet/transfer` - Transfer funds

### Payment Links
- `POST /api/payments/links` - Create link
- `GET /api/payments/links/:code` - Get link (public)
- `GET /api/payments/links/:code/qr` - Get QR
- `POST /api/payments/pay/:code` - Pay link

### QR Codes
- `POST /api/qr/generate` - Generate QR
- `POST /api/qr/scan` - Scan QR
- `POST /api/qr/:id/pay` - Pay via QR

### Webhooks
- `POST /webhooks/spei` - SPEI notifications
- `POST /webhooks/codi` - CoDi notifications
- `POST /webhooks/stripe` - Stripe events
- `POST /webhooks/mercadopago` - Mercado Pago events

See [API.md](API.md) for full documentation.

## 📝 Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - Data encryption key (32 chars)
- `SESSION_SECRET` - Session encryption secret

Optional (Payment Providers):
- `STRIPE_SECRET_KEY` - Stripe API key
- `MERCADOPAGO_ACCESS_TOKEN` - Mercado Pago token
- `STIPAGO_API_KEY` - STiPago API key

See `.env.example` for complete list.

## 🧪 Testing

```bash
# Run health check
npm run health

# Verify deployment
./verify.sh
```

## 📊 Monitoring

```bash
# View app metrics
fly status

# View logs
fly logs

# View metrics dashboard
fly metrics
```

## 🆘 Troubleshooting

### Deployment fails
```bash
# Check logs
fly logs --app pika-backend

# Restart app
fly apps restart pika-backend
```

### Database issues
```bash
# Connect to database
fly postgres connect --app pika-db

# Run migrations manually
fly ssh console --app pika-backend
npm run db:migrate
```

### Redis issues
```bash
# Check Redis status
fly redis status --app pika-redis
```

## 📚 Additional Resources

- [API Documentation](API.md)
- [Fly.io Documentation](https://fly.io/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)

## 📝 License

Private - For authorized use only
