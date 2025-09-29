# Research & Technical Decisions

## SQLite Implementation for Next.js

**Decision**: better-sqlite3 library for Node.js/Next.js integration
**Rationale**:
- Synchronous API aligns with Next.js server components
- Best performance for local file-based storage
- Production-ready with proper transaction support
- Well-maintained and TypeScript-friendly

**Alternatives considered**:
- sqlite3: Async-only, more complex integration
- sql.js: In-memory only, not suitable for persistence
- Prisma ORM: Over-engineered for simple personal use case

## Database Schema Design

**Decision**: Single transactions table with normalized schema
**Rationale**:
- Simplicity for personal use case
- Direct mapping from CSV structure
- Efficient duplicate detection via compound index

**Schema**:
```sql
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, amount, description)
);
```

## CSV Import Strategy

**Decision**: Streaming parser with batch inserts
**Rationale**:
- Memory-efficient for large files (up to 10MB)
- Transaction-wrapped for data integrity
- Clear duplicate handling via ON CONFLICT

**Library**: csv-parse with stream API
- Battle-tested CSV parser
- Handles edge cases and encoding issues
- TypeScript support

## Duplicate Detection

**Decision**: Compound unique constraint on (date + amount + description)
**Rationale**:
- Natural key from transaction data
- Database-enforced consistency
- Simple ON CONFLICT IGNORE for imports

**Alternatives considered**:
- Hash-based detection: More complex, no clear benefit
- Time-window matching: Could miss legitimate duplicates
- Manual comparison: Performance issues at scale

## API Design

**Decision**: RESTful API with Next.js API routes
**Rationale**:
- Leverages existing Next.js infrastructure
- Simple CRUD operations align with REST
- File upload via multipart/form-data

**Endpoints**:
- POST /api/transactions/import - CSV file upload
- GET /api/transactions - List with filtering
- GET /api/transactions/stats - Aggregated data for dashboard
- DELETE /api/transactions/:id - Optional cleanup

## Testing Strategy

**Decision**: Jest + Testing Library + Playwright
**Rationale**:
- Jest for unit tests (existing setup)
- Testing Library for component tests
- Playwright for E2E CSV import flows

**Test Categories**:
1. **Contract Tests**: Schema validation, API contracts
2. **Unit Tests**: Data processing, duplicate detection
3. **Integration Tests**: Full CSV import flow
4. **E2E Tests**: User journey from upload to visualization

## Performance Optimizations

**Decision**: Database-level optimizations with monitoring
**Rationale**:
- Indexes on frequently queried columns (date, category)
- Prepared statements for repeated queries
- Connection pooling not needed (single user)

**Optimizations**:
- Index on date for range queries
- Index on category for filtering
- PRAGMA optimizations for SQLite
- Batch inserts with configurable size

## Data Migration

**Decision**: Automated migration on first run
**Rationale**:
- Zero user intervention required
- Version tracking for future schema changes
- Rollback capability if needed

**Implementation**:
- migrations/ directory with versioned SQL files
- Simple version table to track applied migrations
- Automatic execution on app startup

## Error Handling

**Decision**: User-friendly errors with recovery options
**Rationale**:
- Clear messaging for duplicate detection
- File validation before processing
- Transaction rollback on failures

**Error Categories**:
- Invalid CSV format → Show sample format
- Duplicate transactions → Show count, allow override
- Storage errors → Suggest cleanup options
- Large file errors → Suggest splitting file

## Security Considerations

**Decision**: Input validation and sanitization
**Rationale**:
- Personal use but good practices matter
- Prevent SQL injection via parameterized queries
- File type validation before processing

**Measures**:
- File type checking (CSV only)
- Size limits enforced (10MB)
- SQL parameter binding
- No direct SQL string concatenation

---

All NEEDS CLARIFICATION items have been resolved. Ready for Phase 1 design.