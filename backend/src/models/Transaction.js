import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import {
  withTransaction,
  createIdempotentTransaction,
  checkIdempotencyKey,
  createIdempotencyKey,
  retry
} from '../utils/transaction.js';
import encryptionManager from '../utils/encryption.js';
import securityConfig from '../config/security.js';

export class Transaction {
  /**
   * Encrypt sensitive fields in metadata
   */
  static encryptSensitiveMetadata(metadata) {
    if (!metadata) return metadata;

    const encryptedMetadata = { ...metadata };
    
    // Encrypt sensitive fields defined in security config
    for (const field of securityConfig.sensitiveFields) {
      if (encryptedMetadata[field]) {
        const encrypted = encryptionManager.encrypt(encryptedMetadata[field].toString());
        encryptedMetadata[field] = {
          _encrypted: encrypted.encrypted,
          _iv: encrypted.iv,
          _authTag: encrypted.authTag
        };
      }
    }

    return encryptedMetadata;
  }

  /**
   * Decrypt sensitive fields in metadata
   */
  static decryptSensitiveMetadata(metadata) {
    if (!metadata) return metadata;

    const decryptedMetadata = { ...metadata };

    for (const field of securityConfig.sensitiveFields) {
      if (decryptedMetadata[field] && decryptedMetadata[field]._encrypted) {
        try {
          decryptedMetadata[field] = encryptionManager.decrypt(
            decryptedMetadata[field]._encrypted,
            decryptedMetadata[field]._iv,
            decryptedMetadata[field]._authTag
          );
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted value if decryption fails
          decryptedMetadata[field] = '[ENCRYPTED]';
        }
      }
    }

    return decryptedMetadata;
  }

  /**
   * Create a new transaction with idempotency support
   */
  static async create({
    userId,
    walletId,
    type,
    amount,
    currency,
    status = 'pending',
    referenceCode,
    speiTrackingKey,
    paymentLinkId,
    counterpartyInfo,
    description,
    metadata,
    idempotencyKey = null,
    requestHash = null
  }) {
    // Encrypt sensitive metadata fields
    const encryptedMetadata = this.encryptSensitiveMetadata(metadata);
    // Generate reference code if not provided
    const refCode = referenceCode || this.generateReferenceCode();

    // Use idempotency if key provided
    if (idempotencyKey) {
      const result = await withTransaction(async (client) => {
        return await createIdempotentTransaction(client, idempotencyKey, {
          userId,
          walletId,
          type,
          amount,
          currency: currency || 'MXN',
          status,
          referenceCode: refCode,
          speiTrackingKey,
          paymentLinkId,
          counterpartyInfo,
          description,
          metadata: encryptedMetadata,
          requestHash
        });
      });

      if (result.existing) {
        return {
          idempotent: true,
          transaction: result.transaction
        };
      }

      return {
        idempotent: false,
        transaction: result.transaction
      };
    }

    // Non-idempotent creation
    const queryResult = await pool.query(
      `INSERT INTO transactions (
        user_id, wallet_id, type, amount, currency, status,
        reference_code, spei_tracking_key, payment_link_id,
        counterparty_info, description, metadata, idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        userId, walletId, type, amount, currency || 'MXN', status,
        refCode, speiTrackingKey, paymentLinkId,
        counterpartyInfo, description, encryptedMetadata, null
      ]
    );

    return {
      idempotent: false,
      transaction: queryResult.rows[0]
    };
  }

  /**
   * Generate unique reference code
   */
  static generateReferenceCode() {
    return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  /**
   * Find transaction by ID
   */
  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    const transaction = result.rows[0];
    if (transaction && transaction.metadata) {
      transaction.metadata = this.decryptSensitiveMetadata(transaction.metadata);
    }
    return transaction;
  }

  /**
   * Find transaction by reference code
   */
  static async findByReferenceCode(code) {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE reference_code = $1',
      [code]
    );
    const transaction = result.rows[0];
    if (transaction && transaction.metadata) {
      transaction.metadata = this.decryptSensitiveMetadata(transaction.metadata);
    }
    return transaction;
  }

  /**
   * Find transactions by user with pagination and filters
   */
  static async findByUserId(userId, { limit = 20, offset = 0, type, status, startDate, endDate } = {}) {
    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    // Decrypt sensitive fields in metadata
    return result.rows.map(transaction => {
      if (transaction.metadata) {
        transaction.metadata = this.decryptSensitiveMetadata(transaction.metadata);
      }
      return transaction;
    });
  }

  /**
   * Update transaction status with validation and retry logic
   */
  static async updateStatus(transactionId, newStatus, options = {}) {
    const {
      fromStatus = null,
      idempotencyKey = null,
      metadata = {}
    } = options;

    return retry(async () => {
      return await withTransaction(async (client) => {
        let query = 'UPDATE transactions SET status = $1';
        const values = [newStatus];
        let paramIndex = 2;

        // Add metadata if provided
        if (Object.keys(metadata).length > 0) {
          query += `, metadata = COALESCE(metadata, '{}'::jsonb) || $${paramIndex++}`;
          values.push(JSON.stringify(metadata));
        }

        query += ' WHERE id = $' + paramIndex++;
        values.push(transactionId);

        // Validate status transition if fromStatus provided
        if (fromStatus) {
          query += ' AND status = $' + paramIndex++;
          values.push(fromStatus);
        }

        query += ' RETURNING *';

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
          if (fromStatus) {
            const current = await client.query(
              'SELECT status FROM transactions WHERE id = $1',
              [transactionId]
            );
            if (current.rows.length > 0) {
              throw new Error(
                `Cannot transition from ${current.rows[0].status} to ${newStatus}`
              );
            }
          }
          throw new Error('Transaction not found');
        }

        return result.rows[0];
      });
    }, {
      maxRetries: 3,
      shouldRetry: (error) => {
        // Retry on serialization failures
        return error.code === '40001' || error.code === '40P01';
      }
    });
  }

  /**
   * Add SPEI tracking key to transaction
   */
  static async addSPEITracking(transactionId, trackingKey) {
    const result = await pool.query(
      'UPDATE transactions SET spei_tracking_key = $1 WHERE id = $2 RETURNING *',
      [trackingKey, transactionId]
    );
    return result.rows[0];
  }

  /**
   * Get transaction summary for user
   */
  static async getSummary(userId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_transactions,
         COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
         COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
         COALESCE(SUM(CASE WHEN status = 'completed' AND type = 'credit' THEN amount ELSE 0 END), 0) as completed_credits
       FROM transactions
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Create a paired transaction record (for transfers)
   * Ensures both sides of a transfer are recorded atomically
   */
  static async createPair(fromData, toData, options = {}) {
    const { idempotencyKey = null } = options;

    // Encrypt sensitive metadata
    const encryptedFromMetadata = this.encryptSensitiveMetadata(fromData.metadata);
    const encryptedToMetadata = this.encryptSensitiveMetadata(toData.metadata);

    return withTransaction(async (client) => {
      // Check for existing idempotent transactions
      if (idempotencyKey) {
        const existing = await client.query(
          `SELECT t.*, pt.related_transaction_id
           FROM transactions t
           LEFT JOIN transaction_pairs pt ON pt.transaction_id = t.id
           WHERE t.idempotency_key = $1`,
          [idempotencyKey]
        );

        if (existing.rows.length > 0) {
          return {
            idempotent: true,
            from: existing.rows.find(t => t.type === 'debit'),
            to: existing.rows.find(t => t.type === 'credit')
          };
        }
      }

      // Generate shared reference for both transactions
      const sharedRef = this.generateReferenceCode();
      
      // Insert debit transaction
      const debitResult = await client.query(
        `INSERT INTO transactions (
          user_id, wallet_id, type, amount, currency, status,
          reference_code, description, counterparty_info, 
          metadata, idempotency_key
        )
        VALUES ($1, $2, 'debit', $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          fromData.userId, fromData.walletId, fromData.amount,
          fromData.currency || 'MXN', fromData.status || 'completed',
          sharedRef, fromData.description, fromData.counterpartyInfo,
          encryptedFromMetadata, idempotencyKey
        ]
      );

      // Insert credit transaction
      const creditResult = await client.query(
        `INSERT INTO transactions (
          user_id, wallet_id, type, amount, currency, status,
          reference_code, description, counterparty_info,
          metadata, idempotency_key
        )
        VALUES ($1, $2, 'credit', $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          toData.userId, toData.walletId, toData.amount,
          toData.currency || 'MXN', toData.status || 'completed',
          sharedRef, toData.description, toData.counterpartyInfo,
          encryptedToMetadata, idempotencyKey
        ]
      );

      // Link the transactions
      await client.query(
        `INSERT INTO transaction_pairs (transaction_id, related_transaction_id, pair_type)
         VALUES ($1, $2, 'transfer')`,
        [debitResult.rows[0].id, creditResult.rows[0].id]
      );

      return {
        idempotent: false,
        from: debitResult.rows[0],
        to: creditResult.rows[0]
      };
    });
  }

  /**
   * Get related transaction (for transfer pairs)
   */
  static async getRelatedTransaction(transactionId) {
    const result = await pool.query(
      `SELECT t.*
       FROM transactions t
       INNER JOIN transaction_pairs tp ON (
         tp.transaction_id = $1 AND tp.related_transaction_id = t.id
       ) OR (
         tp.related_transaction_id = $1 AND tp.transaction_id = t.id
       )`,
      [transactionId]
    );
    return result.rows[0];
  }

  /**
   * Process webhook with idempotency
   */
  static async processWebhook(webhookId, payload, processor) {
    return withTransaction(async (client) => {
      // Check if webhook already processed
      const existing = await client.query(
        `SELECT * FROM webhook_logs 
         WHERE webhook_id = $1 OR (payload::text = $2::text AND processed = true)
         LIMIT 1`,
        [webhookId, JSON.stringify(payload)]
      );

      if (existing.rows.length > 0) {
        return {
          processed: true,
          existing: true,
          log: existing.rows[0]
        };
      }

      // Process the webhook
      const result = await processor(client);

      // Log the webhook
      await client.query(
        `INSERT INTO webhook_logs (webhook_id, event_type, payload, processed, processed_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [webhookId, payload.event_type || payload.type, payload]
      );

      return {
        processed: true,
        existing: false,
        result
      };
    });
  }

  /**
   * Find pending transactions that need processing
   */
  static async findPending(options = {}) {
    const { limit = 100, olderThanMinutes = 5 } = options;

    const result = await pool.query(
      `SELECT * FROM transactions
       WHERE status = 'pending'
         AND created_at < NOW() - INTERVAL '${olderThanMinutes} minutes'
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED`,
      [limit]
    );

    return result.rows;
  }

  /**
   * Retry failed transactions
   */
  static async retryFailedTransaction(transactionId) {
    return withTransaction(async (client) => {
      // Lock the transaction
      const tx = await client.query(
        `SELECT * FROM transactions 
         WHERE id = $1 
         FOR UPDATE`,
        [transactionId]
      );

      if (tx.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = tx.rows[0];

      // Check retry count
      const retryCount = transaction.metadata?.retry_count || 0;
      if (retryCount >= 5) {
        await client.query(
          `UPDATE transactions 
           SET status = 'failed',
               metadata = COALESCE(metadata, '{}'::jsonb) || '{"max_retries_exceeded": true}'
           WHERE id = $1`,
          [transactionId]
        );
        throw new Error('Max retry attempts exceeded');
      }

      // Update retry count
      await client.query(
        `UPDATE transactions
         SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('retry_count', $2)
         WHERE id = $1`,
        [transactionId, retryCount + 1]
      );

      return transaction;
    });
  }
}

export default Transaction;
