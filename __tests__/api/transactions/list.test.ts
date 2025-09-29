import { NextRequest } from 'next/server';
import { GET } from '@/app/api/transactions/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/transaction-service');

describe('/api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions', () => {
    it('should return a list of transactions', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('pagination');

      expect(Array.isArray(result.transactions)).toBe(true);

      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
    });

    it('should support date range filtering', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', '2025-01-01');
      url.searchParams.set('endDate', '2025-01-31');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(Array.isArray(result.transactions)).toBe(true);

      // Verify that all returned transactions are within the date range
      result.transactions.forEach((transaction: any) => {
        expect(transaction.date).toBeGreaterThanOrEqual('2025-01-01');
        expect(transaction.date).toBeLessThanOrEqual('2025-01-31');
      });
    });

    it('should support category filtering', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('category', 'Food');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(Array.isArray(result.transactions)).toBe(true);

      // Verify that all returned transactions match the category filter
      result.transactions.forEach((transaction: any) => {
        expect(transaction.category).toBe('Food');
      });
    });

    it('should support pagination', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('page', '2');
      url.searchParams.set('limit', '25');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(25);
      expect(result.transactions.length).toBeLessThanOrEqual(25);
    });

    it('should support sorting', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('sortBy', 'amount');
      url.searchParams.set('sortOrder', 'desc');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(Array.isArray(result.transactions)).toBe(true);

      // Verify sorting (if there are transactions)
      if (result.transactions.length > 1) {
        for (let i = 0; i < result.transactions.length - 1; i++) {
          expect(result.transactions[i].amount).toBeGreaterThanOrEqual(
            result.transactions[i + 1].amount
          );
        }
      }
    });

    it('should use default pagination values', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(100);
    });

    it('should enforce pagination limits', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('limit', '2000'); // Exceeds max of 1000

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('limit');
    });

    it('should handle invalid date format', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('startDate', 'invalid-date');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('date');
    });

    it('should handle invalid sort parameters', async () => {
      const url = new URL('http://localhost:3000/api/transactions');
      url.searchParams.set('sortBy', 'invalid-field');

      const request = new NextRequest(url);

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('sortBy');
    });

    it('should return transactions with correct schema', async () => {
      const request = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      if (result.transactions.length > 0) {
        const transaction = result.transactions[0];
        expect(transaction).toHaveProperty('id');
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('description');
        expect(transaction).toHaveProperty('createdAt');

        expect(typeof transaction.id).toBe('number');
        expect(typeof transaction.date).toBe('string');
        expect(typeof transaction.amount).toBe('number');
        expect(typeof transaction.description).toBe('string');
        expect(typeof transaction.createdAt).toBe('string');
      }
    });
  });
});