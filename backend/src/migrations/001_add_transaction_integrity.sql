-- Migration: Add Transaction Integrity Support
-- This migration adds tables and indexes for idempotency, advisory locks,
-- transaction pairs, and fund reservations

-- Idempotency keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id BIGSERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  transaction_id BIGINT REFERENCES transactions(id) ON DELETE CASCADE,
  request_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  CONSTRAINT idempotency_key_not_expired CHECK (
    expires_at IS NULL OR expires_at > created_at
  )
);

-- Index for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key
  ON idempotency_keys(key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_transaction_id
  ON idempotency_keys(transaction_id);

-- Clean up expired idempotency keys
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at
  ON idempotency_keys(expires_at)
  WHERE expires_at IS NOT NULL;

-- Transaction pairs table (for linking related transactions)
CREATE TABLE IF NOT EXISTS transaction_pairs (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  related_transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  pair_type VARCHAR(50) NOT NULL, -- 'transfer', 'payment', 'refund'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_pair UNIQUE (transaction_id, related_transaction_id),
  CONSTRAINT no_self_pair CHECK (transaction_id != related_transaction_id)
);

-- Index for finding related transactions
CREATE INDEX IF NOT EXISTS idx_transaction_pairs_transaction_id
  ON transaction_pairs(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_pairs_related_id
  ON transaction_pairs(related_transaction_id);

CREATE INDEX IF NOT EXISTS idx_transaction_pairs_type
  ON transaction_pairs(pair_type);

-- Fund reservations table
CREATE TABLE IF NOT EXISTS fund_reservations (
  id BIGSERIAL PRIMARY KEY,
  wallet_id BIGINT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  reservation_id VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  released BOOLEAN DEFAULT false,
  released_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reservation_not_expired CHECK (
    released = false AND expires_at > created_at
  )
);

-- Index for finding active reservations
CREATE INDEX IF NOT EXISTS idx_fund_reservations_wallet_id
  ON fund_reservations(wallet_id);

CREATE INDEX IF NOT EXISTS idx_fund_reservations_reservation_id
  ON fund_reservations(reservation_id);

CREATE INDEX IF NOT EXISTS idx_fund_reservations_expires_at
  ON fund_reservations(expires_at)
  WHERE released = false;

-- Index for cleaning up expired reservations
CREATE INDEX IF NOT EXISTS idx_fund_reservations_released
  ON fund_reservations(released, expires_at);

-- Webhook logs table (for idempotent webhook processing)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  webhook_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for idempotent webhook lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id
  ON webhook_logs(webhook_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed
  ON webhook_logs(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type
  ON webhook_logs(event_type);

-- Add version column to wallets for optimistic locking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'version'
  ) THEN
    ALTER TABLE wallets ADD COLUMN version INTEGER DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add updated_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE wallets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add freeze_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'freeze_reason'
  ) THEN
    ALTER TABLE wallets ADD COLUMN freeze_reason TEXT;
  END IF;
END $$;

-- Add reserved_balance column for pending transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'reserved_balance'
  ) THEN
    ALTER TABLE wallets ADD COLUMN reserved_balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL;
  END IF;
END $$;

-- Update wallets table timestamp trigger
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wallets_updated_at ON wallets;
CREATE TRIGGER trigger_update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallets_updated_at();

-- Add idempotency_key column to transactions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE transactions ADD COLUMN idempotency_key VARCHAR(255);
    CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);
  END IF;
END $$;

-- Add completed_at column to transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN completed_at TIMESTAMP;
  END IF;
END $$;

-- Add indexes for transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_status
  ON transactions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_spei_tracking_key
  ON transactions(spei_tracking_key)
  WHERE spei_tracking_key IS NOT NULL;

-- Advisory lock functions

-- Function to check and acquire advisory lock with timeout
CREATE OR REPLACE FUNCTION try_advisory_lock(
  lock_id BIGINT,
  timeout_ms INTEGER DEFAULT 5000
) RETURNS BOOLEAN AS $$
DECLARE
  start_time TIMESTAMP := CURRENT_TIMESTAMP;
  locked BOOLEAN := false;
BEGIN
  WHILE (CURRENT_TIMESTAMP - start_time) < (timeout_ms || '1ms')::INTERVAL LOOP
    SELECT pg_try_advisory_lock(lock_id) INTO locked;
    
    IF locked THEN
      RETURN true;
    END IF;
    
    PERFORM pg_sleep(0.01); -- Sleep 10ms
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to release all advisory locks held by session
CREATE OR REPLACE FUNCTION release_all_advisory_locks()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER := 0;
BEGIN
  -- Note: pg_advisory_unlock_all() releases all advisory locks
  PERFORM pg_advisory_unlock_all();
  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup functions

-- Function to clean expired idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired fund reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Release expired reservations and rollback funds
  WITH expired_reservations AS (
    SELECT id, wallet_id, amount, reservation_id
    FROM fund_reservations
    WHERE expires_at < CURRENT_TIMESTAMP AND released = false
  )
  UPDATE wallets
  SET balance = balance + er.amount,
      reserved_balance = reserved_balance - er.amount,
      version = version + 1,
      updated_at = CURRENT_TIMESTAMP
  FROM expired_reservations er
  WHERE wallets.id = er.wallet_id;
  
  -- Mark as released
  DELETE FROM fund_reservations
  WHERE expires_at < CURRENT_TIMESTAMP AND released = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your setup)
-- GRANT USAGE ON SCHEMA public TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

-- Add comments for documentation
COMMENT ON TABLE idempotency_keys IS 'Stores idempotency keys to prevent duplicate transaction processing';
COMMENT ON TABLE transaction_pairs IS 'Links related transactions (e.g., transfer pairs, refunds)';
COMMENT ON TABLE fund_reservations IS 'Temporarily reserves funds for pending operations';
COMMENT ON TABLE webhook_logs IS 'Logs incoming webhooks for idempotency and retry processing';

COMMENT ON FUNCTION try_advisory_lock IS 'Attempt to acquire an advisory lock with timeout';
COMMENT ON FUNCTION cleanup_expired_idempotency_keys IS 'Remove expired idempotency keys';
COMMENT ON FUNCTION cleanup_expired_reservations IS 'Release expired fund reservations and rollback funds';
