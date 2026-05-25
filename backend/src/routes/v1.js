import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../lib/appwrite.js';
import { authenticateToken } from '../middleware/auth.js';
import { DemoSpeiProvider } from '../providers/payments/DemoSpeiProvider.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const db = getDatabase();
const paymentProvider = new DemoSpeiProvider();

const now = () => new Date().toISOString();
const money = (value) => Number.parseInt(value, 10);
const mask = (value = '') => (String(value).length > 4 ? `${'•'.repeat(Math.max(0, String(value).length - 4))}${String(value).slice(-4)}` : String(value));
const userName = (user) => user?.full_name || user?.name || user?.email || 'Pika merchant';
const publicBaseUrl = (req) => process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

async function list(collectionId) {
  const { documents } = await db.listDocuments(collectionId);
  return documents || [];
}

async function findOne(collectionId, predicate) {
  return (await list(collectionId)).find(predicate);
}

async function createEvent(requestId, type, actor, metadata = {}) {
  return db.createDocument('request_events', 'unique()', {
    eventId: `evt_${uuidv4()}`,
    requestId,
    type,
    actor: actor || 'system',
    metadataJson: JSON.stringify(metadata),
    createdAt: now()
  });
}

async function logLedgerEvent(entityType, entityId, eventType, amountCents, prevStatus, nextStatus, metadata = {}) {
  try {
    await db.createDocument('ledger_events', 'unique()', {
      entityType,
      entityId,
      eventType,
      amountCents: Number(amountCents || 0),
      currency: 'MXN',
      previousStatus: prevStatus || 'none',
      nextStatus: nextStatus || 'none',
      metadataJson: JSON.stringify(metadata),
      createdBy: metadata.actor || 'system',
      createdAt: now()
    });
  } catch (err) {
    console.error('Failed to write ledger event', err);
  }
}

function receiptFor(payment, request) {
  return {
    receiptId: `rcpt_${payment.paymentId}`,
    paymentId: payment.paymentId,
    requestId: request?.requestId || payment.requestId,
    amountCents: payment.amountCents,
    currency: payment.currency || 'MXN',
    concept: request?.concept || payment.concept || 'Pika payment',
    status: payment.status,
    provider: payment.provider,
    providerPaymentRef: payment.providerPaymentRef,
    traceId: payment.providerTrace || payment.traceId || null,
    paidAt: payment.confirmedAt || payment.createdAt || payment.updatedAt || now(),
    requesterName: request?.requesterName || 'Pika merchant'
  };
}

function requireOwner(request, userId, res) {
  if (!request) {
    res.status(404).json({ error: 'Payment request not found' });
    return false;
  }
  if (request.requesterUserId !== userId) {
    res.status(403).json({ error: 'Not allowed for this payment request' });
    return false;
  }
  return true;
}

// ── HEALTH ──
router.get('/health', async (_req, res) => {
  res.json({ status: 'healthy', timestamp: now(), database: db.isMock ? 'mock-inmemory' : 'appwrite-connected', version: '1.1.0' });
});

// ── PROFILE/ME ──
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    id: req.user.id,
    phone: req.user.phone,
    email: req.user.email,
    displayName: userName(req.user),
    status: 'active',
    kycLevel: req.user.is_verified ? 'verified' : 'light'
  });
});

router.patch('/me', authenticateToken, async (req, res) => {
  res.json({
    id: req.user.id,
    phone: req.body.phone || req.user.phone,
    email: req.user.email,
    displayName: req.body.displayName || userName(req.user),
    status: 'active',
    kycLevel: req.user.is_verified ? 'verified' : 'light'
  });
});

// ── RECEIVING ACCOUNTS ──
router.post('/receiving-accounts', authenticateToken, async (req, res) => {
  try {
    const { accountType, identifier } = req.body;
    if (!accountType || !identifier) return res.status(400).json({ error: 'accountType and identifier are required' });

    const account = await db.createDocument('receiving_accounts', 'unique()', {
      accountId: `acct_${uuidv4()}`,
      userId: req.user.id,
      accountType,
      maskedIdentifier: mask(identifier),
      encryptedIdentifier: crypto.createHash('sha256').update(String(identifier)).digest('hex'),
      providerRef: `prov_${uuidv4()}`,
      isDefault: true,
      verificationStatus: 'verified',
      createdAt: now()
    });

    await logLedgerEvent('account', account.$id, 'ACCOUNT_CREATED', 0, 'none', 'verified', { actor: req.user.id });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receiving-accounts', authenticateToken, async (req, res) => {
  try {
    res.json((await list('receiving_accounts')).filter((account) => account.userId === req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CONTACTS ──
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    res.json((await list('contacts')).filter((contact) => contact.userId === req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/contacts', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, alias } = req.body;
    if (!name || (!phone && !email)) return res.status(400).json({ error: 'name and phone or email are required' });
    const contact = await db.createDocument('contacts', 'unique()', {
      contactId: `ctc_${uuidv4()}`,
      userId: req.user.id,
      name,
      phone: phone || null,
      email: email || null,
      alias: alias || null,
      createdAt: now(),
      updatedAt: now()
    });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REQUESTS (COBROS) ──
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const amountCents = money(req.body.amountCents);
    const { concept, note, contactId } = req.body;
    if (!amountCents || amountCents <= 0 || !concept) return res.status(400).json({ error: 'amountCents and concept are required' });

    const requestId = `req_${uuidv4()}`;
    const publicSlug = `pika-${crypto.randomBytes(4).toString('hex')}`;
    const request = await db.createDocument('payment_requests', 'unique()', {
      requestId,
      requesterUserId: req.user.id,
      requesterName: userName(req.user),
      contactId: contactId || null,
      amountCents,
      currency: 'MXN',
      concept,
      note: note || '',
      status: 'pending',
      payerMode: 'single',
      expectedPayers: 1,
      paidAmountCents: 0,
      publicSlug,
      publicUrl: `${publicBaseUrl(req)}/p/${publicSlug}`,
      qrAssetId: `qr_${publicSlug}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now(),
      updatedAt: now()
    });

    await createEvent(requestId, 'REQUEST_CREATED', req.user.id, { amountCents, concept });
    await logLedgerEvent('request', request.$id, 'REQUEST_CREATED', amountCents, 'draft', 'pending', { actor: req.user.id });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests', authenticateToken, async (req, res) => {
  try {
    res.json((await list('payment_requests')).filter((request) => request.requesterUserId === req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const request = await findOne('payment_requests', (d) => d.requestId === req.params.requestId);
    if (!requireOwner(request, req.user.id, res)) return;
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests/:requestId/share', authenticateToken, async (req, res) => {
  try {
    const request = await findOne('payment_requests', (d) => d.requestId === req.params.requestId);
    if (!requireOwner(request, req.user.id, res)) return;
    const channel = req.body.channel || 'whatsapp';
    const event = await createEvent(request.requestId, 'REQUEST_SHARED', req.user.id, { channel, to: req.body.to || null });
    await db.createDocument('share_events', 'unique()', {
      shareId: `shr_${uuidv4()}`,
      requestId: request.requestId,
      userId: req.user.id,
      channel,
      recipient: req.body.to || null,
      createdAt: now()
    });
    res.status(201).json({ status: 'shared', event, publicUrl: request.publicUrl || `${publicBaseUrl(req)}/p/${request.publicSlug}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests/:requestId/events', authenticateToken, async (req, res) => {
  try {
    const request = await findOne('payment_requests', (d) => d.requestId === req.params.requestId);
    if (!requireOwner(request, req.user.id, res)) return;
    const events = (await list('request_events')).filter((event) => event.requestId === request.requestId);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/requests/:requestId/reminders', authenticateToken, async (req, res) => {
  try {
    const request = await findOne('payment_requests', (d) => d.requestId === req.params.requestId);
    if (!requireOwner(request, req.user.id, res)) return;
    if (request.status === 'paid') return res.status(409).json({ error: 'Request is already paid' });
    const reminder = await db.createDocument('reminders', 'unique()', {
      reminderId: `rem_${uuidv4()}`,
      requestId: request.requestId,
      userId: req.user.id,
      channel: req.body.channel || 'whatsapp',
      recipient: req.body.to || null,
      status: 'queued',
      message: req.body.message || `Recordatorio de pago Pika: ${request.publicUrl || `${publicBaseUrl(req)}/p/${request.publicSlug}`}`,
      createdAt: now()
    });
    await createEvent(request.requestId, 'REMINDER_QUEUED', req.user.id, { reminderId: reminder.reminderId });
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC PAYER FLOW ──
router.get('/public/requests/:publicSlug', async (req, res) => {
  try {
    const request = await findOne('payment_requests', (d) => d.publicSlug === req.params.publicSlug);
    if (!request || new Date(request.expiresAt).getTime() < Date.now()) return res.status(404).json({ error: 'Public payment link not found or expired' });

    res.json({
      publicSlug: request.publicSlug,
      requesterName: request.requesterName || 'Pika merchant',
      requesterVerified: true,
      amountCents: request.amountCents,
      currency: request.currency,
      concept: request.concept,
      note: request.note || '',
      status: request.status,
      expiresAt: request.expiresAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/public/requests/:publicSlug/pay', async (req, res) => {
  try {
    const request = await findOne('payment_requests', (d) => d.publicSlug === req.params.publicSlug);
    if (!request) return res.status(404).json({ error: 'Public payment link not found' });
    if (request.status === 'paid') return res.status(409).json({ error: 'Payment request is already paid' });

    const paymentId = `pay_${uuidv4()}`;
    const intent = await paymentProvider.createPaymentIntent({
      requestId: request.requestId,
      paymentId,
      amountCents: request.amountCents,
      currency: 'MXN',
      concept: request.concept,
      requester: { displayName: request.requesterName || 'Pika merchant', receivingAccountRef: 'collection-account' },
      returnUrl: `${publicBaseUrl(req)}/paid/${paymentId}`,
      webhookUrl: `${req.protocol}://${req.get('host')}/webhooks/demo_spei`
    });

    const payment = await db.createDocument('payments', 'unique()', {
      paymentId,
      requestId: request.requestId,
      payerUserId: null,
      payerName: req.body?.payerName || null,
      payerEmail: req.body?.payerEmail || null,
      payerPhoneMasked: req.body?.payerPhone ? mask(req.body.payerPhone) : null,
      amountCents: request.amountCents,
      currency: 'MXN',
      method: 'spei',
      status: 'pending_provider_confirmation',
      provider: intent.provider || paymentProvider.providerName,
      providerPaymentRef: intent.providerPaymentRef,
      providerTrace: null,
      receiptUrl: `${publicBaseUrl(req)}/paid/${paymentId}`,
      createdAt: now(),
      updatedAt: now()
    });

    await createEvent(request.requestId, 'PAYMENT_INTENT_CREATED', 'public_payer', { paymentId, providerPaymentRef: intent.providerPaymentRef });
    await logLedgerEvent('payment', payment.$id, 'PAYMENT_INTENT_CREATED', request.amountCents, 'none', 'pending_provider_confirmation');
    res.status(201).json({
      paymentId,
      providerPaymentRef: intent.providerPaymentRef,
      status: payment.status,
      instructions: intent.instructions,
      deepLinkUrl: intent.deepLinkUrl,
      qrPayload: intent.qrPayload,
      redirectUrl: intent.redirectUrl,
      receiptUrl: payment.receiptUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public/payments/:paymentId/receipt', async (req, res) => {
  try {
    const payment = await findOne('payments', (p) => p.paymentId === req.params.paymentId);
    if (!payment) return res.status(404).json({ error: 'Receipt not found' });
    const request = await findOne('payment_requests', (r) => r.requestId === payment.requestId);
    res.json(receiptFor(payment, request));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WEBHOOKS ──
router.post('/webhooks/:provider', async (req, res) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const webhookRes = await paymentProvider.verifyWebhook({ headers: req.headers, rawBody });
    if (!webhookRes.valid || !webhookRes.normalized) return res.status(400).json({ error: 'Invalid webhook signature or data' });

    const event = webhookRes.normalized;
    const events = await list('webhook_events');
    if (events.some((e) => e.providerEventId === webhookRes.providerEventId)) return res.json({ status: 'ignored', message: 'Event already processed' });

    await db.createDocument('webhook_events', 'unique()', {
      webhookId: `wh_${uuidv4()}`,
      provider: req.params.provider,
      eventType: webhookRes.eventType || 'status_update',
      providerEventId: webhookRes.providerEventId,
      signatureValid: true,
      processingStatus: 'processed',
      payloadHash: crypto.createHash('sha256').update(rawBody).digest('hex'),
      errorMessage: '',
      createdAt: now()
    });

    const payment = await findOne('payments', (p) => p.paymentId === event.paymentId && p.providerPaymentRef === event.providerPaymentRef);
    if (payment) {
      const prevStatus = payment.status;
      await db.updateDocument('payments', payment.$id, {
        status: event.status,
        confirmedAt: event.confirmedAt,
        providerTrace: event.traceId,
        updatedAt: now()
      });
      await logLedgerEvent('payment', payment.$id, 'PAYMENT_UPDATED', payment.amountCents, prevStatus, event.status);

      const request = await findOne('payment_requests', (r) => r.requestId === payment.requestId);
      if (request && event.status === 'confirmed') {
        await db.updateDocument('payment_requests', request.$id, {
          status: 'paid',
          paidAmountCents: payment.amountCents,
          updatedAt: now()
        });
        await createEvent(request.requestId, 'REQUEST_PAID', 'provider_webhook', { paymentId: payment.paymentId, traceId: event.traceId });
        await logLedgerEvent('request', request.$id, 'REQUEST_PAID', payment.amountCents, request.status, 'paid');
      }
    }

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── QR CODES ──
router.get('/requests/:requestId/qr', authenticateToken, async (req, res) => {
  const request = await findOne('payment_requests', (d) => d.requestId === req.params.requestId);
  if (!requireOwner(request, req.user.id, res)) return;
  res.json({ qrPayload: request.publicUrl || `${publicBaseUrl(req)}/p/${request.publicSlug}` });
});

router.get('/public/requests/:publicSlug/qr', async (req, res) => {
  res.json({ qrPayload: `${publicBaseUrl(req)}/p/${req.params.publicSlug}` });
});

export default router;
