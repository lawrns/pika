import express from 'express';
import { Wallet } from '../models/Wallet.js';
import { authenticateToken, requireVerified } from '../middleware/auth.js';
import { transferRateLimiter } from '../middleware/rateLimiter.js';
import { requireIdempotency } from '../middleware/idempotency.js';
import redisClient from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';
import { createIdempotencyKey } from '../utils/transaction.js';

const router = express.Router();

/**
 * Create a new wallet
 * POST /api/wallet/create
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { currency = 'MXN', dailyLimit, monthlyLimit } = req.body;

    // Check if user already has a wallet
    const existingWallet = await Wallet.findByUserId(req.user.id);
    if (existingWallet) {
      return res.status(400).json({
        error: 'Wallet already exists for this user',
        walletId: existingWallet.id
      });
    }

    // Create new wallet
    const wallet = await Wallet.create(req.user.id, {
      currency,
      dailyLimit: dailyLimit ? Math.round(dailyLimit * 100) : null, // Convert to cents
      monthlyLimit: monthlyLimit ? Math.round(monthlyLimit * 100) : null
    });

    res.status(201).json({
      message: 'Wallet created successfully',
      wallet: {
        id: wallet.id,
        userId: wallet.user_id,
        balance: 0,
        currency: wallet.currency,
        isActive: true,
        createdAt: wallet.created_at
      }
    });
  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({ error: 'Failed to create wallet' });
  }
});

// Get wallet balance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.findByUserId(req.user.id);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      walletId: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
      isActive: wallet.is_active,
      version: wallet.version
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      type,
      status,
      startDate,
      endDate
    } = req.query;

    const transactions = await Transaction.findByUserId(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
      status,
      startDate,
      endDate
    });

    const summary = await Transaction.getSummary(req.user.id);

    res.json({
      transactions,
      summary,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: transactions.length
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/transactions/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get related transaction if this is a transfer
    if (transaction.counterparty_info?.type === 'user_transfer' || 
        transaction.counterparty_info?.type === 'payment_link') {
      const related = await Transaction.getRelatedTransaction(transaction.id);
      if (related) {
        return res.json({
          ...transaction,
          related_transaction: related
        });
      }
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Transfer to another user with idempotency and atomic operations
router.post('/transfer',
  authenticateToken,
  requireVerified,
  transferRateLimiter,
  requireIdempotency('user-transfer'),
  async (req, res) => {
  try {
    const { recipientEmail, amount, description } = req.body;

    if (!recipientEmail || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid transfer parameters' });
    }

    const requestId = req.headers['x-request-id'] || uuidv4();
    const idempotencyKey = createIdempotencyKey(
      req.user.id,
      `transfer:${recipientEmail}`,
      requestId
    );

    const { User } = await import('../models/User.js');

    // Get recipient user
    const recipient = await User.findByEmail(recipientEmail);

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    // Get sender wallet
    const senderWallet = await Wallet.findByUserId(req.user.id);
    if (!senderWallet) {
      return res.status(404).json({ error: 'Sender wallet not found' });
    }

    // Get or create recipient wallet
    let recipientWallet = await Wallet.findByUserId(recipient.id);
    if (!recipientWallet) {
      recipientWallet = await Wallet.create(recipient.id);
    }

    // Validate wallet states
    await Wallet.validateWallet(senderWallet.id);
    await Wallet.validateWallet(recipientWallet.id);

    // Perform atomic transfer with idempotency
    const transferResult = await Wallet.transfer(
      senderWallet.id,
      recipientWallet.id,
      amount,
      {
        idempotencyKey,
        description: description || `Transfer to ${recipientEmail}`,
        metadata: {
          type: 'user_transfer',
          senderId: req.user.id,
          senderEmail: req.user.email,
          recipientId: recipient.id,
          recipientEmail: recipient.email
        }
      }
    );

    if (transferResult.idempotent) {
      // Return existing transactions
      const existingTx = transferResult.transactions;
      return res.json({
        message: 'Transfer already processed',
        idempotent: true,
        transactions: existingTx,
        existing: true
      });
    }

    // Create paired transaction records
    const transactions = await Transaction.createPair(
      {
        userId: req.user.id,
        walletId: senderWallet.id,
        amount,
        currency: 'MXN',
        status: 'completed',
        description: description || `Transfer to ${recipientEmail}`,
        counterpartyInfo: {
          email: recipientEmail,
          type: 'user_transfer',
          userId: recipient.id
        },
        metadata: {
          type: 'user_transfer',
          direction: 'outgoing'
        }
      },
      {
        userId: recipient.id,
        walletId: recipientWallet.id,
        amount,
        currency: 'MXN',
        status: 'completed',
        description: description || `Transfer from ${req.user.email}`,
        counterpartyInfo: {
          email: req.user.email,
          type: 'user_transfer',
          userId: req.user.id
        },
        metadata: {
          type: 'user_transfer',
          direction: 'incoming'
        }
      },
      { idempotencyKey }
    );

    // Invalidate cache for both users
    await redisClient.del(`wallet:${req.user.id}`);
    await redisClient.del(`wallet:${recipient.id}`);

    res.status(201).json({
      message: 'Transfer successful',
      idempotent: false,
      transaction: transactions.from,
      relatedTransaction: transactions.to,
      newBalance: transferResult.fromWallet.balance
    });
  } catch (error) {
    console.error('Transfer error:', error);

    if (error.message === 'Insufficient funds') {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    if (error.message === 'One or both wallets not found') {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (error.message.includes('frozen')) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes('concurrent modification')) {
      return res.status(409).json({ error: 'Transfer conflict - please try again' });
    }

    res.status(500).json({ error: 'Transfer failed' });
  }
});

// Get wallet details with version info (for optimistic locking)
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.getWithVersion(
      (await Wallet.findByUserId(req.user.id)).id
    );

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({
      walletId: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
      isActive: wallet.is_active,
      version: wallet.version,
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at
    });
  } catch (error) {
    console.error('Get wallet details error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
});

// Reserve funds (for pending operations)
router.post('/reserve', authenticateToken, requireVerified, async (req, res) => {
  try {
    const { amount, ttlMinutes = 30 } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const wallet = await Wallet.findByUserId(req.user.id);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const reservationId = uuidv4();

    const result = await Wallet.reserveFunds(
      wallet.id,
      amount,
      reservationId,
      ttlMinutes
    );

    res.status(201).json({
      message: 'Funds reserved successfully',
      reservation: result
    });
  } catch (error) {
    console.error('Reserve funds error:', error);

    if (error.message === 'Insufficient funds for reservation') {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    res.status(500).json({ error: 'Failed to reserve funds' });
  }
});

// Release reserved funds
router.post('/reserve/:reservationId/release', authenticateToken, async (req, res) => {
  try {
    const { commit = true } = req.body;

    const result = await Wallet.releaseReservation(
      req.params.reservationId,
      commit
    );

    res.json({
      message: commit ? 'Reservation committed' : 'Reservation cancelled',
      result
    });
  } catch (error) {
    console.error('Release reservation error:', error);

    if (error.message === 'Reservation not found or already released') {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.status(500).json({ error: 'Failed to release reservation' });
  }
});

// Get transfer history between two users
router.get('/transfers/:userId', authenticateToken, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const { limit = 20, offset = 0 } = req.query;

    // Get transfers where current user is sender or receiver
    const transactions = await Transaction.findByUserId(req.user.id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const transfers = transactions.filter(t => {
      const counterpartyId = t.counterparty_info?.userId;
      return t.type === 'transfer' && counterpartyId === parseInt(otherUserId);
    });

    res.json({
      transfers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: transfers.length
      }
    });
  } catch (error) {
    console.error('Get transfer history error:', error);
    res.status(500).json({ error: 'Failed to fetch transfer history' });
  }
});

export default router;
