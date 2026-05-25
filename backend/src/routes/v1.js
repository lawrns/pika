import express from 'express';
import { getDatabase } from '../lib/appwrite.js';
import { MockPaymentProvider } from '../providers/payments/MockPaymentProvider.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const db = getDatabase();
const paymentProvider = new MockPaymentProvider();

// Helper to log ledger events (append-only state auditor)
const logLedgerEvent = async (entityType, entityId, eventType, amountCents, prevStatus, nextStatus, metadata = {}) => {
  try {
    await db.createDocument('ledger_events', 'unique()', {
      entityType,
      entityId,
      eventType,
      amountCents,
      currency: 'MXN',
      previousStatus: prevStatus || 'none',
      nextStatus: nextStatus || 'none',
      metadataJson: JSON.stringify(metadata),
      createdBy: 'system',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to write ledger event', err);
  }
};

// ── HEALTH ──
router.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db.isMock ? 'mock-inmemory' : 'appwrite-connected',
    version: '1.0.0'
  });
});

// ── PROFILE/ME ──
router.get('/me', async (req, res) => {
  // Return a static profile for local testing or fetch from users collection
  try {
    const { documents } = await db.listDocuments('users');
    let profile = documents[0];
    
    if (!profile) {
      profile = await db.createDocument('users', 'unique()', {
        userId: 'usr_mariana',
        phone: '+52 55 1234 5678',
        email: 'mariana@pika.mx',
        displayName: 'Mariana Báez',
        status: 'active',
        kycLevel: 'light'
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me', async (req, res) => {
  try {
    const { displayName, email } = req.body;
    const { documents } = await db.listDocuments('users');
    const profile = documents[0];

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updated = await db.updateDocument('users', profile.$id, { displayName, email });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── RECEIVING ACCOUNTS ──
router.post('/receiving-accounts', async (req, res) => {
  try {
    const { accountType, identifier } = req.body; // e.g. clabe, dimo_phone
    if (!accountType || !identifier) {
      return res.status(400).json({ error: 'accountType and identifier are required' });
    }

    // Mask the identifier for client protection
    const maskedIdentifier = identifier.length > 4 
      ? '*'.repeat(identifier.length - 4) + identifier.slice(-4) 
      : identifier;

    const account = await db.createDocument('receiving_accounts', 'unique()', {
      userId: 'usr_mariana',
      accountType,
      maskedIdentifier,
      encryptedIdentifier: identifier, // Simplified encrypted token placeholder
      providerRef: 'prov_' + Math.random().toString(36).substring(2, 9),
      isDefault: true,
      verificationStatus: 'verified'
    });

    await logLedgerEvent('account', account.$id, 'ACCOUNT_CREATED', 0, 'none', 'verified');
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/receiving-accounts', async (req, res) => {
  try {
    const { documents } = await db.listDocuments('receiving_accounts');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REQUESTS (COBROS) ──
router.post('/requests', async (req, res) => {
  try {
    const { amountCents, concept, note } = req.body;
    if (!amountCents || !concept) {
      return res.status(400).json({ error: 'amountCents and concept are required' });
    }

    const requestId = 'req_' + uuidv4().substring(0, 8);
    const publicSlug = 'r_' + uuidv4().substring(0, 6);

    const request = await db.createDocument('payment_requests', 'unique()', {
      requestId,
      requesterUserId: 'usr_mariana',
      amountCents: parseInt(amountCents),
      currency: 'MXN',
      concept,
      note: note || '',
      status: 'pending',
      payerMode: 'single',
      expectedPayers: 1,
      paidAmountCents: 0,
      publicSlug,
      qrAssetId: 'qr_' + publicSlug,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });

    await logLedgerEvent('request', request.$id, 'REQUEST_CREATED', amountCents, 'draft', 'pending');
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const { documents } = await db.listDocuments('payment_requests');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/requests/:requestId', async (req, res) => {
  try {
    const { documents } = await db.listDocuments('payment_requests');
    const request = documents.find(d => d.requestId === req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: 'Payment request not found' });
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUBLIC PAYER FLOW ──
router.get('/public/requests/:publicSlug', async (req, res) => {
  try {
    const { documents } = await db.listDocuments('payment_requests');
    const request = documents.find(d => d.publicSlug === req.params.publicSlug);

    if (!request) {
      return res.status(404).json({ error: 'Public payment link not found or expired' });
    }

    // Return safe minimal metadata
    res.json({
      publicSlug: request.publicSlug,
      requesterName: 'Mariana Báez',
      requesterVerified: true,
      amountCents: request.amountCents,
      currency: request.currency,
      concept: request.concept,
      status: request.status,
      expiresAt: request.expiresAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/public/requests/:publicSlug/pay', async (req, res) => {
  try {
    const { documents } = await db.listDocuments('payment_requests');
    const request = documents.find(d => d.publicSlug === req.params.publicSlug);

    if (!request) {
      return res.status(404).json({ error: 'Public payment link not found' });
    }

    const paymentId = 'pay_' + uuidv4().substring(0, 8);

    // Create payment intent through Mock Provider
    const intent = await paymentProvider.createPaymentIntent({
      requestId: request.requestId,
      paymentId,
      amountCents: request.amountCents,
      currency: 'MXN',
      concept: request.concept,
      requester: {
        displayName: 'Mariana Báez',
        receivingAccountRef: '•••• 4821'
      },
      returnUrl: `${req.protocol}://${req.get('host')}/paid/${paymentId}`,
      webhookUrl: `${req.protocol}://${req.get('host')}/webhooks/mock_spei`
    });

    // Save payment record to databases
    const payment = await db.createDocument('payments', 'unique()', {
      paymentId,
      requestId: request.requestId,
      payerUserId: 'usr_anonymous_payer',
      payerPhoneMasked: '•••• ••••',
      amountCents: request.amountCents,
      currency: 'MXN',
      method: 'spei',
      status: 'created',
      provider: 'MOCK_SPEI_PROVIDER',
      providerPaymentRef: intent.providerPaymentRef,
      providerTrace: 'trace_' + Math.random().toString(36).substring(2, 7),
      receiptUrl: intent.redirectUrl
    });

    await logLedgerEvent('payment', payment.$id, 'PAYMENT_INTENT_CREATED', request.amountCents, 'none', 'created');
    res.json({
      paymentId,
      providerPaymentRef: intent.providerPaymentRef,
      deepLinkUrl: intent.deepLinkUrl,
      qrPayload: intent.qrPayload,
      redirectUrl: intent.redirectUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── WEBHOOKS ──
router.post('/webhooks/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    
    // Process mock SPEI webhooks idempotently
    const webhookRes = await paymentProvider.verifyWebhook({
      headers: req.headers,
      rawBody: req.body
    });

    if (!webhookRes.valid || !webhookRes.normalized) {
      return res.status(400).json({ error: 'Invalid webhook signature or data' });
    }

    const event = webhookRes.normalized;

    // Check webhook_events collection for idempotency
    const { documents: events } = await db.listDocuments('webhook_events');
    const isProcessed = events.some(e => e.providerEventId === webhookRes.providerEventId);
    if (isProcessed) {
      return res.json({ status: 'ignored', message: 'Event already processed' });
    }

    // Save webhook event log
    await db.createDocument('webhook_events', 'unique()', {
      webhookId: 'wh_' + uuidv4().substring(0, 8),
      provider,
      eventType: webhookRes.eventType || 'status_update',
      providerEventId: webhookRes.providerEventId || 'none',
      signatureValid: true,
      processingStatus: 'processed',
      payloadHash: 'hash_' + Math.random().toString(36).substring(2, 8),
      errorMessage: ''
    });

    // Update payment status
    const { documents: payments } = await db.listDocuments('payments');
    const payment = payments.find(p => p.paymentId === event.paymentId);

    if (payment) {
      const prevStatus = payment.status;
      await db.updateDocument('payments', payment.$id, {
        status: event.status,
        confirmedAt: event.confirmedAt
      });

      await logLedgerEvent('payment', payment.$id, 'PAYMENT_UPDATED', payment.amountCents, prevStatus, event.status);

      // If paid, update request status to paid
      const { documents: requests } = await db.listDocuments('payment_requests');
      const request = requests.find(r => r.requestId === payment.requestId);
      if (request) {
        await db.updateDocument('payment_requests', request.$id, {
          status: 'paid',
          paidAmountCents: payment.amountCents
        });
        await logLedgerEvent('request', request.$id, 'REQUEST_PAID', payment.amountCents, 'pending', 'paid');
      }
    }

    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── QR CODES ──
router.get('/requests/:requestId/qr', async (req, res) => {
  res.json({ qrPayload: `SPEI:CLABE=646180123400000001;REF=${req.params.requestId}` });
});

router.get('/public/requests/:publicSlug/qr', async (req, res) => {
  res.json({ qrPayload: `SPEI:CLABE=646180123400000001;SLUG=${req.params.publicSlug}` });
});

export default router;
