# Pika Database Schema Documentation

## Overview

This schema powers the Pika payment links and QR code platform, enabling Mexican merchants to accept payments via multiple methods (SPEI, cards, OXXO, etc.).

## Core Tables

### Users (`users`)
- **Purpose**: Merchant and customer accounts
- **Key Features**:
  - Role-based access (MERCHANT, CUSTOMER, ADMIN)
  - Business details (RFC, tax ID, business type)
  - Notification preferences
  - Multi-currency support (default: MXN)
- **Indexes**: email, phone, rfc (unique), role, isActive, createdAt

### Wallets (`wallets`)
- **Purpose**: User wallet balances and transaction limits
- **Key Features**:
  - Balance stored in cents (MXN * 100) for precision
  - Daily/monthly transaction limits
  - Usage counters reset automatically
  - Freeze functionality with reason tracking
- **Indexes**: userId, isActive
- **Unique**: userId (one wallet per user)

### Transactions (`transactions`)
- **Purpose**: All payment transactions (payments, refunds, withdrawals, etc.)
- **Key Features**:
  - Amount in cents for precision
  - Fee calculation (fee + netAmount)
  - Provider tracking (Stripe, MercadoPago, Openpay)
  - SPEI transfer tracking
  - Refund chain (originalTxId → refund)
  - QR code payment tracking
- **Indexes**: userId, walletId, type, status, createdAt (DESC), providerTxId, qrCodeId

### Payment Links (`payment_links`)
- **Purpose**: Shareable payment links for merchants
- **Key Features**:
  - Fixed or flexible amounts
  - Usage limits (maxUses)
  - Custom data collection (name, email, phone, address)
  - Customization (logo, theme color, custom message)
  - Short codes/slugs for shareable URLs
  - Password protection
  - Redirect URLs (success/cancel)
- **Indexes**: userId, shortCode (unique), slug (unique), isActive, expiresAt

### QR Codes (`qr_codes`)
- **Purpose**: QR code payments (static and dynamic)
- **Key Features**:
  - Static vs Dynamic QR types
  - Payment request and withdrawal types
  - Custom design (color, background, logo)
  - Scan tracking
  - Physical location/device tracking
  - Dynamic QR redirect URLs
- **Indexes**: userId, type, isActive, expiresAt, scanCount (DESC)

### Notifications (`notifications`)
- **Purpose**: Transaction and account notifications
- **Key Features**:
  - Multiple notification types
  - Actionable notifications (URL + label)
  - Read/unread tracking
- **Indexes**: userId, read, createdAt (DESC)

### Webhook Logs (`webhook_logs`)
- **Purpose**: Log of all webhooks received from payment providers
- **Key Features**:
  - Provider tracking
  - Event types
  - Processing status
  - HTTP response logging
  - Error tracking
- **Indexes**: event, provider, processed, receivedAt (DESC)

## Auth Tables (NextAuth)

### Accounts (`accounts`)
- OAuth provider linking
- **Unique**: (provider, providerAccountId)

### Sessions (`sessions`)
- Active user sessions
- **Indexes**: userId, sessionToken

### Verification Tokens (`verification_tokens`)
- Email verification tokens
- **Unique**: (identifier, token)

## Enums

### UserRole
- MERCHANT
- CUSTOMER
- ADMIN

### BusinessType
- INDIVIDUAL
- CORPORATION
- NON_PROFIT
- GOVERNMENT

### TransactionType
- PAYMENT
- REFUND
- WITHDRAWAL
- DEPOSIT
- TRANSFER
- FEE
- CHARGEBACK

### TransactionStatus
- PENDING
- PROCESSING
- COMPLETED
- FAILED
- CANCELLED
- REFUNDED

### PaymentMethod
- CARD
- SPEI
- OXXO
- CASH
- TRANSFER
- WALLET

### PaymentProvider
- STRIPE
- MERCADO_PAGO
- OPENPAY
- STP
- SPEI

### PaymentLinkType
- ONE_TIME
- RECURRING
- SUBSCRIPTION
- DONATION
- INVOICE

### QrCodeType
- STATIC
- DYNAMIC
- PAYMENT_REQUEST
- WITHDRAWAL

### QrFormat
- PNG
- JPEG
- SVG
- PDF

### NotificationType
- PAYMENT_RECEIVED
- PAYMENT_FAILED
- WITHDRAWAL_COMPLETE
- WITHDRAWAL_FAILED
- REFUND_ISSUED
- LINK_CREATED
- QR_SCANNED
- LINK_EXPIRED
- LOW_BALANCE
- MONTHLY_SUMMARY
- SYSTEM

## Special Features

### Triggers

1. **Auto-updated_at**: All tables update `updated_at` on modification

2. **Wallet usage counter reset**:
   - Automatically resets `daily_used` at midnight
   - Automatically resets `monthly_used` on the 1st of each month
   - Updates `last_reset_at` timestamp

3. **Payment link usage increment**:
   - When a transaction completes, increments the payment link's `used_count`

4. **QR code scan counter**:
   - When a transaction is created with a `qr_code_id`, increments scan count and updates `last_scanned_at`

5. **Transaction net amount calculation**:
   - Automatically calculates `net_amount = amount - fee` before insert

### Views

#### Wallet Summary (`wallet_summary`)
```sql
SELECT 
    w.id, w.user_id, w.balance, w.currency,
    w.is_active, w.is_frozen,
    u.email, u.name, u.business_name,
    COUNT(t.id) AS daily_transactions,
    COALESCE(SUM(t.amount), 0) AS daily_volume
FROM wallets w
JOIN users u ON w.user_id = u.id
LEFT JOIN transactions t ON t.wallet_id = w.id
    AND t.created_at >= CURRENT_DATE
GROUP BY w.id, u.id
```

#### Transaction Analytics (`transaction_analytics`)
```sql
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    type, status,
    COUNT(*) AS count,
    SUM(amount) AS total_amount,
    SUM(fee) AS total_fees,
    AVG(amount) AS avg_amount
FROM transactions
GROUP BY DATE_TRUNC('day', created_at), type, status
ORDER BY date DESC
```

## Important Constraints

- One wallet per user (unique)
- All user-related deletions cascade
- Transaction amounts are stored in **cents** (multiply by 100)
- `net_amount` is automatically calculated (`amount - fee`)
- Payment link short codes must be unique
- QR codes track scan counts automatically

## Performance Considerations

### Critical Indexes

1. **Transactions**: 
   - Composite on (userId, createdAt) for user transaction history
   - providerTxId for idempotency checks
   - qrCodeId for QR analytics

2. **Payment Links**:
   - shortCode and slug for quick lookups
   - expiresAt for cleanup queries
   - isActive for filtering active links

3. **QR Codes**:
   - scanCount (DESC) for popular QR ranking
   - isActive for filtering active QRs

### Optimization Tips

- Use JSONB for metadata (flexible schema)
- Index providerTxId for idempotent payment processing
- Covering indexes on (userId, status, createdAt) for dashboards
- Use views for analytics to avoid complex joins in app code
- Consider partitioning transactions by month for high-volume scenarios

## Financial Precision

**All amounts are stored in cents (INT) to avoid floating-point issues:**

- $100.00 MXN = `10000` (cents)
- $50.50 MXN = `5050` (cents)

Example calculation:
```javascript
const amountInCents = 10000; // $100.00
const feePercent = 0.035; // 3.5%
const fee = Math.round(amountInCents * feePercent); // 350 cents
const netAmount = amountInCents - fee; // 9650 cents
```

## Migration Files

- **Initial**: `20240101000000_init/migration.sql`
- **Prisma Schema**: `schema.prisma`

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pika?schema=public"

# Payment Provider Credentials (optional)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
MERCADO_PAGO_ACCESS_TOKEN=""
OPENPAY_API_KEY=""
```

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

## Relationships Summary

```
User
  ├── Account (1:1)
  ├── Session (1:N)
  ├── Wallet (1:1)
  ├── Transaction (1:N)
  ├── PaymentLink (1:N)
  ├── QrCode (1:N)
  └── Notification (1:N)

Wallet
  └── Transaction (1:N)

PaymentLink
  └── Transaction (1:N via payment_link reference)

QrCode
  └── Transaction (1:N via qr_code_id reference)
```

## Idempotency

Use `provider_tx_id` to ensure idempotent payment processing:
- If a transaction with the same `provider_tx_id` exists, return it instead of creating a duplicate
- Index on `provider_tx_id` for O(1) lookups

## Mexican Payment Context

### SPEI (Sistema de Pago Electrónico Interbancario)
- Real-time bank transfers in Mexico
- Operates 24/7
- CLABE (18-digit bank account number) required
- Processed by STP (Sistema de Transferencias y Pagos)

### OXXO
- Cash payments at convenience stores
- User gets a reference number
- Payment confirmed within 24-48 hours
- Requires polling for payment confirmation

### RFC (Registro Federal de Contribuyentes)
- Mexican tax ID
- Required for invoicing (facturas)
- Format: 4 letters + 6 digits + 3 characters (e.g., ABCD123456XYZ)
