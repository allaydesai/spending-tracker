# Tasks: Persistent Storage for Transactions

**Input**: Design documents from `/specs/004-add-persistent-storage/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/api.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: TypeScript/Next.js, SQLite with better-sqlite3, csv-parse
2. Load design documents:
   → data-model.md: Transaction, ImportSession entities
   → contracts/api.yaml: 5 API endpoints
   → research.md: Technical decisions on SQLite, CSV parsing
   → quickstart.md: User journey test scenarios
3. Generate tasks by category:
   → Setup: SQLite dependencies, database configuration
   → Tests: API contract tests, integration tests
   → Core: Models, database service, migration system
   → Integration: API routes, CSV import, dashboard updates
   → Polish: unit tests, performance optimization
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T040)
6. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Next.js integrated structure (frontend+backend)
- API routes in `app/api/`
- Services in `lib/services/`
- Database in `lib/db/`
- Components in `components/`
- Tests in `__tests__/` directories

## Phase 3.1: Infrastructure Setup
- [ ] T001 Install better-sqlite3 and type definitions: npm install better-sqlite3 @types/better-sqlite3
- [ ] T002 Install csv-parse for CSV processing: npm install csv-parse
- [ ] T003 Install multer for file uploads: npm install multer @types/multer
- [ ] T004 Create database directory structure: mkdir -p data lib/db/migrations
- [ ] T005 [P] Configure SQLite database connection in lib/db/connection.ts
- [ ] T006 [P] Create database configuration with PRAGMA optimizations in lib/db/config.ts
- [ ] T007 [P] Set up migration system in lib/db/migrator.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
**Constitutional Requirement: Test-Driven Development (NON-NEGOTIABLE)**

### Contract Tests
- [ ] T008 [P] Contract test POST /api/transactions/import in __tests__/api/transactions/import.test.ts
- [ ] T009 [P] Contract test GET /api/transactions in __tests__/api/transactions/list.test.ts
- [ ] T010 [P] Contract test GET /api/transactions/stats in __tests__/api/transactions/stats.test.ts
- [ ] T011 [P] Contract test DELETE /api/transactions/{id} in __tests__/api/transactions/delete.test.ts
- [ ] T012 [P] Contract test GET /api/storage/status in __tests__/api/storage/status.test.ts

### Integration Tests
- [ ] T013 [P] Integration test CSV import workflow in __tests__/integration/csv-import.test.ts
- [ ] T014 [P] Integration test duplicate detection in __tests__/integration/duplicate-detection.test.ts
- [ ] T015 [P] Integration test dashboard data persistence in __tests__/integration/dashboard-persistence.test.ts
- [ ] T016 [P] Integration test date range filtering in __tests__/integration/date-filtering.test.ts

## Phase 3.3: Database Schema & Models
- [ ] T017 Create initial migration 001_create_tables.sql in lib/db/migrations/
- [ ] T018 [P] Implement Transaction model interface in lib/models/transaction.ts
- [ ] T019 [P] Implement ImportSession model interface in lib/models/import-session.ts
- [ ] T020 [P] Create database repository for transactions in lib/db/repositories/transaction-repository.ts
- [ ] T021 [P] Create database repository for import sessions in lib/db/repositories/import-session-repository.ts
- [ ] T022 Initialize database and run migrations on app startup in lib/db/init.ts

## Phase 3.4: Core Services Implementation
- [ ] T023 [P] Implement TransactionService with CRUD operations in lib/services/transaction-service.ts
- [ ] T024 [P] Implement CSVParserService for file processing in lib/services/csv-parser-service.ts
- [ ] T025 [P] Implement ImportService for CSV import logic in lib/services/import-service.ts
- [ ] T026 [P] Implement duplicate detection logic in lib/services/duplicate-detector.ts
- [ ] T027 [P] Implement statistics aggregation service in lib/services/stats-service.ts

## Phase 3.5: API Routes Implementation
- [ ] T028 Implement POST /api/transactions/import route in app/api/transactions/import/route.ts
- [ ] T029 Implement GET /api/transactions route in app/api/transactions/route.ts
- [ ] T030 Implement GET /api/transactions/stats route in app/api/transactions/stats/route.ts
- [ ] T031 Implement DELETE /api/transactions/[id] route in app/api/transactions/[id]/route.ts
- [ ] T032 Implement GET /api/storage/status route in app/api/storage/status/route.ts

## Phase 3.6: UI Integration
- [ ] T033 Create CSV upload component with progress indicator in components/csv-uploader.tsx
- [ ] T034 Create import results display component in components/import-results.tsx
- [ ] T035 Add import page UI in app/import/page.tsx
- [ ] T036 Update dashboard to fetch from database API in app/page.tsx or relevant dashboard component
- [ ] T037 Add "Import CSV" button to dashboard navigation
- [ ] T038 Update data source selector to include database option

## Phase 3.7: Polish & Optimization
- [ ] T039 [P] Unit tests for CSV parsing validation in __tests__/unit/csv-parser.test.ts
- [ ] T040 [P] Unit tests for duplicate detection logic in __tests__/unit/duplicate-detector.test.ts
- [ ] T041 [P] Performance test for 10MB CSV import in __tests__/performance/large-import.test.ts
- [ ] T042 Add database indexes for query optimization (date, category)
- [ ] T043 Implement batch insert optimization for large CSV files
- [ ] T044 Add error boundary and user-friendly error messages
- [ ] T045 Mobile responsiveness validation for import UI (touch targets ≥44px)
- [ ] T046 Accessibility audit for file upload component (ARIA labels, keyboard navigation)
- [ ] T047 Execute quickstart.md validation checklist
- [ ] T048 Update README.md with database setup instructions

## Dependencies
- Infrastructure setup (T001-T007) must complete first
- Tests (T008-T016) before any implementation
- Database schema (T017-T022) before services
- Services (T023-T027) before API routes
- API routes (T028-T032) before UI integration
- All implementation before polish tasks

## Parallel Execution Examples

### Infrastructure Setup (after dependencies installed):
```bash
# Launch T005-T007 together (different files):
Task: "Configure SQLite database connection in lib/db/connection.ts"
Task: "Create database configuration with PRAGMA optimizations in lib/db/config.ts"
Task: "Set up migration system in lib/db/migrator.ts"
```

### Contract Tests (all can run in parallel):
```bash
# Launch T008-T012 together:
Task: "Contract test POST /api/transactions/import"
Task: "Contract test GET /api/transactions"
Task: "Contract test GET /api/transactions/stats"
Task: "Contract test DELETE /api/transactions/{id}"
Task: "Contract test GET /api/storage/status"
```

### Integration Tests (all can run in parallel):
```bash
# Launch T013-T016 together:
Task: "Integration test CSV import workflow"
Task: "Integration test duplicate detection"
Task: "Integration test dashboard data persistence"
Task: "Integration test date range filtering"
```

### Models & Repositories (all can run in parallel):
```bash
# Launch T018-T021 together:
Task: "Implement Transaction model interface"
Task: "Implement ImportSession model interface"
Task: "Create database repository for transactions"
Task: "Create database repository for import sessions"
```

### Services (all can run in parallel):
```bash
# Launch T023-T027 together:
Task: "Implement TransactionService with CRUD operations"
Task: "Implement CSVParserService for file processing"
Task: "Implement ImportService for CSV import logic"
Task: "Implement duplicate detection logic"
Task: "Implement statistics aggregation service"
```

## Notes
- Tests MUST fail before implementation per TDD approach
- Database initialization happens once on app startup
- CSV import uses streaming for memory efficiency
- Duplicate detection uses compound unique constraint
- All file sizes limited to 10MB
- Performance targets: Dashboard <2s, Import <5s
- Use existing shadcn/ui components for consistency
- Maintain mobile-first responsive design

## Validation Checklist
*GATE: Must pass before marking complete*

- [ ] All 5 API endpoints have contract tests
- [ ] All 2 entities have model implementations
- [ ] All 4 integration scenarios have tests
- [ ] Tests written and failing before implementation
- [ ] Parallel tasks are truly independent
- [ ] Each task specifies exact file path
- [ ] No parallel tasks modify same file
- [ ] Database persists across server restarts
- [ ] CSV import handles duplicates correctly
- [ ] Dashboard integrates with new data source
- [ ] Performance targets met (<2s dashboard, <5s import)
- [ ] Mobile responsive (44px touch targets)
- [ ] 80% unit test coverage achieved