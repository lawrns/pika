import express from 'express';
import { PaymentLink } from '../models/PaymentLink.js';
import { Transaction } from '../models/Transaction.js';
import { Wallet } from '../models/Wallet.js';
import { User } from '../models/User.js';
import { authenticateToken, requireVerified } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';
import { generatePaymentQRCode, generateSPEIQRCode } from '../utils/qrCode.js';
import { createSPEIProcessor } from '../utils/stipago.js';
import { v4 as uuidv4 } from 'uuid';
import { createIdempotencyKey } from '../utils/transaction.js';
import {
  paymentRateLimiter,
  paymentLinkCreationLimiter,
  webhookRateLimiter
} from '../middleware/rateLimiter.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import { verifyWebhook, captureRawBody } from '../middleware/webhookSecurity.js';
import { paymentSecurityHeaders, webhookSecurityHeaders } from '../middleware/securityHeaders.js';
import securityConfig from '../config/security.js';

const router = express.Router();

// Create payment link (with rate limiting and idempotency)
router.post('/links',
  authenticateToken,
  requireVerified,
  paymentLinkCreationLimiter,
  requireIdempotency('create-payment-link'),
  validate(schemas.createPaymentLink),
  paymentSecurityHeaders,
  async (req, res) => {
  try {
    const { amount, currency, description, expiresIn } = req.validated;

    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

    const paymentLink = await PaymentLink.create(req.user.id, {
      amount,
      currency,
      description,
      expiresAt
    });

    const paymentUrl = `${process.env.API_BASE_URL}/pay/${paymentLink.reference_code}`;

    res.status(201).json({
      message: 'Payment link created',
      paymentLink: {
        id: paymentLink.id,
        referenceCode: paymentLink.reference_code,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        description: paymentLink.description,
        expiresAt: paymentLink.expires_at,
        url: paymentUrl
      }
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({ error: 'Failed to create payment link' });
  }
});

// Get payment link by reference code (public)
router.get('/public/:referenceCode', async (req, res) => {
  try {
    const paymentLink = await PaymentLink.findByReferenceCode(req.params.referenceCode);

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    const isValid = await PaymentLink.isValid(paymentLink);
    const merchant = await User.findById(paymentLink.user_id);
    const paymentUrl = `${process.env.FRONTEND_URL || process.env.API_BASE_URL || ''}/pay/${paymentLink.reference_code}`;

    res.json({
      paymentLink: {
        id: paymentLink.id,
        referenceCode: paymentLink.reference_code,
        amount: Number(paymentLink.amount),
        currency: paymentLink.currency || 'MXN',
        description: paymentLink.description,
        status: paymentLink.status,
        isValid,
        expiresAt: paymentLink.expires_at,
        paymentUrl,
        merchantName: merchant?.full_name || merchant?.email || 'Pika merchant'
      }
    });
  } catch (error) {
    console.error('Get public payment link error:', error);
    res.status(500).json({ error: 'Failed to fetch payment link' });
  }
});

router.post('/public/:referenceCode/intent',
  paymentRateLimiter,
  validate(schemas.publicPaymentIntent),
  async (req, res) => {
    try {
      const paymentLink = await PaymentLink.findByReferenceCode(req.params.referenceCode);
      if (!paymentLink) {
        return res.status(404).json({ error: 'Payment link not found' });
      }
      const isValid = await PaymentLink.isValid(paymentLink);
      if (!isValid) {
        return res.status(400).json({ error: 'Payment link is invalid or expired' });
      }

      res.status(202).json({
        status: 'pending_provider_reconciliation',
        instructions: 'Payment intent captured. In production, this is completed only after provider webhook reconciliation.',
        referenceCode: paymentLink.reference_code,
        amount: Number(paymentLink.amount),
        currency: paymentLink.currency || 'MXN'
      });
    } catch (error) {
      console.error('Create public payment intent error:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  }
);

// Get payment link by reference code (public)
router.get('/links/:referenceCode', async (req, res) => {
  try {
    const paymentLink = await PaymentLink.findByReferenceCode(req.params.referenceCode);

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    const isValid = await PaymentLink.isValid(paymentLink);

    res.json({
      referenceCode: paymentLink.reference_code,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      description: paymentLink.description,
      isValid,
      expiresAt: paymentLink.expires_at
    });
  } catch (error) {
    console.error('Get payment link error:', error);
    res.status(500).json({ error: 'Failed to fetch payment link' });
  }
});

// Get QR code for payment link
router.get('/links/:referenceCode/qr', async (req, res) => {
  try {
    const paymentLink = await PaymentLink.findByReferenceCode(req.params.referenceCode);

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    const isValid = await PaymentLink.isValid(paymentLink);

    if (!isValid) {
      return res.status(400).json({ error: 'Payment link is invalid or expired' });
    }

    const qrCodeDataUrl = await generatePaymentQRCode(paymentLink, process.env.API_BASE_URL);

    res.json({
      referenceCode: paymentLink.reference_code,
      amount: paymentLink.amount,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Pay a payment link with idempotency and atomic transactions
router.post('/pay/:referenceCode',
  authenticateToken,
  paymentRateLimiter,
  requireIdempotency('execute-payment'),
  paymentSecurityHeaders,
  async (req, res) => {
  try {
    const requestId = req.headers['x-request-id'] || uuidv4();
    const idempotencyKey = createIdempotencyKey(
      req.user.id,
      `payment:${req.params.referenceCode}`,
      requestId
    );

    const paymentLink = await PaymentLink.findByReferenceCode(req.params.referenceCode);

    if (!paymentLink) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    if (paymentLink.user_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot pay your own payment link' });
    }

    const isValid = await PaymentLink.isValid(paymentLink);

    if (!isValid) {
      return res.status(400).json({ error: 'Payment link is invalid or expired' });
    }

    // Debit payer wallet and credit merchant wallet.
    const payerWallet = req.user.wallet_id ? await Wallet.findById(req.user.wallet_id) : await Wallet.findByUserId(req.user.id);
    const payeeWallet = await Wallet.findByUserId(paymentLink.user_id);

    if (!payerWallet || !payeeWallet) {
      return res.status(404).json({ error: 'Payer or merchant wallet not found' });
    }

    const result = await Wallet.transfer(
      payerWallet.id,
      payeeWallet.id,
      paymentLink.amount,
      {
        idempotencyKey,
        description: `Payment: ${paymentLink.description || 'No description'}`,
        metadata: {
          paymentLinkReference: paymentLink.reference_code,
          payerId: req.user.id,
          payeeId: paymentLink.user_id
        }
      }
    );

    if (result.idempotent) {
      // Return existing transaction
      return res.json({
        message: 'Payment already processed',
        idempotent: true,
        transactions: result.transactions
      });
    }

    // Create transaction records atomically
    const transactions = await Transaction.createPair(
      {
        userId: req.user.id,
        walletId: result.fromWallet.id,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: 'completed',
        description: `Payment: ${paymentLink.description || 'No description'}`,
        counterpartyInfo: {
          type: 'payment_link',
          referenceCode: paymentLink.reference_code,
          payeeId: paymentLink.user_id
        },
        metadata: {
          paymentLinkId: paymentLink.id
        }
      },
      {
        userId: paymentLink.user_id,
        walletId: result.toWallet.id,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: 'completed',
        description: `Payment received: ${paymentLink.description || 'No description'}`,
        counterpartyInfo: {
          type: 'payment_link',
          referenceCode: paymentLink.reference_code,
          payerEmail: req.user.email
        },
        metadata: {
          paymentLinkId: paymentLink.id
        }
      },
      { idempotencyKey }
    );

    await PaymentLink.markPaid(paymentLink.id);

    // Invalidate cache
    await redisClient.del(`wallet:${req.user.id}`);
    await redisClient.del(`wallet:${paymentLink.user_id}`);

    res.json({
      message: 'Payment successful',
      idempotent: transactions.idempotent,
      transaction: transactions.from,
      newBalance: result.fromWallet.balance
    });
  } catch (error) {
    console.error('Payment error:', error);

    if (error.message === 'Insufficient funds') {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    if (error.message.includes('concurrent modification')) {
      return res.status(409).json({ error: 'Payment conflict - please try again' });
    }

    res.status(500).json({ error: 'Payment failed' });
  }
});

// List user's payment links
router.get('/links', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0, status } = req.query;

    const paymentLinks = await PaymentLink.findByUserId(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    });

    res.json({
      paymentLinks,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: paymentLinks.length
      }
    });
  } catch (error) {
    console.error('List payment links error:', error);
    res.status(500).json({ error: 'Failed to fetch payment links' });
  }
});

// Cancel payment link
router.delete('/links/:id', authenticateToken, async (req, res) => {
  try {
    const paymentLink = await PaymentLink.findByReferenceCode(req.params.id);

    if (!paymentLink || paymentLink.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Payment link not found' });
    }

    await PaymentLink.cancel(paymentLink.id);

    res.json({ message: 'Payment link cancelled' });
  } catch (error) {
    console.error('Cancel payment link error:', error);
    res.status(500).json({ error: 'Failed to cancel payment link' });
  }
});

// Create SPEI payment order with idempotency
router.post('/spei/create', authenticateToken, requireVerified, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const requestId = req.headers['x-request-id'] || uuidv4();
    const idempotencyKey = createIdempotencyKey(
      req.user.id,
      'spei_deposit',
      requestId
    );

    const speiProcessor = createSPEIProcessor();

    if (!speiProcessor) {
      return res.status(503).json({ error: 'SPEI service not available' });
    }

    const speiOrder = await speiProcessor.createSPEIOrder({
      amount,
      description: description || 'Pika wallet deposit',
      reference: `PIKA-${Date.now()}`,
      customerEmail: req.user.email,
      customerName: req.user.full_name,
      webhookUrl: `${process.env.API_BASE_URL}/webhooks/spei`
    });

    if (!speiOrder.success) {
      return res.status(500).json({ error: speiOrder.error });
    }

    const wallet = await Wallet.findByUserId(req.user.id);

    const result = await Transaction.create({
      userId: req.user.id,
      walletId: wallet.id,
      type: 'credit',
      amount,
      status: 'pending',
      speiTrackingKey: speiOrder.trackingKey,
      description: `SPEI deposit: ${description || 'Wallet top-up'}`,
      metadata: {
        spei: {
          clabe: speiOrder.clabe,
          bankName: speiOrder.bankName,
          expiresAt: speiOrder.expiresAt
        }
      },
      idempotencyKey
    });

    if (result.idempotent) {
      return res.json({
        message: 'SPEI order already created',
        idempotent: true,
        transaction: result.transaction
      });
    }

    res.json({
      message: 'SPEI order created',
      transaction: {
        id: result.transaction.id,
        trackingKey: speiOrder.trackingKey,
        clabe: speiOrder.clabe,
        bankName: speiOrder.bankName,
        amount: speiOrder.amount,
        expiresAt: speiOrder.expiresAt
      }
    });
  } catch (error) {
    console.error('SPEI create error:', error);
    res.status(500).json({ error: 'Failed to create SPEI order' });
  }
});

// Get SPEI QR code
router.get('/spei/qr/:trackingKey', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findByReferenceCode(req.params.trackingKey);

    if (!transaction || transaction.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const speiInfo = transaction.metadata?.spei;

    if (!speiInfo) {
      return res.status(400).json({ error: 'Not a SPEI transaction' });
    }

    const qrCodeDataUrl = await generateSPEIQRCode(
      speiInfo.clabe,
      transaction.amount,
      transaction.spei_tracking_key
    );

    res.json({
      trackingKey: transaction.spei_tracking_key,
      amount: transaction.amount,
      clabe: speiInfo.clabe,
      bankName: speiInfo.bankName,
      qrCode: qrCodeDataUrl
    });
  } catch (error) {
    console.error('SPEI QR error:', error);
    res.status(500).json({ error: 'Failed to generate SPEI QR code' });
  }
});

// Webhook for SPEI notifications with signature verification and idempotency
router.post('/webhooks/spei',
  webhookRateLimiter,
  captureRawBody,
  verifyWebhook(
    () => process.env.STIPAGO_WEBHOOK_SECRET,
    {
      signatureHeader: 'x-signature',
      timestampHeader: 'x-timestamp',
      nonceHeader: 'x-nonce',
      webhookId: 'stipago',
      ...securityConfig.webhooks
    }
  ),
  webhookSecurityHeaders,
  async (req, res) => {
    const webhookId = req.headers['x-webhook-id'] || uuidv4();

    try {
      const speiProcessor = createSPEIProcessor();

      if (!speiProcessor) {
        return res.status(503).json({ error: 'SPEI service not available' });
      }

      // Signature already verified by middleware
      const payload = req.rawBody || JSON.stringify(req.body);

    const { tracking_key, status, amount } = req.body;

    // Process webhook with idempotency
    const result = await Transaction.processWebhook(webhookId, req.body, async (client) => {
      // Find and lock the transaction
      const txResult = await client.query(
        `SELECT * FROM transactions 
         WHERE spei_tracking_key = $1
         FOR UPDATE`,
        [tracking_key]
      );

      if (txResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = txResult.rows[0];

      // Check if already processed
      if (transaction.status === 'completed') {
        return { alreadyProcessed: true, transaction };
      }

      // Process payment if status is completed
      if (status === 'completed' && transaction.status === 'pending') {
        // Validate amount matches
        if (parseFloat(amount) !== parseFloat(transaction.amount)) {
          throw new Error(`Amount mismatch: expected ${transaction.amount}, got ${amount}`);
        }

        // Update wallet balance atomically
        await client.query(
          `UPDATE wallets
           SET balance = balance + $1,
               version = version + 1,
               updated_at = NOW()
           WHERE id = $2`,
          [transaction.amount, transaction.wallet_id]
        );

        // Update transaction status
        await client.query(
          `UPDATE transactions
           SET status = 'completed',
               completed_at = NOW(),
               metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('webhook_processed_at', NOW())
           WHERE id = $1`,
          [transaction.id]
        );

        return { processed: true, transaction };
      }

      return { status: 'unchanged', transaction };
    });

    // Invalidate cache for the user
    if (result.result?.transaction?.user_id) {
      await redisClient.del(`wallet:${result.result.transaction.user_id}`);
    }

    res.json({ message: 'Webhook processed', result });
  } catch (error) {
    console.error('SPEI webhook error:', error);

    // Log failed webhook for retry
    try {
      await pool.query(
        `INSERT INTO webhook_logs (webhook_id, event_type, payload, processed, error_message)
         VALUES ($1, $2, $3, false, $4)`,
        [webhookId, 'spei_payment', req.body, error.message]
      );
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
