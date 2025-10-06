/**
 * Unit Tests: transaction-filter
 * Tests current month filtering and interest detection
 * Reference: data-model.md lines 247-254
 */

import { describe, it, expect } from '@jest/globals';
import { filterCurrentMonth, isInterestTransaction } from '../../lib/budget/transaction-filter';
import { Transaction } from '../../lib/types/transaction';
import { BudgetConfig } from '../../lib/budget/types';

const mockConfig: BudgetConfig = {
  budget: {
    forecasted_income: 13437.98,
    fixed_expenses: {
      mortgage: 4581.34,
      essential_services: { wireless: 371.62, insurance: 698.47, utility: 300.00 },
      car_payment: 600.00,
      additional_services: { netflix: 20.99 },
      aaria_day_care: 484.00,
    },
    day_to_day_budget: 4000.00,
    forecasted_interest: 1025.00,
    interest_patterns: {
      categories: ['Interest', 'Interest & Charges', 'Finance Charge'],
      keywords: ['interest', 'finance charge', 'apr'],
    },
  },
};

describe('transaction-filter', () => {
  describe('filterCurrentMonth', () => {
    it('should filter transactions for current month only', () => {
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-05', amount: -100, description: 'Oct tx', category: 'Food', createdAt: '2025-10-05T00:00:00Z' },
        { id: 2, date: '2025-09-25', amount: -200, description: 'Sept tx', category: 'Food', createdAt: '2025-09-25T00:00:00Z' },
        { id: 3, date: '2025-10-15', amount: -150, description: 'Oct tx 2', category: 'Food', createdAt: '2025-10-15T00:00:00Z' },
        { id: 4, date: '2025-11-01', amount: -175, description: 'Nov tx', category: 'Food', createdAt: '2025-11-01T00:00:00Z' },
      ];
      const referenceDate = new Date('2025-10-15');

      const filtered = filterCurrentMonth(transactions, referenceDate);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe(1);
      expect(filtered[1].id).toBe(3);
    });

    it('should include first and last day of month', () => {
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-01', amount: -100, description: 'First day', category: 'Food', createdAt: '2025-10-01T00:00:00Z' },
        { id: 2, date: '2025-10-31', amount: -200, description: 'Last day', category: 'Food', createdAt: '2025-10-31T00:00:00Z' },
      ];
      const referenceDate = new Date('2025-10-15');

      const filtered = filterCurrentMonth(transactions, referenceDate);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('isInterestTransaction', () => {
    it('should detect interest by category match', () => {
      const tx: Transaction = {
        id: 1,
        date: '2025-10-10',
        amount: -50,
        description: 'Monthly charge',
        category: 'Interest',
        createdAt: '2025-10-10T00:00:00Z',
      };

      expect(isInterestTransaction(tx, mockConfig)).toBe(true);
    });

    it('should detect interest by keyword in description', () => {
      const tx: Transaction = {
        id: 1,
        date: '2025-10-10',
        amount: -50,
        description: 'APR interest charge',
        category: 'Fees',
        createdAt: '2025-10-10T00:00:00Z',
      };

      expect(isInterestTransaction(tx, mockConfig)).toBe(true);
    });

    it('should be case-insensitive for keyword matching', () => {
      const tx: Transaction = {
        id: 1,
        date: '2025-10-10',
        amount: -50,
        description: 'FINANCE CHARGE on card',
        category: 'Fees',
        createdAt: '2025-10-10T00:00:00Z',
      };

      expect(isInterestTransaction(tx, mockConfig)).toBe(true);
    });

    it('should return false for non-interest transactions', () => {
      const tx: Transaction = {
        id: 1,
        date: '2025-10-10',
        amount: -50,
        description: 'Groceries at Walmart',
        category: 'Food',
        createdAt: '2025-10-10T00:00:00Z',
      };

      expect(isInterestTransaction(tx, mockConfig)).toBe(false);
    });
  });
});
