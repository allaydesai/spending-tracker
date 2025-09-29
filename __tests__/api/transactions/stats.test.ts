import { NextRequest } from 'next/server';
import { GET } from '@/app/api/transactions/stats/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/stats-service');

describe('/api/transactions/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions/stats', () => {
    it('should return transaction statistics with correct schema', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('totals');
      expect(result).toHaveProperty('byPeriod');
      expect(result).toHaveProperty('byCategory');

      // Check totals structure
      expect(result.totals).toHaveProperty('income');
      expect(result.totals).toHaveProperty('expenses');
      expect(result.totals).toHaveProperty('count');

      expect(typeof result.totals.income).toBe('number');
      expect(typeof result.totals.expenses).toBe('number');
      expect(typeof result.totals.count).toBe('number');

      // Check byPeriod structure
      expect(Array.isArray(result.byPeriod)).toBe(true);
      if (result.byPeriod.length > 0) {
        const period = result.byPeriod[0];
        expect(period).toHaveProperty('period');
        expect(period).toHaveProperty('income');
        expect(period).toHaveProperty('expenses');
        expect(period).toHaveProperty('count');

        expect(typeof period.period).toBe('string');
        expect(typeof period.income).toBe('number');
        expect(typeof period.expenses).toBe('number');
        expect(typeof period.count).toBe('number');
      }

      // Check byCategory structure
      expect(Array.isArray(result.byCategory)).toBe(true);
      if (result.byCategory.length > 0) {
        const category = result.byCategory[0];
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('amount');
        expect(category).toHaveProperty('count');

        expect(typeof category.category).toBe('string');
        expect(typeof category.amount).toBe('number');
        expect(typeof category.count).toBe('number');
      }
    });

    it('should support date range filtering', async () => {
      const url = new URL('http://localhost:3000/api/transactions/stats');
      url.searchParams.set('startDate', '2025-01-01');
      url.searchParams.set('endDate', '2025-01-31');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('totals');
      expect(result).toHaveProperty('byPeriod');
      expect(result).toHaveProperty('byCategory');
    });

    it('should support different groupBy options', async () => {
      const groupByOptions = ['day', 'week', 'month', 'category'];

      for (const groupBy of groupByOptions) {
        const url = new URL('http://localhost:3000/api/transactions/stats');
        url.searchParams.set('groupBy', groupBy);

        const request = new NextRequest(url);

        // This will fail because the route doesn't exist yet
        const response = await GET(request);

        expect(response.status).toBe(200);

        const result = await response.json();
        expect(result).toHaveProperty('byPeriod');
        expect(Array.isArray(result.byPeriod)).toBe(true);
      }
    });

    it('should use default groupBy value', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('byPeriod');
      expect(Array.isArray(result.byPeriod)).toBe(true);
    });

    it('should handle invalid groupBy parameter', async () => {
      const url = new URL('http://localhost:3000/api/transactions/stats');
      url.searchParams.set('groupBy', 'invalid-option');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('groupBy');
    });

    it('should handle invalid date format', async () => {
      const url = new URL('http://localhost:3000/api/transactions/stats');
      url.searchParams.set('startDate', 'invalid-date');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('date');
    });

    it('should calculate correct income vs expenses totals', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Income should be >= 0 (positive amounts)
      expect(result.totals.income).toBeGreaterThanOrEqual(0);

      // Expenses should be >= 0 (negative amounts converted to positive)
      expect(result.totals.expenses).toBeGreaterThanOrEqual(0);

      // Count should be >= 0
      expect(result.totals.count).toBeGreaterThanOrEqual(0);
    });

    it('should return consistent data across period aggregations', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Sum of all periods should equal totals (approximately)
      if (result.byPeriod.length > 0) {
        const periodIncome = result.byPeriod.reduce((sum: number, period: any) => sum + period.income, 0);
        const periodExpenses = result.byPeriod.reduce((sum: number, period: any) => sum + period.expenses, 0);
        const periodCount = result.byPeriod.reduce((sum: number, period: any) => sum + period.count, 0);

        // Allow for small floating point differences
        expect(Math.abs(periodIncome - result.totals.income)).toBeLessThan(0.01);
        expect(Math.abs(periodExpenses - result.totals.expenses)).toBeLessThan(0.01);
        expect(periodCount).toBe(result.totals.count);
      }
    });

    it('should return consistent data across category aggregations', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Sum of all categories should equal total count
      if (result.byCategory.length > 0) {
        const categoryCount = result.byCategory.reduce((sum: number, category: any) => sum + category.count, 0);
        expect(categoryCount).toBe(result.totals.count);
      }
    });

    it('should handle empty database gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.totals.income).toBe(0);
      expect(result.totals.expenses).toBe(0);
      expect(result.totals.count).toBe(0);
      expect(result.byPeriod).toHaveLength(0);
      expect(result.byCategory).toHaveLength(0);
    });
  });
});