/**
 * Expense Breakdown
 * Derives hierarchical expense structure from config
 * Reference: data-model.md lines 442-493
 */

import { BudgetConfig, ExpenseBreakdown } from './types';

/**
 * Derive expense breakdown from budget configuration
 * @param config Budget configuration
 * @returns Hierarchical expense breakdown for UI display
 */
export function deriveExpenseBreakdown(config: BudgetConfig): ExpenseBreakdown {
  const { fixed_expenses } = config.budget;

  // Fixed expenses breakdown (FR-024, FR-025, FR-026)
  const fixedExpenses = {
    total:
      fixed_expenses.mortgage +
      fixed_expenses.essential_services.wireless +
      fixed_expenses.essential_services.insurance +
      fixed_expenses.essential_services.utility +
      fixed_expenses.car_payment +
      fixed_expenses.aaria_day_care,
    items: [
      {
        label: 'Mortgage',
        amount: fixed_expenses.mortgage,
      },
      {
        label: 'Essential Services',
        amount:
          fixed_expenses.essential_services.wireless +
          fixed_expenses.essential_services.insurance +
          fixed_expenses.essential_services.utility,
        children: [
          {
            label: 'Wireless (Roger+Bell+ATT)',
            amount: fixed_expenses.essential_services.wireless,
          },
          {
            label: 'Insurance (Car+Home)',
            amount: fixed_expenses.essential_services.insurance,
          },
          {
            label: 'Utility (Hydro+Gas)',
            amount: fixed_expenses.essential_services.utility,
          },
        ],
      },
      {
        label: 'Car Payment',
        amount: fixed_expenses.car_payment,
      },
      {
        label: 'Aaria Day Care',
        amount: fixed_expenses.aaria_day_care,
      },
    ],
  };

  // Variable subscriptions breakdown (FR-027, FR-028)
  const subscriptionEntries = Object.entries(fixed_expenses.additional_services);
  const variableSubscriptions = {
    total: subscriptionEntries.reduce((sum, [, amount]) => sum + amount, 0),
    items: subscriptionEntries.map(([key, amount]) => ({
      label: formatSubscriptionLabel(key),
      amount,
    })),
  };

  return { fixedExpenses, variableSubscriptions };
}

/**
 * Format subscription key to display label
 * Converts "netflix" → "Netflix", "amazon_prime" → "Amazon Prime"
 * @param key Subscription key from config
 * @returns Formatted display label
 */
export function formatSubscriptionLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
