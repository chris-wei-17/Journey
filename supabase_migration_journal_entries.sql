-- Migration: Add journal_entries table
-- Date: 2024

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, date);

-- Create index for efficient user queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);

-- Add RLS policies for journal entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own journal entries
CREATE POLICY "Users can view own journal entries" ON journal_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own journal entries
CREATE POLICY "Users can insert own journal entries" ON journal_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own journal entries
CREATE POLICY "Users can update own journal entries" ON journal_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own journal entries
CREATE POLICY "Users can delete own journal entries" ON journal_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE
    ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();