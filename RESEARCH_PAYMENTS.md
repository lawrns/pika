# Payment Systems Research Report
**Payment Request/Collection Systems Architecture Analysis**

*Generated: 2025-02-05*

---

## Executive Summary

This report analyzes Tikkie (Netherlands) and comparable payment systems globally, with focus on technical architecture and applicability to the Mexican market. Key findings indicate that **bank-led, app-based payment request systems** represent the dominant model, with Mexico having strong infrastructure (SPEI/CoDi) but fragmented consumer adoption.

---

## 1. How Tikkie Works

### 1.1 System Overview
Tikkie is a Dutch payment request system launched by ABN AMRO bank, available to anyone with a Dutch bank account and phone number (Netherlands, Belgium, Germany). It has grown from 1M users in 2017 to 5M users in 2019.

### 1.2 Core Mechanism

**Payment Request Flow:**
1. **Request Generation**: User creates payment request via mobile app (iOS/Android)
2. **Link Creation**: System generates a unique hyperlink that encodes:
   - Payment amount
   - Requester's bank account
   - Request description/memo
   - Expiration metadata
3. **Delivery**: Link distributed via WhatsApp, Telegram, SMS, email
4. **Payment Execution**: 
   - Link redirects to iDeal (Dutch interbank payment system)
   - Payer's banking app opens automatically (if installed)
   - Alternatively, web-based payment via browser
5. **Settlement**: Funds settled via traditional banking rails

### 1.3 QR Code Implementation
- Payment links can be encoded as QR codes
- QR codes can be displayed:
  - On phone screens (for in-person requests)
  - Printed materials (invoices, receipts, billboards)
  - Digital displays (POS terminals, websites)
- Scanning QR code triggers same flow as hyperlink

### 1.4 Technical Specifications

**Payment Limits (2024):**
- Sender maximum: €750 per Tikkie
- Recipient maximum: €2,500 per Tikkie
- No limit on number of requests

**Transaction Speed:**
- 50% of requests paid within 1 hour
- 80% paid within 24 hours
- ~200,000 daily payment requests (2019 data)

**Average Transaction Value:**
- 2017: €12
- 2018: €27.50

**Cost Structure:**
- Free for private/personal transactions
- Business clients pay transaction fees
- Dutch banks typically charge annual fees instead of per-transaction fees

### 1.5 Integration Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Requester App  │─────→│  Tikkie Service  │─────→│  iDeal Network  │
│  (Mobile)       │      │  (ABN AMRO)      │      │  (Interbank)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                ↓                         ↓
                        Payment Link Generated     Banking Apps Open
                                ↓                         ↓
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Payer Device   │←─────│  Link/QR Code    │←─────│  Bank Backend   │
│  (Browser/App)  │      │  (WhatsApp/etc)  │      │  (Settlement)   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

**Key Technical Points:**
- No proprietary wallet or balance system
- Uses existing bank authentication (iDeal)
- Deep linking into banking apps via URL schemes
- Stateless payment links (no server-side session required)
- Async payment confirmation via push notifications

---

## 2. Comparison with Global Payment Systems

### 2.1 Feature Comparison Table

| Feature | Tikkie (NL) | Venmo (US) | Bizum (ES) | PicPay (BR) |
|---------|-------------|------------|------------|-------------|
| **Launch Year** | 2016 | 2009 | 2016 | 2015 |
| **Primary Model** | Payment Links | Social Wallet | P2P Transfers | Digital Bank |
| **Transaction Speed** | Minutes to Hours | Instant (optional fee) | Instant (seconds) | Instant |
| **Social Component** | No | Yes (public feed) | Minimal | Yes |
| **QR Code Support** | Yes | Yes (limited) | Yes (2025) | Yes |
| **Business Fees** | Yes | ~3% | Varies by bank | Varies |
| **Privacy by Default** | Yes | No (public) | Yes | Yes |
| **Bank Integration** | Deep (iDeal) | None (wallet) | Deep (banking apps) | Limited |
| **Wallet Required** | No | Yes | No (phone number) | Yes |
| **Users (2024)** | ~5M+ | 80M+ | 27.6M | 66M |

### 2.2 Venmo (United States)

**Architecture:**
- Proprietary wallet system (holds user balances)
- Social feed public by default (privacy concerns)
- Instant transfers available for 1% fee (min $0.25, max $10)
- Standard transfers: 1-3 business days (free)
- $2,999.99 weekly limit after verification

**Key Differences from Tikkie:**
- **Wallet-based**: Funds held in Venmo account, not direct bank transfer
- **Social focus**: Public transaction feed creates network effects
- **Higher friction**: Requires Venmo account installation
- **US-only**: Cannot receive international payments

**Revenue Model:**
- 3% fee on credit card payments
- 1% fee on instant transfers to debit cards
- Merchant fees via Braintree integration
- Cryptocurrency trading fees

**Privacy Issues:**
- FTC settlement 2018 over misleading privacy claims
- Public-by-default exposes transaction patterns
- Research shows 2 in 5 users expose sensitive info
- Biden's Venmo account found in <10 minutes (2021)

### 2.3 Bizum (Spain)

**Architecture:**
- Bank-owned consortium (27 Spanish banks)
- Phone number as unique identifier
- Integrated directly into banking apps (no separate app needed)
- Instant P2P transfers (seconds)
- Expanding to e-commerce and institutional payments

**Key Features:**
- No wallet required (direct bank-to-bank)
- €0.50-€1.00 fee for some transactions (varies by bank)
- Expanding to NFC payments (Bizum Pay, 2025)
- Cross-border interoperability planned with Italy/Portugal (2025)

**Adoption:**
- 27.6M active users (2024)
- ~24 transactions per second (2022)
- 63% market penetration in Spain

**Comparison to Tikkie:**
- Similar bank-led model
- Bizum is phone-number based (push), Tikkie is link-based (pull)
- Bizum is faster (instant seconds), Tikkie is async (hours)
- Both use existing banking infrastructure

### 2.4 PicPay (Brazil)

**Architecture:**
- Full digital bank (not just payment system)
- Proprietary wallet with yield (102% of CDI)
- Pix integration (Brazil's instant payment system)
- Credit card, loans, investments

**Key Features:**
- 66M users (largest in Brazil)
- Zero-fee credit card
- Pix via WhatsApp (voice/text)
- "Cofrinho" (savings with automatic yield)
- Account aggregation (connect external bank accounts)

**Revenue Model:**
- Credit card interest/fees
- Loan interest
- Investment management fees
- Merchant fees

**Comparison to Tikkie:**
- PicPay is a **superapp** (bank + payments + social)
- Tikkie is a **focused tool** (payment requests only)
- PicPay uses Pix (instant), Tikkie uses iDeal (batch)
- PicPay requires wallet, Tikkie does not

---

## 3. Mexico Payment Landscape

### 3.1 SPEI (Sistema de Pagos Electrónicos Interbancarios)

**Overview:**
- Mexico's real-time gross settlement (RTGS) system
- Operated by Banco de México (Banxico)
- Launched 2004
- 24/7/365 operation

**Technical Specs:**
- Settlement: Real-time, irrevocable
- Processing time: <10 seconds
- Transaction limits: Varies by participant
- Cost: ~MXN 2-5 per transaction (bank-dependent)

**Use Cases:**
- Large-value corporate payments
- Government disbursements
- Bank-to-bank transfers
- Foundation for CoDi

**Strengths:**
- High reliability (99.99% uptime)
- Real-time settlement
- Widely adopted by banks

**Weaknesses:**
- Not consumer-facing (no mobile app/UX)
- Clabe numbers required (18-digit bank codes)
- No QR code or mobile-first UX

### 3.2 CoDi (Digitalization of Payments)

**Overview:**
- Launched 2019 by Banco de México
- Mobile-first payment system built on SPEI
- QR code + NFC + phone number

**Technical Architecture:**
- Built on SPEI rails
- Uses QR codes (static & dynamic)
- Phone number as identifier (via CoDi alias)
- Mobile app integration

**Transaction Flow:**
1. Payer scans QR or enters phone number
2. Payment request sent to payer's bank
3. Payer authenticates via banking app
4. Funds transferred via SPEI in <10 seconds
5. Confirmation sent to both parties

**Adoption Challenges:**
- **Fragmented implementation**: Each bank has own CoDi app
- **Limited merchant acceptance**: Not universal
- **Consumer awareness**: Low compared to cash
- **No killer app**: No dominant app driving adoption

**Transaction Limits (2024):**
- Up to MXN 5,000 per transaction (varies by bank)
- Daily limits vary by bank

**Costs:**
- Free for consumers (most banks)
- Merchants pay ~MXN 5-10 per transaction

### 3.3 OXXO

**Overview:**
- Cash payment network (not digital)
- 20,000+ convenience stores nationwide
- Critical for cash-dependent population

**Use Cases:**
- Bill payments (utilities, telco, taxes)
- Online purchases (cash on pickup)
- Money transfers
- Load digital wallets

**Integration with Digital:**
- OXXO as cash-in/cash-out point
- Reference number generation for digital payments
- Bridge between digital and cash economies

**Limitations:**
- Not instant (requires physical visit)
- Fees vary (MXN 5-20)
- Operating hours limited (store hours)

### 3.4 Market Dynamics

**Cash Dominance:**
- ~86% of transactions still in cash (2023)
- Informal economy ~50% of GDP
- Credit card penetration: ~30% of adults

**Smartphone Penetration:**
- ~80% mobile penetration
- ~60% smartphone penetration
- Growing rapidly (5-10% YoY)

**Competitive Landscape:**
- **Traditional banks**: BBVA, Banorte, Santander (CoDi apps)
- **Neobanks**: Nu Bank (Brazil), Klar, Albo
- **Superapps**: Mercado Pago, Rappi, Clip (POS)
- **Telcos**: Telcel, Movistar (wallet integrations)

**Regulatory Environment:**
- Banxico promotes CoDi adoption
- Fintech law (2018) enables innovation
- Open banking regulations pending
- Cross-border payments reform in progress

---

## 4. Technical Architecture Recommendations

### 4.1 Hybrid Model: "Tikkie + CoDi"

Mexico's unique position (strong SPEI/CoDi infrastructure + cash dependence) suggests a hybrid approach:

**Proposed Architecture:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PAYMENT REQUEST APP                          │
│                    (Pika Payment Request Layer)                     │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
                ┌───────────────┴───────────────┐
                ↓                               ↓
        ┌───────────────┐               ┌───────────────┐
        │  Link/QR Mode │               │  CoDi Mode    │
        │  (Tikkie-like)│               │  (Bizum-like) │
        └───────────────┘               └───────────────┘
                ↓                               ↓
        ┌───────────────┐               ┌───────────────┐
        │   SPEI +      │               │   CoDi +      │
        │   Reference   │               │   QR/NFC      │
        └───────────────┘               └───────────────┘
                ↓                               ↓
        ┌───────────────┐               ┌───────────────┐
        │  Async        │               │  Instant      │
        │  (Hours)      │               │  (Seconds)    │
        └───────────────┘               └───────────────┘
```

### 4.2 Core Features

**1. Dual-Mode Payment Requests**

**Mode A: Payment Links (Tikkie-style)**
- Generate shareable link via WhatsApp/SMS/email
- QR code for in-person display
- Payment via SPEI using reference number
- Async settlement (current Mexico banking batch)
- No app required for payer (web-based)

**Mode B: CoDi Integration (Bizum-style)**
- Push payment request via phone number
- QR/NFC scan for instant CoDi payment
- Real-time settlement via CoDi
- Requires payer's banking app (CoDi-enabled)

**2. Unified Request Interface**

```typescript
interface PaymentRequest {
  id: string;
  amount: number;
  currency: "MXN";
  description: string;
  expiresAt: Date;
  
  // Requester info
  requester: {
    name: string;
    bankAccount: string; // Clabe or CoDi alias
  };
  
  // Payment modes
  modes: {
    link: {
      url: string;
      qrCode: string;
    };
    codi: {
      phoneNumber: string;
      qrCode: string; // CoDi dynamic QR
    };
  };
  
  // Status
  status: "pending" | "partial" | "paid" | "expired";
  paidAmount: number;
}
```

### 4.3 Technical Stack Recommendations

**Backend:**
- **Language**: Node.js / TypeScript (for rapid iteration)
- **Framework**: Fastify or Express
- **Database**: PostgreSQL (ACID compliance for financial data)
- **Queue**: Redis / Bull (for async payment processing)
- **Cache**: Redis (for rate limiting, session data)

**Bank Integration:**
- **SPEI**: Via STP (Sistema de Transferencias y Pagos) API
- **CoDi**: Via bank-specific APIs or aggregator (Clip, Conekta)
- **Fallback**: Traditional bank transfer via Clabe

**Security:**
- **Authentication**: OAuth 2.0 / OpenID Connect
- **Encryption**: TLS 1.3, AES-256 for data at rest
- **Signature**: JWT for payment requests
- **Compliance**: PCI-DSS (if handling card data), Mexican fintech law

**Mobile SDK:**
- **Flutter / React Native**: Cross-platform
- **Core features**: QR generation/scanning, deep linking, push notifications
- **Bank app integration**: URL schemes for CoDi apps

**Infrastructure:**
- **Cloud**: AWS / GCP (Mexico City region)
- **CDN**: Cloudflare (global edge for payment links)
- **Monitoring**: Datadog / New Relic
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

### 4.4 Data Model (Simplified)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(100) NOT NULL,
  clabe_account VARCHAR(18), -- For SPEI
  codi_alias VARCHAR(20), -- For CoDi
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Requests
CREATE TABLE payment_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment Links (Tikkie-style)
CREATE TABLE payment_links (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES payment_requests(id),
  url_hash VARCHAR(32) UNIQUE NOT NULL,
  qr_code_url TEXT,
  reference_number VARCHAR(32) UNIQUE, -- For SPEI
  created_at TIMESTAMP DEFAULT NOW()
);

-- CoDi Requests (Bizum-style)
CREATE TABLE codi_requests (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES payment_requests(id),
  phone_number VARCHAR(20) NOT NULL,
  qr_code_data TEXT, -- CoDi dynamic QR
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES payment_requests(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(20), -- 'spei', 'codi', 'oxxo'
  spei_trace VARCHAR(32),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.5 API Design (RESTful)

**Create Payment Request**
```
POST /api/v1/requests
{
  "amount": 150.00,
  "description": "Share of dinner",
  "modes": ["link", "codi"],
  "expiresInHours": 24
}

Response:
{
  "id": "req_123abc",
  "link": {
    "url": "https://pika.mx/pay/xyz123",
    "qrCode": "https://pika.mx/qr/xyz123.png"
  },
  "codi": {
    "phoneNumber": "+525512345678",
    "qrCode": "codi://..."
  },
  "expiresAt": "2025-02-06T20:24:00Z"
}
```

**Check Payment Status**
```
GET /api/v1/requests/{id}/status

Response:
{
  "id": "req_123abc",
  "status": "partial",
  "amount": 150.00,
  "paidAmount": 75.00,
  "payments": [
    {
      "amount": 75.00,
      "method": "spei",
      "at": "2025-02-05T18:00:00Z"
    }
  ]
}
```

**Webhook Callback (Bank Integration)**
```
POST /api/v1/webhooks/spei
{
  "reference": "REF123",
  "amount": 75.00,
  "speiTrace": "STP20250205...",
  "payerAccount": "123456789012345678"
}
```

### 4.6 UX Recommendations

**For Requester (Person asking for money):**
1. Simple amount input + description
2. Choose payment modes (Link, CoDi, or both)
3. Share via WhatsApp/SMS/copy link
4. Track payments in real-time
5. Cash out to linked bank account

**For Payer (Person sending money):**
1. **Link mode**: Open link → Select bank → Pay via SPEI/CoDi
2. **CoDi mode**: Scan QR → Confirm in banking app → Done
3. No account creation required
4. Receipt via SMS/email

**In-Person Flow:**
1. Requester shows QR on phone screen
2. Payer scans with banking app (CoDi) or camera (link)
3. Payment completes
4. Both parties get confirmation

### 4.7 Monetization Strategy

**Phase 1: Free (Growth)**
- Free for personal transactions (< MXN 5,000/month)
- Focus on user acquisition

**Phase 2: Freemium**
- Business accounts: MXN 5-10 per transaction
- Premium features: bulk requests, API access, branding
- Instant withdrawal fee (MXN 10)

**Phase 3: Ecosystem**
- Merchant services (POS integration, e-commerce plugin)
- B2B invoicing platform
- Cross-border payments (US-Mexico remittances)
- Credit products (BNPL for large requests)

### 4.8 Launch Strategy

**Target Market:**
- **Primary**: Millennials/Gen Z (18-35) in urban areas
- **Secondary**: Freelancers, small businesses, gig workers
- **Tertiary**: Tourism (visitors from US/Europe)

**Distribution Channels:**
- WhatsApp integration (viral sharing)
- Partnership with neobanks (Albo, Klar, Nu)
- Social media campaigns (TikTok, Instagram)
- Merchant onboarding (restaurants, events, tours)

**Regulatory Considerations:**
- Register as SOFOM / Sofipo (if holding funds)
- Payment service provider license (if processing)
- Data protection (Mexico's federal data protection law)
- AML/KYC compliance

---

## 5. Key Takeaways

1. **Tikkie's success** comes from simplicity (no wallet, bank integration) and frictionless sharing (WhatsApp/QR)
2. **Mexico has the infrastructure** (SPEI/CoDi) but lacks the **consumer-facing UX layer**
3. **Hybrid model recommended**: Async payment links (like Tikkie) + Instant CoDi (like Bizum)
4. **Privacy matters**: Learn from Venmo's mistakes (private by default)
5. **Bank partnership is critical**: Don't build a wallet, build a **layer on top of existing banking**
6. **QR codes are the bridge**: Works for both digital (link) and physical (in-person) use cases
7. **WhatsApp is Mexico's social graph**: Integrate deeply for viral growth

---

## 6. Next Steps

1. **Technical feasibility study** with STP/Banxico for SPEI integration
2. **Bank partnership discussions** (BBVA, Banorte, or neobanks)
3. **User research** on payment preferences (urban Mexico)
4. **MVP specification**: Link-only mode (simpler, faster to market)
5. **Regulatory pathway**: Determine licensing requirements
6. **Competitive analysis**: Deep dive into Clip, Mercado Pago, CoDi adoption

---

## Appendix: References

- Tikkie Wikipedia / ABN AMRO documentation
- Venmo Wikipedia / FTC settlement documents
- Bizum Wikipedia / Spanish banking consortium
- PicPay website / Brazilian fintech reports
- SPEI / CoDi documentation (Banxico)
- Mexico payment landscape reports (2023-2024)

---

*This report should be reviewed with Opus 4.6 for validation of technical assumptions and Mexico-specific market insights.*
