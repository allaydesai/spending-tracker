/**
 * Unit tests for Calendar utilities and service methods
 * Tests calculateThresholds, generateCalendarCells, and utility functions
 */

import { CalendarService } from '@/lib/services/calendar-service';
import { DailySpending } from '@/lib/types/daily-spending';
import { CalendarPeriod } from '@/lib/types/calendar-period';
import { HeatmapConfig } from '@/lib/types/heatmap-config';
import { Transaction } from '@/lib/data-processor';
import { SpendingThresholds } from '@/lib/types/calendar-cell';

describe('CalendarService', () => {
  let service: CalendarService;
  let mockTransactions: Transaction[];

  beforeEach(() => {
    mockTransactions = [
      {
        id: '1',
        date: new Date('2025-09-15T12:00:00') as any, // Use Date objects as per existing interface
        amount: 25.50,
        description: 'Lunch',
        category: 'Food'
      },
      {
        id: '2',
        date: new Date('2025-09-15T12:00:00') as any,
        amount: 12.00,
        description: 'Coffee',
        category: 'Food'
      },
      {
        id: '3',
        date: new Date('2025-09-20T12:00:00') as any,
        amount: 150.00,
        description: 'Groceries',
        category: 'Food'
      },
      {
        id: '4',
        date: new Date('2025-09-22T12:00:00') as any,
        amount: 75.00,
        description: 'Gas',
        category: 'Transportation'
      }
    ];
    service = new CalendarService(mockTransactions);
  });

  describe('getDailySpending', () => {
    test('should aggregate transactions by date', async () => {
      const result = await service.getDailySpending('2025-09-15', '2025-09-15');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2025-09-15',
        amount: 37.50,
        transactionCount: 2,
        categories: { Food: 37.50 }
      });
    });

    test('should handle date range with multiple days', async () => {
      const result = await service.getDailySpending('2025-09-15', '2025-09-22');

      expect(result).toHaveLength(3);

      const sortedResult = result.sort((a, b) => a.date.localeCompare(b.date));
      expect(sortedResult[0].date).toBe('2025-09-15');
      expect(sortedResult[1].date).toBe('2025-09-20');
      expect(sortedResult[2].date).toBe('2025-09-22');
    });

    test('should return empty array for date range with no transactions', async () => {
      const result = await service.getDailySpending('2025-01-01', '2025-01-02');

      expect(result).toHaveLength(0);
    });

    test('should throw error for invalid date format', async () => {
      await expect(
        service.getDailySpending('invalid-date', '2025-09-15')
      ).rejects.toThrow('Invalid date format. Use YYYY-MM-DD format.');
    });

    test('should throw error when start date is after end date', async () => {
      await expect(
        service.getDailySpending('2025-09-20', '2025-09-15')
      ).rejects.toThrow('Start date must be before or equal to end date.');
    });

    test('should aggregate multiple categories correctly', async () => {
      const multiCategoryTransactions = [
        ...mockTransactions,
        {
          id: '5',
          date: new Date('2025-09-15T12:00:00') as any,
          amount: 50.00,
          description: 'Shopping',
          category: 'Shopping'
        }
      ];

      const serviceWithMultiCategory = new CalendarService(multiCategoryTransactions);
      const result = await serviceWithMultiCategory.getDailySpending('2025-09-15', '2025-09-15');

      expect(result[0]).toEqual({
        date: '2025-09-15',
        amount: 87.50,
        transactionCount: 3,
        categories: {
          Food: 37.50,
          Shopping: 50.00
        }
      });
    });
  });

  describe('getTransactionsForDay', () => {
    test('should return transactions for specific day', async () => {
      const result = await service.getTransactionsForDay('2025-09-15');

      expect(result).toHaveLength(2);
      expect(result.every(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toISOString().split('T')[0] === '2025-09-15';
      })).toBe(true);
    });

    test('should return empty array for day with no transactions', async () => {
      const result = await service.getTransactionsForDay('2025-01-01');

      expect(result).toHaveLength(0);
    });

    test('should handle date format correctly', async () => {
      const result = await service.getTransactionsForDay('2025-09-20');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });
  });

  describe('calculateThresholds', () => {
    test('should calculate correct thresholds for non-empty dataset', () => {
      const dailySpending: DailySpending[] = [
        { date: '2025-09-01', amount: 10, transactionCount: 1, categories: {} },
        { date: '2025-09-02', amount: 50, transactionCount: 1, categories: {} },
        { date: '2025-09-03', amount: 100, transactionCount: 1, categories: {} },
        { date: '2025-09-04', amount: 75, transactionCount: 1, categories: {} },
        { date: '2025-09-05', amount: 25, transactionCount: 1, categories: {} }
      ];

      const result = service.calculateThresholds(dailySpending);

      expect(result.min).toBe(10);
      expect(result.max).toBe(100);
      expect(result.median).toBe(50);
      expect(result.percentiles.p25).toBe(25);
      expect(result.percentiles.p50).toBe(50);
      expect(result.percentiles.p75).toBe(75);
      expect(result.percentiles.p90).toBe(90);
    });

    test('should handle empty dataset', () => {
      const result = service.calculateThresholds([]);

      expect(result).toEqual({
        min: 0,
        max: 0,
        median: 0,
        percentiles: { p25: 0, p50: 0, p75: 0, p90: 0 }
      });
    });

    test('should handle single item dataset', () => {
      const dailySpending: DailySpending[] = [
        { date: '2025-09-01', amount: 42, transactionCount: 1, categories: {} }
      ];

      const result = service.calculateThresholds(dailySpending);

      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
      expect(result.median).toBe(42);
      expect(result.percentiles.p25).toBe(42);
      expect(result.percentiles.p50).toBe(42);
      expect(result.percentiles.p75).toBe(42);
      expect(result.percentiles.p90).toBe(42);
    });

    test('should handle two item dataset', () => {
      const dailySpending: DailySpending[] = [
        { date: '2025-09-01', amount: 20, transactionCount: 1, categories: {} },
        { date: '2025-09-02', amount: 80, transactionCount: 1, categories: {} }
      ];

      const result = service.calculateThresholds(dailySpending);

      expect(result.min).toBe(20);
      expect(result.max).toBe(80);
      expect(result.median).toBe(50); // Average of 20 and 80
    });
  });

  describe('generateCalendarCells', () => {
    const mockConfig: HeatmapConfig = {
      colorScale: {
        min: '#22c55e',
        mid: '#fbbf24',
        max: '#ef4444',
        empty: '#f3f4f6'
      },
      thresholds: {
        low: 25,
        high: 75
      }
    };

    test('should generate calendar cells for month view', () => {
      const period: CalendarPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month'
      };

      const dailySpending: DailySpending[] = [
        { date: '2025-09-15', amount: 37.50, transactionCount: 2, categories: {} }
      ];

      const result = service.generateCalendarCells(period, dailySpending, mockConfig);

      // Month view should show full calendar grid (5 weeks for Sept 2025)
      expect(result.length).toBe(35);

      // Find the cell for September 15
      const sept15Cell = result.find(cell => cell.date === '2025-09-15');
      expect(sept15Cell).toBeDefined();
      expect(sept15Cell?.spending?.amount).toBe(37.50);
      expect(sept15Cell?.isCurrentMonth).toBe(true);
    });

    test('should mark today correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      const period: CalendarPeriod = {
        startDate: today,
        endDate: today,
        viewType: 'month'
      };

      const result = service.generateCalendarCells(period, [], mockConfig);

      const todayCell = result.find(cell => cell.date === today);
      expect(todayCell?.isToday).toBe(true);
    });

    test('should calculate intensity correctly', () => {
      const period: CalendarPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month'
      };

      const dailySpending: DailySpending[] = [
        { date: '2025-09-15', amount: 25, transactionCount: 1, categories: {} }, // At low threshold
        { date: '2025-09-20', amount: 75, transactionCount: 1, categories: {} }, // At high threshold
        { date: '2025-09-25', amount: 100, transactionCount: 1, categories: {} } // Above high threshold
      ];

      const result = service.generateCalendarCells(period, dailySpending, mockConfig);

      const lowCell = result.find(cell => cell.date === '2025-09-15');
      const highCell = result.find(cell => cell.date === '2025-09-20');
      const maxCell = result.find(cell => cell.date === '2025-09-25');

      expect(lowCell?.intensity).toBe(0.5); // At low threshold = 0.5
      expect(highCell?.intensity).toBe(1.0); // At high threshold = 1.0
      expect(maxCell?.intensity).toBe(1.0); // Above high threshold = 1.0 (capped)
    });

    test('should handle empty spending data', () => {
      const period: CalendarPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month'
      };

      const result = service.generateCalendarCells(period, [], mockConfig);

      expect(result.length).toBe(35); // September 2025 is 5 weeks
      result.forEach(cell => {
        expect(cell.spending).toBeNull();
        expect(cell.intensity).toBe(0);
      });
    });

    test('should mark cells for different months correctly', () => {
      const period: CalendarPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month'
      };

      const result = service.generateCalendarCells(period, [], mockConfig);

      // Check first few cells (likely August dates)
      const firstCell = result[0];
      if (firstCell.date.includes('2025-08')) {
        expect(firstCell.isCurrentMonth).toBe(false);
      }

      // Check September dates
      const septCell = result.find(cell => cell.date === '2025-09-15');
      expect(septCell?.isCurrentMonth).toBe(true);

      // Check last few cells (likely October dates)
      const lastCell = result[result.length - 1];
      if (lastCell.date.includes('2025-10')) {
        expect(lastCell.isCurrentMonth).toBe(false);
      }
    });
  });

  describe('updateTransactions', () => {
    test('should update internal transactions', async () => {
      const newTransactions: Transaction[] = [
        {
          id: '100',
          date: new Date('2025-10-01T12:00:00') as any,
          amount: 999.99,
          description: 'Big purchase',
          category: 'Other'
        }
      ];

      service.updateTransactions(newTransactions);

      const result = await service.getTransactionsForDay('2025-10-01');
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(999.99);
    });

    test('should replace all transactions', async () => {
      const newTransactions: Transaction[] = [
        {
          id: '200',
          date: new Date('2025-11-01T12:00:00') as any,
          amount: 50.00,
          description: 'New transaction',
          category: 'Test'
        }
      ];

      service.updateTransactions(newTransactions);

      // Old transactions should no longer be available
      const oldResult = await service.getTransactionsForDay('2025-09-15');
      expect(oldResult).toHaveLength(0);

      // New transaction should be available
      const newResult = await service.getTransactionsForDay('2025-11-01');
      expect(newResult).toHaveLength(1);
    });
  });
});