
# Implementation Plan: Spending Heatmap Calendar

**Branch**: `002-spending-heatmap-calendar` | **Date**: 2025-09-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/allay/dev/spending-tracker/specs/002-spending-heatmap-calendar/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
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
Calendar view with color-coded spending amounts per day (GitHub contribution graph style) allowing pattern identification and transaction drill-down. Built as React components integrated with existing Next.js dashboard.

## Technical Context
**Language/Version**: TypeScript 5.x with Next.js 14.2.16
**Primary Dependencies**: React 18, Next.js, Radix UI, TailwindCSS, date-fns, Recharts, Zod
**Storage**: Local browser storage (existing transaction data structure)
**Testing**: Jest + Testing Library + Playwright for E2E
**Target Platform**: Modern web browsers, mobile-responsive
**Project Type**: web - Next.js application with app router
**Performance Goals**: <2s dashboard load, <1s calendar render, <500ms day selection
**Constraints**: <512MB memory usage, responsive design, GitHub-like visual similarity
**Scale/Scope**: Support 5+ years transaction data, 10k+ transactions efficiently

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Code Quality Compliance:**
- [x] Code follows maintainable patterns and formatting standards (ESLint, Prettier configured)
- [x] Type safety implemented where applicable (TypeScript with strict mode)
- [x] Documentation updated for interface changes (component interfaces documented)

**Testing Standards Compliance:**
- [x] TDD approach planned (tests before implementation - Jest/Testing Library/Playwright)
- [x] Unit test coverage target ≥80% identified (Jest coverage reporting configured)
- [x] Integration tests cover user workflows (calendar interaction, transaction drill-down)
- [x] Contract tests validate data interfaces (transaction data structure validation)

**User Experience Consistency:**
- [x] Interface patterns consistent across components (follows existing dashboard patterns)
- [x] User feedback mechanisms planned (loading states, hover effects, click feedback)
- [x] Error handling provides clear, actionable messages (empty state handling, error boundaries)
- [x] Navigation follows intuitive patterns (integrates with existing dashboard navigation)

**Mobile-First Design:**
- [x] Responsive design approach planned (TailwindCSS responsive classes)
- [x] Touch-friendly interface considerations (calendar cells sized for touch)
- [x] Accessibility guidelines compliance (44px touch targets, keyboard navigation)
- [x] Offline functionality planned where applicable (works with existing local data)

**Performance Excellence:**
- [x] Load time targets defined (<2s dashboard, <1s calendar render, <500ms day selection)
- [x] Resource constraints identified (<512MB memory, calendar virtualization for large datasets)
- [x] Performance monitoring approach planned (React DevTools, bundle analysis)
- [x] Scalability targets addressed (efficient date calculations, memoization for large datasets)

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
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 - Web application (Next.js app router structure with components/, app/, lib/)

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
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- CalendarService contract → service interface test [P]
- Component contracts → component interface tests [P]
- Data model entities → type definition and validation tasks [P]
- Quickstart scenarios → integration test tasks
- Implementation tasks following TDD approach

**Ordering Strategy**:
- TDD order: Contract tests → type definitions → service implementation → components → integration
- Dependency order: Types/interfaces → services → components → integration
- Mark [P] for parallel execution (independent files/contracts)

**Specific Task Areas**:
1. **Type Definitions** (tasks 1-5): DailySpending, CalendarPeriod, HeatmapConfig, CalendarCell interfaces
2. **Contract Tests** (tasks 6-10): CalendarService, SpendingCalendar component contract validation
3. **Service Layer** (tasks 11-16): Date calculations, spending aggregation, threshold calculation
4. **Component Layer** (tasks 17-24): CalendarCell, CalendarHeader, SpendingCalendar main component
5. **Integration** (tasks 25-30): Dashboard integration, transaction drill-down, performance optimization

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command) - research.md generated with tech decisions
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 30-35 tasks planned
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - all principles met
- [x] Post-Design Constitution Check: PASS - no new violations introduced
- [x] All NEEDS CLARIFICATION resolved - no unknown technical aspects
- [x] Complexity deviations documented - none required

---
*Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`*
