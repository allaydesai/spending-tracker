
# Implementation Plan: Budget Overview Component

**Branch**: `005-feature-specification-budget` | **Date**: 2025-10-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-feature-specification-budget/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Build a budget overview component for the expense tracker dashboard that displays monthly budget progress with real-time tracking of spending against forecasted budgets. The component will visualize fixed expenses ($7,588.94), variable subscriptions ($553.51), and day-to-day spending ($4,000 budget) with progress indicators, burn rate analysis, and interest tracking. Budget configuration is managed through a YAML file. The feature integrates with existing transaction data and must render in <1 second, be fully responsive on mobile (320px+), and support both database and localStorage data sources. Uses shadcn/ui components (Card, Progress, Accordion/Collapsible) for consistent UI/UX.

## Technical Context
**Language/Version**: TypeScript 5.x with React 18, Next.js 14.2.16
**Primary Dependencies**: Next.js (App Router), React, shadcn/ui (@shadcn, @originui registries), Radix UI primitives, Tailwind CSS 4.x, js-yaml (YAML parsing), date-fns (date calculations), Zod (validation)
**Storage**: Dual-mode - Better-SQLite3 (database mode) or localStorage (file mode), CSV files for budget config reference
**Testing**: Jest 30.x with React Testing Library, TypeScript, MSW for API mocking, contract tests, integration tests (>80% coverage required)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge), responsive mobile-first (320px+ width), single-page application
**Project Type**: Web application (Next.js App Router with API routes)
**Performance Goals**: <1s component render, <2s dashboard load, <500ms filter operations, support 10,000+ transactions
**Constraints**: <512MB memory usage, <2MB compressed bundle, mobile-responsive with 44px+ touch targets, offline-capable with localStorage fallback
**Scale/Scope**: Single user personal finance app, 5+ years of transaction data, monthly budget tracking with ~50 line items (fixed + variable expenses)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Code Quality First**
- ✅ TypeScript for type safety (mandatory)
- ✅ ESLint + Prettier configured (automated formatting)
- ✅ Component documentation with JSDoc
- ✅ Follow existing patterns (shadcn/ui components, Next.js App Router)

**II. Test-Driven Development (NON-NEGOTIABLE)**
- ✅ Tests written before implementation
- ✅ Unit tests for calculations (budget metrics, burn rate, progress indicators)
- ✅ Integration tests for user workflows (budget display, YAML loading, data filtering)
- ✅ Contract tests for API endpoints (/api/budget/config, /api/budget/metrics)
- ✅ Target: >80% test coverage
- ✅ All tests must pass before merge

**III. User Experience Consistency**
- ✅ Uses shadcn/ui components for consistency (@shadcn/card, @shadcn/progress, @shadcn/accordion)
- ✅ Follows existing dashboard patterns
- ✅ Immediate feedback on interactions (expand/collapse, progress updates)
- ✅ Clear error messages for YAML config validation
- ✅ Visual hierarchy guides users to key metrics (budget remaining, burn rate)

**IV. Mobile-First Design**
- ✅ Responsive layout (320px+ width requirement)
- ✅ Touch-friendly targets (44px+ minimum per spec FR-038)
- ✅ Collapsible sections to reduce mobile clutter
- ✅ No horizontal scrolling (per FR-037)
- ✅ Performance targets met on mobile (<1s render)

**V. Performance Excellence**
- ✅ <1s component render (FR-036)
- ✅ <2s dashboard load (constitution requirement)
- ✅ YAML config caching for hot-reload
- ✅ Optimized queries (current month transactions only)
- ✅ Lazy loading for breakdown sections
- ✅ Memory: <512MB during operation

**Performance Standards Alignment**:
- Dashboard load: <2s ✅ (constitutional requirement)
- Chart rendering: <1s ✅ (FR-036 component render)
- Filter operations: <500ms ✅ (technical context)
- Database queries: <100ms p95 ✅ (optimized current month queries)
- Scalability: 10,000+ transactions ✅ (existing capability)

**Result**: ✅ PASS - All constitutional principles satisfied, no violations

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
app/
├── api/
│   └── budget/
│       ├── config/
│       │   └── route.ts          # GET /api/budget/config - Load & validate YAML
│       └── metrics/
│           └── route.ts          # GET /api/budget/metrics - Calculate budget stats
├── page.tsx                      # Dashboard (integrate BudgetOverview component)
└── globals.css

components/
├── ui/                           # shadcn/ui components
│   ├── card.tsx                  # @shadcn/card
│   ├── progress.tsx              # @shadcn/progress
│   ├── accordion.tsx             # @shadcn/accordion
│   └── collapsible.tsx           # @shadcn/collapsible
└── budget/
    ├── BudgetOverview.tsx        # Main component (integrates all sub-components)
    ├── BudgetHeader.tsx          # Month progress indicator
    ├── BudgetProgress.tsx        # Day-to-day spending progress bar
    ├── BudgetBreakdown.tsx       # Fixed expenses & subscriptions (collapsible)
    ├── BurnRateIndicator.tsx     # Actual vs target burn rate
    └── InterestTracker.tsx       # Interest forecasted vs actual

lib/
├── budget/
│   ├── types.ts                  # BudgetConfig, BudgetMetrics, ProgressIndicators
│   ├── config-loader.ts          # YAML parsing & validation with Zod
│   ├── metrics-calculator.ts     # Calculate all budget metrics from config + transactions
│   ├── progress-tracker.ts       # Calculate burn rate, progress %, color coding
│   └── transaction-filter.ts     # Filter current month transactions
└── utils.ts                      # Existing utilities (cn, etc.)

data/
├── budget-config.yaml            # Budget configuration (user-editable)
├── budget_summary.csv            # Reference data for initial config
├── essential-services.csv        # Reference data for initial config
└── additional-services.csv       # Reference data for initial config

tests/
├── contract/
│   ├── budget-config.contract.test.ts      # API contract: GET /api/budget/config
│   └── budget-metrics.contract.test.ts     # API contract: GET /api/budget/metrics
├── integration/
│   ├── budget-overview.integration.test.tsx    # User scenarios from spec
│   ├── yaml-loading.integration.test.ts        # YAML validation & error handling
│   └── budget-calculations.integration.test.ts # End-to-end calculation flows
└── unit/
    ├── config-loader.test.ts           # YAML parsing, validation, error messages
    ├── metrics-calculator.test.ts      # Budget calculations (FR-007 to FR-014)
    ├── progress-tracker.test.ts        # Burn rate, progress %, color coding (FR-015 to FR-023)
    └── components/
        ├── BudgetOverview.test.tsx
        ├── BudgetProgress.test.tsx
        └── BudgetBreakdown.test.tsx
```

**Structure Decision**: Next.js App Router architecture with API routes. Component layer follows existing shadcn/ui patterns. Business logic isolated in `lib/budget/` for testability. API routes provide clear contract boundaries between frontend and backend logic. Tests organized by contract/integration/unit matching TDD requirements. YAML config in `data/` directory alongside existing CSV reference files.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

1. **Contract Test Tasks** (from contracts/*.yaml):
   - Task: Write contract test for GET /api/budget/config [P]
   - Task: Write contract test for GET /api/budget/metrics [P]
   - Each test validates request/response schemas, error cases
   - Tests MUST fail initially (no implementation)

2. **Data Model Tasks** (from data-model.md):
   - Task: Create TypeScript types (BudgetConfig, BudgetMetrics, ProgressIndicators, ExpenseBreakdown) [P]
   - Task: Create Zod validation schemas for BudgetConfig [P]
   - Independent file creation, can run in parallel

3. **Unit Test Tasks for Business Logic** (from data-model.md calculations):
   - Task: Write unit tests for config-loader.ts (YAML parsing, validation) [P]
   - Task: Write unit tests for metrics-calculator.ts (FR-007 to FR-014) [P]
   - Task: Write unit tests for progress-tracker.ts (FR-015 to FR-023) [P]
   - Task: Write unit tests for transaction-filter.ts [P]
   - Each test file is independent, tests written BEFORE implementation

4. **Business Logic Implementation Tasks** (make unit tests pass):
   - Task: Implement config-loader.ts (YAML loading, Zod validation, error handling)
   - Task: Implement metrics-calculator.ts (all calculation formulas from data-model.md)
   - Task: Implement progress-tracker.ts (burn rate, color coding algorithm)
   - Task: Implement transaction-filter.ts (current month filtering, interest detection)
   - Sequential: Each depends on its tests passing

5. **API Route Implementation Tasks** (make contract tests pass):
   - Task: Implement GET /api/budget/config route (use config-loader)
   - Task: Implement GET /api/budget/metrics route (use calculators + transaction data)
   - Sequential: Depends on business logic completion

6. **Component Unit Test Tasks** (from UI structure in plan.md):
   - Task: Write unit tests for BudgetOverview.tsx [P]
   - Task: Write unit tests for BudgetProgress.tsx [P]
   - Task: Write unit tests for BudgetBreakdown.tsx [P]
   - Task: Write unit tests for BurnRateIndicator.tsx [P]
   - Task: Write unit tests for InterestTracker.tsx [P]
   - Independent components, parallel test creation

7. **shadcn/ui Component Setup** (before component implementation):
   - Task: Install @shadcn/card, @shadcn/progress, @shadcn/accordion (if not already installed)
   - Task: Review component demos and examples (use shadcn MCP)
   - Prerequisite for UI implementation

8. **Component Implementation Tasks** (make component tests pass):
   - Task: Implement BudgetHeader.tsx (month progress indicator)
   - Task: Implement BudgetProgress.tsx (progress bar with color coding)
   - Task: Implement BudgetBreakdown.tsx (collapsible expense sections using Accordion)
   - Task: Implement BurnRateIndicator.tsx (actual vs target display)
   - Task: Implement InterestTracker.tsx (forecasted vs actual)
   - Task: Implement BudgetOverview.tsx (integrate all sub-components)
   - Sequential: Sub-components before parent component

9. **Integration Test Tasks** (from quickstart.md scenarios):
   - Task: Write integration test for Scenario 1 (budget overview displays correctly)
   - Task: Write integration test for Scenario 2 (progress indicator shows correct status)
   - Task: Write integration test for Scenario 3 (burn rate displays correctly)
   - Task: Write integration test for Scenario 4 (collapsible breakdown works)
   - Task: Write integration test for Scenario 5 (interest tracking displays)
   - Task: Write integration test for Scenario 6 (config hot-reload works)
   - Task: Write integration test for Scenario 7 (over-budget state displays)
   - Sequential: Requires full implementation complete

10. **YAML Config Creation**:
    - Task: Create budget-config.yaml from CSV reference data (budget_summary.csv, essential-services.csv, additional-services.csv)
    - Can be done early or in parallel with tests

11. **Dashboard Integration**:
    - Task: Integrate BudgetOverview component into app/page.tsx
    - Task: Verify responsive layout (mobile, tablet, desktop)
    - Sequential: Requires component implementation complete

12. **Edge Case Testing**:
    - Task: Test missing YAML config edge case
    - Task: Test malformed YAML edge case
    - Task: Test first/last day of month edge cases
    - Task: Test no transactions edge case
    - Task: Test negative transactions (refunds)
    - Sequential: After main implementation

13. **Performance Validation**:
    - Task: Profile component render time (<1s requirement)
    - Task: Measure API response time (<100ms requirement)
    - Task: Test with 10,000+ transactions
    - Final validation tasks

14. **Accessibility Testing**:
    - Task: Keyboard navigation testing
    - Task: Screen reader testing
    - Task: Color contrast validation
    - Final validation tasks

**Ordering Strategy**:
1. **Phase 1 (Setup)**: Types + YAML config [P]
2. **Phase 2 (Contract Tests)**: API contract tests [P]
3. **Phase 3 (Business Logic TDD)**: Unit tests → implementations (config, calculator, tracker, filter)
4. **Phase 4 (API Routes)**: Implement routes → contract tests pass
5. **Phase 5 (Components TDD)**: Component unit tests [P] → shadcn setup → implementations
6. **Phase 6 (Integration)**: Dashboard integration → integration tests
7. **Phase 7 (Validation)**: Edge cases → performance → accessibility

**Parallelization Strategy**:
- [P] = Tasks that can run in parallel (independent files, no dependencies)
- Sequential tasks must wait for dependencies
- Example: All unit test writing can happen in parallel, but implementations are sequential per module

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

**Task Template Format**:
```
## Task N: [Action Verb] [Target]

**Type**: [contract-test | unit-test | implementation | integration-test | validation]
**Priority**: [critical | high | medium]
**Estimated Time**: [15min | 30min | 1hr | 2hr]
**Dependencies**: [List of task numbers, or "None"]
**Parallel**: [Yes/No]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Implementation Notes
- File path: /path/to/file
- Key requirements: FR-XXX, FR-YYY
```

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
