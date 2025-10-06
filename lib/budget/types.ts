/**
 * Budget Types
 * TypeScript type definitions for budget configuration and metrics
 */

/**
 * Budget configuration loaded from YAML file
 * Source: data/budget-config.yaml
 */
export interface BudgetConfig {
  budget: {
    forecasted_income: number;
    fixed_expenses: FixedExpenses;
    day_to_day_budget: number;
    forecasted_interest: number;
    interest_patterns: InterestPatterns;
  };
}

/**
 * Fixed monthly expenses structure
 */
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

/**
 * Patterns for identifying interest transactions
 */
export interface InterestPatterns {
  categories: string[];  // Transaction categories
  keywords: string[];    // Keywords in descriptions
}

/**
 * Calculated budget metrics from config + transaction data
 * Recalculated on every data fetch
 */
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
  net: number;                          // Total Income - Fixed Expenses - Spending (FR-015)

  // Day-to-day budget tracking
  dayToDayBudget: number;               // From config.day_to_day_budget
}

/**
 * Time-based progress tracking and status indicators
 * Recalculated on every render (date-dependent)
 */
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

/**
 * Hierarchical structure for collapsible expense display
 * Derived from BudgetConfig
 */
export interface ExpenseBreakdown {
  fixedExpenses: ExpenseCategory;
  variableSubscriptions: ExpenseCategory;
}

/**
 * Expense category with total and line items
 */
export interface ExpenseCategory {
  total: number;
  items: ExpenseItem[];
}

/**
 * Individual expense line item
 * Can have nested children for hierarchical display
 */
export interface ExpenseItem {
  label: string;
  amount: number;
  children?: ExpenseItem[];  // For nested items like essential_services
}
