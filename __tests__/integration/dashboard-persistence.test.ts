import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transactions/import/route';
import { GET as getTransactions } from '@/app/api/transactions/route';
import { GET as getStats } from '@/app/api/transactions/stats/route';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/import-service');
jest.mock('@/lib/services/transaction-service');
jest.mock('@/lib/services/stats-service');

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Dashboard Data Persistence Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Persistence Across Sessions', () => {
    it('should persist imported transaction data across page refreshes', async () => {
      // Step 1: Import transactions
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining',
        '2025-01-03,2500.00,Salary,Income',
        '2025-01-04,-100.00,Gas Station,Transport'
      ].join('\n');

      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const importResponse = await POST(importRequest);
      expect(importResponse.status).toBe(200);

      const importResult = await importResponse.json();
      expect(importResult.session.importedCount).toBe(4);

      // Step 2: Simulate page refresh by fetching data again
      const listRequest1 = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse1 = await getTransactions(listRequest1);
      expect(listResponse1.status).toBe(200);

      const listResult1 = await listResponse1.json();
      expect(listResult1.pagination.total).toBe(4);

      // Step 3: Simulate another page refresh
      const listRequest2 = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse2 = await getTransactions(listRequest2);
      expect(listResponse2.status).toBe(200);

      const listResult2 = await listResponse2.json();

      // Data should be identical across refreshes
      expect(listResult2.pagination.total).toBe(4);
      expect(listResult2.transactions).toHaveLength(4);

      // Verify transaction data is consistent
      const transactions1 = listResult1.transactions.sort((a: any, b: any) => a.id - b.id);
      const transactions2 = listResult2.transactions.sort((a: any, b: any) => a.id - b.id);

      expect(transactions1).toEqual(transactions2);
    });

    it('should persist statistics data across dashboard loads', async () => {
      // Step 1: Import test data
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining',
        '2025-01-03,2500.00,Salary,Income',
        '2025-01-04,-100.00,Gas Station,Transport'
      ].join('\n');

      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest);

      // Step 2: Fetch statistics first time
      const statsRequest1 = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const statsResponse1 = await getStats(statsRequest1);
      expect(statsResponse1.status).toBe(200);

      const statsResult1 = await statsResponse1.json();
      expect(statsResult1.totals.count).toBe(4);
      expect(statsResult1.totals.income).toBe(2500.00);
      expect(statsResult1.totals.expenses).toBe(175.50);

      // Step 3: Fetch statistics again (simulating dashboard refresh)
      const statsRequest2 = new NextRequest('http://localhost:3000/api/transactions/stats');

      // This will fail because the route doesn't exist yet
      const statsResponse2 = await getStats(statsRequest2);
      expect(statsResponse2.status).toBe(200);

      const statsResult2 = await statsResponse2.json();

      // Statistics should be consistent
      expect(statsResult2.totals).toEqual(statsResult1.totals);
      expect(statsResult2.byCategory).toEqual(statsResult1.byCategory);
      expect(statsResult2.byPeriod).toEqual(statsResult1.byPeriod);
    });

    it('should maintain data integrity after multiple import sessions', async () => {
      // First import session
      const csvContent1 = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining'
      ].join('\n');

      const file1 = new File([csvContent1], 'import1.csv', { type: 'text/csv' });
      const formData1 = new FormData();
      formData1.append('file', file1);

      const importRequest1 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData1,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest1);

      // Check count after first import
      const listRequest1 = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse1 = await getTransactions(listRequest1);
      const listResult1 = await listResponse1.json();
      expect(listResult1.pagination.total).toBe(2);

      // Second import session
      const csvContent2 = [
        'Date,Amount,Description,Category',
        '2025-01-03,2500.00,Salary,Income',
        '2025-01-04,-100.00,Gas Station,Transport'
      ].join('\n');

      const file2 = new File([csvContent2], 'import2.csv', { type: 'text/csv' });
      const formData2 = new FormData();
      formData2.append('file', file2);

      const importRequest2 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData2,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest2);

      // Check cumulative count
      const listRequest2 = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse2 = await getTransactions(listRequest2);
      const listResult2 = await listResponse2.json();
      expect(listResult2.pagination.total).toBe(4);

      // Verify all transactions from both imports are present
      const allTransactions = listResult2.transactions;
      const descriptions = allTransactions.map((t: any) => t.description);
      expect(descriptions).toContain('Grocery Store');
      expect(descriptions).toContain('Coffee Shop');
      expect(descriptions).toContain('Salary');
      expect(descriptions).toContain('Gas Station');
    });

    it('should handle database queries efficiently with persisted data', async () => {
      // Import a larger dataset
      const csvLines = ['Date,Amount,Description,Category'];

      for (let i = 0; i < 500; i++) {
        const date = new Date(2025, 0, (i % 31) + 1).toISOString().split('T')[0];
        const amount = (Math.random() * 200 - 100).toFixed(2);
        const description = `Transaction ${i + 1}`;
        const category = ['Food', 'Transport', 'Entertainment', 'Utilities'][i % 4];

        csvLines.push(`${date},${amount},${description},${category}`);
      }

      const csvContent = csvLines.join('\n');
      const file = new File([csvContent], 'large-dataset.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest);

      // Test query performance with various filters
      const queries = [
        { description: 'List all transactions', params: '' },
        { description: 'Filter by date range', params: 'startDate=2025-01-01&endDate=2025-01-10' },
        { description: 'Filter by category', params: 'category=Food' },
        { description: 'Paginated query', params: 'page=2&limit=50' },
        { description: 'Sort by amount', params: 'sortBy=amount&sortOrder=desc' },
      ];

      for (const query of queries) {
        const url = `http://localhost:3000/api/transactions?${query.params}`;
        const request = new NextRequest(url);

        const startTime = Date.now();

        // This will fail because the route doesn't exist yet
        const response = await getTransactions(request);
        const endTime = Date.now();

        expect(response.status).toBe(200);

        const result = await response.json();
        expect(Array.isArray(result.transactions)).toBe(true);
        expect(result.pagination).toBeDefined();

        // Query should complete within reasonable time
        const queryTime = endTime - startTime;
        expect(queryTime).toBeLessThan(1000); // Less than 1 second

        console.log(`${query.description}: ${queryTime}ms`);
      }
    });

    it('should maintain data consistency across concurrent operations', async () => {
      // Import initial data
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining'
      ].join('\n');

      const file = new File([csvContent], 'concurrent-test.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest);

      // Perform multiple concurrent read operations
      const readOperations = [
        getTransactions(new NextRequest('http://localhost:3000/api/transactions')),
        getTransactions(new NextRequest('http://localhost:3000/api/transactions?category=Food')),
        getStats(new NextRequest('http://localhost:3000/api/transactions/stats')),
        getStats(new NextRequest('http://localhost:3000/api/transactions/stats?groupBy=day')),
      ];

      // This will fail because the routes don't exist yet
      const results = await Promise.all(readOperations);

      // All operations should succeed
      results.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify data consistency across concurrent reads
      const listResult1 = await results[0].json();
      const listResult2 = await results[1].json();
      const statsResult1 = await results[2].json();

      expect(listResult1.pagination.total).toBe(2);
      expect(listResult2.transactions.every((t: any) => t.category === 'Food')).toBe(true);
      expect(statsResult1.totals.count).toBe(2);
    });

    it('should handle database reconnection gracefully', async () => {
      // Import some initial data
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food'
      ].join('\n');

      const file = new File([csvContent], 'reconnection-test.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest);

      // Simulate database reconnection by making multiple requests
      // In a real scenario, this might involve database connection drops
      const requests = Array(5).fill(null).map(() =>
        getTransactions(new NextRequest('http://localhost:3000/api/transactions'))
      );

      // This will fail because the route doesn't exist yet
      const responses = await Promise.all(requests);

      // All requests should succeed even with potential reconnections
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Data should be consistent across all responses
      const results = await Promise.all(responses.map(r => r.json()));
      results.forEach(result => {
        expect(result.pagination.total).toBe(1);
        expect(result.transactions[0].description).toBe('Grocery Store');
      });
    });

    it('should preserve data through application restart simulation', async () => {
      // Import transactions
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining'
      ].join('\n');

      const file = new File([csvContent], 'restart-test.csv', { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const importResponse = await POST(importRequest);
      const importResult = await importResponse.json();

      expect(importResult.session.importedCount).toBe(2);

      // Simulate application restart by clearing mocks and re-initializing
      jest.clearAllMocks();

      // After "restart", data should still be available
      const listRequest = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse = await getTransactions(listRequest);
      expect(listResponse.status).toBe(200);

      const listResult = await listResponse.json();
      expect(listResult.pagination.total).toBe(2);

      // Verify specific transaction data persisted
      const transactions = listResult.transactions;
      const descriptions = transactions.map((t: any) => t.description);
      expect(descriptions).toContain('Grocery Store');
      expect(descriptions).toContain('Coffee Shop');
    });
  });
});