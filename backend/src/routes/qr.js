import express from 'express';
import QRCode from 'qrcode';
import { authenticateToken, requireVerified } from '../middleware/auth.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';
import { validate, schemas } from '../middleware/validation.js';
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { createSPEIProcessor } from '../utils/stipago.js';

const router = express.Router();

/**
 * Generate a new QR code
 * POST /api/qr/generate
 */
router.post('/generate',
  authenticateToken,
  requireVerified,
  paymentRateLimiter,
  async (req, res) => {
    try {
      const {
        name,
        description,
        amount,
        currency = 'MXN',
        type = 'DYNAMIC',
        format = 'PNG',
        size = 300,
        color,
        backgroundColor,
        logo,
        expiresIn,
        location,
        deviceId
      } = req.body;

      // Validate amount for static QR
      if (type === 'STATIC' && (!amount || amount <= 0)) {
        return res.status(400).json({
          error: 'Static QR codes require a fixed amount'
        });
      }

      // Generate unique QR code ID
      const qrId = uuidv4();
      const shortCode = `QR-${Date.now().toString(36).toUpperCase()}`;

      // Build payment URL
      const baseUrl = process.env.API_BASE_URL || 'https://api.pika.mx';
      const paymentUrl = `${baseUrl}/pay/qr/${shortCode}`;

      // Generate QR code data
      const qrData = JSON.stringify({
        type: type === 'PAYMENT_REQUEST' ? 'payment' : 'qr',
        id: qrId,
        code: shortCode,
        amount: amount || null,
        currency,
        merchantId: req.user.id,
        merchantName: req.user.full_name || req.user.email,
        url: paymentUrl
      });

      // Generate QR code image
      const qrOptions = {
        type: format.toLowerCase() === 'svg' ? 'svg' : 'png',
        width: size,
        margin: 2,
        color: {
          dark: color || '#000000',
          light: backgroundColor || '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      };

      let qrImage;
      if (format.toUpperCase() === 'SVG') {
        qrImage = await QRCode.toString(qrData, qrOptions);
      } else {
        qrImage = await QRCode.toDataURL(qrData, qrOptions);
      }

      // Calculate expiration
      const expiresAt = expiresIn
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
        : null;

      // Save to database
      const result = await pool.query(
        `INSERT INTO qr_codes (
          id, user_id, name, description, amount, currency, type,
          data, format, size, color, background_color, logo,
          target_url, location, device_id, expires_at, is_active,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING *`,
        [
          qrId,
          req.user.id,
          name,
          description || null,
          amount || 0,
          currency,
          type,
          qrData,
          format,
          size,
          color || null,
          backgroundColor || null,
          logo || null,
          paymentUrl,
          location || null,
          deviceId || null,
          expiresAt,
          true
        ]
      );

      res.status(201).json({
        message: 'QR code generated successfully',
        qrCode: {
          id: qrId,
          code: shortCode,
          name,
          description,
          amount,
          currency,
          type,
          format,
          size,
          url: paymentUrl,
          image: qrImage,
          expiresAt,
          isActive: true
        }
      });
    } catch (error) {
      console.error('QR generation error:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  }
);

/**
 * Scan/Process a QR code
 * POST /api/qr/scan
 */
router.post('/scan',
  authenticateToken,
  paymentRateLimiter,
  async (req, res) => {
    try {
      const { qrData, amount: customAmount } = req.body;

      let parsedData;
      try {
        parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid QR code format' });
      }

      // Handle different QR types
      if (parsedData.type === 'payment' || parsedData.type === 'payment_request') {
        // This is a payment QR - process payment
        const { id: qrId, code, amount: qrAmount, merchantId } = parsedData;

        // Verify QR code exists and is valid
        const qrResult = await pool.query(
          `SELECT * FROM qr_codes
           WHERE id = $1 AND is_active = true
           AND (expires_at IS NULL OR expires_at > NOW())`,
          [qrId]
        );

        if (qrResult.rows.length === 0) {
          return res.status(404).json({ error: 'QR code not found or expired' });
        }

        const qrCode = qrResult.rows[0];

        // Update scan count
        await pool.query(
          `UPDATE qr_codes
           SET scan_count = scan_count + 1,
               last_scanned_at = NOW()
           WHERE id = $1`,
          [qrId]
        );

        // Determine payment amount
        const paymentAmount = qrAmount || customAmount;
        if (!paymentAmount || paymentAmount <= 0) {
          return res.status(400).json({
            error: 'Payment amount required',
            message: 'This QR code requires you to specify an amount'
          });
        }

        res.json({
          type: 'payment_request',
          qrCode: {
            id: qrId,
            code,
            merchantId,
            merchantName: parsedData.merchantName,
            amount: paymentAmount,
            currency: parsedData.currency || 'MXN'
          },
          action: 'confirm_payment',
          paymentUrl: `/api/payments/qr/${qrId}/pay`
        });
      } else if (parsedData.type === 'SPEI') {
        // SPEI QR code
        res.json({
          type: 'spei_transfer',
          data: {
            clabe: parsedData.clabe,
            amount: parsedData.amount,
            reference: parsedData.reference,
            bankName: parsedData.bankName
          },
          action: 'initiate_spei'
        });
      } else {
        // Generic QR - return data
        res.json({
          type: 'generic',
          data: parsedData,
          action: 'display'
        });
      }
    } catch (error) {
      console.error('QR scan error:', error);
      res.status(500).json({ error: 'Failed to process QR code' });
    }
  }
);

/**
 * Pay via QR code
 * POST /api/qr/:id/pay
 */
router.post('/:id/pay',
  authenticateToken,
  requireVerified,
  paymentRateLimiter,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { amount: customAmount, description } = req.body;

      // Get QR code details
      const qrResult = await pool.query(
        `SELECT q.*, w.id as wallet_id, w.user_id as merchant_user_id
         FROM qr_codes q
         JOIN wallets w ON w.user_id = q.user_id
         WHERE q.id = $1 AND q.is_active = true`,
        [id]
      );

      if (qrResult.rows.length === 0) {
        return res.status(404).json({ error: 'QR code not found' });
      }

      const qrCode = qrResult.rows[0];

      // Check expiration
      if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
        return res.status(400).json({ error: 'QR code has expired' });
      }

      // Cannot pay yourself
      if (qrCode.user_id === req.user.id) {
        return res.status(400).json({ error: 'Cannot pay your own QR code' });
      }

      // Determine amount
      const paymentAmount = qrCode.amount > 0 ? qrCode.amount : customAmount;
      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({ error: 'Invalid payment amount' });
      }

      // Get payer wallet
      const payerWalletResult = await pool.query(
        'SELECT * FROM wallets WHERE user_id = $1',
        [req.user.id]
      );

      if (payerWalletResult.rows.length === 0) {
        return res.status(404).json({ error: 'Payer wallet not found' });
      }

      const payerWallet = payerWalletResult.rows[0];

      // Check sufficient funds
      if (parseFloat(payerWallet.balance) < paymentAmount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      // Process transfer
      const { transfer, createPair } = await import('../models/Wallet.js');
      const { Transaction } = await import('../models/Transaction.js');

      const transferResult = await transfer(
        payerWallet.id,
        qrCode.wallet_id,
        paymentAmount,
        {
          description: description || `QR Payment: ${qrCode.name}`,
          metadata: {
            qrCodeId: id,
            qrName: qrCode.name,
            merchantId: qrCode.user_id
          }
        }
      );

      // Create transaction records
      const transactions = await Transaction.createPair(
        {
          userId: req.user.id,
          walletId: payerWallet.id,
          amount: paymentAmount,
          currency: qrCode.currency,
          status: 'completed',
          description: description || `Paid via QR: ${qrCode.name}`,
          metadata: {
            type: 'qr_payment',
            direction: 'outgoing',
            qrCodeId: id,
            merchantId: qrCode.user_id
          }
        },
        {
          userId: qrCode.user_id,
          walletId: qrCode.wallet_id,
          amount: paymentAmount,
          currency: qrCode.currency,
          status: 'completed',
          description: `QR Payment received: ${qrCode.name}`,
          metadata: {
            type: 'qr_payment',
            direction: 'incoming',
            qrCodeId: id,
            payerId: req.user.id
          }
        }
      );

      // Update scan stats
      await pool.query(
        `UPDATE qr_codes
         SET scan_count = scan_count + 1,
             last_scanned_at = NOW()
         WHERE id = $1`,
        [id]
      );

      res.json({
        message: 'Payment successful',
        transaction: transactions.from,
        amount: paymentAmount,
        currency: qrCode.currency,
        merchant: {
          id: qrCode.user_id,
          name: qrCode.name
        }
      });
    } catch (error) {
      console.error('QR payment error:', error);

      if (error.message === 'Insufficient funds') {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      res.status(500).json({ error: 'Payment failed' });
    }
  }
);

/**
 * Get QR code details
 * GET /api/qr/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT q.*, u.full_name as merchant_name
       FROM qr_codes q
       JOIN users u ON u.id = q.user_id
       WHERE q.id = $1 AND q.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const qrCode = result.rows[0];

    res.json({
      id: qrCode.id,
      name: qrCode.name,
      description: qrCode.description,
      amount: qrCode.amount,
      currency: qrCode.currency,
      type: qrCode.type,
      format: qrCode.format,
      size: qrCode.size,
      color: qrCode.color,
      backgroundColor: qrCode.background_color,
      targetUrl: qrCode.target_url,
      location: qrCode.location,
      deviceId: qrCode.device_id,
      scanCount: qrCode.scan_count,
      lastScannedAt: qrCode.last_scanned_at,
      expiresAt: qrCode.expires_at,
      isActive: qrCode.is_active,
      createdAt: qrCode.created_at
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

/**
 * List user's QR codes
 * GET /api/qr
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0, type, isActive } = req.query;

    let query = 'SELECT * FROM qr_codes WHERE user_id = $1';
    const params = [req.user.id];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (isActive !== undefined) {
      query += ` AND is_active = $${paramIndex++}`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      qrCodes: result.rows.map(qr => ({
        id: qr.id,
        name: qr.name,
        description: qr.description,
        amount: qr.amount,
        currency: qr.currency,
        type: qr.type,
        format: qr.format,
        targetUrl: qr.target_url,
        scanCount: qr.scan_count,
        lastScannedAt: qr.last_scanned_at,
        expiresAt: qr.expires_at,
        isActive: qr.is_active,
        createdAt: qr.created_at
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: result.rows.length
      }
    });
  } catch (error) {
    console.error('List QR codes error:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

/**
 * Deactivate/Delete QR code
 * DELETE /api/qr/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE qr_codes
       SET is_active = false,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.json({ message: 'QR code deactivated successfully' });
  } catch (error) {
    console.error('Deactivate QR code error:', error);
    res.status(500).json({ error: 'Failed to deactivate QR code' });
  }
});

export default router;
