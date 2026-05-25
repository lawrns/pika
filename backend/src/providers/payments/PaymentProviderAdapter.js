/**
 * PaymentProviderAdapter Interface (represented as class in JS ES modules)
 * Establishes a strict contract for all payment processors (SPEI, DiMo, Stripe, Mercado Pago)
 * so switching adapters doesn't require product rewrites.
 */
export class PaymentProviderAdapter {
  constructor() {
    this.providerName = 'Base';
  }

  /**
   * Creates a payment intent/link with the provider
   * @param {Object} input
   * @param {string} input.requestId - Pika request ID
   * @param {string} input.paymentId - Pika payment transaction ID
   * @param {number} input.amountCents - Amount in cents
   * @param {string} input.currency - 'MXN'
   * @param {string} input.concept - Description of payment
   * @param {Object} input.requester - Information about destination
   * @param {string} input.requester.displayName - Name of the requester
   * @param {string} input.requester.receivingAccountRef - Masked account or identifier reference
   * @param {string} input.returnUrl - Redirect URL after payment completion
   * @param {string} input.webhookUrl - Callback URL for payment updates
   * @returns {Promise<{providerPaymentRef: string, redirectUrl?: string, deepLinkUrl?: string, qrPayload?: string, expiresAt?: string}>}
   */
  async createPaymentIntent(input) {
    throw new Error('Method not implemented');
  }

  /**
   * Verifies incoming webhook callback and formats to a normalized structure
   * @param {Object} input
   * @param {Object} input.headers - Raw HTTP request headers
   * @param {Buffer} input.rawBody - Raw HTTP body payload
   * @returns {Promise<{valid: boolean, providerEventId?: string, eventType?: string, normalized?: Object}>}
   */
  async verifyWebhook(input) {
    throw new Error('Method not implemented');
  }

  /**
   * Queries payment status directly from provider
   * @param {string} providerPaymentRef - Provider's transaction reference
   * @returns {Promise<{status: 'created' | 'pending' | 'confirmed' | 'failed', amountCents: number, traceId?: string}>}
   */
  async getPaymentStatus(providerPaymentRef) {
    throw new Error('Method not implemented');
  }
}
