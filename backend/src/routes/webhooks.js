import express from 'express';
import crypto from 'crypto';
import pool from '../config/database.js';
import { captureRawBody, verifyWebhook } from '../middleware/webhookSecurity.js';
import { webhookRateLimiter } from '../middleware/rateLimiter.js';
import { webhookSecurityHeaders } from '../middleware/securityHeaders.js';
import securityConfig from '../config/security.js';
import redisClient from '../config/redis.js';

const router = express.Router();

/**
 * Log webhook for debugging and compliance
 */
async function logWebhook(provider, event, payload, status, error = null) {
  try {
    await pool.query(
      `INSERT INTO webhook_logs (event, provider, payload, processed, http_status, error, received_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        event,
        provider.toUpperCase(),
        JSON.stringify(payload),
        status === 'success',
        status === 'success' ? 200 : 500,
        error
      ]
    );
  } catch (logError) {
    console.error('Failed to log webhook:', logError);
  }
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Verify Mercado Pago webhook signature
 */
function verifyMercadoPagoSignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (error) {
    return false;
  }
}

/**
 * SPEI Webhook Handler
 * POST /webhooks/spei
 */
router.post('/spei',
  webhookRateLimiter,
  captureRawBody,
  async (req, res) => {
    const webhookId = req.headers['x-webhook-id'] || `spei-${Date.now()}`;

    try {
      // Verify webhook signature if configured
      const secret = process.env.STIPAGO_WEBHOOK_SECRET;
      if (secret) {
        const signature = req.headers['x-signature'];
        if (!signature || !verifyStripeSignature(req.rawBody, signature, secret)) {
          console.warn('Invalid SPEI webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { event_type, data } = req.body;

      // Log incoming webhook
      await logWebhook('SPEI', event_type, req.body, 'processing');

      // Check for duplicate webhook
      const existingKey = `webhook:spei:${data?.tracking_key || data?.id}`;
      const existing = await redisClient.get(existingKey);
      if (existing) {
        console.log('Duplicate SPEI webhook ignored');
        return res.json({ message: 'Already processed' });
      }

      switch (event_type) {
        case 'payment.received':
        case 'transfer.completed':
          await processSPEIPayment(data);
          break;

        case 'payment.failed':
        case 'transfer.failed':
          await processSPEIFailure(data);
          break;

        case 'payment.pending':
          await processSPEIPending(data);
          break;

        default:
          console.log('Unhandled SPEI event:', event_type);
      }

      // Mark as processed
      await redisClient.setEx(existingKey, 86400, 'processed');
      await logWebhook('SPEI', event_type, req.body, 'success');

      res.json({ received: true, event: event_type });
    } catch (error) {
      console.error('SPEI webhook error:', error);
      await logWebhook('SPEI', req.body?.event_type, req.body, 'error', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/**
 * Process successful SPEI payment
 */
async function processSPEIPayment(data) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find transaction by tracking key
    const txResult = await client.query(
      `SELECT t.*, w.id as wallet_id, w.user_id
       FROM transactions t
       JOIN wallets w ON w.id = t.wallet_id
       WHERE t.spei_tracking_key = $1
       FOR UPDATE`,
      [data.tracking_key]
    );

    if (txResult.rows.length === 0) {
      console.warn('SPEI payment: Transaction not found for tracking key:', data.tracking_key);
      await client.query('COMMIT');
      return;
    }

    const transaction = txResult.rows[0];

    // Check if already processed
    if (transaction.status === 'COMPLETED') {
      console.log('SPEI payment already processed');
      await client.query('COMMIT');
      return;
    }

    // Validate amount
    if (parseFloat(data.amount) !== parseFloat(transaction.amount)) {
      console.warn(`SPEI amount mismatch: expected ${transaction.amount}, got ${data.amount}`);
    }

    // Update wallet balance
    await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [transaction.amount, transaction.wallet_id]
    );

    // Update transaction status
    await client.query(
      `UPDATE transactions
       SET status = 'COMPLETED',
           provider_tx_id = $1,
           completed_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $3`,
      [
        data.transaction_id,
        JSON.stringify({
          spei_response: data,
          bank_origin: data.bank_origin,
          processed_at: new Date().toISOString()
        }),
        transaction.id
      ]
    );

    // Invalidate cache
    await redisClient.del(`wallet:${transaction.user_id}`);

    await client.query('COMMIT');
    console.log('SPEI payment processed successfully:', transaction.id);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process SPEI payment failure
 */
async function processSPEIFailure(data) {
  const result = await pool.query(
    `UPDATE transactions
     SET status = 'FAILED',
         metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
         failed_at = NOW(),
         updated_at = NOW()
     WHERE spei_tracking_key = $2
     RETURNING *`,
    [
      JSON.stringify({
        failure_reason: data.reason,
        spei_response: data
      }),
      data.tracking_key
    ]
  );

  if (result.rows.length > 0) {
    console.log('SPEI payment marked as failed:', result.rows[0].id);
  }
}

/**
 * Process SPEI pending payment
 */
async function processSPEIPending(data) {
  await pool.query(
    `UPDATE transactions
     SET status = 'PROCESSING',
         metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
         updated_at = NOW()
     WHERE spei_tracking_key = $2`,
    [
      JSON.stringify({
        spei_status: 'pending',
        spei_response: data
      }),
      data.tracking_key
    ]
  );
}

/**
 * CoDi Webhook Handler
 * POST /webhooks/codi
 */
router.post('/codi',
  webhookRateLimiter,
  captureRawBody,
  async (req, res) => {
    const webhookId = req.headers['x-webhook-id'] || `codi-${Date.now()}`;

    try {
      // Verify signature
      const secret = process.env.STIPAGO_WEBHOOK_SECRET;
      if (secret) {
        const signature = req.headers['x-signature'];
        if (!signature || !verifyStripeSignature(req.rawBody, signature, secret)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { event_type, data } = req.body;

      await logWebhook('CoDi', event_type, req.body, 'processing');

      // Check for duplicates
      const existingKey = `webhook:codi:${data?.qr_id || data?.id}`;
      const existing = await redisClient.get(existingKey);
      if (existing) {
        return res.json({ message: 'Already processed' });
      }

      switch (event_type) {
        case 'codi.payment.completed':
          await processCoDiPayment(data);
          break;

        case 'codi.payment.failed':
          await processCoDiFailure(data);
          break;

        case 'codi.payment.pending':
          await processCoDiPending(data);
          break;

        default:
          console.log('Unhandled CoDi event:', event_type);
      }

      await redisClient.setEx(existingKey, 86400, 'processed');
      await logWebhook('CoDi', event_type, req.body, 'success');

      res.json({ received: true, event: event_type });
    } catch (error) {
      console.error('CoDi webhook error:', error);
      await logWebhook('CoDi', req.body?.event_type, req.body, 'error', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

/**
 * Process CoDi payment
 */
async function processCoDiPayment(data) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find by QR reference
    const txResult = await client.query(
      `SELECT t.*, w.id as wallet_id, w.user_id
       FROM transactions t
       JOIN wallets w ON w.id = t.wallet_id
       WHERE t.metadata->>'codi_qr_id' = $1
       FOR UPDATE`,
      [data.qr_id]
    );

    if (txResult.rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const transaction = txResult.rows[0];

    if (transaction.status === 'COMPLETED') {
      await client.query('COMMIT');
      return;
    }

    // Update wallet
    await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [transaction.amount, transaction.wallet_id]
    );

    // Update transaction
    await client.query(
      `UPDATE transactions
       SET status = 'COMPLETED',
           provider_tx_id = $1,
           completed_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = NOW()
       WHERE id = $3`,
      [
        data.payment_id,
        JSON.stringify({
          codi_response: data,
          processed_at: new Date().toISOString()
        }),
        transaction.id
      ]
    );

    await redisClient.del(`wallet:${transaction.user_id}`);

    await client.query('COMMIT');
    console.log('CoDi payment processed:', transaction.id);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function processCoDiFailure(data) {
  await pool.query(
    `UPDATE transactions
     SET status = 'FAILED',
         metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
         failed_at = NOW(),
         updated_at = NOW()
     WHERE metadata->>'codi_qr_id' = $2`,
    [
      JSON.stringify({ failure_reason: data.reason, codi_response: data }),
      data.qr_id
    ]
  );
}

async function processCoDiPending(data) {
  await pool.query(
    `UPDATE transactions
     SET status = 'PROCESSING',
         metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
         updated_at = NOW()
     WHERE metadata->>'codi_qr_id' = $2`,
    [
      JSON.stringify({ codi_status: 'pending', codi_response: data }),
      data.qr_id
    ]
  );
}

/**
 * Stripe Webhook Handler
 * POST /webhooks/stripe
 */
router.post('/stripe',
  webhookRateLimiter,
  captureRawBody,
  async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const secret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return res.status(401).json({ error: 'Missing signature or secret' });
      }

      // Verify Stripe signature
      const stripe = await import('stripe');
      const Stripe = stripe.default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);

      let event;
      try {
        event = stripeClient.webhooks.constructEvent(
          req.rawBody,
          signature,
          secret
        );
      } catch (err) {
        console.warn('Invalid Stripe signature:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      await logWebhook('STRIPE', event.type, event.data.object, 'processing');

      // Check for duplicates
      const existingKey = `webhook:stripe:${event.id}`;
      const existing = await redisClient.get(existingKey);
      if (existing) {
        return res.json({ received: true, duplicate: true });
      }

      switch (event.type) {
        case 'payment_intent.succeeded':
          await processStripePaymentSuccess(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await processStripePaymentFailure(event.data.object);
          break;

        case 'charge.refunded':
          await processStripeRefund(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await processStripeInvoicePayment(event.data.object);
          break;

        default:
          console.log('Unhandled Stripe event:', event.type);
      }

      await redisClient.setEx(existingKey, 86400, 'processed');
      await logWebhook('STRIPE', event.type, event.data.object, 'success');

      res.json({ received: true, event: event.type });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      await logWebhook('STRIPE', req.body?.type, req.body, 'error', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

async function processStripePaymentSuccess(paymentIntent) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Find by provider transaction ID
    const txResult = await client.query(
      `SELECT t.*, w.id as wallet_id, w.user_id
       FROM transactions t
       JOIN wallets w ON w.id = t.wallet_id
       WHERE t.provider_tx_id = $1
       FOR UPDATE`,
      [paymentIntent.id]
    );

    if (txResult.rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const transaction = txResult.rows[0];

    if (transaction.status === 'COMPLETED') {
      await client.query('COMMIT');
      return;
    }

    // Update wallet
    await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [transaction.amount, transaction.wallet_id]
    );

    // Update transaction
    await client.query(
      `UPDATE transactions
       SET status = 'COMPLETED',
           completed_at = NOW(),
           metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          stripe_payment_intent: paymentIntent.id,
          stripe_charge_id: paymentIntent.latest_charge,
          processed_at: new Date().toISOString()
        }),
        transaction.id
      ]
    );

    await redisClient.del(`wallet:${transaction.user_id}`);

    await client.query('COMMIT');
    console.log('Stripe payment processed:', transaction.id);

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function processStripePaymentFailure(paymentIntent) {
  await pool.query(
    `UPDATE transactions
     SET status = 'FAILED',
         failed_at = NOW(),
         metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
         updated_at = NOW()
     WHERE provider_tx_id = $2`,
    [
      JSON.stringify({
        failure_message: paymentIntent.last_payment_error?.message,
        decline_code: paymentIntent.last_payment_error?.decline_code
      }),
      paymentIntent.id
    ]
  );
}

async function processStripeRefund(charge) {
  console.log('Processing Stripe refund:', charge.id);
  // Implement refund logic
}

async function processStripeInvoicePayment(invoice) {
  console.log('Processing Stripe invoice payment:', invoice.id);
  // Implement subscription payment logic
}

/**
 * Mercado Pago Webhook Handler
 * POST /webhooks/mercadopago
 */
router.post('/mercadopago',
  webhookRateLimiter,
  captureRawBody,
  async (req, res) => {
    try {
      // Verify signature
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
      if (secret) {
        const signature = req.headers['x-signature'];
        if (!signature || !verifyMercadoPagoSignature(req.rawBody, signature, secret)) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const { type, data } = req.body;

      await logWebhook('MERCADO_PAGO', type, req.body, 'processing');

      // Check for duplicates
      const existingKey = `webhook:mp:${data?.id}`;
      const existing = await redisClient.get(existingKey);
      if (existing) {
        return res.json({ message: 'Already processed' });
      }

      switch (type) {
        case 'payment':
          await processMercadoPagoPayment(data.id);
          break;

        case 'merchant_order':
          await processMercadoPagoOrder(data.id);
          break;

        case 'subscription_preapproval':
          await processMercadoPagoSubscription(data.id);
          break;

        default:
          console.log('Unhandled Mercado Pago event:', type);
      }

      await redisClient.setEx(existingKey, 86400, 'processed');
      await logWebhook('MERCADO_PAGO', type, req.body, 'success');

      res.json({ received: true, type });
    } catch (error) {
      console.error('Mercado Pago webhook error:', error);
      await logWebhook('MERCADO_PAGO', req.body?.type, req.body, 'error', error.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

async function processMercadoPagoPayment(paymentId) {
  // Fetch payment details from Mercado Pago API
  const mercadopago = await import('mercadopago');

  try {
    const payment = await mercadopago.payment.get({
      id: paymentId,
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
    });

    const paymentData = payment.body || payment;

    if (paymentData.status === 'approved') {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const txResult = await client.query(
          `SELECT t.*, w.id as wallet_id, w.user_id
           FROM transactions t
           JOIN wallets w ON w.id = t.wallet_id
           WHERE t.provider_tx_id = $1
           FOR UPDATE`,
          [paymentId.toString()]
        );

        if (txResult.rows.length === 0) {
          await client.query('COMMIT');
          return;
        }

        const transaction = txResult.rows[0];

        if (transaction.status === 'COMPLETED') {
          await client.query('COMMIT');
          return;
        }

        await client.query(
          `UPDATE wallets
           SET balance = balance + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [transaction.amount, transaction.wallet_id]
        );

        await client.query(
          `UPDATE transactions
           SET status = 'COMPLETED',
               completed_at = NOW(),
               metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
               updated_at = NOW()
           WHERE id = $2`,
          [
            JSON.stringify({
              mp_payment_id: paymentId,
              mp_status: paymentData.status,
              mp_payment_method: paymentData.payment_method_id,
              processed_at: new Date().toISOString()
            }),
            transaction.id
          ]
        );

        await redisClient.del(`wallet:${transaction.user_id}`);

        await client.query('COMMIT');
        console.log('Mercado Pago payment processed:', transaction.id);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

  } catch (error) {
    console.error('Error fetching Mercado Pago payment:', error);
    throw error;
  }
}

async function processMercadoPagoOrder(orderId) {
  console.log('Processing Mercado Pago order:', orderId);
}

async function processMercadoPagoSubscription(preapprovalId) {
  console.log('Processing Mercado Pago subscription:', preapprovalId);
}

/**
 * Health check endpoint for webhook monitoring
 * GET /webhooks/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    webhooks: {
      spei: !!process.env.STIPAGO_WEBHOOK_SECRET,
      codi: !!process.env.STIPAGO_WEBHOOK_SECRET,
      stripe: !!process.env.STRIPE_WEBHOOK_SECRET,
      mercadopago: !!process.env.MERCADOPAGO_WEBHOOK_SECRET
    }
  });
});

export default router;
