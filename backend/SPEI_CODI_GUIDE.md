# SPEI/CoDi Integration Guide

## Overview

SPEI (Sistema de Pagos Electrónicos Interbancarios) and CoDi are Mexico's primary payment infrastructures. This guide explains how to integrate them with Pika Backend.

## What is SPEI?

SPEI is Mexico's real-time electronic payment system operated by Banco de México:
- **Transfer time**: Seconds to minutes
- **Availability**: 24/7/365
- **Cost**: Very low (~$2-5 MXN per transaction)
- **Limits**: Up to $8,000 MXN for individuals, higher for businesses

## What is CoDi?

CoDi is a mobile payment system built on SPEI:
- **QR codes**: Scan to pay
- **Push notifications**: Receive payments directly
- **No card needed**: Uses bank account (CLABE)
- **Instant**: Same as SPEI

## Integration Options

### 1. STiPago (Recommended)

STiPago provides a simple API for SPEI/CoDi:

**Pros:**
- Easy integration
- Webhook notifications
- QR code generation
- Sandbox environment
- Good documentation

**Contact:**
- Website: https://www.stipago.com
- Email: contacto@stipago.com

**Required credentials:**
```
STIPAGO_API_KEY=your_api_key
STIPAGO_SECRET_KEY=your_secret_key
```

### 2. Direct Bank Integration

Some banks offer direct SPEI APIs:
- BBVA API Market
- Santander API
- Banorte Developer

**Pros:**
- Direct relationship with bank
- Potentially lower fees
- More control

**Cons:**
- Complex integration
- Individual certification per bank
- Higher maintenance

### 3. Payment Processors

- **Clip**: Offers SPEI for merchants
- **Conekta**: SPEI payments
- **MercadoPago**: SPEI available

## Implementation Steps

### Step 1: Get Credentials

Contact STiPago or your chosen provider to obtain:
- API key
- Secret key (for webhooks)
- Test/Sandbox credentials
- CLABE for receiving payments

### Step 2: Configure Environment

```bash
# Enable SPEI
SPEI_ENABLED=true

# STiPago credentials
STIPAGO_API_KEY=your_production_key
STIPAGO_SECRET_KEY=your_secret_key

# Webhook URL
STIPAGO_WEBHOOK_SECRET=webhook_signing_secret
```

### Step 3: Test in Sandbox

Use sandbox credentials first:
```bash
STIPAGO_API_KEY=test_sandbox_key
STIPAGO_SECRET_KEY=test_sandbox_secret
```

The backend includes `/utils/stipago.js` with:
- `createSPEIOrder()` - Create payment order
- `checkSPEIStatus()` - Check transaction status
- `createCoDiQR()` - Generate CoDi QR
- `verifyWebhookSignature()` - Validate webhooks

### Step 4: Handle Webhooks

The `/api/payments/webhooks/spei` endpoint receives notifications:

1. Verify signature
2. Parse tracking key
3. Update transaction status
4. Credit user wallet

### Step 5: Go Live

1. Switch to production credentials
2. Verify webhook URL is accessible
3. Test with real small amounts
4. Monitor first transactions

## SPEI Transaction Flow

```
User Request
    ↓
Create SPEI Order (STiPago)
    ↓
Receive CLABE + Tracking Key
    ↓
Generate QR Code
    ↓
User makes SPEI transfer
    ↓
STiPago detects payment
    ↓
Webhook notification
    ↓
Verify & Credit Wallet
    ↓
Transaction Complete
```

## CLABE Format

CLABE = Clave Bancaria Estandarizada (18 digits)

Format: `XXXXXYYYYYYYYYYYYYY`

- First 3 digits: Bank code
- Next 3 digits: Branch code
- Next 11 digits: Account number
- Last digit: Control digit

**Example CLABEs:**
- BBVA: `012`
- Santander: `014`
- Banorte: `072`
- HSBC: `021`
- Banamex: `002`

## Security Considerations

1. **Webhook Verification**: Always verify signatures
2. **Idempotency**: Handle duplicate webhooks
3. **Encryption**: Use TLS for all connections
4. **Rate Limiting**: Protect against abuse
5. **Logging**: Keep audit trails

## Testing Checklist

- [ ] Create SPEI order successfully
- [ ] Receive CLABE and tracking key
- [ ] Generate QR code
- [ ] Make test SPEI payment
- [ ] Receive webhook notification
- [ ] Verify webhook signature
- [ ] Credit wallet correctly
- [ ] Handle failed transactions
- [ ] Handle expired orders
- [ ] Test refund flow (if applicable)

## Common Issues

### Webhook not received
- Verify URL is accessible from internet
- Check firewall rules
- Verify webhook URL in STiPago dashboard

### Signature verification fails
- Check secret key matches
- Verify raw payload is used
- Check encoding (UTF-8)

### Transaction not credited
- Check tracking key matches
- Verify webhook was processed
- Check database for errors

## Compliance

### Legal Requirements

1. **Registro de Prestadores de Servicios Financieros**
2. **Anti-Money Laundering (AML)**
3. **Know Your Customer (KYC)**
4. **Data protection (Federal Law on Protection of Personal Data)**

### Recommended

1. Implement transaction monitoring
2. Set spending limits
3. Require verification for large amounts
4. Keep transaction records for 5+ years
5. Implement fraud detection

## Costs

### STiPago (estimate)

- **Setup**: Variable
- **Per transaction**: $2-5 MXN
- **Monthly fee**: Variable (based on volume)
- **CoDi**: Additional fee per QR

### Direct Bank

- **Certification**: $10,000-50,000 MXN (one-time)
- **Per transaction**: $1-3 MXN
- **Maintenance**: Variable

## Support

For implementation help:
- Review `/utils/stipago.js` code
- Check STiPago documentation
- Contact their support team
- Test thoroughly in sandbox

## Resources

- Banco de México SPEI: https://www.banxico.org.mx/spei
- STiPago: https://www.stipago.com
- CoDi info: https://www.gob.mx/codi

## Next Steps

1. Contact STiPago for sandbox access
2. Implement webhook handler (already in code)
3. Test end-to-end flow
4. Implement monitoring/alerts
5. Go live with production credentials
