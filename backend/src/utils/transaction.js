/**
 * Transaction Utility Module
 * Provides atomic operations, retry logic, and race condition prevention
 */

import pool from '../config/database.js';

/**
 * Execute a callback with database transaction and row-level locking
 * @param {Function} callback - Async function to execute within transaction
 * @param {Object} options - Configuration options
 * @returns {Promise<any>} - Result of the callback
 */
export async function withTransaction(callback, options = {}) {
  const {
    isolationLevel = 'READ COMMITTED',
    maxRetries = 3,
    retryDelay = 100,
    timeoutMs = 30000
  } = options;

  let client;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      client = await pool.connect();
      
      // Set transaction isolation level
      await client.query(`BEGIN TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      
      // Set statement timeout
      await client.query(`SET statement_timeout = ${timeoutMs}`);

      // Execute callback with transaction client
      const result = await callback(client);

      await client.query('COMMIT');
      return result;

    } catch (error) {
      lastError = error;
      
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }
      }

      // Check if error is retryable (serialization failure, deadlock, etc.)
      const isRetryable = 
        error.code === '40001' || // serialization_failure
        error.code === '40P01' || // deadlock_detected
        error.code === '55000' || // object_not_in_prerequisite_state
        error.message?.includes('could not serialize') ||
        error.message?.includes('deadlock');

      if (isRetryable && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`, {
          code: error.code,
          message: error.message
        });
        await sleep(delay);
        continue;
      }

      throw error;

    } finally {
      if (client) {
        client.release();
      }
    }
  }

  throw lastError;
}

/**
 * Execute a callback with advisory lock for distributed locking
 * @param {string|number} lockKey - Unique identifier for the lock
 * @param {Function} callback - Async function to execute while holding lock
 * @param {Object} options - Configuration options
 * @returns {Promise<any>} - Result of the callback
 */
export async function withAdvisoryLock(lockKey, callback, options = {}) {
  const {
    timeoutMs = 10000,
    maxRetries = 3
  } = options;

  // Convert string key to numeric hash for PostgreSQL advisory lock
  const lockId = typeof lockKey === 'string' 
    ? hashStringToInt(lockKey)
    : lockKey;

  let client;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      client = await pool.connect();

      // Try to acquire advisory lock (non-blocking)
      const lockResult = await client.query(
        'SELECT pg_try_advisory_lock($1) as acquired',
        [lockId]
      );

      if (!lockResult.rows[0].acquired) {
        // Lock is held by another transaction, wait with timeout
        const waitResult = await client.query({
          text: 'SELECT pg_advisory_lock($1)',
          values: [lockId],
          timeoutMs
        });
      }

      // Execute callback while holding lock
      const result = await callback(client);

      // Release lock
      await client.query('SELECT pg_advisory_unlock($1)', [lockId]);

      return result;

    } catch (error) {
      lastError = error;

      if (client) {
        try {
          await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
        } catch (unlockError) {
          console.error('Advisory unlock error:', unlockError);
        }
      }

      // Retry on timeout or lock acquisition failure
      if (
        (error.code === '57014' || error.code === '55P03') && 
        attempt < maxRetries
      ) {
        const delay = 100 * Math.pow(2, attempt - 1);
        console.warn(`Advisory lock attempt ${attempt} failed, retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      throw error;

    } finally {
      if (client) {
        client.release();
      }
    }
  }

  throw lastError;
}

/**
 * Lock a wallet row for update (pessimistic locking)
 * @param {*} client - Database client
 * @param {string|number} walletId - Wallet ID to lock
 * @returns {Promise<Object>} - Locked wallet row
 */
export async function lockWallet(client, walletId) {
  const result = await client.query(
    `SELECT * FROM wallets 
     WHERE id = $1 
     FOR UPDATE`,
    [walletId]
  );

  if (result.rows.length === 0) {
    throw new Error('Wallet not found');
  }

  return result.rows[0];
}

/**
 * Lock multiple wallet rows for update in a consistent order
 * This prevents deadlocks when transferring between wallets
 * @param {*} client - Database client
 * @param {string|number[]} walletIds - Array of wallet IDs to lock
 * @returns {Promise<Object[]>} - Array of locked wallet rows
 */
export async function lockWallets(client, walletIds) {
  if (!Array.isArray(walletIds) || walletIds.length === 0) {
    return [];
  }

  // Sort IDs to ensure consistent lock order and prevent deadlocks
  const sortedIds = [...walletIds].sort((a, b) => {
    const numA = typeof a === 'string' ? parseInt(a, 36) : a;
    const numB = typeof b === 'string' ? parseInt(b, 36) : b;
    return numA - numB;
  });

  const placeholders = sortedIds.map((_, idx) => `$${idx + 1}`).join(',');
  
  const result = await client.query(
    `SELECT * FROM wallets 
     WHERE id IN (${placeholders})
     ORDER BY id
     FOR UPDATE`,
    sortedIds
  );

  return result.rows;
}

/**
 * Update wallet balance atomically within transaction
 * @param {*} client - Database client with active transaction
 * @param {string|number} walletId - Wallet ID
 * @param {number} amount - Amount to add (positive or negative)
 * @param {Object} options - Options
 * @returns {Promise<Object>} - Updated wallet
 */
export async function updateWalletBalance(client, walletId, amount, options = {}) {
  const {
    allowNegative = false,
    minimumBalance = 0
  } = options;

  const operator = amount >= 0 ? '+' : '-';
  const absAmount = Math.abs(amount);

  const result = await client.query(
    `UPDATE wallets
     SET balance = balance ${operator} $1,
         updated_at = NOW()
     WHERE id = $2
       AND ($3 = true OR balance ${operator} $1 >= $4)
     RETURNING *`,
    [absAmount, walletId, allowNegative, minimumBalance]
  );

  if (result.rows.length === 0) {
    if (!allowNegative) {
      throw new Error('Insufficient funds');
    }
    throw new Error('Wallet not found or balance constraint violated');
  }

  return result.rows[0];
}

/**
 * Create an idempotent transaction record
 * @param {*} client - Database client
 * @param {string} idempotencyKey - Unique key for idempotency
 * @param {Object} data - Transaction data
 * @returns {Promise<Object>} - Created or existing transaction
 */
export async function createIdempotentTransaction(client, idempotencyKey, data) {
  // First check if already processed
  const existing = await client.query(
    `SELECT t.*, 
            COALESCE(json_build_object(
              'processed', true,
              'createdAt', i.created_at
            ), json_build_object('processed', false)) as idempotency_info
     FROM transactions t
     LEFT JOIN idempotency_keys i ON i.transaction_id = t.id AND i.key = $1
     WHERE t.idempotency_key = $1`,
    [idempotencyKey]
  );

  if (existing.rows.length > 0) {
    return {
      existing: true,
      transaction: existing.rows[0],
      idempotencyInfo: existing.rows[0].idempotency_info
    };
  }

  // Create new transaction with idempotency key
  const transaction = await client.query(
    `INSERT INTO transactions (
      user_id, wallet_id, type, amount, currency, status,
      reference_code, spei_tracking_key, payment_link_id,
      counterparty_info, description, metadata, idempotency_key
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      data.userId, data.walletId, data.type, data.amount, 
      data.currency || 'MXN', data.status || 'pending',
      data.referenceCode, data.speiTrackingKey, data.paymentLinkId,
      data.counterpartyInfo, data.description, data.metadata,
      idempotencyKey
    ]
  );

  // Record idempotency key
  await client.query(
    `INSERT INTO idempotency_keys (key, transaction_id, request_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO NOTHING`,
    [idempotencyKey, transaction.rows[0].id, data.requestHash]
  );

  return {
    existing: false,
    transaction: transaction.rows[0]
  };
}

/**
 * Check if an idempotency key has been used
 * @param {string} idempotencyKey - Key to check
 * @returns {Promise<Object|null>} - Transaction record if exists, null otherwise
 */
export async function checkIdempotencyKey(idempotencyKey) {
  const result = await pool.query(
    `SELECT t.*, i.created_at as idempotency_created_at
     FROM transactions t
     INNER JOIN idempotency_keys i ON i.transaction_id = t.id
     WHERE i.key = $1`,
    [idempotencyKey]
  );

  return result.rows[0] || null;
}

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Hash string to integer for advisory locks
 * @param {string} str - String to hash
 * @returns {number} - Hashed integer
 */
function hashStringToInt(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result of the function
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 100,
    maxDelay = 10000,
    shouldRetry = () => true
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Create a distributed lock key for wallet operations
 * @param {string} operation - Operation type (transfer, payment, etc.)
 * @param {...string} identifiers - Identifiers for the lock
 * @returns {string} - Lock key
 */
export function createLockKey(operation, ...identifiers) {
  return `pika:lock:${operation}:${identifiers.join(':')}`;
}

/**
 * Create idempotency key from request
 * @param {string} userId - User ID
 * @param {string} operation - Operation type
 * @param {string} requestId - Unique request ID
 * @returns {string} - Idempotency key
 */
export function createIdempotencyKey(userId, operation, requestId) {
  return `${userId}:${operation}:${requestId}`;
}
