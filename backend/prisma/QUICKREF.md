# Pika Database Schema - Quick Reference

## Entity Overview

| Entity | Table | Description |
|--------|-------|-------------|
| User | `users` | Merchants, customers, admins |
| Wallet | `wallets` | User wallet balances |
| Transaction | `transactions` | Payments, refunds, withdrawals |
| PaymentLink | `payment_links` | Shareable payment links |
| QrCode | `qr_codes` | Static & dynamic QR codes |
| Notification | `notifications` | Transaction notifications |
| WebhookLog | `webhook_logs` | Provider webhook logs |

## Key Fields by Entity

### User
- `role`: MERCHANT, CUSTOMER, ADMIN
- `rfc`: Mexican tax ID (unique)
- `businessType`: INDIVIDUAL, CORPORATION, NON_PROFIT, GOVERNMENT
- `currency`: Default "MXN"
- `timezone`: Default "America/Mexico_City"

### Wallet
- `balance**: In **cents** (×100)
- `dailyLimit/monthlyLimit`: In cents
- `dailyUsed/monthlyUsed`: Reset automatically
- `isFrozen`: Block all transactions
- Unique per user

### Transaction
- `type**: PAYMENT, REFUND, WITHDRAWAL, DEPOSIT, TRANSFER, FEE, CHARGEBACK
- `status**: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED
- `amount/fee/netAmount**: In **cents**
- `paymentMethod`: CARD, SPEI, OXXO, CASH, TRANSFER, WALLET
- `provider`: STRIPE, MERCADO_PAGO, OPENPAY, STP, SPEI
- `originalTxId`: For refunds

### PaymentLink
- `type**: ONE_TIME, RECURRING, SUBSCRIPTION, DONATION, INVOICE
- `amount**: 0 = flexible amount
- `maxUses/usedCount`: Usage tracking
- `shortCode/slug**: For shareable URLs
- `expiresAt`: Optional expiration
- `requireAuth/password`: Security options

### QrCode
- `type**: STATIC, DYNAMIC, PAYMENT_REQUEST, WITHDRAWAL
- `amount**: 0 = flexible amount
- `format**: PNG, JPEG, SVG, PDF
- `scanCount`: Usage analytics
- `targetUrl`: For dynamic QRs

## Important Indexes

### Performance Critical
- `transactions`: (user_id, created_at DESC) for transaction history
- `transactions`: (wallet_id, status) for wallet operations
- `transactions`: (provider_tx_id) for idempotency
- `payment_links`: (short_code) for quick lookups
- `payment_links`: (user_id, is_active) for merchant dashboards
- `qr_codes`: (user_id, scan_count DESC) for popular QRs

## Common Queries

### Get wallet with user info
```sql
SELECT w.*, u.email, u.name, u.business_name
FROM wallets w
JOIN users u ON w.user_id = u.id
WHERE w.user_id = $1 AND w.is_active = true;
```

### Get transaction history
```sql
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 50 OFFSET 0;
```

### Get payment analytics (daily)
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE status = 'COMPLETED') as total_payments,
  SUM(amount) FILTER (WHERE status = 'COMPLETED') as volume
FROM transactions
WHERE user_id = $1 AND type = 'PAYMENT'
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Check for idempotent payment
```sql
SELECT * FROM transactions
WHERE provider_tx_id = $1;
```

## Relationships

```
User 1:1 Wallet
User 1:N Transaction
User 1:N PaymentLink
User 1:N QrCode
Wallet 1:N Transaction
PaymentLink 1:N Transaction (via payment_link reference)
QrCode 1:N Transaction (via qr_code_id reference)
```

## Amounts in Cents

**All amounts stored as integers (cents)**

| Amount | Stored As |
|--------|-----------|
| $10.00 MXN | 1000 |
| $99.99 MXN | 9999 |
| $500.50 MXN | 50050 |

**Calculations:**
```javascript
const amountInCents = 10000 // $100.00
const displayAmount = amountInCents / 100 // 100.00
```

## Fee Structure

### Common Fee Percentages
- **SPEI/STP**: 3.5% processorFeePercent
- **Cards (Stripe)**: 3.75% + fixed fee
- **OXXO**: 8% (higher due to cash handling)
- **Withdrawals**: 1%

### Fee Calculation
```javascript
const amount = 10000 // $100.00
const feePercent = 0.035 // 3.5%
const fee = Math.round(amount * feePercent) // 350 cents = $3.50
const netAmount = amount - fee // 9650 cents = $96.50
```

## Payment Methods

### SPEI (Sistema de Pago Electrónico Interbancario)
- Real-time bank transfers (24/7)
- Requires CLABE (18 digits)
- Provider: STP
- Fee: ~3.5%

### Cards
- Credit/debit cards
- Providers: Stripe, Openpay
- Fee: ~3.75% + fixed

### OXXO
- Cash payments at convenience stores
- Reference number generated
- Payment confirmed in 24-48h
- Provider: Mercado Pago
- Fee: ~8%

## Mexican Context

### RFC (Registro Federal de Contribuyentes)
- Format: 4 letters + 6 digits + 3 characters
- Example: `CUPU800825569`
- Required for invoicing (facturas)
- Stored in `users.rfc` (unique)

### CLABE (Clave Bancaria Estandarizada)
- 18-digit bank account number
- Used for SPEI transfers
- Format validation built-in

### Currency
- All amounts in MXN (Mexican Peso)
- Stored as cents (integer)
- Default: `currency = 'MXN'`

## Triggers (Automation)

### Wallet Usage Reset
- `daily_used` resets at midnight
- `monthly_used` resets on the 1st of month
- `last_reset_at` updated automatically

### Payment Link Usage
- `used_count` increments when transaction completes
- Prevents use beyond `max_uses`

### QR Scan Tracking
- `scan_count` increments on transaction
- `last_scanned_at` updated

### Net Amount Calculation
- `net_amount = amount - fee` (automatic)
- Ensures data consistency

## Status Workflows

### Payment Lifecycle
```
PENDING → PROCESSING → COMPLETED
        ↘ FAILED / CANCELLED
```

### Refund Flow
```
COMPLETED → REFUNDED (new transaction with original_tx_id)
```

### Withdrawal Flow
```
PENDING → PROCESSING → COMPLETED
        ↘ FAILED
```

## Idempotency

Use `provider_tx_id` to prevent duplicate transactions:
- Check if exists before creating
- Return existing if found
- Index on `provider_tx_id` for O(1) lookup

## Security Features

### Payment Links
- `require_auth`: Require login
- `password`: Password protection
- `expires_at`: Time-limited access
- `max_uses`: Usage limit

### Wallet Protection
- `is_frozen`: Block all transactions
- `frozen_reason`: Audit trail
- `daily_limit/monthly_limit`: Loss limitation
