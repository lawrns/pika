import pool from '../config/database.js';
import {
  withTransaction,
  withAdvisoryLock,
  lockWallet,
  lockWallets,
  updateWalletBalance,
  createLockKey
} from '../utils/transaction.js';

export class Wallet {
  /**
   * Create a new wallet for a user
   */
  static async create(userId, options = {}) {
    const { currency = 'MXN', dailyLimit = null, monthlyLimit = null } = options;

    return withTransaction(async (client) => {
      // Check if wallet already exists
      const existing = await client.query(
        'SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (existing.rows.length > 0) {
        throw new Error('Wallet already exists for this user');
      }

      const result = await client.query(
        `INSERT INTO wallets (user_id, balance, currency, is_active, daily_limit, monthly_limit, version)
         VALUES ($1, 0.00, $2, true, $3, $4, 1)
         RETURNING *`,
        [userId, currency, dailyLimit, monthlyLimit]
      );

      return result.rows[0];
    });
  }

  /**
   * Find wallet by user ID with optional locking
   */
  static async findByUserId(userId, options = {}) {
    const { forUpdate = false, client } = options;

    const queryClient = client || pool;
    const forUpdateClause = forUpdate ? ' FOR UPDATE' : '';

    const result = await queryClient.query(
      `SELECT * FROM wallets 
       WHERE user_id = $1${forUpdateClause}`,
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Find wallet by ID with optional locking
   */
  static async findById(walletId, options = {}) {
    const { forUpdate = false, client } = options;

    const queryClient = client || pool;
    const forUpdateClause = forUpdate ? ' FOR UPDATE' : '';

    const result = await queryClient.query(
      `SELECT * FROM wallets 
       WHERE id = $1${forUpdateClause}`,
      [walletId]
    );

    return result.rows[0];
  }

  /**
   * Get current balance (cached version available via Redis)
   */
  static async getBalance(userId) {
    const result = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.balance || 0;
  }

  /**
   * Update wallet balance with atomic operation and row locking
   * This is the PRIMARY method for all balance updates
   */
  static async updateBalance(walletId, amount, transactionType, options = {}) {
    const {
      allowNegative = false,
      minimumBalance = 0,
      idempotencyKey = null,
      metadata = {}
    } = options;

    const lockKey = createLockKey('wallet', walletId);

    return withAdvisoryLock(lockKey, async (client) => {
      // Check idempotency if key provided
      if (idempotencyKey) {
        const existing = await client.query(
          `SELECT t.status, t.amount, t.type
           FROM transactions t
           WHERE t.idempotency_key = $1`,
          [idempotencyKey]
        );

        if (existing.rows.length > 0) {
          const tx = existing.rows[0];
          return {
            idempotent: true,
            status: tx.status,
            amount: tx.amount,
            type: tx.type
          };
        }
      }

      // Lock the wallet row
      const wallet = await lockWallet(client, walletId);

      // Check if wallet is active
      if (!wallet.is_active) {
        throw new Error('Wallet is frozen');
      }

      // Calculate new balance
      const isCredit = transactionType === 'credit';
      const change = isCredit ? amount : -amount;
      const newBalance = parseFloat(wallet.balance) + change;

      // Validate balance constraints
      if (!allowNegative && newBalance < minimumBalance) {
        throw new Error('Insufficient funds');
      }

      // Update balance atomically
      const result = await client.query(
        `UPDATE wallets
         SET balance = $1,
             version = version + 1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newBalance, walletId]
      );

      return result.rows[0];
    });
  }

  /**
   * Transfer funds between wallets atomically
   * Uses distributed locking and consistent lock ordering to prevent deadlocks
   */
  static async transfer(fromWalletId, toWalletId, amount, options = {}) {
    const {
      idempotencyKey = null,
      description = null,
      metadata = {},
      requireReference = true
    } = options;

    if (fromWalletId === toWalletId) {
      throw new Error('Cannot transfer to same wallet');
    }

    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Create lock key for the transfer operation
    const lockKey = createLockKey('transfer', ...[fromWalletId, toWalletId].sort());

    return withAdvisoryLock(lockKey, async (client) => {
      // Check idempotency
      if (idempotencyKey) {
        const existing = await client.query(
          `SELECT t.id, t.status
           FROM transactions t
           WHERE t.idempotency_key = $1
           LIMIT 2`,
          [idempotencyKey]
        );

        if (existing.rows.length > 0) {
          return {
            idempotent: true,
            transactions: existing.rows
          };
        }
      }

      // Lock both wallets in consistent order (by ID) to prevent deadlocks
      const wallets = await lockWallets(client, [fromWalletId, toWalletId]);
      
      const fromWallet = wallets.find(w => w.id === fromWalletId);
      const toWallet = wallets.find(w => w.id === toWalletId);

      if (!fromWallet || !toWallet) {
        throw new Error('One or both wallets not found');
      }

      // Check sender wallet is active
      if (!fromWallet.is_active) {
        throw new Error('Sender wallet is frozen');
      }

      // Check receiver wallet is active
      if (!toWallet.is_active) {
        throw new Error('Receiver wallet is frozen');
      }

      // Check sufficient funds
      if (parseFloat(fromWallet.balance) < amount) {
        throw new Error('Insufficient funds');
      }

      // Perform atomic transfer using a single UPDATE statement
      const transferResult = await client.query(
        `UPDATE wallets
         SET balance = CASE 
           WHEN id = $1 THEN balance - $3
           WHEN id = $2 THEN balance + $3
         END,
             version = version + 1,
             updated_at = NOW()
         WHERE id IN ($1, $2)
           AND (id != $1 OR balance >= $3)
         RETURNING *`,
        [fromWalletId, toWalletId, amount]
      );

      if (transferResult.rows.length !== 2) {
        throw new Error('Transfer failed - concurrent modification detected');
      }

      return {
        success: true,
        fromWallet: transferResult.rows.find(w => w.id === fromWalletId),
        toWallet: transferResult.rows.find(w => w.id === toWalletId)
      };
    });
  }

  /**
   * Freeze a wallet (prevent transactions)
   */
  static async freeze(walletId, reason = null) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE wallets 
         SET is_active = false, 
             freeze_reason = $2,
             updated_at = NOW()
         WHERE id = $1 
         RETURNING *`,
        [walletId, reason]
      );

      if (result.rows.length === 0) {
        throw new Error('Wallet not found');
      }

      return result.rows[0];
    });
  }

  /**
   * Unfreeze a wallet
   */
  static async unfreeze(walletId) {
    const result = await pool.query(
      `UPDATE wallets 
       SET is_active = true, 
           freeze_reason = NULL,
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [walletId]
    );

    if (result.rows.length === 0) {
      throw new Error('Wallet not found');
    }

    return result.rows[0];
  }

  /**
   * Get wallet with version for optimistic locking
   */
  static async getWithVersion(walletId) {
    const result = await pool.query(
      'SELECT * FROM wallets WHERE id = $1',
      [walletId]
    );
    return result.rows[0];
  }

  /**
   * Update wallet with optimistic locking
   */
  static async updateWithVersion(walletId, updates, expectedVersion) {
    return withTransaction(async (client) => {
      const setClause = Object.keys(updates)
        .map((key, idx) => `${key} = $${idx + 2}`)
        .join(', ');

      const values = [walletId, expectedVersion, ...Object.values(updates)];

      const result = await client.query(
        `UPDATE wallets
         SET ${setClause},
             version = version + 1,
             updated_at = NOW()
         WHERE id = $1 AND version = $2
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Wallet was modified by another transaction');
      }

      return result.rows[0];
    });
  }

  /**
   * Validate wallet state before operations
   */
  static async validateWallet(walletId) {
    const wallet = await this.findById(walletId);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (!wallet.is_active) {
      throw new Error(`Wallet is frozen: ${wallet.freeze_reason || 'No reason provided'}`);
    }

    return wallet;
  }

  /**
   * Reserve funds for a pending operation
   */
  static async reserveFunds(walletId, amount, reservationId, ttlMinutes = 30) {
    return withTransaction(async (client) => {
      // Lock wallet
      const wallet = await lockWallet(client, walletId);

      // Check balance
      if (parseFloat(wallet.balance) < amount) {
        throw new Error('Insufficient funds for reservation');
      }

      // Deduct from balance
      await client.query(
        `UPDATE wallets
         SET balance = balance - $1,
             reserved_balance = reserved_balance + $1,
             version = version + 1,
             updated_at = NOW()
         WHERE id = $2`,
        [amount, walletId]
      );

      // Create reservation record
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await client.query(
        `INSERT INTO fund_reservations (wallet_id, amount, reservation_id, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [walletId, amount, reservationId, expiresAt]
      );

      return {
        success: true,
        reservationId,
        amount,
        expiresAt
      };
    });
  }

  /**
   * Release reserved funds (either commit or rollback)
   */
  static async releaseReservation(reservationId, commit = true) {
    return withTransaction(async (client) => {
      // Get reservation
      const reservation = await client.query(
        `SELECT * FROM fund_reservations
         WHERE reservation_id = $1 AND released = false
         FOR UPDATE`,
        [reservationId]
      );

      if (reservation.rows.length === 0) {
        throw new Error('Reservation not found or already released');
      }

      const res = reservation.rows[0];

      if (commit) {
        // Funds already deducted, just mark as released
        await client.query(
          `UPDATE fund_reservations
           SET released = true, released_at = NOW()
           WHERE reservation_id = $1`,
          [reservationId]
        );
      } else {
        // Rollback: return funds to balance
        await client.query(
          `UPDATE wallets
           SET balance = balance + $1,
               reserved_balance = reserved_balance - $1,
               version = version + 1,
               updated_at = NOW()
           WHERE id = $2`,
          [res.amount, res.wallet_id]
        );

        await client.query(
          `UPDATE fund_reservations
           SET released = true, released_at = NOW()
           WHERE reservation_id = $1`,
          [reservationId]
        );
      }

      return { success: true };
    });
  }
}

export default Wallet;
