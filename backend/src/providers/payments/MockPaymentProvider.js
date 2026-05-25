import { PaymentProviderAdapter } from './PaymentProviderAdapter.js';

export class MockPaymentProvider extends PaymentProviderAdapter {
  constructor() {
    super();
    this.providerName = 'MOCK_SPEI_PROVIDER';
  }

  async createPaymentIntent(input) {
    const { paymentId, amountCents, concept } = input;
    const providerPaymentRef = 'ref_' + Math.random().toString(36).substring(2, 9);
    
    // Simulate high-fidelity payment credentials
    const traceId = '102605' + Math.floor(100000 + Math.random() * 900000);
    const mockDeepLinkUrl = `https://mockbank.mx/pay?ref=${providerPaymentRef}&amt=${amountCents}&desc=${encodeURIComponent(concept)}`;
    const mockQrPayload = `SPEI:CLABE=646180123400000001;REF=${providerPaymentRef};AMT=${amountCents / 100}`;

    return {
      providerPaymentRef,
      redirectUrl: input.returnUrl,
      deepLinkUrl: mockDeepLinkUrl,
      qrPayload: mockQrPayload,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 mins
    };
  }

  async verifyWebhook(input) {
    const { headers, rawBody } = input;
    
    // Parse body if it is buffer or string
    let parsedBody = {};
    try {
      parsedBody = JSON.parse(rawBody.toString());
    } catch (e) {
      parsedBody = rawBody;
    }

    const { paymentId, providerRef, status } = parsedBody;

    if (!paymentId || !providerRef) {
      return { valid: false };
    }

    // Mock verification succeeds automatically
    return {
      valid: true,
      providerEventId: 'evt_' + Math.random().toString(36).substring(2, 9),
      eventType: 'payment.status_update',
      normalized: {
        paymentId,
        providerPaymentRef: providerRef,
        status: status === 'paid' ? 'confirmed' : 'failed',
        amountCents: parsedBody.amountCents || 0,
        confirmedAt: new Date().toISOString()
      }
    };
  }

  async getPaymentStatus(providerPaymentRef) {
    // Return a default successful response
    return {
      status: 'confirmed',
      amountCents: 48000,
      traceId: '102605' + Math.floor(100000 + Math.random() * 900000)
    };
  }
}
