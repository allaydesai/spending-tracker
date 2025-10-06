# Research: Budget Overview Component

**Feature**: Budget Overview Component (005)
**Date**: 2025-10-05
**Status**: Complete

## Research Areas

### 1. YAML Configuration Management in Next.js

**Decision**: Use `js-yaml` library with server-side loading and Zod validation

**Rationale**:
- YAML is human-readable and easy for non-technical users to edit
- `js-yaml` is the most popular YAML parser for JavaScript (5M+ weekly downloads)
- Server-side loading via API route prevents exposing config to client bundle
- Zod provides runtime type safety and clear validation error messages
- Hot-reload supported via API route re-fetching on dashboard refresh

**Alternatives Considered**:
- JSON config: Less readable for nested structures, no comments support
- TOML config: Less familiar to users, fewer ecosystem tools
- UI-based config editor: Adds unnecessary complexity (violates constitution), harder to version control

**Implementation Pattern**:
```typescript
// lib/budget/config-loader.ts
import yaml from 'js-yaml';
import { z } from 'zod';
import fs from 'fs/promises';

const BudgetConfigSchema = z.object({
  budget: z.object({
    forecasted_income: z.number().positive(),
    fixed_expenses: z.object({ /* ... */ }),
    day_to_day_budget: z.number().positive(),
    forecasted_interest: z.number().nonnegative(),
    interest_patterns: z.object({ /* ... */ })
  })
});

export async function loadBudgetConfig() {
  const yamlContent = await fs.readFile('data/budget-config.yaml', 'utf8');
  const parsed = yaml.load(yamlContent);
  return BudgetConfigSchema.parse(parsed); // Throws with clear errors
}
```

**Best Practices**:
- Cache parsed config with 5-minute TTL to avoid repeated disk reads
- Validate on server startup and fail fast if config is malformed
- Provide detailed error messages referencing YAML line numbers if possible
- Support environment variable overrides for testing

---

### 2. shadcn/ui Component Selection and Usage

**Decision**: Use @shadcn/card, @shadcn/progress, @shadcn/accordion for budget overview

**Rationale**:
- Project already uses shadcn/ui (components.json configured)
- Consistent with existing dashboard UI patterns
- Accessible (ARIA-compliant Radix UI primitives)
- Customizable with Tailwind CSS (matches project styling)
- Mobile-responsive out of the box

**Component Mapping**:
- **Card**: Container for entire budget overview and sub-sections
- **Progress**: Visual progress bars for budget usage and month progress
- **Accordion**: Collapsible breakdown sections (fixed expenses, subscriptions)
- **Badge**: Status indicators (green/yellow/red for burn rate)
- **Separator**: Visual dividers between sections

**Alternatives Considered**:
- Custom components: More work, inconsistent with existing UI, harder to maintain
- Material UI: Different design language, larger bundle size
- Collapsible instead of Accordion: Accordion provides better multi-section management

**Implementation Pattern**:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function BudgetOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview - October 2025</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={46.3} className="h-4" />
        <Accordion type="multiple">
          <AccordionItem value="fixed">
            <AccordionTrigger>Fixed Expenses</AccordionTrigger>
            <AccordionContent>{/* breakdown */}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
```

**Best Practices from shadcn/ui**:
- Use `type="multiple"` on Accordion to allow multiple sections open simultaneously
- Leverage Tailwind CSS custom colors for status indicators (green-500, yellow-500, red-500)
- Use `cn()` utility for conditional className composition
- Follow responsive design with Tailwind breakpoints (sm:, md:, lg:)
- Ensure 44px+ touch targets on mobile (accordion triggers, expand buttons)

---

### 3. Budget Calculation Performance Optimization

**Decision**: Client-side calculation with memoization, server-side API for data fetching

**Rationale**:
- Calculations are simple arithmetic (no heavy computation)
- Minimizes API roundtrips (<100ms for data fetch + <50ms for calculation)
- React.useMemo prevents recalculation on unrelated re-renders
- Meets <1s component render requirement with room to spare
- Current month filtering reduces dataset to ~500-1000 transactions max

**Alternatives Considered**:
- Full server-side calculation: Extra API latency, no benefit for simple math
- Web Workers: Overkill for lightweight calculations, adds complexity
- Database views: Couples implementation to database, breaks localStorage compatibility

**Implementation Pattern**:
```typescript
// lib/budget/metrics-calculator.ts
import { useMemo } from 'react';
import { BudgetConfig, Transaction, BudgetMetrics } from './types';

export function calculateBudgetMetrics(
  config: BudgetConfig,
  transactions: Transaction[]
): BudgetMetrics {
  const totalFixedExpenses = /* sum all fixed costs */;
  const totalVariableSubscriptions = /* sum subscriptions */;
  const actualIncomeMtd = /* sum positive transactions */;
  const actualVariableSpendingMtd = /* sum day-to-day expenses */;

  return {
    totalFixedExpenses,
    totalVariableSubscriptions,
    forecastedSavings: config.forecasted_income - totalFixedExpenses - totalVariableSubscriptions - config.day_to_day_budget,
    actualIncomeMtd,
    actualVariableSpendingMtd,
    budgetRemaining: config.day_to_day_budget - actualVariableSpendingMtd,
    actualSavingsMtd: actualIncomeMtd - totalFixedExpenses - totalVariableSubscriptions - actualVariableSpendingMtd,
    interestPaidMtd: /* sum interest transactions */
  };
}

// In component
const metrics = useMemo(
  () => calculateBudgetMetrics(config, transactions),
  [config, transactions]
);
```

**Best Practices**:
- Use date-fns for timezone-safe date comparisons (startOfMonth, endOfMonth, isWithinInterval)
- Memoize expensive array filters with useMemo
- Batch state updates to avoid multiple re-renders
- Profile with React DevTools Profiler to verify <1s render time

---

### 4. Color Coding Algorithm for Budget Status

**Decision**: Dynamic color calculation based on budget usage vs. time elapsed ratio

**Rationale**:
- Provides contextual feedback (spending 50% of budget at 75% through month = good)
- Matches user mental model from spec requirements (FR-021, FR-022)
- Simple algorithm with clear thresholds
- Accessible color choices (sufficient contrast ratios)

**Algorithm**:
```typescript
// lib/budget/progress-tracker.ts
export function calculateStatusColor(
  budgetUsagePercent: number,
  monthProgressPercent: number
): 'green' | 'yellow' | 'red' {
  const ratio = budgetUsagePercent / monthProgressPercent;

  if (ratio <= 1.0) return 'green';      // On track or ahead
  if (ratio <= 1.10) return 'yellow';    // Within 10% over pace
  return 'red';                          // More than 10% over pace
}

// Edge case: Beginning of month (monthProgressPercent close to 0)
if (monthProgressPercent < 3) {
  // Use simple threshold for first 1-2 days
  return budgetUsagePercent <= 10 ? 'green' : 'yellow';
}
```

**Alternatives Considered**:
- Fixed thresholds (0-75% green, 76-95% yellow, 96%+ red): Ignores time context
- Linear interpolation: Overly complex for marginal benefit
- Tertiary states (5+ colors): Confusing, violates UX simplicity

**Accessibility**:
- Green: #22c55e (bg-green-500) - AA contrast on white
- Yellow: #eab308 (bg-yellow-500) - AA contrast on white
- Red: #ef4444 (bg-red-500) - AA contrast on white
- Always include text indicators alongside color (not color-only)

---

### 5. Transaction Filtering for Current Month

**Decision**: Client-side filtering with date-fns, cached current month boundaries

**Rationale**:
- Transactions already fetched for dashboard (no extra API call)
- date-fns provides timezone-safe date handling
- Filter operation <10ms for 10,000 transactions (well under 500ms constraint)
- Supports both database and localStorage modes transparently

**Implementation Pattern**:
```typescript
// lib/budget/transaction-filter.ts
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export function getCurrentMonthTransactions(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): Transaction[] {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);

  return transactions.filter(tx =>
    isWithinInterval(new Date(tx.date), { start, end })
  );
}

export function filterInterestTransactions(
  transactions: Transaction[],
  interestPatterns: InterestPatterns
): Transaction[] {
  return transactions.filter(tx =>
    interestPatterns.categories.includes(tx.category) ||
    interestPatterns.keywords.some(keyword =>
      tx.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );
}
```

**Best Practices**:
- Always use date-fns for date operations (handles DST, leap years, timezones)
- Cache month boundaries in useMemo to avoid recalculation
- Use Array.filter (O(n)) instead of multiple passes for multiple conditions
- Handle edge case: transactions with invalid date strings (filter out gracefully)

---

### 6. Testing Strategy for Financial Calculations

**Decision**: TDD with comprehensive unit tests for calculations, integration tests for workflows

**Rationale**:
- Financial calculations must be 100% accurate (zero tolerance for math errors)
- Unit tests verify each calculation function independently
- Integration tests verify end-to-end user scenarios
- Contract tests ensure API stability
- Meets constitutional requirement of >80% coverage

**Test Structure**:
```typescript
// tests/unit/metrics-calculator.test.ts
describe('calculateBudgetMetrics', () => {
  it('calculates total fixed expenses correctly (FR-007)', () => {
    const config = mockBudgetConfig({ mortgage: 4581.34, car_payment: 600 });
    const metrics = calculateBudgetMetrics(config, []);
    expect(metrics.totalFixedExpenses).toBe(7588.94); // Exact match
  });

  it('calculates forecasted savings correctly (FR-009)', () => {
    const config = mockBudgetConfig();
    const metrics = calculateBudgetMetrics(config, []);
    // forecasted_savings = 13437.98 - 7588.94 - 4000.00 = 1849.04
    expect(metrics.forecastedSavings).toBe(1849.04);
  });

  it('handles negative budget remaining (edge case)', () => {
    const config = mockBudgetConfig({ day_to_day_budget: 1000 });
    const transactions = mockTransactions({ totalSpending: 1500 });
    const metrics = calculateBudgetMetrics(config, transactions);
    expect(metrics.budgetRemaining).toBe(-500);
  });
});
```

**Coverage Targets**:
- Calculation functions: 100% (all branches, edge cases)
- Component logic: >90% (visual variations, interactions)
- API routes: >85% (happy path + error handling)
- Integration tests: All acceptance scenarios from spec

**Best Practices**:
- Use decimal.js for currency math if floating-point precision issues arise
- Test edge cases: month boundaries, leap years, timezone changes, negative values
- Snapshot tests for component rendering (detect unintended visual changes)
- Performance tests: Assert calculations complete in <50ms

---

## Summary of Key Decisions

| Area | Technology | Rationale |
|------|------------|-----------|
| Config Storage | YAML + js-yaml | Human-readable, comments, version control friendly |
| Config Validation | Zod schemas | Type safety, clear error messages |
| UI Components | shadcn/ui (@shadcn) | Existing project standard, accessible, customizable |
| Calculations | Client-side + useMemo | Simple math, <1s render target, no server roundtrip |
| Date Handling | date-fns | Timezone-safe, comprehensive, well-tested |
| Testing | Jest + RTL + MSW | Existing project setup, TDD-friendly |
| Color Coding | Dynamic ratio-based | Context-aware, user-friendly feedback |
| API Routes | Next.js App Router | Existing architecture, clear contracts |

## Performance Validation

**Expected Metrics**:
- YAML load + parse: <50ms (cached after first load)
- Config validation: <10ms (Zod runtime check)
- Transaction filtering: <10ms (1000 transactions × O(n))
- Metric calculations: <20ms (simple arithmetic)
- Component render: <200ms (React + shadcn/ui)
- **Total**: ~290ms < 1s requirement ✅

## Risk Mitigation

**Risk**: YAML parse errors crash application
**Mitigation**: Try-catch in API route, return 400 with detailed error message, fallback to default config

**Risk**: Floating-point precision errors in currency calculations
**Mitigation**: Use fixed-point arithmetic (multiply by 100, work with cents, divide by 100) or decimal.js if needed

**Risk**: Timezone bugs causing incorrect "current month" detection
**Mitigation**: date-fns handles timezones, unit tests cover month boundaries, explicit timezone in config if needed

**Risk**: Bundle size increase from dependencies (js-yaml, date-fns)
**Mitigation**: Both are already in package.json, tree-shaking enabled, <50KB combined minified+gzip

---

**Research Complete**: All technical unknowns resolved. Ready for Phase 1 (Design & Contracts).
