/**
 * Unit Tests: expense-breakdown
 * Tests derivation of ExpenseBreakdown from BudgetConfig
 * Reference: data-model.md lines 442-493
 */

import { describe, it, expect } from '@jest/globals';
import { deriveExpenseBreakdown, formatSubscriptionLabel } from '../../lib/budget/expense-breakdown';
import { BudgetConfig } from '../../lib/budget/types';

const mockConfig: BudgetConfig = {
  budget: {
    forecasted_income: 13437.98,
    fixed_expenses: {
      mortgage: 4581.34,
      essential_services: {
        wireless: 371.62,
        insurance: 698.47,
        utility: 300.00,
      },
      car_payment: 600.00,
      additional_services: {
        netflix: 20.99,
        spotify: 10.99,
        amazon_prime: 14.99,
      },
      aaria_day_care: 484.00,
    },
    day_to_day_budget: 4000.00,
    forecasted_interest: 1025.00,
    interest_patterns: {
      categories: ['Interest'],
      keywords: ['interest'],
    },
  },
};

describe('expense-breakdown', () => {
  describe('deriveExpenseBreakdown', () => {
    it('should derive fixed expenses breakdown correctly', () => {
      const breakdown = deriveExpenseBreakdown(mockConfig);

      expect(breakdown.fixedExpenses.total).toBeCloseTo(7035.43, 2);
      expect(breakdown.fixedExpenses.items).toHaveLength(4);

      expect(breakdown.fixedExpenses.items[0].label).toBe('Mortgage');
      expect(breakdown.fixedExpenses.items[0].amount).toBe(4581.34);
    });

    it('should create nested children for essential services', () => {
      const breakdown = deriveExpenseBreakdown(mockConfig);

      const essentialServices = breakdown.fixedExpenses.items.find(item => item.label === 'Essential Services');
      expect(essentialServices).toBeDefined();
      expect(essentialServices?.children).toHaveLength(3);
      expect(essentialServices?.amount).toBeCloseTo(1370.09, 2);
    });

    it('should derive variable subscriptions breakdown correctly', () => {
      const breakdown = deriveExpenseBreakdown(mockConfig);

      expect(breakdown.variableSubscriptions.total).toBeCloseTo(46.97, 2);
      expect(breakdown.variableSubscriptions.items).toHaveLength(3);
    });

    it('should format subscription labels correctly', () => {
      const breakdown = deriveExpenseBreakdown(mockConfig);

      const labels = breakdown.variableSubscriptions.items.map(item => item.label);
      expect(labels).toContain('Netflix');
      expect(labels).toContain('Spotify');
      expect(labels).toContain('Amazon Prime');
    });
  });

  describe('formatSubscriptionLabel', () => {
    it('should capitalize single word', () => {
      expect(formatSubscriptionLabel('netflix')).toBe('Netflix');
    });

    it('should capitalize each word separated by underscore', () => {
      expect(formatSubscriptionLabel('amazon_prime')).toBe('Amazon Prime');
    });

    it('should handle multiple underscores', () => {
      expect(formatSubscriptionLabel('google_one_storage')).toBe('Google One Storage');
    });
  });
});
