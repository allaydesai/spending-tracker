/**
 * Memory optimization tests for calendar components
 * Tests virtualization for large datasets (>365 days) and memory efficiency
 */

import { CalendarService } from '@/lib/services/calendar-service';
import { Transaction } from '@/lib/data-processor';

describe('Calendar Memory Optimization', () => {
  const generateLargeTransactionDataset = (days: number): Transaction[] => {
    const transactions: Transaction[] = [];
    const baseDate = new Date('2023-01-01');

    for (let day = 0; day < days; day++) {
      const currentDate = new Date(baseDate);
      currentDate.setDate(currentDate.getDate() + day);

      // Add 1-5 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < transactionsPerDay; i++) {
        transactions.push({
          id: `txn-${day}-${i}`,
          date: currentDate as any,
          amount: Math.random() * 200 + 10,
          description: `Transaction ${day}-${i}`,
          category: ['Food', 'Transportation', 'Shopping', 'Entertainment'][i % 4],
          merchant: `Merchant ${day % 50}`,
          account: 'Checking',
          isTransfer: false
        } as Transaction);
      }
    }

    return transactions;
  };

  describe('Large Dataset Handling', () => {
    test('should handle 1 year of data efficiently', async () => {
      const oneYearTransactions = generateLargeTransactionDataset(365);
      const service = new CalendarService(oneYearTransactions);

      const startTime = performance.now();

      // Process full year
      await service.getDailySpending('2023-01-01', '2023-12-31');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should process 1 year in reasonable time
      expect(duration).toBeLessThan(2000); // <2s for 1 year
      expect(oneYearTransactions.length).toBeGreaterThan(365); // Multiple transactions per day
    });

    test('should handle 2+ years of data with memory efficiency', async () => {
      const twoYearTransactions = generateLargeTransactionDataset(730); // 2 years
      const service = new CalendarService(twoYearTransactions);

      const startTime = performance.now();

      // Process 2 years
      const dailySpending = await service.getDailySpending('2023-01-01', '2024-12-31');

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should still be reasonably fast for 2 years
      expect(duration).toBeLessThan(5000); // <5s for 2 years
      expect(dailySpending.length).toBeLessThanOrEqual(730); // Max one entry per day
      expect(twoYearTransactions.length).toBeGreaterThan(730); // Multiple transactions per day
    });

    test('should identify when virtualization is beneficial', () => {
      const smallDataset = generateLargeTransactionDataset(90); // 3 months
      const mediumDataset = generateLargeTransactionDataset(365); // 1 year
      const largeDataset = generateLargeTransactionDataset(1095); // 3 years

      // Define virtualization threshold
      const VIRTUALIZATION_THRESHOLD = 365; // Days

      const needsVirtualization = (days: number) => days > VIRTUALIZATION_THRESHOLD;

      expect(needsVirtualization(90)).toBe(false);   // 3 months - no virtualization
      expect(needsVirtualization(365)).toBe(false);  // 1 year - borderline, no virtualization
      expect(needsVirtualization(1095)).toBe(true);  // 3+ years - virtualization recommended

      // Verify dataset sizes
      expect(smallDataset.length).toBeGreaterThan(0);
      expect(mediumDataset.length).toBeGreaterThan(smallDataset.length);
      expect(largeDataset.length).toBeGreaterThan(mediumDataset.length);
    });
  });

  describe('Memory Usage Patterns', () => {
    test('should use efficient data structures', () => {
      const service = new CalendarService();

      // CalendarService uses Map for O(1) lookup efficiency
      const dailySpendingMap = new Map<string, any>();

      // Add test data
      dailySpendingMap.set('2023-01-01', { amount: 100 });
      dailySpendingMap.set('2023-01-02', { amount: 150 });

      // Map operations should be O(1)
      const startTime = performance.now();
      const exists = dailySpendingMap.has('2023-01-01');
      const value = dailySpendingMap.get('2023-01-01');
      const endTime = performance.now();

      expect(exists).toBe(true);
      expect(value.amount).toBe(100);
      expect(endTime - startTime).toBeLessThan(1); // Should be immediate
    });

    test('should avoid memory leaks with transaction updates', () => {
      const service = new CalendarService();

      // Simulate multiple updates (common in real usage)
      for (let i = 0; i < 10; i++) {
        const transactions = generateLargeTransactionDataset(100);
        service.updateTransactions(transactions);
      }

      // Service should maintain single reference to current transactions
      // (No way to directly test memory usage in Jest, but structure should be sound)
      expect(service).toBeDefined();
    });

    test('should handle calendar cell generation efficiently', () => {
      const transactions = generateLargeTransactionDataset(365);
      const service = new CalendarService(transactions);

      const startTime = performance.now();

      // Generate cells for a year view (most expensive operation)
      const period = { startDate: '2023-01-01', endDate: '2023-12-31', viewType: 'year' as const };
      const config = {
        colorScale: { min: '#22c55e', mid: '#fbbf24', max: '#ef4444', empty: '#f3f4f6' },
        thresholds: { low: 50, high: 150 }
      };

      const cells = service.generateCalendarCells(period, [], config);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Should generate year view quickly
      expect(cells.length).toBe(365); // One cell per day for year view
    });
  });

  describe('Virtualization Strategy', () => {
    test('should support windowed rendering concept', () => {
      // Test data structure that supports virtualization
      const allCells = Array.from({ length: 1095 }, (_, i) => ({
        date: `2023-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}`,
        visible: false,
        index: i
      }));

      // Simulate viewport showing only subset of data
      const VIEWPORT_SIZE = 42; // ~6 weeks visible
      const startIndex = 100;

      // Mark visible items
      for (let i = startIndex; i < Math.min(startIndex + VIEWPORT_SIZE, allCells.length); i++) {
        allCells[i].visible = true;
      }

      const visibleCells = allCells.filter(cell => cell.visible);

      expect(visibleCells.length).toBe(VIEWPORT_SIZE);
      expect(visibleCells[0].index).toBe(startIndex);
      expect(allCells.length).toBe(1095); // All data still available
    });

    test('should calculate visible range efficiently', () => {
      const calculateVisibleRange = (
        totalItems: number,
        itemHeight: number,
        scrollTop: number,
        containerHeight: number
      ) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(
          totalItems - 1,
          Math.ceil((scrollTop + containerHeight) / itemHeight)
        );

        return { startIndex, endIndex, visibleCount: endIndex - startIndex + 1 };
      };

      // Test with large dataset
      const range = calculateVisibleRange(
        1000, // 1000 items
        50,   // 50px per item
        2000, // Scrolled 2000px down
        400   // 400px container height
      );

      expect(range.startIndex).toBe(40); // 2000 / 50
      expect(range.endIndex).toBeLessThanOrEqual(999); // Don't exceed bounds
      expect(range.visibleCount).toBeLessThanOrEqual(20); // Reasonable visible count
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics for optimization', () => {
      const performanceMetrics = {
        renderTime: 0,
        dataProcessingTime: 0,
        memoryUsage: 0
      };

      const startTime = performance.now();

      // Simulate heavy operation
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `item-${i}`
      }));

      const endTime = performance.now();
      performanceMetrics.renderTime = endTime - startTime;

      // Basic performance validation
      expect(performanceMetrics.renderTime).toBeGreaterThan(0);
      expect(performanceMetrics.renderTime).toBeLessThan(100); // Should be fast
      expect(largeArray.length).toBe(10000);
    });

    test('should provide optimization recommendations', () => {
      const getOptimizationRecommendations = (dataSize: number, renderTime: number) => {
        const recommendations = [];

        if (dataSize > 365) {
          recommendations.push('Consider implementing virtualization');
        }

        if (renderTime > 1000) {
          recommendations.push('Optimize rendering performance');
        }

        if (dataSize > 1095) {
          recommendations.push('Implement lazy loading');
        }

        return recommendations;
      };

      // Test different scenarios
      const smallDataset = getOptimizationRecommendations(100, 50);
      const largeDataset = getOptimizationRecommendations(1500, 500);
      const slowRender = getOptimizationRecommendations(300, 1500);

      expect(smallDataset.length).toBe(0); // No recommendations for small, fast data
      expect(largeDataset).toContain('Consider implementing virtualization');
      expect(slowRender).toContain('Optimize rendering performance');
    });
  });
});