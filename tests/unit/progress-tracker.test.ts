/**
 * Unit Tests: progress-tracker
 * Tests FR-015 to FR-023 (month progress, burn rate, status color)
 * Reference: data-model.md lines 312-391
 */

import { describe, it, expect } from '@jest/globals';
import { calculateProgressIndicators, calculateStatusColor } from '../../lib/budget/progress-tracker';
import { BudgetMetrics } from '../../lib/budget/types';

const mockMetrics: BudgetMetrics = {
  totalFixedExpenses: 7035.43,
  totalVariableSubscriptions: 101.96,
  forecastedIncome: 13437.98,
  forecastedSavings: 2300.59,
  forecastedInterest: 1025.00,
  actualIncomeMtd: 6800.00,
  actualVariableSpendingMtd: 1850.00,
  budgetRemaining: 2150.00,
  actualSavingsMtd: 2361.06,
  interestPaidMtd: 512.50,
  dayToDayBudget: 4000.00,
};

describe('progress-tracker', () => {
  describe('calculateProgressIndicators', () => {
    it('should calculate month progress correctly (FR-015)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.daysElapsed).toBe(15);
      expect(indicators.totalDays).toBe(31);
      expect(indicators.monthProgressPercent).toBeCloseTo(48.39, 1);
    });

    it('should calculate budget usage correctly (FR-016)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.budgetUsagePercent).toBeCloseTo(46.25, 1);
      expect(indicators.budgetUsageAmount).toBe(1850.00);
      expect(indicators.budgetTotalAmount).toBe(4000.00);
    });

    it('should calculate actual burn rate correctly (FR-017)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.actualBurnRate).toBeCloseTo(123.33, 2);
    });

    it('should calculate target burn rate correctly (FR-018)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.targetBurnRate).toBeCloseTo(129.03, 2);
    });

    it('should calculate burn rate variance correctly (FR-019)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.burnRateVariance).toBeCloseTo(-5.70, 2);
      expect(indicators.burnRateVariancePercent).toBeCloseTo(-4.42, 1);
    });

    it('should set green status when on track (FR-021)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.statusColor).toBe('green');
    });

    it('should set isOverBudget to false when budget remaining is positive (FR-023)', () => {
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(mockMetrics, referenceDate);

      expect(indicators.isOverBudget).toBe(false);
    });

    it('should set isOverBudget to true when budget remaining is negative', () => {
      const overBudgetMetrics = { ...mockMetrics, budgetRemaining: -500, actualVariableSpendingMtd: 4500 };
      const referenceDate = new Date('2025-10-15');
      const indicators = calculateProgressIndicators(overBudgetMetrics, referenceDate);

      expect(indicators.isOverBudget).toBe(true);
    });
  });

  describe('calculateStatusColor', () => {
    it('should return green when under budget pace', () => {
      const color = calculateStatusColor(46.25, 48.39, 15);
      expect(color).toBe('green');
    });

    it('should return yellow when slightly over budget pace (within 10%)', () => {
      const color = calculateStatusColor(53, 50, 15);
      expect(color).toBe('yellow');
    });

    it('should return red when significantly over budget pace (>10%)', () => {
      const color = calculateStatusColor(60, 50, 15);
      expect(color).toBe('red');
    });

    it('should handle first day of month edge case', () => {
      const color = calculateStatusColor(5, 3.23, 1);
      expect(color).toBe('yellow');
    });
  });
});
