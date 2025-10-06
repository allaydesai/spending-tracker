/**
 * Metrics Calculator
 * Calculates budget metrics from config and transaction data
 * Reference: data-model.md lines 175-255
 */

import { BudgetConfig, BudgetMetrics } from './types';
import { Transaction } from '../types/transaction';
import { isInterestTransaction } from './transaction-filter';

/**
 * Calculate all budget metrics from config and transactions
 * @param config Budget configuration
 * @param currentMonthTransactions Transactions for the current month only
 * @param isCurrentMonth Whether viewing current month (uses forecasted income) or past month (uses actual income)
 * @returns Calculated budget metrics
 */
export function calculateBudgetMetrics(
  config: BudgetConfig,
  currentMonthTransactions: Transaction[],
  isCurrentMonth: boolean = true
): BudgetMetrics {
  const { fixed_expenses, forecasted_income, day_to_day_budget, forecasted_interest } = config.budget;

  // FR-007: Total Fixed Expenses
  const totalFixedExpenses =
    fixed_expenses.mortgage +
    fixed_expenses.essential_services.wireless +
    fixed_expenses.essential_services.insurance +
    fixed_expenses.essential_services.utility +
    fixed_expenses.car_payment +
    fixed_expenses.aaria_day_care;

  // FR-008: Total Variable Subscriptions
  const totalVariableSubscriptions = Object.values(
    fixed_expenses.additional_services
  ).reduce((sum, amount) => sum + amount, 0);

  // FR-010: Actual Income MTD (positive transactions only)
  const actualIncomeMtd = currentMonthTransactions
    .filter(tx => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // FR-014: Interest Paid MTD (must calculate before variable spending)
  const interestPaidMtd = currentMonthTransactions
    .filter(tx => isInterestTransaction(tx, config))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // FR-011: Actual Variable Spending MTD (negative transactions, exclude interest)
  const actualVariableSpendingMtd = Math.abs(
    currentMonthTransactions
      .filter(tx => tx.amount < 0 && !isInterestTransaction(tx, config))
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  // Total Spending MTD (ALL negative transactions including interest)
  const totalSpendingMtd = Math.abs(
    currentMonthTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  // FR-012: Budget Remaining (can be negative)
  const budgetRemaining = day_to_day_budget - actualVariableSpendingMtd;

  // FR-009: Forecasted Savings
  const forecastedSavings =
    forecasted_income -
    totalFixedExpenses -
    totalVariableSubscriptions -
    day_to_day_budget;

  // FR-013: Actual Savings MTD
  const actualSavingsMtd =
    actualIncomeMtd -
    totalFixedExpenses -
    totalVariableSubscriptions -
    actualVariableSpendingMtd;

  // FR-015: Net = Income - Total Spending (all imported transactions) - Monthly Fixed (from config)
  // Monthly Fixed = Fixed Expenses + Variable Subscriptions
  const incomeForNet = isCurrentMonth ? forecasted_income : actualIncomeMtd;
  const monthlyFixed = totalFixedExpenses + totalVariableSubscriptions;
  const net = incomeForNet - totalSpendingMtd - monthlyFixed;

  return {
    totalFixedExpenses,
    totalVariableSubscriptions,
    forecastedIncome: forecasted_income,
    forecastedSavings,
    forecastedInterest: forecasted_interest,
    actualIncomeMtd,
    actualVariableSpendingMtd,
    budgetRemaining,
    actualSavingsMtd,
    interestPaidMtd,
    net,
    dayToDayBudget: day_to_day_budget,
  };
}
