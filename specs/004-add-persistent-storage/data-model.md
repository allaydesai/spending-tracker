# Data Model

## Core Entities

### Transaction
Primary entity representing a single financial transaction.

```typescript
interface Transaction {
  id: number;                    // Auto-generated primary key
  date: string;                   // ISO 8601 date (YYYY-MM-DD)
  amount: number;                 // Decimal amount (positive or negative)
  description: string;            // Transaction description/merchant
  category?: string;              // Optional category classification
  createdAt: string;             // ISO 8601 timestamp of record creation
}
```

**Validation Rules:**
- `date`: Must be valid ISO date format, not in future
- `amount`: Non-zero number, up to 2 decimal places
- `description`: Non-empty string, max 500 characters
- `category`: Optional, max 100 characters

**Constraints:**
- Unique constraint on combination of (date, amount, description)
- Index on date for range queries
- Index on category for filtering

### ImportSession
Tracks CSV import operations for audit and debugging.

```typescript
interface ImportSession {
  id: number;                    // Auto-generated primary key
  filename: string;               // Original CSV filename
  startedAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp (null if failed)
  totalRows: number;             // Total rows in CSV
  importedCount: number;         // Successfully imported transactions
  duplicateCount: number;        // Skipped duplicate transactions
  errorCount: number;            // Failed rows
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;         // Error details if failed
}
```

### ImportResult (Response Model)
Returned after CSV import completion.

```typescript
interface ImportResult {
  session: ImportSession;        // Import session details
  imported: Transaction[];       // Newly imported transactions
  duplicates: DuplicateInfo[];   // Information about skipped duplicates
  errors: ImportError[];         // Detailed error information
}

interface DuplicateInfo {
  row: number;                   // CSV row number
  date: string;
  amount: number;
  description: string;
  existingId: number;           // ID of existing transaction
}

interface ImportError {
  row: number;                   // CSV row number
  field?: string;                // Field that caused error
  message: string;               // Error description
  data: any;                     // Raw row data for debugging
}
```

## Database Schema

### transactions table
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CHECK (amount != 0),
  CHECK (length(description) > 0),
  UNIQUE(date, amount, description)
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
```

### import_sessions table
```sql
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
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_started_at ON import_sessions(started_at);
```

### migrations table
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## State Transitions

### Transaction States
Transactions are immutable once created. No state transitions.

### ImportSession States
```
pending → completed (successful import)
pending → failed (error during import)
```

## Data Access Patterns

### Write Operations
1. **Bulk Insert**: CSV import with conflict resolution
2. **Single Insert**: Manual transaction entry (future feature)
3. **Delete**: Remove individual transactions (optional)

### Read Operations
1. **List All**: Paginated transaction list
2. **Date Range**: Transactions between dates
3. **By Category**: Filter by category
4. **Aggregations**: Sum/count by date, category
5. **Duplicate Check**: Find existing matching transactions

## Performance Considerations

### Indexes
- Primary key index on `id` (automatic)
- Date index for range queries and sorting
- Category index for filtering
- Compound unique index on (date, amount, description)

### Query Optimization
- Use prepared statements for all queries
- Batch inserts with transactions
- Limit result sets with pagination
- Use database aggregations vs application-level

## Data Volume Estimates

Based on personal use for 5+ years:
- Average 200 transactions/month
- 5 years = 12,000 transactions
- Average row size: ~100 bytes
- Total database size: ~2-3 MB
- Query response times: <10ms for indexed queries