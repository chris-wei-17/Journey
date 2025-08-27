-- WHOOP webhook support tables and columns

-- Add whoop_user_id to whoop_tokens
ALTER TABLE whoop_tokens ADD COLUMN IF NOT EXISTS whoop_user_id VARCHAR;

-- Log of webhook events
CREATE TABLE IF NOT EXISTS whoop_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    whoop_user_id VARCHAR,
    event_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    raw_payload JSONB,
    received_at TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    process_error TEXT,
    processed_at TIMESTAMP
);

-- Resource cache table
CREATE TABLE IF NOT EXISTS whoop_resource_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    whoop_user_id VARCHAR,
    resource_type VARCHAR(32) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whoop_resource_cache_lookup ON whoop_resource_cache(whoop_user_id, resource_type, resource_id);
