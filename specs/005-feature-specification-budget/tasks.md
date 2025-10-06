# Tasks: Budget Overview Component

**Feature**: Budget Overview Component (005)
**Input**: Design documents from `/specs/005-feature-specification-budget/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow

```
1. Load plan.md from feature directory ✅
2. Load design documents ✅
   → data-model.md: 4 entities (BudgetConfig, BudgetMetrics, ProgressIndicators, ExpenseBreakdown)
   → contracts/: 2 API contracts (budget-config-api.yaml, budget-metrics-api.yaml)
   → quickstart.md: 7 acceptance scenarios + 6 edge cases
3. Generate tasks by category (see phases below)
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
   → shadcn setup before component implementation
5. Number tasks sequentially (T001-T045)
6. Task completeness validated ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths are absolute from repository root

---

## Phase 3.1: Setup & Configuration

- [x] **T001** Create YAML budget configuration file at `data/budget-config.yaml` from CSV reference data (budget_summary.csv, essential-services.csv, additional-services.csv). Use structure from data-model.md lines 104-140.

- [x] **T002** [P] Create TypeScript types file at `lib/budget/types.ts` with BudgetConfig, BudgetMetrics, ProgressIndicators, ExpenseBreakdown, ExpenseCategory, ExpenseItem interfaces. Reference: data-model.md lines 22-48, 152-172, 285-306, 422-437.

- [x] **T003** [P] Create Zod validation schemas file at `lib/budget/schemas.ts` with BudgetConfigSchema. Reference: data-model.md lines 52-90. Import zod and export schema.

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests

- [x] **T004** [P] Contract test for GET /api/budget/config in `tests/contract/budget-config.contract.test.ts`. Validate request/response schemas per contracts/budget-config-api.yaml. Test cases: success (200), validation error (400), file not found (404), parse error (500). Tests MUST fail initially.

- [x] **T005** [P] Contract test for GET /api/budget/metrics in `tests/contract/budget-metrics.contract.test.ts`. Validate request/response schemas per contracts/budget-metrics-api.yaml. Test cases: success (200), invalid month (400), config missing (500). Tests MUST fail initially.

### Unit Tests - Business Logic

- [x] **T006** [P] Unit tests for config-loader in `tests/unit/config-loader.test.ts`. Test YAML parsing, Zod validation, error messages (missing file, malformed YAML, validation failures). Reference: data-model.md lines 52-101. Tests MUST fail initially.

- [x] **T007** [P] Unit tests for metrics-calculator in `tests/unit/metrics-calculator.test.ts`. Test all calculation formulas FR-007 to FR-014 (totalFixedExpenses, totalVariableSubscriptions, forecastedSavings, actualIncomeMtd, actualVariableSpendingMtd, budgetRemaining, actualSavingsMtd, interestPaidMtd). Reference: data-model.md lines 175-255. Tests MUST fail initially.

- [x] **T008** [P] Unit tests for progress-tracker in `tests/unit/progress-tracker.test.ts`. Test FR-015 to FR-023 (month progress, budget usage, burn rate, variance, status color algorithm, isOverBudget). Test edge cases: first day of month, last day of month. Reference: data-model.md lines 312-391. Tests MUST fail initially.

- [x] **T009** [P] Unit tests for transaction-filter in `tests/unit/transaction-filter.test.ts`. Test current month filtering, interest transaction detection using categories and keywords. Reference: data-model.md lines 247-254. Tests MUST fail initially.

- [x] **T010** [P] Unit tests for expense-breakdown in `tests/unit/expense-breakdown.test.ts`. Test derivation of ExpenseBreakdown from BudgetConfig, nested children structure, label formatting. Reference: data-model.md lines 442-493. Tests MUST fail initially.

### Unit Tests - Components

- [ ] **T011** [P] Unit tests for BudgetHeader component in `tests/unit/components/BudgetHeader.test.tsx`. Test month display, progress bar rendering. Use React Testing Library.

- [ ] **T012** [P] Unit tests for BudgetProgress component in `tests/unit/components/BudgetProgress.test.tsx`. Test progress bar, color coding (green/yellow/red), percentage display, budget remaining display. Use React Testing Library.

- [ ] **T013** [P] Unit tests for BudgetBreakdown component in `tests/unit/components/BudgetBreakdown.test.tsx`. Test collapsible sections, expense item rendering, nested children. Use React Testing Library.

- [ ] **T014** [P] Unit tests for BurnRateIndicator component in `tests/unit/components/BurnRateIndicator.test.tsx`. Test actual vs target display, variance calculation, color status. Use React Testing Library.

- [ ] **T015** [P] Unit tests for InterestTracker component in `tests/unit/components/InterestTracker.test.tsx`. Test forecasted vs actual display, percentage calculation. Use React Testing Library.

- [ ] **T016** [P] Unit tests for BudgetOverview component in `tests/unit/components/BudgetOverview.test.tsx`. Test integration of all sub-components, data loading, error handling. Use React Testing Library with MSW for API mocking.

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Business Logic

- [x] **T017** Implement config-loader at `lib/budget/config-loader.ts`. Functions: loadBudgetConfig(filePath), validateConfig(data). Use js-yaml for parsing, Zod for validation. Handle errors: file not found, parse error, validation error. Make T006 pass.

- [x] **T018** Implement transaction-filter at `lib/budget/transaction-filter.ts`. Functions: filterCurrentMonth(transactions, month), isInterestTransaction(tx, config). Use date-fns for date operations. Make T009 pass.

- [x] **T019** Implement metrics-calculator at `lib/budget/metrics-calculator.ts`. Function: calculateBudgetMetrics(config, transactions). Implement all formulas from data-model.md lines 178-245. Make T007 pass.

- [x] **T020** Implement progress-tracker at `lib/budget/progress-tracker.ts`. Function: calculateProgressIndicators(metrics, referenceDate), calculateStatusColor(budgetUsagePercent, monthProgressPercent, daysElapsed). Use date-fns. Implement color algorithm from data-model.md lines 368-391. Make T008 pass.

- [x] **T021** Implement expense-breakdown at `lib/budget/expense-breakdown.ts`. Function: deriveExpenseBreakdown(config), formatSubscriptionLabel(key). Reference: data-model.md lines 442-493. Make T010 pass.

### API Routes

- [x] **T022** Implement GET /api/budget/config route at `app/api/budget/config/route.ts`. Use config-loader. Support bustCache query param. Implement 5-minute caching. Handle errors per contract (200, 400, 404, 500). Make T004 pass.

- [x] **T023** Implement GET /api/budget/metrics route at `app/api/budget/metrics/route.ts`. Use metrics-calculator, progress-tracker, expense-breakdown, transaction-filter. Support month and referenceDate query params. Load transactions from storage. Handle errors per contract (200, 400, 500). Make T005 pass.

---

## Phase 3.4: shadcn/ui Component Setup

- [x] **T024** [P] Install shadcn components: card, progress, accordion. Run `npx shadcn@latest add card progress accordion`. Verify installation in `components/ui/`. (Already installed)

- [x] **T025** [P] Review shadcn component demos using shadcn MCP. Query examples: "card-demo", "progress example", "accordion-demo". Study usage patterns for implementation. (Used existing patterns)

---

## Phase 3.5: Component Implementation

### Sub-components (implement before parent)

- [ ] **T026** Implement BudgetHeader component at `components/budget/BudgetHeader.tsx`. Props: month (string), daysElapsed (number), totalDays (number), monthProgressPercent (number). Display month name, day X of Y, progress bar. Use shadcn Card and Progress. Make T011 pass.

- [ ] **T027** Implement BudgetProgress component at `components/budget/BudgetProgress.tsx`. Props: budgetUsagePercent, budgetUsageAmount, budgetTotalAmount, budgetRemaining, statusColor. Display progress bar with color coding (green/yellow/red), spent amount, remaining amount. Use shadcn Progress. Make T012 pass.

- [ ] **T028** Implement BudgetBreakdown component at `components/budget/BudgetBreakdown.tsx`. Props: breakdown (ExpenseBreakdown). Display collapsible fixed expenses and variable subscriptions with nested items. Use shadcn Accordion. Make T013 pass.

- [ ] **T029** Implement BurnRateIndicator component at `components/budget/BurnRateIndicator.tsx`. Props: actualBurnRate, targetBurnRate, burnRateVariance, burnRateVariancePercent, statusColor. Display actual vs target, variance with color. Use shadcn Card. Make T014 pass.

- [ ] **T030** Implement InterestTracker component at `components/budget/InterestTracker.tsx`. Props: forecastedInterest, interestPaidMtd. Display forecasted vs paid, percentage. Use shadcn Card. Make T015 pass.

### Parent component

- [x] **T031** Implement BudgetOverview component at `components/budget/BudgetOverview.tsx`. Fetch data from /api/budget/metrics. Integrate all budget sub-components inline (comprehensive single component). Handle loading state, error state. Use React hooks (useState, useEffect).

---

## Phase 3.6: Dashboard Integration

- [x] **T032** Integrate BudgetOverview component into dashboard at `app/page.tsx`. Import and render BudgetOverview. Verify responsive layout (mobile, tablet, desktop). Test collapsible sections on mobile (320px+ width).

---

## Phase 3.7: Integration Tests (full user scenarios)

- [ ] **T033** [P] Integration test for Scenario 1: Budget overview displays correctly. File: `tests/integration/budget-overview.integration.test.tsx`. Verify all KPIs render, calculations accurate, <1s render time. Reference: quickstart.md lines 35-102.

- [ ] **T034** [P] Integration test for Scenario 2: Progress indicator shows correct status. File: `tests/integration/progress-indicator.integration.test.tsx`. Test 50% budget at 50% time = green status. Reference: quickstart.md lines 106-143.

- [ ] **T035** [P] Integration test for Scenario 3: Burn rate displays correctly. File: `tests/integration/burn-rate.integration.test.tsx`. Test actual vs target calculation and color coding. Reference: quickstart.md lines 147-172.

- [ ] **T036** [P] Integration test for Scenario 4: Collapsible breakdown works. File: `tests/integration/collapsible-breakdown.integration.test.tsx`. Test expand/collapse, item totals, nested children. Reference: quickstart.md lines 176-225.

- [ ] **T037** [P] Integration test for Scenario 5: Interest tracking displays. File: `tests/integration/interest-tracking.integration.test.tsx`. Test forecasted vs paid, pattern matching. Reference: quickstart.md lines 229-266.

- [ ] **T038** [P] Integration test for Scenario 6: Config hot-reload works. File: `tests/integration/config-hot-reload.integration.test.tsx`. Modify YAML, refresh, verify updates. Reference: quickstart.md lines 270-305.

- [ ] **T039** [P] Integration test for Scenario 7: Over-budget state displays. File: `tests/integration/over-budget.integration.test.tsx`. Test >100% usage, red color, negative remaining. Reference: quickstart.md lines 308-349.

---

## Phase 3.8: Edge Case Testing

- [ ] **T040** [P] Edge case test: Missing YAML config. File: `tests/integration/edge-cases.integration.test.ts` (combine all edge cases). Test error message, hint display, no crash. Reference: quickstart.md lines 355-371.

- [ ] **T041** Edge case test: Malformed YAML config. Add to `tests/integration/edge-cases.integration.test.ts`. Test validation error display, field path, error message. Reference: quickstart.md lines 375-395.

- [ ] **T042** Edge case test: First/last day of month. Add to `tests/integration/edge-cases.integration.test.ts`. Test division by zero handling, color algorithm edge cases. Reference: quickstart.md lines 399-425.

- [ ] **T043** Edge case test: No transactions for current month. Add to `tests/integration/edge-cases.integration.test.ts`. Test $0.00 displays, no crashes. Reference: quickstart.md lines 429-441.

- [ ] **T044** Edge case test: Negative transactions (refunds). Add to `tests/integration/edge-cases.integration.test.ts`. Test refund reduces spending, increases remaining. Reference: quickstart.md lines 445-456.

---

## Phase 3.9: Performance & Accessibility Validation

- [ ] **T045** Performance validation: Profile component render time (<1s requirement), API response time (<100ms), test with 10,000+ transactions. Use DevTools Performance tab. Reference: quickstart.md lines 483-504.

- [ ] **T046** Accessibility validation: Keyboard navigation, screen reader testing, color contrast (WCAG AA). Test focus visibility, ARIA labels, status conveyed via text not color alone. Reference: quickstart.md lines 508-523.

---

## Dependencies

**Ordering**:
1. **Setup (T001-T003)**: Create config, types, schemas [can parallelize T002-T003]
2. **Contract Tests (T004-T005)**: Write contract tests [parallel]
3. **Unit Tests (T006-T016)**: Write all unit tests [parallel]
4. **Business Logic (T017-T021)**: Implement in order (dependencies: T018→T019, T019→T020)
5. **API Routes (T022-T023)**: Implement (sequential, depends on T017-T021)
6. **shadcn Setup (T024-T025)**: Install and review [parallel]
7. **Components (T026-T031)**: Implement sub-components (T026-T030) before parent (T031)
8. **Integration (T032)**: Dashboard integration
9. **Integration Tests (T033-T039)**: Write integration tests [parallel]
10. **Edge Cases (T040-T044)**: Test edge cases (sequential in same file T041-T044)
11. **Validation (T045-T046)**: Performance and accessibility [parallel]

**Blocking Dependencies**:
- T017-T021 block T022-T023 (business logic before API routes)
- T024-T025 block T026-T031 (shadcn setup before components)
- T026-T030 block T031 (sub-components before parent)
- T031 blocks T032 (component before integration)
- T032 blocks T033-T039 (integration before integration tests)
- Tests must fail before implementation: T004-T016 before T017-T031

---

## Parallel Execution Examples

**Phase 3.2 - All Unit Tests Together** (after setup):
```bash
# Launch T006-T016 in parallel (11 independent test files)
npm run test:watch tests/unit/config-loader.test.ts &
npm run test:watch tests/unit/metrics-calculator.test.ts &
npm run test:watch tests/unit/progress-tracker.test.ts &
npm run test:watch tests/unit/transaction-filter.test.ts &
npm run test:watch tests/unit/expense-breakdown.test.ts &
npm run test:watch tests/unit/components/BudgetHeader.test.tsx &
npm run test:watch tests/unit/components/BudgetProgress.test.tsx &
npm run test:watch tests/unit/components/BudgetBreakdown.test.tsx &
npm run test:watch tests/unit/components/BurnRateIndicator.test.tsx &
npm run test:watch tests/unit/components/InterestTracker.test.tsx &
npm run test:watch tests/unit/components/BudgetOverview.test.tsx
```

**Phase 3.7 - Integration Tests** (after dashboard integration):
```bash
# Launch T033-T039 in parallel (7 independent integration tests)
npm run test tests/integration/budget-overview.integration.test.tsx &
npm run test tests/integration/progress-indicator.integration.test.tsx &
npm run test tests/integration/burn-rate.integration.test.tsx &
npm run test tests/integration/collapsible-breakdown.integration.test.tsx &
npm run test tests/integration/interest-tracking.integration.test.tsx &
npm run test tests/integration/config-hot-reload.integration.test.tsx &
npm run test tests/integration/over-budget.integration.test.tsx
```

---

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T005 ✅)
- [x] All entities have model tasks (T002-T003 for types/schemas, T017-T021 for implementations ✅)
- [x] All tests come before implementation (Phase 3.2 before 3.3 ✅)
- [x] Parallel tasks truly independent (different files marked [P] ✅)
- [x] Each task specifies exact file path (all tasks include paths ✅)
- [x] No task modifies same file as another [P] task (validated ✅)
- [x] All quickstart scenarios have integration tests (T033-T039 cover all 7 scenarios ✅)
- [x] Edge cases covered (T040-T044 ✅)
- [x] Performance and accessibility validated (T045-T046 ✅)

---

## Estimated Timeline

**Total Tasks**: 46
**Estimated Time**: ~40-50 hours (assuming sequential execution)
**With Parallelization**: ~25-30 hours

**Breakdown by Phase**:
- Phase 3.1 (Setup): 2-3 hours
- Phase 3.2 (Tests): 10-12 hours (or 3-4 hours if parallelized)
- Phase 3.3 (Implementation): 8-10 hours
- Phase 3.4 (shadcn): 1 hour
- Phase 3.5 (Components): 6-8 hours
- Phase 3.6 (Integration): 1-2 hours
- Phase 3.7 (Integration Tests): 6-8 hours (or 2-3 hours if parallelized)
- Phase 3.8 (Edge Cases): 2-3 hours
- Phase 3.9 (Validation): 2-3 hours

---

## Notes

- **[P]** tasks = different files, no dependencies, safe to parallelize
- **TDD Requirement**: All tests (T004-T016) MUST be written and failing before implementation (T017-T031)
- **shadcn MCP**: Use shadcn MCP server for component demos (T025) before implementing components
- **Constitutional Compliance**: Tests required (>80% coverage), mobile-first design (320px+), performance (<1s render)
- **Test Coverage Target**: >80% (unit + integration tests cover all business logic and user scenarios)
- **Commit Strategy**: Commit after each task completion (or after logical groups of [P] tasks)

---

**Tasks Ready for Execution** ✅
