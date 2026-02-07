-- Migration: Pika Initial Schema
-- Created: 2024-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    name TEXT NOT NULL,
    business_name TEXT,
    avatar TEXT,
    
    role TEXT NOT NULL DEFAULT 'MERCHANT',
    
    -- Business Details
    rfc TEXT UNIQUE,
    tax_id TEXT,
    business_type TEXT,
    industry TEXT,
    
    -- Preferences
    currency TEXT DEFAULT 'MXN',
    language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/Mexico_City',
    
    -- Notifications
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    
    fcm_token TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_onboarded BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_rfc ON users(rfc);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- ACCOUNTS (NextAuth)
-- ============================================

CREATE TABLE accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- ============================================
-- SESSIONS
-- ============================================

CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);

-- ============================================
-- VERIFICATION TOKENS
-- ============================================

CREATE TABLE verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(identifier, token)
);

-- ============================================
-- WALLETS
-- ============================================

CREATE TABLE wallets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    balance INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'MXN',
    
    -- Limits
    daily_limit INTEGER,
    monthly_limit INTEGER,
    daily_used INTEGER DEFAULT 0,
    monthly_used INTEGER DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_reason TEXT,
    frozen_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_is_active ON wallets(is_active);

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TABLE transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,
    
    type TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    
    amount INTEGER NOT NULL,
    fee INTEGER DEFAULT 0,
    net_amount INTEGER NOT NULL,
    
    currency TEXT DEFAULT 'MXN',
    
    description TEXT,
    metadata JSONB,
    
    -- Payment Details
    payment_method TEXT,
    payment_link TEXT,
    qr_code_id VARCHAR(255),
    
    -- Provider Info
    provider TEXT,
    provider_tx_id VARCHAR(255),
    provider_url TEXT,
    
    -- Processor Info
    processor_fee INTEGER DEFAULT 0,
    processor_fee_percent DOUBLE PRECISION,
    
    -- Refund Info
    original_tx_id VARCHAR(255),
    refund_reason TEXT,
    
    -- Timestamps
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_provider_tx_id ON transactions(provider_tx_id);
CREATE INDEX idx_transactions_qr_code_id ON transactions(qr_code_id);

-- ============================================
-- PAYMENT LINKS
-- ============================================

CREATE TABLE payment_links (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Link Details
    title TEXT NOT NULL,
    description TEXT,
    
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'MXN',
    
    -- Type & Settings
    type TEXT DEFAULT 'ONE_TIME',
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    
    -- Customer Info
    collect_name BOOLEAN DEFAULT FALSE,
    collect_email BOOLEAN DEFAULT FALSE,
    collect_phone BOOLEAN DEFAULT FALSE,
    collect_address BOOLEAN DEFAULT FALSE,
    
    -- Customization
    logo TEXT,
    theme_color VARCHAR(7),
    custom_message TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Redirect
    success_url TEXT,
    cancel_url TEXT,
    
    -- Short URL
    short_code TEXT UNIQUE,
    slug TEXT UNIQUE,
    
    -- Security
    require_auth BOOLEAN DEFAULT FALSE,
    password TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_links_user_id ON payment_links(user_id);
CREATE INDEX idx_payment_links_short_code ON payment_links(short_code);
CREATE INDEX idx_payment_links_slug ON payment_links(slug);
CREATE INDEX idx_payment_links_is_active ON payment_links(is_active);
CREATE INDEX idx_payment_links_expires_at ON payment_links(expires_at);

-- ============================================
-- QR CODES
-- ============================================

CREATE TABLE qr_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- QR Details
    name TEXT NOT NULL,
    description TEXT,
    
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'MXN',
    
    -- Type
    type TEXT DEFAULT 'DYNAMIC',
    
    -- Content
    data TEXT NOT NULL,
    format TEXT DEFAULT 'PNG',
    size INTEGER DEFAULT 300,
    
    -- Settings
    color VARCHAR(7),
    background_color VARCHAR(7),
    logo TEXT,
    
    -- Usage Tracking
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    
    -- Dynamic QR specific
    target_url TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Location
    location TEXT,
    device_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_type ON qr_codes(type);
CREATE INDEX idx_qr_codes_is_active ON qr_codes(is_active);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX idx_qr_codes_scan_count ON qr_codes(scan_count DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    action_url TEXT,
    action_label TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- WEBHOOK LOGS
-- ============================================

CREATE TABLE webhook_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    
    event TEXT NOT NULL,
    provider TEXT,
    
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    
    http_status INTEGER,
    response TEXT,
    error TEXT,
    
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX idx_webhook_logs_received_at ON webhook_logs(received_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_links_updated_at BEFORE UPDATE ON payment_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily/monthly usage counters
CREATE OR REPLACE FUNCTION reset_wallet_usage_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset daily counter if new day
    IF EXTRACT(DAY FROM NOW()) != EXTRACT(DAY FROM NEW.last_reset_at) THEN
        NEW.daily_used := 0;
    END IF;
    
    -- Reset monthly counter if new month
    IF EXTRACT(MONTH FROM NOW()) != EXTRACT(MONTH FROM NEW.last_reset_at) OR
       EXTRACT(YEAR FROM NOW()) != EXTRACT(YEAR FROM NEW.last_reset_at)) THEN
        NEW.monthly_used := 0;
    END IF;
    
    NEW.last_reset_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_wallet_usage_counters_trigger 
    BEFORE UPDATE ON wallets
    FOR EACH ROW 
    WHEN (NEW.daily_used > 0 OR NEW.monthly_used > 0)
    EXECUTE FUNCTION reset_wallet_usage_counters();

-- Function to update payment link usage count
CREATE OR REPLACE FUNCTION increment_payment_link_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND NEW.payment_link IS NOT NULL THEN
        UPDATE payment_links 
        SET used_count = used_count + 1 
        WHERE id = NEW.payment_link;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_payment_link_usage_trigger 
    AFTER INSERT OR UPDATE ON transactions
    FOR EACH ROW
    WHEN (NEW.status = 'COMPLETED')
    EXECUTE FUNCTION increment_payment_link_usage();

-- Function to update QR code scan count
CREATE OR REPLACE FUNCTION increment_qr_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code_id IS NOT NULL THEN
        UPDATE qr_codes 
        SET scan_count = scan_count + 1,
            last_scanned_at = NOW()
        WHERE id = NEW.qr_code_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_qr_scan_count_trigger 
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION increment_qr_scan_count();

-- Function to ensure net_amount calculation
CREATE OR REPLACE FUNCTION calculate_transaction_net_amount()
RETURNS TRIGGER AS $$
BEGIN
    NEW.net_amount := NEW.amount - NEW.fee;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_transaction_net_amount_trigger 
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_transaction_net_amount();

-- ============================================
-- VIEWS
-- ============================================

-- Wallet summary view
CREATE OR REPLACE VIEW wallet_summary AS
SELECT 
    w.id,
    w.user_id,
    w.balance,
    w.currency,
    w.is_active,
    w.is_frozen,
    u.email,
    u.name,
    u.business_name,
    COUNT(t.id) FILTER (WHERE t.created_at >= CURRENT_DATE) AS daily_transactions,
    COALESCE(SUM(t.amount) FILTER (WHERE t.created_at >= CURRENT_DATE AND t.type = 'PAYMENT' AND t.status = 'COMPLETED'), 0) AS daily_volume
FROM wallets w
JOIN users u ON w.user_id = u.id
LEFT JOIN transactions t ON t.wallet_id = w.id
GROUP BY w.id, u.id;

-- Transaction analytics view
CREATE OR REPLACE VIEW transaction_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) AS date,
    type,
    status,
    COUNT(*) AS count,
    SUM(amount) AS total_amount,
    SUM(fee) AS total_fees,
    AVG(amount) AS avg_amount
FROM transactions
GROUP BY DATE_TRUNC('day', created_at), type, status
ORDER BY date DESC;

-- ============================================
-- SEED DATA (Optional)
-- ============================================

-- Insert some initial users for testing
-- INSERT INTO users (email, name, business_name, role) VALUES
-- ('test@pika.mx', 'Test User', 'Test Business', 'MERCHANT')
-- ON CONFLICT (email) DO NOTHING;
