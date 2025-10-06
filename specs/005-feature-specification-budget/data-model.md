# Data Model: Budget Overview Component

**Feature**: Budget Overview Component (005)
**Date**: 2025-10-05
**Status**: Complete

## Overview

This document defines the data entities for the Budget Overview feature. These entities represent budget configuration, calculated metrics, and progress indicators used throughout the component.

---

## Entity: BudgetConfig

**Source**: YAML configuration file (`data/budget-config.yaml`)
**Purpose**: User-editable budget parameters and expense breakdowns
**Lifecycle**: Loaded on demand, cached for 5 minutes, validated on load

### TypeScript Definition

```typescript
export interface BudgetConfig {
  budget: {
    forecasted_income: number;
    fixed_expenses: FixedExpenses;
    day_to_day_budget: number;
    forecasted_interest: number;
    interest_patterns: InterestPatterns;
  };
}

export interface FixedExpenses {
  mortgage: number;
  essential_services: {
    wireless: number;
    insurance: number;
    utility: number;
  };
  car_payment: number;
  additional_services: Record<string, number>; // Dynamic subscription keys
  aaria_day_care: number;
}

export interface InterestPatterns {
  categories: string[];
  keywords: string[];
}
```

### Zod Validation Schema

```typescript
import { z } from 'zod';

export const BudgetConfigSchema = z.object({
  budget: z.object({
    forecasted_income: z.number().positive("Income must be positive"),

    fixed_expenses: z.object({
      mortgage: z.number().nonnegative("Mortgage cannot be negative"),

      essential_services: z.object({
        wireless: z.number().nonnegative("Wireless cost cannot be negative"),
        insurance: z.number().nonnegative("Insurance cost cannot be negative"),
        utility: z.number().nonnegative("Utility cost cannot be negative"),
      }),

      car_payment: z.number().nonnegative("Car payment cannot be negative"),

      additional_services: z.record(
        z.string(),
        z.number().nonnegative("Subscription cost cannot be negative")
      ),

      aaria_day_care: z.number().nonnegative("Day care cost cannot be negative"),
    }),

    day_to_day_budget: z.number().positive("Day-to-day budget must be positive"),

    forecasted_interest: z.number().nonnegative("Forecasted interest cannot be negative"),

    interest_patterns: z.object({
      categories: z.array(z.string()).min(1, "At least one interest category required"),
      keywords: z.array(z.string()).min(1, "At least one interest keyword required"),
    }),
  })
});

export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
```

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| forecasted_income | > 0 | "Income must be positive" |
| day_to_day_budget | > 0 | "Day-to-day budget must be positive" |
| All money fields | >= 0 | "{Field} cannot be negative" |
| interest_patterns.categories | length >= 1 | "At least one interest category required" |
| interest_patterns.keywords | length >= 1 | "At least one interest keyword required" |

### Example Data

```yaml
budget:
  forecasted_income: 13437.98

  fixed_expenses:
    mortgage: 4581.34

    essential_services:
      wireless: 371.62
      insurance: 698.47
      utility: 300.00

    car_payment: 600.00

    additional_services:
      netflix: 20.99
      spotify: 10.99
      amazon_prime: 14.99
      gym_membership: 45.00
      cloud_storage: 9.99

    aaria_day_care: 484.00

  day_to_day_budget: 4000.00

  forecasted_interest: 1025.00

  interest_patterns:
    categories:
      - "Interest"
      - "Interest & Charges"
      - "Finance Charge"
    keywords:
      - "interest"
      - "finance charge"
      - "apr"
```

---

## Entity: BudgetMetrics

**Source**: Calculated from BudgetConfig + Transaction data
**Purpose**: Real-time budget performance metrics
**Lifecycle**: Recalculated on every data fetch, memoized in component

### TypeScript Definition

```typescript
export interface BudgetMetrics {
  // Breakdown totals (from config)
  totalFixedExpenses: number;           // Sum of all fixed expenses (FR-007)
  totalVariableSubscriptions: number;   // Sum of additional_services (FR-008)

  // Forecasted values (from config)
  forecastedIncome: number;             // From config.forecasted_income
  forecastedSavings: number;            // Calculated per FR-009
  forecastedInterest: number;           // From config.forecasted_interest

  // Actual values month-to-date (from transactions)
  actualIncomeMtd: number;              // Sum of positive transactions (FR-010)
  actualVariableSpendingMtd: number;    // Sum of day-to-day expenses (FR-011)
  budgetRemaining: number;              // Day-to-day budget - actual spending (FR-012)
  actualSavingsMtd: number;             // Calculated per FR-013
  interestPaidMtd: number;              // Sum of interest transactions (FR-014)

  // Day-to-day budget tracking
  dayToDayBudget: number;               // From config.day_to_day_budget
}
```

### Calculation Formulas

```typescript
export function calculateBudgetMetrics(
  config: BudgetConfig,
  currentMonthTransactions: Transaction[]
): BudgetMetrics {
  // FR-007: Total Fixed Expenses
  const totalFixedExpenses =
    config.budget.fixed_expenses.mortgage +
    config.budget.fixed_expenses.essential_services.wireless +
    config.budget.fixed_expenses.essential_services.insurance +
    config.budget.fixed_expenses.essential_services.utility +
    config.budget.fixed_expenses.car_payment +
    config.budget.fixed_expenses.aaria_day_care;

  // FR-008: Total Variable Subscriptions
  const totalVariableSubscriptions = Object.values(
    config.budget.fixed_expenses.additional_services
  ).reduce((sum, amount) => sum + amount, 0);

  // FR-010: Actual Income MTD (positive transactions only)
  const actualIncomeMtd = currentMonthTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // FR-011: Actual Variable Spending MTD (negative transactions, exclude fixed/subscriptions)
  // NOTE: Fixed expenses and subscriptions are excluded from imports per FR-042
  const actualVariableSpendingMtd = Math.abs(
    currentMonthTransactions
      .filter(tx => tx.amount < 0 && !isInterestTransaction(tx, config))
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  // FR-012: Budget Remaining
  const budgetRemaining =
    config.budget.day_to_day_budget - actualVariableSpendingMtd;

  // FR-009: Forecasted Savings
  const forecastedSavings =
    config.budget.forecasted_income -
    totalFixedExpenses -
    totalVariableSubscriptions -
    config.budget.day_to_day_budget;

  // FR-013: Actual Savings MTD
  const actualSavingsMtd =
    actualIncomeMtd -
    totalFixedExpenses -
    totalVariableSubscriptions -
    actualVariableSpendingMtd;

  // FR-014: Interest Paid MTD
  const interestPaidMtd = currentMonthTransactions
    .filter(tx => isInterestTransaction(tx, config))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return {
    totalFixedExpenses,
    totalVariableSubscriptions,
    forecastedIncome: config.budget.forecasted_income,
    forecastedSavings,
    forecastedInterest: config.budget.forecasted_interest,
    actualIncomeMtd,
    actualVariableSpendingMtd,
    budgetRemaining,
    actualSavingsMtd,
    interestPaidMtd,
    dayToDayBudget: config.budget.day_to_day_budget,
  };
}

function isInterestTransaction(tx: Transaction, config: BudgetConfig): boolean {
  return (
    config.budget.interest_patterns.categories.includes(tx.category) ||
    config.budget.interest_patterns.keywords.some(keyword =>
      tx.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );
}
```

### Example Data

```typescript
{
  totalFixedExpenses: 7588.94,
  totalVariableSubscriptions: 553.51,
  forecastedIncome: 13437.98,
  forecastedSavings: 1849.04,
  forecastedInterest: 1025.00,
  actualIncomeMtd: 6800.00,
  actualVariableSpendingMtd: 1850.00,
  budgetRemaining: 2150.00,
  actualSavingsMtd: 2361.06,
  interestPaidMtd: 512.50,
  dayToDayBudget: 4000.00
}
```

---

## Entity: ProgressIndicators

**Source**: Calculated from BudgetMetrics + current date
**Purpose**: Time-based progress tracking and status indicators
**Lifecycle**: Recalculated on every render (date-dependent)

### TypeScript Definition

```typescript
export interface ProgressIndicators {
  // Time tracking (FR-015)
  daysElapsed: number;                  // Days completed in current month
  totalDays: number;                    // Total days in current month
  monthProgressPercent: number;         // Percentage of month completed (0-100)

  // Budget tracking (FR-016)
  budgetUsagePercent: number;           // Percentage of day-to-day budget used (0-100+)
  budgetUsageAmount: number;            // Dollar amount used
  budgetTotalAmount: number;            // Total day-to-day budget

  // Burn rate (FR-017, FR-018, FR-019)
  actualBurnRate: number;               // Actual spending per day
  targetBurnRate: number;               // Target spending per day
  burnRateVariance: number;             // Difference (positive = over target)
  burnRateVariancePercent: number;      // Percentage variance

  // Status (FR-021, FR-022, FR-023)
  statusColor: 'green' | 'yellow' | 'red';  // Color coding based on progress
  isOverBudget: boolean;                // True if budget remaining < 0
}
```

### Calculation Formulas

```typescript
import { getDaysInMonth, getDate } from 'date-fns';

export function calculateProgressIndicators(
  metrics: BudgetMetrics,
  referenceDate: Date = new Date()
): ProgressIndicators {
  // FR-015: Month progress
  const totalDays = getDaysInMonth(referenceDate);
  const daysElapsed = getDate(referenceDate);
  const monthProgressPercent = (daysElapsed / totalDays) * 100;

  // FR-016: Budget usage
  const budgetUsageAmount = metrics.actualVariableSpendingMtd;
  const budgetTotalAmount = metrics.dayToDayBudget;
  const budgetUsagePercent = (budgetUsageAmount / budgetTotalAmount) * 100;

  // FR-017: Actual burn rate
  const actualBurnRate = daysElapsed > 0
    ? budgetUsageAmount / daysElapsed
    : 0;

  // FR-018: Target burn rate
  const targetBurnRate = budgetTotalAmount / totalDays;

  // FR-019: Burn rate variance
  const burnRateVariance = actualBurnRate - targetBurnRate;
  const burnRateVariancePercent = targetBurnRate > 0
    ? (burnRateVariance / targetBurnRate) * 100
    : 0;

  // FR-021, FR-022: Status color
  const statusColor = calculateStatusColor(
    budgetUsagePercent,
    monthProgressPercent,
    daysElapsed
  );

  // FR-023: Over budget indicator
  const isOverBudget = metrics.budgetRemaining < 0;

  return {
    daysElapsed,
    totalDays,
    monthProgressPercent,
    budgetUsagePercent,
    budgetUsageAmount,
    budgetTotalAmount,
    actualBurnRate,
    targetBurnRate,
    burnRateVariance,
    burnRateVariancePercent,
    statusColor,
    isOverBudget,
  };
}

// FR-021, FR-022: Color coding algorithm
function calculateStatusColor(
  budgetUsagePercent: number,
  monthProgressPercent: number,
  daysElapsed: number
): 'green' | 'yellow' | 'red' {
  // Edge case: First 1-2 days of month
  if (daysElapsed <= 2) {
    return budgetUsagePercent <= 10 ? 'green' : 'yellow';
  }

  // Calculate ratio of budget used vs time elapsed
  const ratio = budgetUsagePercent / monthProgressPercent;

  // FR-021: Green if on track or ahead
  if (ratio <= 1.0) return 'green';

  // FR-022: Yellow if 1-10% over pace
  if (ratio <= 1.10) return 'yellow';

  // FR-022: Red if >10% over pace
  return 'red';
}
```

### Example Data

```typescript
{
  daysElapsed: 15,
  totalDays: 31,
  monthProgressPercent: 48.4,
  budgetUsagePercent: 46.3,
  budgetUsageAmount: 1850.00,
  budgetTotalAmount: 4000.00,
  actualBurnRate: 123.33,
  targetBurnRate: 129.03,
  burnRateVariance: -5.70,
  burnRateVariancePercent: -4.4,
  statusColor: 'green',
  isOverBudget: false
}
```

---

## Entity: ExpenseBreakdown

**Source**: Derived from BudgetConfig
**Purpose**: Hierarchical structure for collapsible expense display
**Lifecycle**: Derived once when config loads

### TypeScript Definition

```typescript
export interface ExpenseBreakdown {
  fixedExpenses: ExpenseCategory;
  variableSubscriptions: ExpenseCategory;
}

export interface ExpenseCategory {
  total: number;
  items: ExpenseItem[];
}

export interface ExpenseItem {
  label: string;
  amount: number;
  children?: ExpenseItem[];  // For nested items like essential_services
}
```

### Derivation Logic

```typescript
export function deriveExpenseBreakdown(config: BudgetConfig): ExpenseBreakdown {
  const { fixed_expenses } = config.budget;

  // Fixed expenses breakdown (FR-024, FR-025, FR-026)
  const fixedExpenses: ExpenseCategory = {
    total:
      fixed_expenses.mortgage +
      fixed_expenses.essential_services.wireless +
      fixed_expenses.essential_services.insurance +
      fixed_expenses.essential_services.utility +
      fixed_expenses.car_payment +
      fixed_expenses.aaria_day_care,
    items: [
      { label: 'Mortgage', amount: fixed_expenses.mortgage },
      {
        label: 'Essential Services',
        amount:
          fixed_expenses.essential_services.wireless +
          fixed_expenses.essential_services.insurance +
          fixed_expenses.essential_services.utility,
        children: [
          { label: 'Wireless (Roger+Bell+ATT)', amount: fixed_expenses.essential_services.wireless },
          { label: 'Insurance (Car+Home)', amount: fixed_expenses.essential_services.insurance },
          { label: 'Utility (Hydro+Gas)', amount: fixed_expenses.essential_services.utility },
        ]
      },
      { label: 'Car Payment', amount: fixed_expenses.car_payment },
      { label: 'Aaria Day Care', amount: fixed_expenses.aaria_day_care },
    ]
  };

  // Variable subscriptions breakdown (FR-027, FR-028)
  const subscriptionEntries = Object.entries(fixed_expenses.additional_services);
  const variableSubscriptions: ExpenseCategory = {
    total: subscriptionEntries.reduce((sum, [, amount]) => sum + amount, 0),
    items: subscriptionEntries.map(([key, amount]) => ({
      label: formatSubscriptionLabel(key),  // Convert "netflix" → "Netflix"
      amount,
    }))
  };

  return { fixedExpenses, variableSubscriptions };
}

function formatSubscriptionLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

### Example Data

```typescript
{
  fixedExpenses: {
    total: 7588.94,
    items: [
      { label: 'Mortgage', amount: 4581.34 },
      {
        label: 'Essential Services',
        amount: 1370.09,
        children: [
          { label: 'Wireless (Roger+Bell+ATT)', amount: 371.62 },
          { label: 'Insurance (Car+Home)', amount: 698.47 },
          { label: 'Utility (Hydro+Gas)', amount: 300.00 },
        ]
      },
      { label: 'Car Payment', amount: 600.00 },
      { label: 'Aaria Day Care', amount: 484.00 },
    ]
  },
  variableSubscriptions: {
    total: 553.51,
    items: [
      { label: 'Netflix', amount: 20.99 },
      { label: 'Spotify', amount: 10.99 },
      { label: 'Amazon Prime', amount: 14.99 },
      { label: 'Gym Membership', amount: 45.00 },
      { label: 'Cloud Storage', amount: 9.99 },
    ]
  }
}
```

---

## Relationships

```
┌─────────────────┐
│  BudgetConfig   │
│  (YAML file)    │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────────┐
│ BudgetMetrics   │  │ ExpenseBreakdown │
│ (calculated)    │  │ (derived)        │
└────────┬────────┘  └──────────────────┘
         │
         │ + current date
         │
         ▼
┌─────────────────────┐
│ ProgressIndicators  │
│ (calculated)        │
└─────────────────────┘
```

**Data Flow**:
1. YAML file → `BudgetConfig` (validated with Zod)
2. `BudgetConfig` + `Transaction[]` → `BudgetMetrics` (calculated)
3. `BudgetConfig` → `ExpenseBreakdown` (derived)
4. `BudgetMetrics` + `Date` → `ProgressIndicators` (calculated)

---

## State Transitions

### BudgetConfig
- **Initial**: Not loaded
- **Loading**: API fetch in progress
- **Loaded**: Valid config in memory
- **Error**: Validation failed (show error message)
- **Stale**: >5 minutes old (refresh on next access)

### BudgetMetrics / ProgressIndicators
- **Initial**: Not calculated
- **Calculating**: Dependencies available, computation in progress
- **Ready**: Valid metrics available for display
- **Stale**: Dependencies changed (trigger recalculation)

---

## Validation & Constraints

| Entity | Constraint | Enforcement |
|--------|------------|-------------|
| BudgetConfig | All monetary values >= 0 | Zod schema (runtime) |
| BudgetConfig | forecasted_income > 0 | Zod schema (runtime) |
| BudgetConfig | day_to_day_budget > 0 | Zod schema (runtime) |
| BudgetMetrics | budgetRemaining can be negative | Allowed (over budget case) |
| ProgressIndicators | budgetUsagePercent can exceed 100 | Allowed (over budget case) |
| ProgressIndicators | statusColor in {green, yellow, red} | TypeScript enum |
| ProgressIndicators | daysElapsed <= totalDays | Guaranteed by date-fns |

---

## Performance Considerations

**Memory Footprint**:
- BudgetConfig: ~1-2KB (50 line items)
- BudgetMetrics: ~500 bytes (12 numeric fields)
- ProgressIndicators: ~400 bytes (11 fields)
- ExpenseBreakdown: ~2-3KB (50 items with nesting)
- **Total**: <6KB per instance (negligible impact)

**Calculation Performance**:
- BudgetMetrics: O(n) where n = current month transactions (~500-1000) = <10ms
- ProgressIndicators: O(1) simple arithmetic = <1ms
- ExpenseBreakdown: O(m) where m = config items (~50) = <1ms
- **Total**: <15ms calculation time ✅

---

**Data Model Complete**: All entities defined with TypeScript types, validation schemas, calculation formulas, and examples. Ready for contract generation.
