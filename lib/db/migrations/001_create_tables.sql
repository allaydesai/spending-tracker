-- Migration 001: Create initial tables for transaction storage
-- This migration creates the core tables for the spending tracker application

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CHECK (amount != 0),
  CHECK (length(description) > 0),
  CHECK (length(description) <= 500),
  CHECK (category IS NULL OR length(category) <= 100),

  -- Unique constraint for duplicate detection
  UNIQUE(date, amount, description)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- Create import_sessions table for tracking CSV imports
CREATE TABLE IF NOT EXISTS import_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  total_rows INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,

  -- Constraints
  CHECK (total_rows >= 0),
  CHECK (imported_count >= 0),
  CHECK (duplicate_count >= 0),
  CHECK (error_count >= 0),
  CHECK (imported_count + duplicate_count + error_count <= total_rows)
);

-- Create indexes for import_sessions
CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_started_at ON import_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_import_sessions_filename ON import_sessions(filename);

-- Create a view for transaction statistics (for performance)
CREATE VIEW IF NOT EXISTS transaction_stats AS
SELECT
  COUNT(*) as total_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expenses,
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(DISTINCT category) as category_count
FROM transactions;

-- Create a view for monthly statistics
CREATE VIEW IF NOT EXISTS monthly_stats AS
SELECT
  strftime('%Y-%m', date) as month,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
  SUM(amount) as net_amount
FROM transactions
GROUP BY strftime('%Y-%m', date)
ORDER BY month;

-- Create a view for category statistics
CREATE VIEW IF NOT EXISTS category_stats AS
SELECT
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as transaction_count,
  SUM(ABS(amount)) as total_amount,
  AVG(ABS(amount)) as avg_amount,
  MIN(date) as first_transaction,
  MAX(date) as last_transaction
FROM transactions
GROUP BY category
ORDER BY total_amount DESC;

-- Insert initial migration record
-- Note: This will be handled by the migrator, but we document it here
-- INSERT INTO migrations (version, name) VALUES (1, 'create_tables');