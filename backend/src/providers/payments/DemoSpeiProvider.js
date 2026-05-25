import crypto from 'crypto';
import { PaymentProviderAdapter } from './PaymentProviderAdapter.js';

function safeEqualHex(a, b) {
  const left = Buffer.from(String(a || ''), 'hex');
  const right = Buffer.from(String(b || ''), 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export class DemoSpeiProvider extends PaymentProviderAdapter {
  constructor(options = {}) {
    super();
    this.providerName = options.providerName || 'DEMO_SPEI_PROVIDER';
    this.webhookSecret = options.webhookSecret || process.env.PIKA_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
  }

  async createPaymentIntent(input) {
    const providerPaymentRef = `demo_spei_${crypto.randomUUID()}`;
    const reference = input.paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase();
    const amount = (Number(input.amountCents) / 100).toFixed(2);

    return {
      providerPaymentRef,
      provider: this.providerName,
      status: 'pending_provider_confirmation',
      instructions: {
        method: 'SPEI',
        amountCents: Number(input.amountCents),
        currency: input.currency || 'MXN',
        clabe: process.env.PIKA_COLLECTION_CLABE || '646180123400000001',
        beneficiary: input.requester?.displayName || 'Pika merchant',
        reference,
        concept: input.concept,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      },
      deepLinkUrl: null,
      qrPayload: `SPEI:CLABE=${process.env.PIKA_COLLECTION_CLABE || '646180123400000001'};REF=${reference};AMT=${amount}`,
      redirectUrl: null,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  }

  async verifyWebhook(input) {
    const rawBody = typeof input.rawBody === 'string' ? input.rawBody : JSON.stringify(input.rawBody || {});
    const signature = input.headers?.['x-pika-signature'] || input.headers?.['x-demo-spei-signature'];

    if (!this.webhookSecret || !signature) {
      return { valid: false, error: 'Missing webhook secret or signature' };
    }

    const expected = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    if (!safeEqualHex(signature, expected)) {
      return { valid: false, error: 'Invalid webhook signature' };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return { valid: false, error: 'Invalid JSON payload' };
    }

    const paymentId = parsedBody.paymentId;
    const providerPaymentRef = parsedBody.providerPaymentRef || parsedBody.providerRef;
    if (!paymentId || !providerPaymentRef) {
      return { valid: false, error: 'Missing payment identifiers' };
    }

    const normalizedStatus = ['paid', 'confirmed', 'completed', 'settled'].includes(String(parsedBody.status).toLowerCase())
      ? 'confirmed'
      : ['failed', 'cancelled', 'rejected'].includes(String(parsedBody.status).toLowerCase())
        ? 'failed'
        : 'pending_provider_confirmation';

    return {
      valid: true,
      providerEventId: crypto.createHash('sha256').update(rawBody).digest('hex'),
      eventType: `payment.${normalizedStatus}`,
      normalized: {
        paymentId,
        providerPaymentRef,
        status: normalizedStatus,
        amountCents: Number(parsedBody.amountCents || 0),
        currency: parsedBody.currency || 'MXN',
        traceId: parsedBody.traceId || null,
        confirmedAt: normalizedStatus === 'confirmed' ? (parsedBody.confirmedAt || new Date().toISOString()) : null,
        raw: parsedBody
      }
    };
  }

  async getPaymentStatus() {
    return { status: 'pending_provider_confirmation', amountCents: 0 };
  }
}

export default DemoSpeiProvider;
