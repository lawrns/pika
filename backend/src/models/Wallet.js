import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { withTransaction, withAdvisoryLock, createLockKey } from '../utils/transaction.js';

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    user_id: row.userId,
    is_active: row.isActive && !row.isFrozen,
    daily_limit: row.dailyLimit,
    monthly_limit: row.monthlyLimit,
    freeze_reason: row.frozenReason,
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

export class Wallet {
  static async create(userId, options = {}) {
    const { currency = 'MXN', dailyLimit = null, monthlyLimit = null } = options;
    return withTransaction(async (client) => {
      const existing = await client.query('SELECT id FROM wallets WHERE "userId" = $1 FOR UPDATE', [userId]);
      if (existing.rows.length > 0) return normalize(existing.rows[0]);
      const result = await client.query(
        `INSERT INTO wallets (id, "userId", balance, currency, "dailyLimit", "monthlyLimit", "createdAt", "updatedAt")
         VALUES ($1, $2, 0, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [uuidv4(), userId, currency, dailyLimit, monthlyLimit]
      );
      return normalize(result.rows[0]);
    });
  }

  static async findByUserId(userId, options = {}) {
    const { forUpdate = false, client } = options;
    const queryClient = client || pool;
    const result = await queryClient.query(`SELECT * FROM wallets WHERE "userId" = $1${forUpdate ? ' FOR UPDATE' : ''}`, [userId]);
    return normalize(result.rows[0]);
  }

  static async findById(walletId, options = {}) {
    const { forUpdate = false, client } = options;
    const queryClient = client || pool;
    const result = await queryClient.query(`SELECT * FROM wallets WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`, [walletId]);
    return normalize(result.rows[0]);
  }

  static async getBalance(userId) {
    const result = await pool.query('SELECT balance FROM wallets WHERE "userId" = $1', [userId]);
    return result.rows[0]?.balance || 0;
  }

  static async transfer(fromWalletId, toWalletId, amount, options = {}) {
    const value = Math.round(Number(amount));
    if (fromWalletId === toWalletId) throw new Error('Cannot transfer to same wallet');
    if (value <= 0) throw new Error('Transfer amount must be positive');
    const lockKey = createLockKey('transfer', ...[fromWalletId, toWalletId].sort());

    return withAdvisoryLock(lockKey, async (client) => {
      await client.query('BEGIN');
      try {
        const walletsResult = await client.query('SELECT * FROM wallets WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [fromWalletId, toWalletId]);
        const wallets = walletsResult.rows.map(normalize);
        const fromWallet = wallets.find(w => w.id === fromWalletId);
        const toWallet = wallets.find(w => w.id === toWalletId);
        if (!fromWallet || !toWallet) throw new Error('One or both wallets not found');
        if (!fromWallet.is_active) throw new Error('Sender wallet is frozen');
        if (!toWallet.is_active) throw new Error('Receiver wallet is frozen');
        if (Number(fromWallet.balance) < value) throw new Error('Insufficient funds');

        const transferResult = await client.query(
          `UPDATE wallets
           SET balance = CASE WHEN id = $1 THEN balance - $3 WHEN id = $2 THEN balance + $3 END,
               "updatedAt" = NOW()
           WHERE id IN ($1, $2)
           RETURNING *`,
          [fromWalletId, toWalletId, value]
        );
        await client.query('COMMIT');
        const updated = transferResult.rows.map(normalize);
        return {
          success: true,
          fromWallet: updated.find(w => w.id === fromWalletId),
          toWallet: updated.find(w => w.id === toWalletId)
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }

  static async updateBalance(walletId, amount, transactionType) {
    const delta = transactionType === 'credit' ? Math.round(Number(amount)) : -Math.round(Number(amount));
    const result = await pool.query(
      `UPDATE wallets SET balance = balance + $1, "updatedAt" = NOW()
       WHERE id = $2 AND (balance + $1) >= 0 RETURNING *`,
      [delta, walletId]
    );
    if (!result.rows[0]) throw new Error('Insufficient funds');
    return normalize(result.rows[0]);
  }
}

export default Wallet;
