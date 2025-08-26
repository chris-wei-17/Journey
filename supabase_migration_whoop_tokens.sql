-- WHOOP OAuth tokens per user
-- Run this migration once on your database

CREATE TABLE IF NOT EXISTS whoop_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(20) NOT NULL DEFAULT 'bearer',
    scope TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Helpful index for expiry checks
CREATE INDEX IF NOT EXISTS idx_whoop_tokens_expires_at ON whoop_tokens(expires_at);

