-- Analytics tables

-- Run log
CREATE TABLE IF NOT EXISTS analytics_runs (
  batch_id TEXT PRIMARY KEY,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'running',
  rows_processed INTEGER DEFAULT 0,
  error TEXT
);

-- Per-user summary (json for flexibility)
CREATE TABLE IF NOT EXISTS analytics_summary (
  id SERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES analytics_runs(batch_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,
  insights TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_user ON analytics_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_summary_batch ON analytics_summary(batch_id);

-- Relationships and scores (pairwise or unary with var_y NULL)
CREATE TABLE IF NOT EXISTS analytics_relationships (
  id SERIAL PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES analytics_runs(batch_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  var_x TEXT NOT NULL,
  var_y TEXT,
  metric TEXT NOT NULL, -- e.g., pearson, spearman, mi, vif, cross_lag
  value DOUBLE PRECISION,
  lag INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_reln_user ON analytics_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reln_batch ON analytics_relationships(batch_id);