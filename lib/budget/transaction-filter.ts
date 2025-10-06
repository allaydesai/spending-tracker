/**
 * Transaction Filter
 * Filters transactions by current month and detects interest transactions
 * Reference: data-model.md lines 247-254, research.md lines 217-262
 */

import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { Transaction } from '../types/transaction';
import { BudgetConfig } from './types';

/**
 * Filter transactions for the current month
 * @param transactions All transactions
 * @param referenceDate Reference date (defaults to today)
 * @returns Transactions within the reference month
 */
export function filterCurrentMonth(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): Transaction[] {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);

  return transactions.filter(tx => {
    const txDate = parseISO(tx.date);
    return isWithinInterval(txDate, { start, end });
  });
}

/**
 * Determine if a transaction is an interest charge
 * Matches against categories and keywords from config
 * @param tx Transaction to check
 * @param config Budget configuration with interest patterns
 * @returns true if transaction is interest-related
 */
export function isInterestTransaction(
  tx: Transaction,
  config: BudgetConfig
): boolean {
  const patterns = config.budget.interest_patterns;

  // Check category match
  if (tx.category && patterns.categories.includes(tx.category)) {
    return true;
  }

  // Check keyword match (case-insensitive)
  const descriptionLower = tx.description.toLowerCase();
  return patterns.keywords.some(keyword =>
    descriptionLower.includes(keyword.toLowerCase())
  );
}
