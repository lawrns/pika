# Pika Build Spec — VPS Backend + Appwrite Database

This is the implementation specification for building Pika as a consumer payment-request product using a VPS-hosted backend and Appwrite as the primary application database/auth layer.

The spec is written for an IDE agent. It defines what to build, what not to build, and how to preserve the launch architecture: orchestration-only, no stored customer balances, no Pika wallet.

## 1. Product summary

Build Pika as a WhatsApp-native payment request layer for Mexico.

A requester creates a payment request, shares it through WhatsApp as a link or QR, and tracks status. A payer opens a lightweight web page, sees who is requesting money, the amount, and the concept, then pays through a partner rail / bank / DiMo / SPEI flow. Pika tracks the request lifecycle and confirmation, but does not hold customer funds.

## 2. Non-negotiable product rules

1. The payer must not be forced to install an app.
2. Pika must not hold customer balances in the launch version.
3. Pika must not be described as a wallet in consumer UI.
4. Every request must clearly show requester, amount, concept, and status.
5. WhatsApp sharing is primary; QR and copy-link are secondary.
6. Activation means a requester created a first request that got paid, not signup.
7. The backend must abstract the payment partner so a future provider switch does not require product rewrites.

## 3. Recommended architecture

Frontend:
- Next.js or Vite React for public web, payer pages, and requester dashboard.
- Mobile-first PWA-ready UI.
- Optional native app later; do not block MVP on native apps.

Backend:
- Node.js 20.
- Express or Fastify API on a VPS.
- TypeScript preferred.
- Appwrite Node SDK for database/auth/storage operations.
- Redis recommended for queues, session support, and rate limiting.

Database/platform:
- Appwrite for Auth, Databases, Storage, and optional Functions.
- Appwrite Database stores product state.
- Backend remains the authority for payment lifecycle mutations.
- Client must never directly update payment status.

Infrastructure:
- Ubuntu VPS.
- Docker Compose.
- Nginx reverse proxy.
- TLS via Certbot or Cloudflare.
- Appwrite can be managed cloud or self-hosted; managed is simpler for MVP.

## 4. System diagram

```text
Browser / PWA
  |
  | HTTPS
  v
Nginx on VPS
  |
  +--> Frontend app
  |
  +--> Node API backend
          |
          +--> Appwrite: Auth + Database + Storage
          +--> Redis: queues and rate limits
          +--> Payment Partner Adapter
          +--> WhatsApp share/message provider
```

## 5. Appwrite project setup

Create one project per environment:
- pika-dev
- pika-staging
- pika-production

Use separate API keys per environment.

Required Appwrite products:
- Auth: phone OTP or email magic link, depending on what is available in the current setup.
- Databases: core product collections.
- Storage: generated QR images, receipt files, and optional user avatars.

Backend service role logic should perform all sensitive writes. The browser should only read safe public request data and authenticated user-owned data.

## 6. Core collections

Database ID: `pika_main`.

### users

Fields:
- userId: string, unique, maps to Appwrite Auth user id.
- phone: string, indexed.
- email: string, optional indexed.
- displayName: string.
- avatarUrl: string optional.
- status: active, blocked, pending_review.
- kycLevel: none, light, full.
- createdAt, updatedAt.

### receiving_accounts

Purpose: stores masked/tokenized requester destinations. Do not expose raw identifiers to the client.

Fields:
- userId.
- accountType: dimo_phone, clabe, partner_virtual_account.
- maskedIdentifier.
- encryptedIdentifier or provider token.
- providerRef.
- isDefault.
- verificationStatus: unverified, pending, verified, failed.
- createdAt, updatedAt.

### payment_requests

Fields:
- requestId: unique public-safe id.
- requesterUserId.
- amountCents.
- currency: MXN.
- concept.
- note.
- status: draft, pending, paid, partial, expired, cancelled, failed, disputed.
- payerMode: single or split.
- expectedPayers.
- paidAmountCents.
- publicSlug: unique.
- qrAssetId.
- expiresAt.
- createdAt, updatedAt.

### request_recipients

Fields:
- requestId.
- recipientPhone.
- recipientName.
- amountCents.
- status: pending, paid, failed, expired, muted.
- paymentId.
- lastReminderAt.
- createdAt, updatedAt.

### payments

Fields:
- paymentId.
- requestId.
- recipientId.
- payerUserId.
- payerPhoneMasked.
- amountCents.
- currency: MXN.
- method: spei, dimo, codi, partner_collection, manual_test.
- status: created, redirected, pending, confirmed, failed, reversed, disputed.
- provider.
- providerPaymentRef.
- providerTrace.
- receiptUrl.
- failureCode.
- failureMessage.
- createdAt, confirmedAt, updatedAt.

### ledger_events

Append-only audit events for state transitions.

Fields:
- eventId.
- entityType: request, payment, recipient, account, webhook.
- entityId.
- eventType.
- amountCents.
- currency.
- previousStatus.
- nextStatus.
- metadataJson.
- createdBy: system, user, provider, admin.
- createdAt.

### webhook_events

Purpose: idempotent processing of provider callbacks.

Fields:
- webhookId.
- provider.
- eventType.
- providerEventId.
- signatureValid.
- processingStatus: received, processed, ignored, failed.
- payloadHash.
- errorMessage.
- receivedAt, processedAt.

### share_events

Growth-loop analytics.

Fields:
- shareId.
- requestId.
- channel: whatsapp, copy_link, qr, sms, email, telegram.
- recipientCount.
- source: request_created, reminder, confirmation, manual.
- createdAt.

### fraud_signals

Basic risk and abuse monitoring.

Fields:
- signalId.
- userId.
- requestId.
- paymentId.
- signalType.
- severity: low, medium, high, critical.
- metadataJson.
- resolved.
- createdAt.

## 7. Required API surface

Base path: `/api/v1`.

Health:
- GET `/health`

Auth/profile:
- GET `/me`
- PATCH `/me`

Receiving accounts:
- POST `/receiving-accounts`
- GET `/receiving-accounts`
- PATCH `/receiving-accounts/:id/default`

Requests:
- POST `/requests`
- GET `/requests`
- GET `/requests/:requestId`
- PATCH `/requests/:requestId/cancel`
- POST `/requests/:requestId/reminders`

Public payer flow:
- GET `/public/requests/:publicSlug`
- POST `/public/requests/:publicSlug/pay`

Webhooks:
- POST `/webhooks/:provider`

QR:
- GET `/requests/:requestId/qr`
- GET `/public/requests/:publicSlug/qr`

## 8. Public payer page response

Public request data must be safe and minimal.

```json
{
  "publicSlug": "r_abc123",
  "requesterName": "Laurence",
  "requesterVerified": true,
  "amountCents": 48000,
  "currency": "MXN",
  "concept": "Cena Contramar",
  "status": "pending",
  "expiresAt": "2026-05-30T18:00:00.000Z"
}
```

Never expose raw account identifiers, internal provider references, full phone numbers, or internal risk data on the public payer endpoint.

## 9. Payment provider adapter

Create a strict adapter layer so the MVP can use a mock provider and later swap to a real partner provider.

```ts
export interface PaymentProviderAdapter {
  providerName: string;

  createPaymentIntent(input: {
    requestId: string;
    paymentId: string;
    amountCents: number;
    currency: 'MXN';
    concept: string;
    requester: {
      displayName: string;
      receivingAccountRef: string;
    };
    returnUrl: string;
    webhookUrl: string;
  }): Promise<{
    providerPaymentRef: string;
    redirectUrl?: string;
    deepLinkUrl?: string;
    qrPayload?: string;
    expiresAt?: string;
  }>;

  verifyWebhook(input: {
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer;
  }): Promise<{
    valid: boolean;
    providerEventId?: string;
    eventType?: string;
    normalized?: NormalizedPaymentEvent;
  }>;

  getPaymentStatus(providerPaymentRef: string): Promise<NormalizedPaymentStatus>;
}
```

## 10. Required frontend pages

### `/`

Marketing landing page using the brand guidelines.

Sections:
- Hero with logo, headline, subtitle, CTA.
- How it works: create request, share, get paid.
- Use cases: dinner, rent, trips, gifts, clubs.
- Trust: pay from your bank, no Pika wallet, clear receipts.
- Final CTA.

Hero copy:
- H1: `Envía tu pago con Pika`
- Subtitle: `La forma más fácil de pagarle a tus amigos al instante.`
- Primary CTA: `Haz un pago`
- Secondary CTA: `Regístrate`

### `/app`

Requester dashboard. Auth required.

Widgets:
- Create request button.
- Active pending requests.
- Paid requests.
- Activation checklist.
- Share/reminder buttons.

### `/app/requests/new`

Create request flow with amount, concept, optional note, and expiration.

After creation show:
- Public link.
- WhatsApp share button.
- QR code.
- Copy link.

### `/p/[slug]`

Public payer page.

Above fold:
- Requester identity.
- Amount.
- Concept.
- CTA: `Pagar ahora`.
- Trust note: `Pagas desde tu banco. Pika no guarda tu dinero.`

States:
- Pending.
- Paid.
- Expired.
- Failed.
- Confirming.

### `/paid/:paymentId`

Confirmation page.

Copy:
- `Listo. Tu pago fue enviado.`
- Show amount, concept, timestamp, and receipt if available.
- Secondary CTA: `Crea tu propio Pika`.

## 11. Component inventory

Create reusable components:
- PikaLogo
- PikaButton
- PikaCard
- AmountDisplay
- PaymentStatusPill
- RequestCard
- QRCodeBlock
- WhatsAppShareButton
- TrustNote
- PhoneMockup
- ConfettiField
- RequesterIdentity
- PaymentTimeline
- EmptyState
- ErrorState

## 12. WhatsApp share format

Default message:

```text
Te mandé un Pika por {{amount}} para {{concept}}.
Págalo aquí: {{publicUrl}}
```

Alternative casual:

```text
Mándame tu parte por Pika: {{publicUrl}}
{{amount}} · {{concept}}
```

Do not include sensitive account details in WhatsApp messages.

## 13. Security and trust requirements

- Use HTTPS everywhere.
- Verify provider callbacks before changing payment state.
- Use idempotency keys for payment creation.
- Rate limit public payment endpoints by IP and request slug.
- Rate limit reminder endpoints by user and request.
- Store only masked/tokenized receiving account data for client reads.
- Never log full account identifiers, OTPs, service keys, or provider secrets.
- Use append-only ledger events for all status changes.
- Add admin/manual mutation endpoints only behind strict internal authorization.

## 14. MVP fraud controls

Implement minimum controls:
- New requester daily request count limit.
- New requester daily amount limit.
- Repeated identical requests at high velocity should be slowed or reviewed.
- Mark unusual spikes as `pending_review`.
- Public report link: `Reportar este Pika`.
- Recipient mute option for reminders.

## 15. Observability

Required logs and metrics:
- Request created.
- Share event created.
- Payment attempt created.
- Provider redirect returned.
- Provider callback received.
- Payment status transition.
- Request aggregate status transition.
- Reminder sent.
- Weekly paid requests.
- Payers per request.
- Payer-to-requester conversion.
- Payment confirmation latency.
- Payment failure rate.

## 16. Docker Compose baseline

```yaml
services:
  api:
    build: ./backend
    env_file: ./backend/.env
    ports:
      - "8080:8080"
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  redis_data:
```

Adjust this if using Next.js server mode instead of static export.

## 17. Milestones

### Milestone 1 — brand landing page

Deliver:
- Brand tokens.
- Hero from visual reference.
- Responsive landing page.
- CTA routing.
- Static decorative system.

Acceptance:
- Looks recognizably like Pika reference.
- Mobile 390 px viewport works.
- Primary CTA visible above fold.

### Milestone 2 — Appwrite setup

Deliver:
- Appwrite collections created.
- Permissions configured.
- Backend Appwrite service client.
- User profile creation on signup.

Acceptance:
- User can sign up/log in.
- User profile stored.
- Client cannot write payment status.

### Milestone 3 — request creation

Deliver:
- Create request API.
- App dashboard.
- New request form.
- Public slug generation.
- QR generation.
- WhatsApp share URL.

Acceptance:
- Authenticated user can create a request.
- Link opens public payer page.
- Share event is logged.

### Milestone 4 — mock payment provider

Deliver:
- Payment adapter interface.
- Mock provider.
- Public pay endpoint.
- Dev-only payment confirmation simulation.
- Paid confirmation page.

Acceptance:
- Payer can click pay and complete mock flow.
- Payment status updates through backend only.
- Ledger event written for each transition.

### Milestone 5 — production hardening

Deliver:
- Rate limiting.
- Verified provider callback handling.
- Error states.
- Fraud signals.
- Docker deployment.
- Health checks.
- Monitoring.

Acceptance:
- VPS deployment works behind HTTPS.
- Duplicate provider callbacks are idempotent.
- Sensitive identifiers are masked/tokenized.

## 18. Suggested file structure

```text
/frontend
  /src
    /components/pika
    /styles/tokens.css
    /lib/api.ts
    /lib/format.ts

/backend
  /src
    server.ts
    app.ts
    /config/env.ts
    /lib/appwrite.ts
    /lib/crypto.ts
    /lib/id.ts
    /middleware/auth.ts
    /middleware/rateLimit.ts
    /modules/users
    /modules/receivingAccounts
    /modules/requests
    /modules/payments
    /modules/webhooks
    /modules/shareEvents
    /providers/payments
      PaymentProviderAdapter.ts
      MockPaymentProvider.ts
    /providers/whatsapp
      whatsappShare.ts

/infra
  nginx.conf
  docker-compose.yml
```

## 19. IDE agent prompt

```text
You are working in the Pika codebase. Build the MVP according to docs/brand/PIKA_BRAND_GUIDELINES.md and docs/specs/PIKA_BUILD_SPEC_VPS_APPWRITE.md.

Goal: implement a mobile-first Pika payment-request product using a VPS-hosted Node backend and Appwrite for auth/database/storage. Pika is orchestration-only at launch and must not hold customer balances or present itself as a wallet.

Start by auditing the existing repo structure. Preserve existing backend work where useful. Create the smallest coherent implementation that supports:
1. branded landing page matching the Pika visual direction,
2. user auth/profile integration with Appwrite,
3. request creation,
4. public payer page,
5. WhatsApp share link,
6. QR generation,
7. mock payment provider adapter,
8. backend-driven status updates,
9. append-only ledger events,
10. Docker/VPS deployment baseline.

Implement clean environment variable handling. Do not expose server secrets to the frontend. Do not allow the client to mutate payment statuses directly. Use backend service logic for all payment lifecycle transitions.

After implementation, run lint/typecheck/tests if available. If tests do not exist, add basic API and utility tests for request creation, slug generation, payment status transitions, and idempotency. Document remaining integration TODOs for the real SPEI/DiMo/BaaS provider.
```

## 20. Do not build yet

Do not build in MVP unless explicitly requested:
- Pika wallet balance.
- Stored-value account.
- Cashback.
- Credit.
- Virtual cards.
- Public social feed.
- Crypto.
- Complex KYC beyond basic tiered placeholders.
- Direct Banxico participant integration.
- Native mobile app if web/PWA is not complete.

## 21. Compliance note

Keep launch orchestration-only. The moment Pika holds balances, offers a wallet, or intermediates funds on its own book, the product enters a different regulatory posture. Make that a deliberate future phase, not an accidental implementation detail.
