/**
 * Performance validation tests for calendar components
 * Tests render time (<1s) and day selection response time (<500ms)
 */

import { CalendarService } from '@/lib/services/calendar-service';
import { Transaction } from '@/lib/data-processor';

describe('Calendar Performance', () => {
  const generateMockTransactions = (count: number): Transaction[] => {
    const transactions: Transaction[] = [];
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(i / 10)); // Spread across days

      transactions.push({
        id: `txn-${i}`,
        date: date as any,
        amount: Math.random() * 200 + 10, // $10-$210
        description: `Transaction ${i}`,
        category: ['Food', 'Transportation', 'Shopping', 'Entertainment'][i % 4],
        merchant: `Merchant ${i % 20}`,
        account: 'Checking',
        isTransfer: false
      } as Transaction);
    }

    return transactions;
  };

  describe('Calendar Service Performance', () => {
    test('should calculate daily spending for large dataset in <1s', async () => {
      const largeTransactions = generateMockTransactions(10000); // 10k transactions
      const service = new CalendarService(largeTransactions);

      const startTime = performance.now();

      await service.getDailySpending('2023-01-01', '2023-12-31');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // <1s
    });

    test('should generate calendar cells for year view in <1s', async () => {
      const largeTransactions = generateMockTransactions(5000);
      const service = new CalendarService(largeTransactions);

      const startTime = performance.now();

      // Get daily spending first
      const dailySpending = await service.getDailySpending('2023-01-01', '2023-12-31');

      // Generate calendar cells for full year
      const period = { startDate: '2023-01-01', endDate: '2023-12-31', viewType: 'year' as const };
      const config = {
        colorScale: { min: '#22c55e', mid: '#fbbf24', max: '#ef4444', empty: '#f3f4f6' },
        thresholds: { low: 50, high: 150 }
      };

      service.generateCalendarCells(period, dailySpending, config);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // <1s total
    });

    test('should calculate thresholds for large dataset efficiently', () => {
      const largeDailySpending = Array.from({ length: 1000 }, (_, i) => ({
        date: `2023-01-${String(i % 28 + 1).padStart(2, '0')}`,
        amount: Math.random() * 500,
        transactionCount: Math.floor(Math.random() * 10) + 1,
        categories: { 'Category': Math.random() * 500 }
      }));

      const service = new CalendarService();

      const startTime = performance.now();
      service.calculateThresholds(largeDailySpending);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast <100ms
    });
  });

  describe('Service Performance Benchmarks', () => {
    test('should handle transaction filtering efficiently', async () => {
      const largeTransactions = generateMockTransactions(2000);
      const service = new CalendarService(largeTransactions);

      const startTime = performance.now();

      // Multiple day queries to simulate typical usage
      await service.getTransactionsForDay('2023-06-15');
      await service.getTransactionsForDay('2023-08-22');
      await service.getTransactionsForDay('2023-12-10');

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // <500ms for multiple queries
    });

    test('should calculate calendar cells efficiently for different periods', () => {
      const transactions = generateMockTransactions(1000);
      const service = new CalendarService(transactions);

      // Test month view performance
      const monthStartTime = performance.now();
      const monthPeriod = { startDate: '2023-06-01', endDate: '2023-06-30', viewType: 'month' as const };
      const config = {
        colorScale: { min: '#22c55e', mid: '#fbbf24', max: '#ef4444', empty: '#f3f4f6' },
        thresholds: { low: 50, high: 150 }
      };

      service.generateCalendarCells(monthPeriod, [], config);
      const monthEndTime = performance.now();

      const monthDuration = monthEndTime - monthStartTime;
      expect(monthDuration).toBeLessThan(100); // Month view should be very fast
    });
  });

  describe('Memory Performance', () => {
    test('should handle large transaction arrays without excessive memory usage', () => {
      // This is more of a smoke test - if it completes without crashing, memory usage is reasonable
      const largeTransactions = generateMockTransactions(5000);
      const service = new CalendarService(largeTransactions);

      // Multiple operations to test memory handling
      expect(service).toBeDefined();
      expect(largeTransactions.length).toBe(5000);

      // Test updating transactions doesn't cause memory leaks
      const newTransactions = generateMockTransactions(3000);
      service.updateTransactions(newTransactions);

      expect(service).toBeDefined();
    });

    test('should handle multiple service instances efficiently', () => {
      const transactions = generateMockTransactions(1000);

      // Create multiple service instances and perform operations
      const services = Array.from({ length: 5 }, () => new CalendarService(transactions));

      const startTime = performance.now();

      // Perform operations on all services
      services.forEach(service => {
        service.calculateThresholds([
          { date: '2023-01-01', amount: 100, transactionCount: 1, categories: {} }
        ]);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Multiple instances should still be fast
      expect(services.length).toBe(5);
    });
  });
});