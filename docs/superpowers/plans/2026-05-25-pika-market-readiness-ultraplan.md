# Pika Market Readiness UltraPlan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or executing-plans to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Turn Pika from a deployed backend + mocked frontend prototype into a credible Mexico-ready payment request product that can safely onboard pilot users.

**Architecture:** Stabilize the core ledger/backend first, connect the frontend to real APIs, add compliance/KYC/risk controls, then launch a constrained pilot around payment requests and QR links before expanding into stored wallet/balance products.

**Tech Stack:** Express, Node.js, PostgreSQL, Prisma schema currently present but runtime models use raw pg SQL, Redis, React/Vite/TypeScript, Zustand, Tailwind/shadcn, Coolify.

---

## Current Verified State

- Repo: `/opt/data/pika`
- Branch: `main`
- Git pull: already up to date at `e110422 fix: make Redis health checks idempotent`
- Backend deployment: healthy at `http://isw6kd7ljtiew2p41enfegtz.45.132.242.102.sslip.io/health`
- Health response: `database=connected`, `redis=connected`, `version=1.0.0`
- Backend tests: blocked because `jest` is referenced but not installed
- Frontend build: blocked because dependencies are not installed in `frontend/node_modules`; current build reports missing `react`, `react-router-dom`, `lucide-react`, etc.
- Frontend product state: largely mock/local state; `frontend/src/lib/api.ts`, login/register, wallet, transactions, contacts, and QR flows simulate data instead of calling the backend.

---

## Phase 0: Repo Hygiene and Build Truth

### Task 0.1: Make local checks deterministic

**Files:**
- Modify: `backend/package.json`
- Modify: `frontend/package.json`
- Create: `Makefile` or `scripts/check-all.sh`

- [ ] Add missing backend test dependencies or remove the fake `test` script until tests exist.
- [ ] Run `npm ci` in `backend` and `frontend` from clean lockfiles.
- [ ] Add one command that runs backend syntax, backend tests, frontend typecheck, frontend build.
- [ ] Gate every deploy on this command.

### Task 0.2: Resolve schema/runtime mismatch

**Files:**
- Audit: `backend/prisma/schema.prisma`
- Audit: `backend/src/models/*.js`
- Audit: live database tables

- [ ] Decide one ORM layer: Prisma Client or raw `pg`, not both half-used.
- [ ] Make DB column names match the runtime model code. Current code uses snake_case fields such as `full_name`, `is_verified`, `password_hash`; Prisma schema uses camelCase fields such as `name`, `emailVerified` in places.
- [ ] Replace startup `prisma db push --accept-data-loss` with controlled migrations before any real money data exists.
- [ ] Add a migration smoke test against an empty database.

---

## Phase 1: Marketable MVP Scope

### Task 1.1: Narrow launch promise

**Decision:** Do not launch as a generic stored-wallet fintech yet. Launch as:

> “Payment links and QR payment requests for Mexico, optimized for WhatsApp sharing and SPEI/CoDi collection.”

**Why:** Full wallet custody, P2P balances, withdrawals, card rails, and merchant processing create regulatory/compliance load. Payment-request orchestration is a safer pilot wedge.

### Task 1.2: Freeze MVP feature set

**MVP must include:**
- User registration/login with real API calls.
- Merchant profile and verified contact info.
- Create payment request link.
- Share via WhatsApp/copy/QR.
- Payer landing page for a request.
- SPEI/CoDi provider integration or explicit sandbox mode.
- Webhook-driven status updates.
- Transaction history and receipts.
- Admin/risk dashboard.

**Explicitly defer:**
- Consumer stored balances.
- Internal wallet-to-wallet transfers.
- Cashback/rewards.
- Virtual cards.
- International remittance.
- Public claims around PCI DSS/compliance until verified by counsel/auditors.

---

## Phase 2: Backend Hardening

### Task 2.1: Fix money movement direction and ledger semantics

**Files:**
- Modify: `backend/src/routes/payments.js`
- Modify: `backend/src/routes/wallet.js`
- Modify: `backend/src/models/Wallet.js`
- Modify: `backend/src/models/Transaction.js`

- [ ] Review `POST /api/payments/pay/:referenceCode`; it currently transfers from `paymentLink.wallet_id` to payer wallet in code, which appears directionally wrong for a payer paying a payee.
- [ ] Model every movement as double-entry ledger entries, not only wallet balance updates.
- [ ] Store amounts as integer centavos everywhere; remove float parsing from money paths.
- [ ] Add invariant tests: total debits = total credits, no negative balance unless explicitly allowed, idempotent replay returns the same ledger result.

### Task 2.2: Build real idempotency and concurrency tests

**Files:**
- Modify: `backend/src/middleware/idempotency.js`
- Modify: `backend/src/utils/transaction.js`
- Create: `backend/tests/payments.idempotency.test.js`
- Create: `backend/tests/wallet.concurrency.test.js`

- [ ] Test duplicate idempotency key replay.
- [ ] Test two simultaneous payments against one wallet.
- [ ] Test webhook replay.
- [ ] Test timeout/retry after provider callback.

### Task 2.3: Replace placeholder SPEI/CoDi with a real provider adapter

**Files:**
- Modify: `backend/src/utils/stipago.js`
- Modify: `backend/src/routes/webhooks.js`
- Modify: `backend/src/routes/payments.js`

- [ ] Confirm provider: STiPago, bank API, or a Mexican payments aggregator.
- [ ] Implement a strict adapter interface: create order, fetch status, parse webhook, verify signature.
- [ ] Add sandbox fixtures and contract tests.
- [ ] Store provider event IDs for replay protection.
- [ ] Never mark a payment completed from client-side confirmation; only webhook/provider reconciliation can complete it.

### Task 2.4: Make auth launch-grade

**Files:**
- Modify: `backend/src/routes/auth.js`
- Modify: `backend/src/middleware/auth.js`
- Modify: `backend/src/middleware/validation.js`

- [ ] Add refresh tokens/session rotation.
- [ ] Shorten access token TTL.
- [ ] Enforce email/phone verification before payment collection.
- [ ] Add password reset and account recovery.
- [ ] Add failed-login throttling and lockout.
- [ ] Remove any default fallback secrets such as `change-me-in-production` patterns.

### Task 2.5: Add KYC/KYB and risk controls

**Files:**
- Create: `backend/src/routes/kyc.js`
- Create: `backend/src/models/KycCase.js`
- Create: `backend/src/models/RiskRule.js`
- Modify: `backend/prisma/schema.prisma` or migration SQL

- [ ] Capture CPF/RFC/business profile depending on user type.
- [ ] Add KYC status: unverified, pending, verified, rejected, restricted.
- [ ] Enforce transaction limits by KYC tier.
- [ ] Add sanctions/PEP/provider screening hooks.
- [ ] Add suspicious activity flags: velocity, amount, device/IP, repeated failed payments.

### Task 2.6: Observability and incident readiness

**Files:**
- Modify: `backend/src/server.js`
- Create: `backend/src/utils/logger.js`
- Create: `backend/src/routes/admin.js`

- [ ] Add structured JSON logs with request IDs.
- [ ] Add `/ready` and `/live` separate from `/health`.
- [ ] Add Sentry/OpenTelemetry.
- [ ] Add audit log table for payment/auth/admin events.
- [ ] Add admin-only payment/event replay tooling.

---

## Phase 3: Frontend Productization

### Task 3.1: Remove mock API layer

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/store/index.ts`
- Modify: `frontend/src/components/auth/LoginPage.tsx`
- Modify: `frontend/src/components/auth/RegisterPage.tsx`

- [ ] Restore `VITE_API_URL` and implement a real fetch client.
- [ ] Store token securely enough for web MVP; prefer httpOnly session cookie if backend supports it.
- [ ] Wire login/register to `/api/auth/login` and `/api/auth/register`.
- [ ] Wire wallet/payment/transaction pages to real API endpoints.
- [ ] Delete or quarantine `frontend/src/lib/mock-data.ts` from production routes.

### Task 3.2: Mexico-first UX

**Files:**
- Modify: all `frontend/src/components/**/*.tsx`
- Modify: `frontend/src/lib/mock-data.ts` if retained only for story/demo mode

- [ ] Convert default currency from USD to MXN.
- [ ] Convert user-facing copy from English to Spanish-first es-MX.
- [ ] Use Mexican phone formats and CLABE/RFC labels.
- [ ] Add WhatsApp-first sharing CTA for payment links.
- [ ] Add explicit trust copy: “No guardamos datos de tarjeta” only if true.

### Task 3.3: Build payer flow outside authenticated dashboard

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/pages/PayLinkPage.tsx`
- Modify: `backend/src/routes/payments.js` as needed

- [ ] Add public route `/pay/:referenceCode`.
- [ ] Show amount, merchant/requester, concept, expiry, and status.
- [ ] Let payer choose SPEI/CoDi/payment method.
- [ ] Poll or subscribe to payment status after provider redirect/webhook.
- [ ] Generate receipt view after confirmed provider event.

### Task 3.4: Mobile PWA polish

**Files:**
- Create/modify: PWA manifest, icons, service worker strategy
- Modify: dashboard/payment/QR pages

- [ ] Make the core create/share/pay flow excellent on mobile.
- [ ] Add installable PWA shell.
- [ ] Add camera permission UX for QR scanner.
- [ ] Add offline-safe pending states, not offline money movement.

---

## Phase 4: Compliance, Legal, and Trust

### Task 4.1: Regulatory path

**Action items:**
- [ ] Decide whether Pika touches/custodies funds. If yes, treat as fintech-regulated and get Mexican legal counsel immediately.
- [ ] If no custody, structure as payment request/order orchestration with provider-held funds.
- [ ] Draft Terms, Privacy, AML/KYC policy, chargeback/refund policy, complaint path.
- [ ] Define data retention and deletion policies.

### Task 4.2: Security baseline before pilots

**Action items:**
- [ ] Dependency scanning in CI.
- [ ] Secret scanning in CI.
- [ ] OWASP API checklist.
- [ ] External pentest before broad launch.
- [ ] Backups + restore drill.
- [ ] Incident response runbook.

---

## Phase 5: Pilot GTM

### Task 5.1: Pick a wedge segment

Recommended first wedge:
- WhatsApp-native micro-merchants, freelancers, clinics, personal trainers, classes, local services.

Why:
- They already request payments manually.
- They value simple links/QR more than complex financial features.
- They can tolerate a provider-backed collection flow if it is easy.

### Task 5.2: Launch metrics

Track:
- Registration started/completed.
- KYC started/completed/rejected.
- First payment link created.
- First link shared via WhatsApp.
- Payer opened link.
- Payment initiated.
- Payment confirmed by provider webhook.
- Merchant viewed receipt/history.
- 7-day repeat merchant usage.

### Task 5.3: Monetization test

Start with one of:
- Flat monthly merchant plan for payment links + receipts.
- Small successful-collection fee, if provider economics support it.
- Free personal use, paid business tooling.

Do not monetize consumer P2P before trust/liquidity exists.

---

## Phase 6: Execution Order

### Week 1: Make it real and buildable
- [ ] Fix frontend dependency/build state.
- [ ] Install backend test runner and add first auth/payment tests.
- [ ] Wire frontend auth to backend.
- [ ] Remove production mock data.
- [ ] Verify deployed backend + frontend against real API.

### Week 2: Payment request core
- [ ] Implement real create-payment-link API usage.
- [ ] Build public payer page.
- [ ] Add provider sandbox adapter.
- [ ] Add webhook verification and reconciliation tests.
- [ ] Add idempotency/concurrency tests.

### Week 3: Trust and compliance shell
- [ ] KYC/KYB status model.
- [ ] Transaction limits by verification tier.
- [ ] Audit log.
- [ ] Admin/risk review page.
- [ ] Spanish MX copy and legal doc placeholders reviewed by counsel.

### Week 4: Pilot launch
- [ ] Onboard 5-10 pilot merchants manually.
- [ ] Instrument funnel events.
- [ ] Add support channel and incident runbook.
- [ ] Monitor payment success/failure reasons daily.
- [ ] Iterate around the top 3 observed friction points.

---

## Definition of Market Ready

Pika is market-ready only when:

- A new merchant can register, verify, create a payment request, share it on WhatsApp, and see a provider-confirmed payment status without developer intervention.
- Frontend uses real backend APIs, not mock data.
- Payment completion is webhook/provider-driven, not optimistic client state.
- Ledger invariants are covered by automated tests.
- KYC/risk/limits exist and are enforced.
- Logs, audit trail, backups, and incident response are in place.
- Legal/compliance posture is explicit and reviewed.
- Pilot metrics prove repeat usage from real merchants.
