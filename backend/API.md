# Pika API Documentation

## Base URL
```
Production: https://pika-backend.fly.dev
Local: http://localhost:8080
```

## Authentication

All API requests (except public endpoints) require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Obtain a token via the `/api/auth/login` or `/api/auth/register` endpoints.

## Response Format

All responses follow a standard format:

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": { ... },
  "requestId": "uuid"
}
```

## Endpoints

### Health Check
```
GET /health
```

Public endpoint to check API status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "redis": "connected",
  "version": "1.0.0"
}
```

---

## Authentication API

### Register
```
POST /api/auth/register
```

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "phone": "+521234567890",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "phone": "+521234567890",
    "fullName": "John Doe",
    "isVerified": false
  },
  "token": "jwt-token"
}
```

### Login
```
POST /api/auth/login
```

Authenticate and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "phone": "+521234567890",
    "fullName": "John Doe",
    "isVerified": true,
    "balance": 0
  },
  "token": "jwt-token"
}
```

### Get Current User
```
GET /api/auth/me
```

Get current authenticated user details.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "phone": "+521234567890",
    "fullName": "John Doe",
    "isVerified": true,
    "balance": 15000
  }
}
```

### Logout
```
POST /api/auth/logout
```

Revoke current access token.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Wallet API

### Create Wallet
```
POST /api/wallet/create
```

Create a new wallet for the authenticated user.

**Request Body:**
```json
{
  "currency": "MXN",
  "dailyLimit": 10000,
  "monthlyLimit": 100000
}
```

**Response:**
```json
{
  "message": "Wallet created successfully",
  "wallet": {
    "id": "wallet-id",
    "userId": "user-id",
    "balance": 0,
    "currency": "MXN",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Wallet Balance
```
GET /api/wallet
```

Get current wallet balance and status.

**Response:**
```json
{
  "walletId": "wallet-id",
  "balance": 15000,
  "currency": "MXN",
  "isActive": true,
  "version": 1
}
```

### Get Transaction History
```
GET /api/wallet/transactions
```

Get paginated transaction history.

**Query Parameters:**
- `limit` (number): Number of results (default: 20, max: 100)
- `offset` (number): Pagination offset (default: 0)
- `type` (string): Filter by type (PAYMENT, REFUND, WITHDRAWAL, DEPOSIT, TRANSFER, FEE)
- `status` (string): Filter by status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED)
- `startDate` (string): Filter from date (ISO 8601)
- `endDate` (string): Filter to date (ISO 8601)

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn-id",
      "type": "PAYMENT",
      "status": "COMPLETED",
      "amount": 15000,
      "fee": 525,
      "netAmount": 14475,
      "currency": "MXN",
      "description": "Payment for order #123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "completedAt": "2024-01-01T00:01:00.000Z"
    }
  ],
  "summary": {
    "total_transactions": "45",
    "total_credits": "500000",
    "total_debits": "100000",
    "pending_amount": "0",
    "completed_credits": "500000"
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "count": 1
  }
}
```

### Transfer Funds
```
POST /api/wallet/transfer
```

Transfer funds to another user.

**Headers:**
- `Idempotency-Key`: UUID v4 to prevent duplicate transfers

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com",
  "amount": 5000,
  "description": "Payment for lunch"
}
```

**Response:**
```json
{
  "message": "Transfer successful",
  "idempotent": false,
  "transaction": {
    "id": "txn-id",
    "type": "TRANSFER",
    "amount": 5000,
    "status": "COMPLETED"
  },
  "newBalance": 10000
}
```

---

## Payment Links API

### Create Payment Link
```
POST /api/payments/links
```

Create a new payment link.

**Headers:**
- `Idempotency-Key`: UUID v4 to prevent duplicates

**Request Body:**
```json
{
  "amount": 15000,
  "currency": "MXN",
  "description": "Payment for services",
  "expiresIn": 24
}
```

**Response:**
```json
{
  "message": "Payment link created",
  "paymentLink": {
    "id": "link-id",
    "referenceCode": "PIKA-ABC123",
    "amount": 15000,
    "currency": "MXN",
    "description": "Payment for services",
    "expiresAt": "2024-01-02T00:00:00.000Z",
    "url": "https://api.pika.mx/pay/PIKA-ABC123"
  }
}
```

### Get Payment Link (Public)
```
GET /api/payments/links/:referenceCode
```

Get payment link details (public endpoint, no auth required).

**Response:**
```json
{
  "referenceCode": "PIKA-ABC123",
  "amount": 15000,
  "currency": "MXN",
  "description": "Payment for services",
  "isValid": true,
  "expiresAt": "2024-01-02T00:00:00.000Z"
}
```

### Get Payment Link QR Code
```
GET /api/payments/links/:referenceCode/qr
```

Get QR code for a payment link.

**Response:**
```json
{
  "referenceCode": "PIKA-ABC123",
  "amount": 15000,
  "qrCode": "data:image/png;base64,..."
}
```

### Pay Payment Link
```
POST /api/payments/pay/:referenceCode
```

Pay a payment link.

**Headers:**
- `Idempotency-Key`: UUID v4 to prevent duplicate payments

**Response:**
```json
{
  "message": "Payment successful",
  "idempotent": false,
  "transaction": {
    "id": "txn-id",
    "type": "PAYMENT",
    "amount": 15000,
    "status": "COMPLETED"
  },
  "newBalance": 8500
}
```

---

## QR Codes API

### Generate QR Code
```
POST /api/qr/generate
```

Generate a new QR code for payments.

**Request Body:**
```json
{
  "name": "Store Counter",
  "description": "QR code at store counter",
  "amount": 0,
  "currency": "MXN",
  "type": "DYNAMIC",
  "format": "PNG",
  "size": 300,
  "color": "#000000",
  "backgroundColor": "#FFFFFF",
  "expiresIn": 168
}
```

**Response:**
```json
{
  "message": "QR code generated successfully",
  "qrCode": {
    "id": "qr-id",
    "code": "QR-ABC123",
    "name": "Store Counter",
    "amount": 0,
    "currency": "MXN",
    "type": "DYNAMIC",
    "format": "PNG",
    "size": 300,
    "url": "https://api.pika.mx/pay/qr/QR-ABC123",
    "image": "data:image/png;base64,...",
    "expiresAt": "2024-01-08T00:00:00.000Z",
    "isActive": true
  }
}
```

### Scan QR Code
```
POST /api/qr/scan
```

Process a scanned QR code.

**Request Body:**
```json
{
  "qrData": "{\"type\":\"payment\",\"id\":\"qr-id\",\"code\":\"QR-ABC123\",\"amount\":null,...}",
  "amount": 15000
}
```

**Response:**
```json
{
  "type": "payment_request",
  "qrCode": {
    "id": "qr-id",
    "code": "QR-ABC123",
    "merchantId": "merchant-id",
    "merchantName": "Store Name",
    "amount": 15000,
    "currency": "MXN"
  },
  "action": "confirm_payment",
  "paymentUrl": "/api/payments/qr/qr-id/pay"
}
```

### Pay via QR Code
```
POST /api/qr/:id/pay
```

Process payment for a scanned QR code.

**Request Body:**
```json
{
  "amount": 15000,
  "description": "Payment at Store Counter"
}
```

**Response:**
```json
{
  "message": "Payment successful",
  "transaction": {
    "id": "txn-id",
    "type": "qr_payment",
    "amount": 15000,
    "status": "COMPLETED"
  },
  "amount": 15000,
  "currency": "MXN",
  "merchant": {
    "id": "merchant-id",
    "name": "Store Name"
  }
}
```

---

## Webhooks

### SPEI Webhook
```
POST /webhooks/spei
```

Receive SPEI payment notifications.

**Headers:**
- `X-Signature`: Webhook signature
- `X-Timestamp`: Timestamp
- `X-Nonce`: Nonce for replay protection

### CoDi Webhook
```
POST /webhooks/codi
```

Receive CoDi payment notifications.

### Stripe Webhook
```
POST /webhooks/stripe
```

Receive Stripe event notifications.

**Headers:**
- `Stripe-Signature`: Stripe signature

### Mercado Pago Webhook
```
POST /webhooks/mercadopago
```

Receive Mercado Pago notifications.

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid request parameters |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate) |
| 422 | VALIDATION_ERROR | Validation failed |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| All API | 100 | 15 minutes |
| Auth | 5 | 15 minutes |
| Payments | 10 | 15 minutes |
| Transfers | 3 | 5 minutes |
| Webhooks | 100 | 1 minute |

## Idempotency

For POST requests that create resources (payments, transfers, etc.), include an `Idempotency-Key` header with a UUID v4 value. This ensures the operation is only executed once, even if the request is retried.

```
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

If a request with the same key has already been processed, the API will return the previous response.
