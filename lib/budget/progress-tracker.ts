/**
 * Progress Tracker
 * Calculates progress indicators and burn rate metrics
 * Reference: data-model.md lines 312-391
 */

import { getDaysInMonth, getDate } from 'date-fns';
import { BudgetMetrics, ProgressIndicators } from './types';

/**
 * Calculate progress indicators from budget metrics
 * @param metrics Calculated budget metrics
 * @param referenceDate Reference date (defaults to today)
 * @returns Progress indicators with burn rate and status
 */
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

/**
 * Calculate status color based on budget usage vs time elapsed
 * @param budgetUsagePercent Percentage of budget used (0-100+)
 * @param monthProgressPercent Percentage of month elapsed (0-100)
 * @param daysElapsed Days into the month
 * @returns Status color (green, yellow, or red)
 */
export function calculateStatusColor(
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
