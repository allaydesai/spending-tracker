import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transactions/import/route';
import { GET as getTransactions } from '@/app/api/transactions/route';
import { GET as getStats } from '@/app/api/transactions/stats/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/import-service');
jest.mock('@/lib/services/transaction-service');
jest.mock('@/lib/services/stats-service');

describe('Date Range Filtering Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Date Range Filtering Functionality', () => {
    beforeAll(async () => {
      // Setup test data covering multiple months
      const csvContent = [
        'Date,Amount,Description,Category',
        '2024-12-15,-50.00,December Transaction,Food',
        '2024-12-31,-25.50,New Years Eve,Entertainment',
        '2025-01-01,2500.00,January Salary,Income',
        '2025-01-15,-100.00,Mid January,Transport',
        '2025-01-31,-75.50,End of January,Utilities',
        '2025-02-01,-30.00,February Start,Food',
        '2025-02-14,-60.00,Valentines Day,Entertainment',
        '2025-02-28,-40.00,End of February,Shopping',
        '2025-03-01,-20.00,March Begin,Food',
        '2025-03-15,-80.00,Mid March,Transport'
      ].join('\n');

      const file = new File([csvContent], 'date-range-test.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest);
    });

    it('should filter transactions by start date only', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-01-01');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(Array.isArray(result.transactions)).toBe(true);

      // All transactions should be on or after 2025-01-01
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBeGreaterThanOrEqual('2025-01-01');
      });

      // Should exclude December 2024 transactions
      const descriptions = result.transactions.map((t: any) => t.description);
      expect(descriptions).not.toContain('December Transaction');
      expect(descriptions).not.toContain('New Years Eve');

      // Should include January 2025 and later transactions
      expect(descriptions).toContain('January Salary');
      expect(descriptions).toContain('February Start');
    });

    it('should filter transactions by end date only', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('endDate', '2025-01-31');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // All transactions should be on or before 2025-01-31
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBeLessThanOrEqual('2025-01-31');
      });

      // Should include December 2024 and January 2025 transactions
      const descriptions = result.transactions.map((t: any) => t.description);
      expect(descriptions).toContain('December Transaction');
      expect(descriptions).toContain('January Salary');

      // Should exclude February 2025 and later transactions
      expect(descriptions).not.toContain('February Start');
      expect(descriptions).not.toContain('March Begin');
    });

    it('should filter transactions by date range (start and end date)', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-01-01');
      url.searchParams.set('endDate', '2025-01-31');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // All transactions should be within January 2025
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBeGreaterThanOrEqual('2025-01-01');
        expect(transaction.date).toBeLessThanOrEqual('2025-01-31');
      });

      // Should only include January transactions
      const descriptions = result.transactions.map((t: any) => t.description);
      expect(descriptions).toContain('January Salary');
      expect(descriptions).toContain('Mid January');
      expect(descriptions).toContain('End of January');

      // Should exclude all other months
      expect(descriptions).not.toContain('December Transaction');
      expect(descriptions).not.toContain('February Start');
      expect(descriptions).not.toContain('March Begin');

      // Verify exact count for January
      expect(result.transactions).toHaveLength(3);
    });

    it('should handle single day date range', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-01-01');
      url.searchParams.set('endDate', '2025-01-01');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should only include transactions from exactly 2025-01-01
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBe('2025-01-01');
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].description).toBe('January Salary');
    });

    it('should handle empty date ranges', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-06-01');
      url.searchParams.set('endDate', '2025-06-30');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should return empty result for date range with no transactions
      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    it('should work with statistics endpoint for date filtering', async () => {
      const url = new URL('http://localhost:3000/api/transactions/stats');
      url.searchParams.set('startDate', '2025-02-01');
      url.searchParams.set('endDate', '2025-02-28');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getStats(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Statistics should only include February transactions
      expect(result.totals.count).toBe(3); // Three February transactions

      // Calculate expected totals for February
      const expectedExpenses = 30.00 + 60.00 + 40.00; // February expenses
      expect(result.totals.expenses).toBeCloseTo(expectedExpenses, 2);
      expect(result.totals.income).toBe(0); // No income in February

      // Categories should only include February categories
      const categories = result.byCategory.map((c: any) => c.category);
      expect(categories).toContain('Food');
      expect(categories).toContain('Entertainment');
      expect(categories).toContain('Shopping');

      // Should not include categories only present in other months
      expect(categories).not.toContain('Income');
      expect(categories).not.toContain('Transport');
    });

    it('should handle date range with pagination', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-01-01');
      url.searchParams.set('endDate', '2025-03-31');
      url.searchParams.set('page', '1');
      url.searchParams.set('limit', '5');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should return paginated results within date range
      expect(result.transactions.length).toBeLessThanOrEqual(5);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.page).toBe(1);

      // All returned transactions should be within the date range
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBeGreaterThanOrEqual('2025-01-01');
        expect(transaction.date).toBeLessThanOrEqual('2025-03-31');
      });

      // Total should reflect all transactions in date range, not just this page
      expect(result.pagination.total).toBe(7); // Q1 2025 transactions
    });

    it('should combine date filtering with category filtering', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-01-01');
      url.searchParams.set('endDate', '2025-03-31');
      url.searchParams.set('category', 'Food');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should only include Food transactions within Q1 2025
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBeGreaterThanOrEqual('2025-01-01');
        expect(transaction.date).toBeLessThanOrEqual('2025-03-31');
        expect(transaction.category).toBe('Food');
      });

      // Should include February and March Food transactions
      const descriptions = result.transactions.map((t: any) => t.description);
      expect(descriptions).toContain('February Start');
      expect(descriptions).toContain('March Begin');

      // Should not include non-Food transactions even within date range
      expect(descriptions).not.toContain('January Salary');
      expect(descriptions).not.toContain('Mid January');
    });

    it('should handle date filtering with sorting', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-02-01');
      url.searchParams.set('endDate', '2025-02-28');
      url.searchParams.set('sortBy', 'date');
      url.searchParams.set('sortOrder', 'asc');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should return February transactions sorted by date ascending
      expect(result.transactions).toHaveLength(3);

      // Verify sorting order
      const dates = result.transactions.map((t: any) => t.date);
      expect(dates).toEqual(['2025-02-01', '2025-02-14', '2025-02-28']);

      // Verify all dates are within February
      dates.forEach((date: string) => {
        expect(date).toMatch(/^2025-02/);
      });
    });

    it('should handle invalid date formats gracefully', async () => {
      const invalidDateQueries = [
        { startDate: 'invalid-date', endDate: '2025-01-31' },
        { startDate: '2025-01-01', endDate: 'not-a-date' },
        { startDate: '2025-13-01', endDate: '2025-01-31' }, // Invalid month
        { startDate: '2025-01-32', endDate: '2025-01-31' }, // Invalid day
        { startDate: '25-01-01', endDate: '2025-01-31' }, // Invalid year format
      ];

      for (const invalidQuery of invalidDateQueries) {
        const url = new URL('http://localhost:3000/api/transactions');
        if (invalidQuery.startDate) {
          url.searchParams.set('startDate', invalidQuery.startDate);
        }
        if (invalidQuery.endDate) {
          url.searchParams.set('endDate', invalidQuery.endDate);
        }

        const request = new NextRequest(url);

        // This will fail because the route doesn't exist yet
        const response = await getTransactions(request);

        expect(response.status).toBe(400);

        const result = await response.json();
        expect(result).toHaveProperty('message');
        expect(result.message.toLowerCase()).toContain('date');
      }
    });

    it('should handle edge case where start date is after end date', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-02-01');
      url.searchParams.set('endDate', '2025-01-31'); // End before start

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);

      // Should either return 400 error or empty results
      expect([200, 400].includes(response.status)).toBe(true);

      if (response.status === 200) {
        const result = await response.json();
        expect(result.transactions).toHaveLength(0);
      } else {
        const result = await response.json();
        expect(result).toHaveProperty('message');
      }
    });

    it('should handle very large date ranges efficiently', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2020-01-01');
      url.searchParams.set('endDate', '2030-12-31'); // 10+ year range

      const request = new NextRequest(url);

      const startTime = Date.now();

      // This will fail because the route doesn't exist yet
      const response = await getTransactions(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should include all test transactions (since they're all within this range)
      expect(result.pagination.total).toBe(10);

      // Should complete efficiently even with large date range
      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(1000);
    });
  });
});