/**
 * STiPago Integration for SPEI/CoDi Payments
 *
 * This is a planning/placeholder implementation for SPEI/CoDi integration.
 * STiPago is a Mexican payment processor that provides SPEI and CoDi APIs.
 *
 * Implementation notes:
 * 1. Contact STiPago (https://www.stipago.com) for API credentials
 * 2. They provide Webhooks for payment notifications
 * 3. SPEI transactions use CLABE (18-digit bank account numbers)
 * 4. CoDi uses QR codes and mobile banking apps
 */

import axios from 'axios';

const STIPAGO_BASE_URL = 'https://api.stipago.com/v1';

export class SPEIProcessor {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseURL = STIPAGO_BASE_URL;
  }

  /**
   * Generate a SPEI payment order
   * @param {Object} params - Payment parameters
   * @returns {Promise<Object>} Payment order with tracking key
   */
  async createSPEIOrder(params) {
    try {
      const response = await axios.post(
        `${this.baseURL}/spei/orders`,
        {
          amount: params.amount,
          currency: 'MXN',
          reference: params.reference,
          concept: params.description,
          customer: {
            email: params.customerEmail,
            name: params.customerName
          },
          webhook_url: params.webhookUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        trackingKey: response.data.tracking_key,
        clabe: response.data.payment_account.clabe,
        bankName: response.data.payment_account.bank,
        amount: response.data.amount,
        expiresAt: response.data.expires_at
      };
    } catch (error) {
      console.error('SPEI order creation failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create SPEI order'
      };
    }
  }

  /**
   * Check SPEI transaction status
   * @param {string} trackingKey - SPEI tracking key
   * @returns {Promise<Object>} Transaction status
   */
  async checkSPEIStatus(trackingKey) {
    try {
      const response = await axios.get(
        `${this.baseURL}/spei/orders/${trackingKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        amount: response.data.amount,
        paidAt: response.data.paid_at,
        bankOrigin: response.data.bank_origin
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check SPEI status'
      };
    }
  }

  /**
   * Generate CoDi payment QR
   * @param {Object} params - CoDi parameters
   * @returns {Promise<Object>} CoDi QR data
   */
  async createCoDiQR(params) {
    try {
      const response = await axios.post(
        `${this.baseURL}/codi/qr`,
        {
          amount: params.amount,
          reference: params.reference,
          concept: params.description,
          expires_in: 3600
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        qrData: response.data.qr_code,
        qrUrl: response.data.qr_url,
        expiresAt: response.data.expires_at
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create CoDi QR'
      };
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - X-Signature header
   * @returns {boolean}
   */
  verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(payload);
    const digest = hmac.digest('hex');
    return digest === signature;
  }
}

// Export singleton instance
export function createSPEIProcessor() {
  if (!process.env.STIPAGO_API_KEY || !process.env.STIPAGO_SECRET_KEY) {
    console.warn('⚠️  STiPago credentials not configured. SPEI/CoDi features will be disabled.');
    return null;
  }

  return new SPEIProcessor(
    process.env.STIPAGO_API_KEY,
    process.env.STIPAGO_SECRET_KEY
  );
}

// SPEI configuration for deployment
export const SPEI_CONFIG = {
  enabled: process.env.SPEI_ENABLED === 'true',
  apiKey: process.env.STIPAGO_API_KEY,
  banks: {
    'BBVA': '012',
    'Santander': '014',
    'Banorte': '072',
    'HSBC': '021',
    'Banamex': '002',
    'Scotiabank': '044'
  },
  paymentAccounts: {
    // Production CLABE accounts from your bank
    production: {
      clabe: process.env.SPEI_CLABE_PRODUCTION,
      bankName: process.env.SPEI_BANK_NAME
    },
    // Sandbox/test CLABE from STiPago
    sandbox: {
      clabe: process.env.SPEI_CLABE_SANDBOX || '646180123400000001',
      bankName: 'STiPago Test Bank'
    }
  }
};
