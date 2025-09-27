/**
 * Calendar Service Contract Test
 * Tests the CalendarService interface contract - must fail before implementation
 */

import { CalendarService, DailySpending, CalendarPeriod, HeatmapConfig, CalendarCell, SpendingThresholds, Transaction } from '@/lib/services/calendar-service';

describe('CalendarService Contract', () => {
  let calendarService: CalendarService;

  beforeEach(() => {
    // This will fail until CalendarService is implemented
    calendarService = new (require('@/lib/services/calendar-service').CalendarService)();
  });

  describe('getDailySpending', () => {
    it('should return promise resolving to daily spending array', async () => {
      const startDate = '2025-09-01';
      const endDate = '2025-09-30';

      const result = await calendarService.getDailySpending(startDate, endDate);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const dailySpending = result[0];
        expect(typeof dailySpending.date).toBe('string');
        expect(typeof dailySpending.amount).toBe('number');
        expect(typeof dailySpending.transactionCount).toBe('number');
        expect(typeof dailySpending.categories).toBe('object');
      }
    });

    it('should handle date range validation', async () => {
      const invalidStartDate = 'invalid-date';
      const validEndDate = '2025-09-30';

      await expect(
        calendarService.getDailySpending(invalidStartDate, validEndDate)
      ).rejects.toThrow();
    });
  });

  describe('getTransactionsForDay', () => {
    it('should return promise resolving to transactions array', async () => {
      const date = '2025-09-15';

      const result = await calendarService.getTransactionsForDay(date);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const transaction = result[0];
        expect(typeof transaction.id).toBe('string');
        expect(typeof transaction.date).toBe('string');
        expect(typeof transaction.amount).toBe('number');
        expect(typeof transaction.description).toBe('string');
        expect(typeof transaction.category).toBe('string');
      }
    });

    it('should return empty array for dates with no transactions', async () => {
      const futureDate = '2099-12-31';

      const result = await calendarService.getTransactionsForDay(futureDate);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('calculateThresholds', () => {
    it('should return spending thresholds object', () => {
      const dailySpending: DailySpending[] = [
        { date: '2025-09-01', amount: 10, transactionCount: 1, categories: { Food: 10 } },
        { date: '2025-09-02', amount: 50, transactionCount: 2, categories: { Food: 30, Shopping: 20 } },
        { date: '2025-09-03', amount: 100, transactionCount: 1, categories: { Bills: 100 } }
      ];

      const result = calendarService.calculateThresholds(dailySpending);

      expect(typeof result.min).toBe('number');
      expect(typeof result.max).toBe('number');
      expect(typeof result.median).toBe('number');
      expect(typeof result.percentiles).toBe('object');
      expect(typeof result.percentiles.p25).toBe('number');
      expect(typeof result.percentiles.p50).toBe('number');
      expect(typeof result.percentiles.p75).toBe('number');
      expect(typeof result.percentiles.p90).toBe('number');

      expect(result.min).toBeLessThanOrEqual(result.max);
    });

    it('should handle empty daily spending array', () => {
      const emptyDailySpending: DailySpending[] = [];

      const result = calendarService.calculateThresholds(emptyDailySpending);

      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.median).toBe(0);
    });
  });

  describe('generateCalendarCells', () => {
    it('should return array of calendar cells', () => {
      const period: CalendarPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month'
      };

      const dailySpending: DailySpending[] = [
        { date: '2025-09-15', amount: 50, transactionCount: 2, categories: { Food: 50 } }
      ];

      const config: HeatmapConfig = {
        colorScale: {
          min: 'hsl(120, 50%, 90%)',
          mid: 'hsl(60, 50%, 70%)',
          max: 'hsl(0, 50%, 50%)',
          empty: 'hsl(0, 0%, 95%)'
        },
        thresholds: {
          low: 25,
          high: 75
        }
      };

      const result = calendarService.generateCalendarCells(period, dailySpending, config);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      if (result.length > 0) {
        const cell = result[0];
        expect(typeof cell.date).toBe('string');
        expect(typeof cell.intensity).toBe('number');
        expect(typeof cell.isCurrentMonth).toBe('boolean');
        expect(typeof cell.isToday).toBe('boolean');
        expect(cell.intensity).toBeGreaterThanOrEqual(0);
        expect(cell.intensity).toBeLessThanOrEqual(1);
      }
    });

    it('should include cells for full calendar grid', () => {
      const period: CalendarPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month'
      };

      const result = calendarService.generateCalendarCells(period, [], {
        colorScale: { min: '', mid: '', max: '', empty: '' },
        thresholds: { low: 0, high: 100 }
      });

      // Should include leading/trailing days to fill calendar grid (42 cells for 6 weeks)
      expect(result.length).toBeGreaterThanOrEqual(30); // At least days in month
      expect(result.length).toBeLessThanOrEqual(42); // At most 6 weeks
    });
  });

  describe('interface compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof calendarService.getDailySpending).toBe('function');
      expect(typeof calendarService.getTransactionsForDay).toBe('function');
      expect(typeof calendarService.calculateThresholds).toBe('function');
      expect(typeof calendarService.generateCalendarCells).toBe('function');
    });
  });
});