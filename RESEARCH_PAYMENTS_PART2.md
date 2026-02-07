
**Phase 2 (Months 4-6):**
- Business payment requests (transaction fees)
- Payment splitting (split bill among multiple people)
- Transaction history and analytics
- Push notifications
- Biometric authentication
- Recurring payments

**Phase 3 (Months 7-12):**
- Virtual card for online spending
- Cashback rewards at partner merchants
- Merchant directory (who accepts app)
- Group payment pools (events, gifts)
- International remittances (US-Mexico corridor)

### 8.3 Technical Architecture Recommendation

#### Core Components

**1. Mobile Apps (iOS/Android)**
```
┌───────────────────────────────────────────────────────────┐
│                      Mobile App Layer                      │
├─────────────────┬─────────────────┬───────────────────────┤
│   User Auth     │  Payment UI     │   Wallet Features     │
│  (Biometric)    │  (Requests)     │   (Balance, Card)      │
└─────────────────┴─────────────────┴───────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    API Gateway Layer                       │
├─────────────────┬─────────────────┬───────────────────────┤
│   REST API      │  GraphQL API    │   WebSocket (Realtime)│
└─────────────────┴─────────────────┴───────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                   Microservices Layer                      │
├──────────────┬──────────────┬──────────────┬──────────────┤
│   User       │  Payment     │   Wallet     │  Notification│
│  Service     │  Service     │   Service    │   Service    │
└──────────────┴──────────────┴──────────────┴──────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│                 Integration Layer                         │
├──────────────┬──────────────┬──────────────┬──────────────┤
│   SPEI/CoDi  │   Bank APIs  │   Card       │  WhatsApp    │
│  Integration │   (Open API) │   Processor  │  Business API│
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**2. Backend Infrastructure**
- **Primary Language:** Node.js or Go (for performance)
- **Database:** PostgreSQL (relational) + Redis (caching)
- **Message Queue:** RabbitMQ or Kafka (payment processing)
- **Container Orchestration:** Kubernetes (scalability)
- **Cloud Provider:** AWS (us-east-1 for Mexico proximity) or Google Cloud
- **CDN:** CloudFlare (global content delivery)
- **Monitoring:** Datadog or New Relic

**3. Security Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                  Security Layers                        │
├─────────────────────────────────────────────────────────┤
│  1. Device Security                                     │
│     - Certificate pinning                               │
│     - Root/jailbreak detection                          │
│     - Encrypted local storage (Keychain/Keystore)       │
├─────────────────────────────────────────────────────────┤
│  2. Transport Security                                  │
│     - TLS 1.3 for all API calls                        │
│     - Certificate pinning                               │
│     - VPN tunneling for sensitive operations            │
├─────────────────────────────────────────────────────────┤
│  3. Application Security                                │
│     - JWT tokens with short expiry                      │
│     - Refresh token rotation                           │
│     - Rate limiting per user/IP                         │
│     - Input validation and sanitization                │
├─────────────────────────────────────────────────────────┤
│  4. Data Security                                       │
│     - AES-256 encryption at rest                        │
│     - Field-level encryption for sensitive data         │
│     - Database encryption                               │
│     - Secure key management (AWS KMS)                   │
├─────────────────────────────────────────────────────────┤
│  5. Fraud & AML                                         │
│     - Real-time transaction monitoring                 │
│     - Machine learning fraud detection                  │
│     - Suspicious activity alerts                        │
│     - Transaction limits and velocity checks            │
└─────────────────────────────────────────────────────────┘
```

**4. Payment Processing Flow**
```
Payer Initiates Payment
        │
        ▼
┌───────────────────────┐
│  Create Payment Link  │
│  - Generate UUID      │
│  - Encrypt payload    │
│  - Store in DB        │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│   Share via WhatsApp  │
│   SMS, Email, QR      │
└───────────────────────┘
        │
        ▼
┌───────────────────────┐
│  Recipient Clicks     │
│  Deep link detection  │
└───────────────────────┘
        │
        ├───► Has Bank App? ───► Open Bank App ────► SPEI/CoDi ────► Done
        │
        └───► No Bank App ─────► Web Payment ─────► Card Payment ──► Done
```

**5. Bank Integration Strategy**

**Option A: Direct SPEI Integration**
- **Pros:** Lower transaction costs, direct control
- **Cons:** Requires IFPE license, significant integration work
- **Timeline:** 12+ months
- **Cost:** MXN 2-5M in integration and licensing

**Option B: Payment Processor Partnership**
- **Pros:** Fast to market (2-3 months), less regulatory burden
- **Cons:** Higher transaction costs, less control
- **Partners:** Stripe Mexico, Conekta, Clip, Mercado Pago
- **Timeline:** 3-6 months
- **Cost:** Integration fee + revenue share

**Recommended:** Start with **Option B** for MVP, add **Option A** in Phase 2

### 8.4 Regulatory Pathway

#### Recommended Approach: IFPE License + Partnership Strategy

**Phase 1: Launch with Partner (Months 1-6)**
- Partner with licensed payment processor (e.g., Conekta, Stripe)
- They handle regulatory compliance and fund management
- You focus on UX and customer acquisition
- **Pros:** Fast to market, lower upfront cost
- **Cons:** Revenue sharing, dependence on partner

**Phase 2: Apply for IFPE License (Months 3-12)**
- While operating with partner, begin IFPE application
- Build compliance infrastructure
- Hire compliance officer
- Prepare documentation
- **Timeline:** 9-12 months for approval

**Phase 3: Migration (Months 12-18)**
- Gradually migrate transactions to own IFPE license
- Maintain partner as backup/fallback
- Reduce transaction costs
- Expand product offering

#### Legal Structure Recommendations

**Option 1: Mexico Corporation (SAPI de CV)**
- **Type:** Private company with variable capital
- **Minimum shareholders:** 2
- **Foreign ownership:** 100% allowed
- **Tax:** 30% corporate income tax
- **Pros:** Familiar to investors, clear structure
- **Cons:** Higher compliance burden

**Option 2: US Corporation with Mexico Subsidiary**
- **Structure:** Delaware C-Corp + Mexico SAPI
- **Pros:** Easier for US investors, familiar for VC
- **Cons:** Double taxation (with treaty relief), complex
- **Best for:** Venture-backed startups seeking US funding

**Recommended:** Start as **SAPI de CV** (simpler), add US parent if raising from US investors

### 8.5 Go-to-Market Strategy

#### Target Market Segmentation

**Primary Target: Millennials/Gen Z (18-35)**
- **Size:** ~35 million Mexicans
- **Characteristics:** Heavy WhatsApp users, smartphone penetration 85%+
- **Pain points:** Splitting bills, paying friends back, sending money to family
- **Acquisition:** Social media, influencer marketing, viral features
- **Monetization:** Freemium → business features, card, lending

**Secondary Target: Gig Economy Workers**
- **Size:** ~10 million Mexicans
- **Characteristics:** Receive payments from multiple sources, need instant access
- **Pain points:** Waiting days for bank transfers, payment collection
- **Acquisition:** Direct outreach, platform partnerships
- **Monetization:** Instant withdrawal fees, business accounts

**Tertiary Target: Small Businesses**
- **Size:** ~4 million businesses
- **Characteristics:** Unbanked or underbanked, cash-heavy
- **Pain points:** Card fees too high, cash handling risk
- **Acquisition:** Direct sales, referral program
- **Monetization:** Transaction fees, value-added services

#### Launch Strategy

**Phase 1: Soft Launch (Month 1-3)**
- **Location:** One city (Mexico City, Guadalajara, or Monterrey)
- **User base:** 1,000-5,000 users
- **Acquisition:** Friends and family, early adopters
- **Focus:** Product validation, bug fixing, feedback collection
- **Metrics:** Activation rate, retention, transaction frequency

**Phase 2: Public Launch (Months 4-6)**
- **Location:** Expand to 3-5 major cities
- **User base:** 50,000-100,000 users
- **Acquisition:** Social media marketing, influencer partnerships
- **Focus:** Growth, brand awareness, user education
- **Metrics:** Cost per acquisition (CPA), viral coefficient, NPS

**Phase 3: National Expansion (Months 7-12)**
- **Location:** Nationwide
- **User base:** 500,000-1 million users
- **Acquisition:** Mass media, partnerships, referrals
- **Focus:** Scale, monetization, business development
- **Metrics:** Monthly active users (MAU), ARPU, revenue growth

#### Marketing Tactics

**1. Referral Program (Viral Growth)**
- **Offer:** MXN 50 for referrer + MXN 50 for referee (first payment)
- **Structure:** Unlimited referrals
- **Why:** Low CPA, high trust, viral coefficient >1

**2. WhatsApp First Strategy**
- **Native integration:** WhatsApp Business API for payment notifications
- **Templates:** Pre-formatted payment request messages
- **Groups:** Create user community groups for support
- **Why:** 95%+ WhatsApp penetration in Mexico

**3. Influencer Partnerships**
- **Local micro-influencers:** 10K-100K followers
- **Focus:** Finance, tech, lifestyle creators
- **Campaign:** "Split the bill without the awkwardness"
- **Why:** Authentic, trusted voices

**4. Merchant Partnerships**
- **Strategic partners:** Popular restaurants, bars, cafes
- **Integration:** Display QR codes at checkout
- **Incentive:** Lower transaction fees than cards
- **Why:** Merchant advocacy drives user adoption

**5. Content Marketing**
- **Topics:** Financial literacy, payment safety, tips for splitting bills
- **Channels:** TikTok, Instagram Reels, YouTube
- **Tone:** Educational, entertaining, relatable
- **Why:** Build trust, educate market

### 8.6 Monetization Strategy

#### Revenue Streams (Ranked by Priority)

**1. Business Payment Fees**
- **Structure:** 2-5% per transaction (compared to 3-4% for cards)
- **Target:** Small businesses, freelancers, online sellers
- **Timeline:** Launch at Month 4
- **Potential:** MXN 10-50M annually at 100K MAU

**2. Instant Withdrawal Fees**
- **Structure:** 1% fee (max MXN 20) for instant bank withdrawal
- **Free option:** 1-3 business day withdrawal
- **Target:** Users who need money immediately
- **Timeline:** Launch at Month 3
- **Potential:** MXN 5-15M annually at 100K MAU

**3. Virtual Card Fees**
- **Structure:** Interchange revenue on card transactions
- **Virtual card:** Free for users (generate revenue from merchant fees)
- **Physical card:** Optional upgrade with annual fee
- **Timeline:** Launch virtual at Month 6, physical at Month 9
- **Potential:** MXN 20-80M annually at 100K MAU

**4. Credit/Lending (Future)**
- **Structure:** Buy now, pay later (BNPL) or personal loans
- **Risk:** Higher regulatory burden, credit risk
- **Timeline:** Phase 2 (Year 2)
- **Potential:** MXN 50-200M annually (high margin)

**5. Premium Subscription (Optional)**
- **Features:** Higher limits, priority support, cashback boost
- **Price:** MXN 49-99/month
- **Target:** Power users, freelancers
- **Timeline:** Month 12
- **Potential:** MXN 5-20M annually (assuming 5-10% conversion)

#### Unit Economics (Estimates)

**Average User Economics (Year 1):**
- **Average transactions per user/month:** 5-10
- **Average transaction size:** MXN 500-1,000
- **Monetized transactions:** 20-30% (business payments, instant withdrawals)
- **Revenue per user/month:** MXN 15-30
- **Revenue per user/year:** MXN 180-360

**Break-even Analysis (Year 1-2):**
- **Fixed costs:** MXN 5-10M/month (team, infrastructure, office)
- **Variable costs:** MXN 5-15 per transaction (processing, support)
- **Break-even MAU:** ~100,000-200,000 users

### 8.7 Competitive Differentiation

#### Unique Selling Propositions

**1. WhatsApp-Native Payments**
- **Innovation:** First app designed for WhatsApp from ground up
- **Features:** Natural language payments, rich payment cards, bot automation
- **Advantage:** Fits existing user behavior (95% WhatsApp usage)
- **Defense:** Network effects, integration depth

**2. Hybrid Wallet + Bank Transfer**
- **Innovation:** Optional wallet without requiring it
- **Features:** Pay with wallet or direct bank transfer (CoDi/SPEI)
- **Advantage:** Flexibility for different user preferences
- **Defense:** Convenience vs. cost optimization

**3. Privacy-First Social Features**
- **Innovation:** Social payments without exposing transaction data
- **Features:** Friend-only feed, transaction hiding, private groups
- **Advantage:** Addresses privacy concerns (Venmo's weakness)
- **Defense:** Trust and safety reputation

**4. Merchant-Focused Business Tools**
- **Innovation:** Business accounts with invoicing, analytics, QR payments
- **Features:** Custom QR codes, payment links, instant settlement
- **Advantage:** Better than generic P2P apps for business use
- **Defense:** Switching costs, feature depth

### 8.8 Risk Assessment & Mitigation

#### Regulatory Risk
- **Risk:** Regulatory changes, licensing delays, compliance failures
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Engage legal counsel early
  - Partner with licensed processor for MVP
  - Maintain strong compliance culture
  - Build relationships with CNBV and Banco de México

#### Market Risk
- **Risk:** Low adoption, strong competitors, cash culture persists
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Start with specific use case (e.g., splitting bills)
  - Focus on younger demographic (more open to digital)
  - Leverage WhatsApp distribution (viral potential)
  - Partner with banks and merchants for distribution

#### Technology Risk
- **Risk:** Security breaches, downtime, scalability issues
- **Probability:** Low-Medium
- **Impact:** High
- **Mitigation:**
  - Invest in security from day one
  - Use proven cloud infrastructure
  - Implement redundancy and disaster recovery
  - Regular security audits and penetration testing

#### Fraud Risk
- **Risk:** Account takeover, fraudulent transactions, money laundering
- **Probability:** Medium
- **Impact:** Medium-High
- **Mitigation:**
  - Strong KYC and identity verification
  - Real-time fraud monitoring and machine learning
  - Transaction limits and velocity checks
  - User education on security best practices

#### Competition Risk
- **Risk:** Existing players launch similar features, banks improve apps
- **Probability:** High
- **Impact:** Medium
- **Mitigation:**
  - Move fast (first-mover advantage in social payments)
  - Focus on user experience (banks struggle here)
  - Build network effects (viral sharing)
  - Create switching costs (wallet, card, history)

#### Liquidity Risk
- **Risk:** Insufficient capital for operations and float
- **Probability:** Low (if properly funded)
- **Impact:** High
- **Mitigation:**
  - Raise sufficient seed capital (MXN 30-50M)
  - Manage burn rate carefully
  - Plan for 24+ months runway
  - Secure line of credit or partner support

---

## 9. Technical Implementation Guide

### 9.1 Minimum Viable Product (MVP) Architecture

#### Frontend Stack
```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Applications                  │
├──────────────────────┬──────────────────────────────────┤
│       iOS            │            Android               │
│  Swift / SwiftUI    │  Kotlin / Jetpack Compose        │
│  - Async/Await      │  - Coroutines                    │
│  - Combine          │  - Flow                           │
│  - Keychain         │  - Keystore                      │
└──────────────────────┴──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Shared Libraries / Modules                 │
├─────────────────────────────────────────────────────────┤
│  - Design System (UI Components)                        │
│  - Networking Layer                                     │
│  - Data Models                                          │
│  - Encryption Utilities                                 │
│  - Analytics Tracking                                   │
└─────────────────────────────────────────────────────────┘
```

#### Backend Stack (MVP)
```
┌─────────────────────────────────────────────────────────┐
│                   API Gateway (Node.js)                 │
├─────────────────────────────────────────────────────────┤
│  Express.js / Fastify                                   │
│  - Authentication (JWT)                                 │
│  - Rate Limiting                                        │
│  - Request Logging                                      │
│  - API Versioning                                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Microservices (Go or Node.js)           │
├──────────────┬──────────────┬──────────────┬───────────┤
│   Auth       │  Payments    │   Users      │  Wallet   │
│  Service     │  Service     │   Service    │  Service  │
├──────────────┼──────────────┼──────────────┼───────────┤
│ - Register   │ - Create     │ - Profile    │ - Balance │
│ - Login      │   payment    │ - KYC        │ - Load    │
│ - MFA        │ - Process    │ - Limits     │ - Withdraw│
│ - Session    │ - Status     │ - Verify     │ - History │
└──────────────┴──────────────┴──────────────┴───────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Data Layer                           │
├──────────────┬──────────────┬──────────────┬───────────┤
│  PostgreSQL  │    Redis     │   S3         │  CloudFlare│
│  (Primary)   │   (Cache)    │  (Files)     │   (CDN)   │
└──────────────┴──────────────┴──────────────┴───────────┘
```

### 9.2 Database Schema (Simplified)

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    curp VARCHAR(18),
    kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    kyc_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Payment Requests Table
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, expired, cancelled
    expires_at TIMESTAMP,
    qr_code_url VARCHAR(500),
    deep_link_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Request Recipients (for splitting)
CREATE TABLE payment_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_request_id UUID REFERENCES payment_requests(id),
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, declined
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    payment_request_id UUID REFERENCES payment_requests(id),
    type VARCHAR(50) NOT NULL, -- payment_request, wallet_load, withdrawal, transfer
    amount DECIMAL(12, 2) NOT NULL,
    fee DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, cancelled
    payment_method VARCHAR(100), -- spei, card, wallet
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Wallet Balances Table
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    balance DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'MXN',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES wallets(id),
    transaction_id UUID REFERENCES transactions(id),
    type VARCHAR(50) NOT NULL, -- credit, debit
    amount DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank Accounts Table
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    bank_name VARCHAR(255) NOT NULL,
    clabe VARCHAR(18) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards Table
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    card_token VARCHAR(255) NOT NULL, -- Tokenized from payment processor
    last_4 VARCHAR(4) NOT NULL,
    card_brand VARCHAR(50) NOT NULL, -- visa, mastercard, amex
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100), -- user, payment_request, transaction
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_payment_requests_requester ON payment_requests(requester_id);
CREATE INDEX idx_payment_requests_status ON payment_requests(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
```

### 9.3 API Design (RESTful)

#### Authentication Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/verify-phone
POST   /api/v1/auth/verify-mfa
```

#### User Endpoints
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
POST   /api/v1/users/me/kyc
GET    /api/v1/users/me/limits
```

#### Payment Request Endpoints
```
POST   /api/v1/payment-requests              # Create payment request
GET    /api/v1/payment-requests              # List my payment requests
GET    /api/v1/payment-requests/:id          # Get payment request details
PUT    /api/v1/payment-requests/:id          # Update payment request
DELETE /api/v1/payment-requests/:id          # Cancel payment request
POST   /api/v1/payment-requests/:id/pay      # Pay a payment request
GET    /api/v1/payment-requests/:id/qrcode   # Get QR code
```

#### Transaction Endpoints
```
GET    /api/v1/transactions                  # List transactions
GET    /api/v1/transactions/:id              # Get transaction details
```

#### Wallet Endpoints
```
GET    /api/v1/wallet                        # Get wallet balance
POST   /api/v1/wallet/load                   # Load wallet (deposit funds)
POST   /api/v1/wallet/withdraw               # Withdraw to bank account
GET    /api/v1/wallet/transactions           # Wallet transaction history
```

#### Bank Account Endpoints
```
POST   /api/v1/bank-accounts                 # Add bank account
GET    /api/v1/bank-accounts                 # List bank accounts
DELETE /api/v1/bank-accounts/:id             # Remove bank account
PUT    /api/v1/bank-accounts/:id/primary     # Set as primary
```

### 9.4 Security Implementation

#### Authentication Flow
```
1. User Registration
   - Phone number verification (SMS OTP)
   - Basic info collection
   - JWT token generation (access + refresh)

2. Login
   - Phone/Email + PIN/Password
   - MFA option (SMS, authenticator app, biometrics)
   - JWT token generation

3. Token Structure
   Header: {
     "alg": "RS256",
     "typ": "JWT"
   }
   Payload: {
     "sub": "user_id",
     "iat": 1234567890,
     "exp": 1234571490,
     "scope": ["read:payments", "write:payments"]
   }
   Signature: RSA private key
```

#### Transaction Security
```
1. Client-Side
   - Certificate pinning
   - Root/jailbreak detection
   - Encrypted local storage
   - Biometric authentication for transactions

2. Transport
   - TLS 1.3 only
   - Certificate pinning
   - HSTS headers
   - No sensitive data in URL

3. Server-Side
   - Input validation and sanitization
   - SQL injection prevention (parameterized queries)
   - XSS protection
   - CSRF tokens for state-changing operations
   - Rate limiting (per user, per IP)

4. Payment Processing
   - End-to-end encryption for card data
   - Tokenization (never store raw card data)
   - 3D Secure for card payments
   - Digital signatures for SPEI transactions
```

#### Fraud Detection Rules
```
1. Velocity Checks
   - Max X transactions per hour/day
   - Max amount per hour/day
   - Max failed attempts per hour

2. Behavioral Analysis
   - Device fingerprinting
   - Location analysis (impossible travel)
   - Transaction pattern analysis
   - Machine learning anomaly detection

3. Blacklist/Whitelist
   - Blocked users (fraud, AML)
   - Suspicious IP addresses
   - High-risk countries (for cross-border)

4. Manual Review
   - Flagged transactions
   - Large transactions (>MXN 10,000)
   - New user transactions (first 7 days)
```

### 9.5 Integration with Payment Processors

#### Conekta Integration (Example)
```javascript
// Create payment link
const createPaymentLink = async (amount, description, customerInfo) => {
  const payment = await conekta.charges.create({
    amount: amount * 100, // in cents
    currency: 'MXN',
    description: description,
    customer_info: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone
    },
    payment_method: {
      type: 'default'
    }
  });
  
  return payment.payment_url;
};

// Process webhook notification
const handleWebhook = async (event) => {
  const signature = request.headers['Conekta-Signature'];
  const isValid = verifyWebhookSignature(rawBody, signature);
  
  if (!isValid) {
    throw new Error('Invalid webhook signature');
  }
  
  switch (event.type) {
    case 'charge.paid':
      await updateTransactionStatus(event.data.object.id, 'completed');
      break;
    case 'charge.failed':
      await updateTransactionStatus(event.data.object.id, 'failed');
      break;
  }
};
```

#### SPEI Integration (via Bank API)
```javascript
// Create SPEI transfer
const createSPEITransfer = async (clabe, amount, reference) => {
  const transaction = await bankAPI.createTransfer({
    destination_clabe: clabe,
    amount: amount,
    currency: 'MXN',
    reference: reference,
    concept: 'Payment request payment'
  });
  
  return {
    transaction_id: transaction.id,
    status: transaction.status,
    tracking_key: transaction.tracking_key
  };
};

// Check SPEI transaction status
const checkSPEIStatus = async (transactionId) => {
  const status = await bankAPI.getTransactionStatus(transactionId);
  
  if (status === 'completed') {
    await updateTransactionStatus(transactionId, 'completed');
  }
  
  return status;
};
```

### 9.6 Mobile App Features

#### Core Screens
```
1. Onboarding
   - Welcome screen
   - Phone verification
   - Basic profile setup
   - PIN/biometric setup

2. Home
   - Balance display (if wallet enabled)
   - Quick actions: Send, Request, Scan QR
   - Recent transactions
   - Payment requests

3. Send Money
   - Contact selection (phone, from contacts)
   - Amount entry
   - Note/emoji (optional)
   - Payment method selection (wallet, bank, card)
   - Confirmation

4. Request Payment
   - Amount entry
   - Split option (multiple people)
   - Description/note
   - Share options (WhatsApp, SMS, Email, QR)
   - Track responses

5. Scan QR
   - Camera viewfinder
   - QR code detection
   - Display payment details
   - Confirm payment

6. Transaction History
   - Filter by type, date, status
   - Search functionality
   - Transaction details
   - Receipt/proof of payment

7. Wallet (if enabled)
   - Balance display
   - Load money
   - Withdraw
   - Transaction history

8. Settings
   - Profile management
   - Payment methods
   - Security settings
   - Notifications
   - Help & support
```

#### WhatsApp Integration
```
1. Payment Request Card (Rich Media)
   - Amount
   - Requester name and avatar
   - Description
   - "Pay Now" button (deep link)
   - QR code image

2. Payment Notification
   - "You received MXN X from [Name]"
   - Transaction details
   - "View in app" button

3. Payment Reminder
   - "Payment request from [Name] expires in X hours"
   - "Pay now" button
```

---

## 10. Roadmap & Milestones

### 10.1 12-Month Roadmap

**Months 1-3: Foundation & MVP**
- [ ] Legal entity formation (SAPI de CV)
- [ ] Core team hiring (CTO, Product Lead, Compliance)
- [ ] Payment processor partnership (Conekta or Stripe)
- [ ] Mobile app development (iOS + Android)
- [ ] Backend infrastructure setup
- [ ] Security implementation (penetration testing)
- [ ] Beta launch (1,000 users, invite-only)
- [ ] Feedback collection and iteration

**Months 4-6: Public Launch**
- [ ] App Store and Play Store submission
- [ ] Public launch (Mexico City only)
- [ ] Marketing campaign launch
- [ ] Referral program implementation
- [ ] WhatsApp Business API integration
- [ ] Business payment features launch
- [ ] First 50,000 users
- [ ] Customer support team setup

**Months 7-9: Expansion**
- [ ] Expand to Guadalajara and Monterrey
- [ ] Virtual card launch
- [ ] Merchant partnership program
- [ ] Influencer marketing campaign
- [ ] First 200,000 users
- [ ] Revenue optimization (business fees, instant withdrawals)

**Months 10-12: Scale**
- [ ] National expansion
- [ ] Physical card launch
- [ ] Cashback/rewards program
- [ ] IFPE license application (or advance partnership)
- [ ] First 500,000 users
- [ ] Break-even or reduce burn rate
- [ ] Series A fundraising preparation

### 10.2 Key Metrics (Year 1 Targets)

**User Metrics**
- Total registered users: 500,000
- Monthly active users (MAU): 200,000
- User retention (Month 3): 40%+
- Daily active users (DAU): 50,000
- DAU/MAU ratio: 25%+

**Transaction Metrics**
- Total transactions: 5 million
- Transactions per user/month: 8-10
- Average transaction size: MXN 600
- Total transaction volume: MXN 3 billion

**Revenue Metrics**
- Monthly recurring revenue (Month 12): MXN 5-10M
- Annual revenue: MXN 60-120M
- ARPU (annual): MXN 120-240
- Revenue margin: 40-60%

**Engagement Metrics**
- NPS (Net Promoter Score): 50+
- App Store rating: 4.5+
- Viral coefficient: 1.2+
- Referral conversion: 30%+

**Support Metrics**
- Response time: < 2 hours
- First contact resolution: 85%+
- Ticket volume per 1K users: < 50

---

## 11. Conclusion & Recommendations

### 11.1 Key Takeaways

1. **Social payments are the future:** Tikkie, Bizum, and Venmo prove that social-first design drives viral adoption

2. **Hybrid models win:** The most successful apps combine request links (Tikkie), optional wallets (Venmo), and bank integration (Bizum)

3. **Mexico is underserved:** Despite good infrastructure (SPEI, CoDi), Mexico lacks a dominant social payment app

4. **Regulatory pathway is manageable:** IFPE license or partnership model makes entry feasible

5. **WhatsApp is the key:** 95%+ penetration makes WhatsApp integration critical for Mexico

6. **Cash culture is changing:** Younger generations are adopting digital payments faster

### 11.2 Strategic Recommendations

**1. Product Strategy:**
- Launch with **request-link model** (Tikkie-style) for viral distribution
- Add **optional wallet** for power users and monetization
- Design for **WhatsApp-first** experience
- Build **privacy-focused** social features (avoid Venmo's mistakes)

**2. Go-to-Market:**
- Start with **Millennials/Gen Z** in urban areas
- Use **referral program** as primary acquisition channel
- **Partner with merchants** for QR code distribution
- **Leverage influencers** for brand awareness

**3. Regulatory:**
- **Partner first** (fast to market, lower risk)
- **Apply for IFPE license** in parallel (long-term control)
- **Invest in compliance** from day one
- **Build relationships** with CNBV and Banco de México