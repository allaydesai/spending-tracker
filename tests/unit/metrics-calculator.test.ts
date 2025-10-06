/**
 * Unit Tests: metrics-calculator
 * Tests all calculation formulas FR-007 to FR-014
 * Reference: data-model.md lines 175-255
 *
 * These tests MUST fail initially (TDD approach)
 */

import { describe, it, expect } from '@jest/globals';
import { calculateBudgetMetrics } from '../../lib/budget/metrics-calculator';
import { BudgetConfig } from '../../lib/budget/types';
import { Transaction } from '../../lib/types/transaction';

const mockBudgetConfig: BudgetConfig = {
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
        gym_membership: 45.00,
        cloud_storage: 9.99,
      },
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

describe('metrics-calculator', () => {
  describe('calculateBudgetMetrics', () => {
    it('should calculate totalFixedExpenses correctly (FR-007)', () => {
      // Arrange
      const transactions: Transaction[] = [];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Total = 4581.34 + 371.62 + 698.47 + 300 + 600 + 484 = 7035.43
      expect(metrics.totalFixedExpenses).toBe(7035.43);
    });

    it('should calculate totalVariableSubscriptions correctly (FR-008)', () => {
      // Arrange
      const transactions: Transaction[] = [];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Total = 20.99 + 10.99 + 14.99 + 45.00 + 9.99 = 101.96
      expect(metrics.totalVariableSubscriptions).toBeCloseTo(101.96, 2);
    });

    it('should calculate forecastedSavings correctly (FR-009)', () => {
      // Arrange
      const transactions: Transaction[] = [];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Savings = 13437.98 - 7035.43 - 101.96 - 4000 = 2300.59
      expect(metrics.forecastedSavings).toBeCloseTo(2300.59, 2);
    });

    it('should calculate actualIncomeMtd correctly (FR-010)', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-01', amount: 6718.99, description: 'Payroll', category: 'Income', createdAt: '2025-10-01T00:00:00Z' },
        { id: 2, date: '2025-10-15', amount: 6718.99, description: 'Payroll', category: 'Income', createdAt: '2025-10-15T00:00:00Z' },
        { id: 3, date: '2025-10-10', amount: -100, description: 'Groceries', category: 'Food', createdAt: '2025-10-10T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Total income = 6718.99 + 6718.99 = 13437.98
      expect(metrics.actualIncomeMtd).toBeCloseTo(13437.98, 2);
    });

    it('should calculate actualVariableSpendingMtd correctly (FR-011)', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-05', amount: -150.50, description: 'Groceries', category: 'Food', createdAt: '2025-10-05T00:00:00Z' },
        { id: 2, date: '2025-10-10', amount: -75.25, description: 'Gas', category: 'Transportation', createdAt: '2025-10-10T00:00:00Z' },
        { id: 3, date: '2025-10-12', amount: -200.00, description: 'Shopping', category: 'Retail', createdAt: '2025-10-12T00:00:00Z' },
        { id: 4, date: '2025-10-08', amount: 50.00, description: 'Refund', category: 'Retail', createdAt: '2025-10-08T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Total = abs(-150.50 - 75.25 - 200.00) = 425.75 (refund not counted as spending)
      expect(metrics.actualVariableSpendingMtd).toBeCloseTo(425.75, 2);
    });

    it('should calculate budgetRemaining correctly (FR-012)', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-05', amount: -1850.00, description: 'Various', category: 'Expenses', createdAt: '2025-10-05T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Remaining = 4000 - 1850 = 2150
      expect(metrics.budgetRemaining).toBeCloseTo(2150.00, 2);
    });

    it('should allow negative budgetRemaining when over budget', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-05', amount: -4500.00, description: 'Over budget', category: 'Expenses', createdAt: '2025-10-05T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Remaining = 4000 - 4500 = -500
      expect(metrics.budgetRemaining).toBeCloseTo(-500.00, 2);
      expect(metrics.budgetRemaining).toBeLessThan(0);
    });

    it('should calculate actualSavingsMtd correctly (FR-013)', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-01', amount: 13437.98, description: 'Income', category: 'Income', createdAt: '2025-10-01T00:00:00Z' },
        { id: 2, date: '2025-10-05', amount: -1850.00, description: 'Variable expenses', category: 'Expenses', createdAt: '2025-10-05T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Savings = 13437.98 - 7035.43 - 101.96 - 1850 = 4450.59
      expect(metrics.actualSavingsMtd).toBeCloseTo(4450.59, 2);
    });

    it('should calculate interestPaidMtd correctly (FR-014)', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-10', amount: -250.00, description: 'Interest Charge', category: 'Interest', createdAt: '2025-10-10T00:00:00Z' },
        { id: 2, date: '2025-10-15', amount: -175.50, description: 'Finance charge on card', category: 'Fees', createdAt: '2025-10-15T00:00:00Z' },
        { id: 3, date: '2025-10-20', amount: -50.00, description: 'APR Interest', category: 'Other', createdAt: '2025-10-20T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Total interest = 250 + 175.50 (keyword match) + 50 (keyword match) = 475.50
      expect(metrics.interestPaidMtd).toBeCloseTo(475.50, 2);
    });

    it('should exclude interest transactions from variable spending', () => {
      // Arrange
      const transactions: Transaction[] = [
        { id: 1, date: '2025-10-05', amount: -100.00, description: 'Groceries', category: 'Food', createdAt: '2025-10-05T00:00:00Z' },
        { id: 2, date: '2025-10-10', amount: -50.00, description: 'Interest Charge', category: 'Interest', createdAt: '2025-10-10T00:00:00Z' },
      ];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      // Variable spending should only be 100 (groceries), not 150
      expect(metrics.actualVariableSpendingMtd).toBeCloseTo(100.00, 2);
      expect(metrics.interestPaidMtd).toBeCloseTo(50.00, 2);
    });

    it('should return correct dayToDayBudget from config', () => {
      // Arrange
      const transactions: Transaction[] = [];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      expect(metrics.dayToDayBudget).toBe(4000.00);
    });

    it('should handle empty transaction list', () => {
      // Arrange
      const transactions: Transaction[] = [];

      // Act
      const metrics = calculateBudgetMetrics(mockBudgetConfig, transactions);

      // Assert
      expect(metrics.actualIncomeMtd).toBe(0);
      expect(metrics.actualVariableSpendingMtd).toBe(0);
      expect(metrics.budgetRemaining).toBe(4000.00);
      expect(metrics.interestPaidMtd).toBe(0);
    });
  });
});
