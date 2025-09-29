import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transactions/import/route';
import { GET as getTransactions } from '@/app/api/transactions/route';
import { GET as getStatus } from '@/app/api/storage/status/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/import-service');
jest.mock('@/lib/services/transaction-service');

describe('CSV Import Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End CSV Import Flow', () => {
    it('should complete full import workflow from file upload to data retrieval', async () => {
      // Step 1: Prepare CSV data
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining',
        '2025-01-03,2500.00,Salary,Income',
        '2025-01-04,-100.00,Gas Station,Transport'
      ].join('\n');

      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      // Step 2: Import the CSV file
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
      expect(importResult.session.status).toBe('completed');
      expect(importResult.session.totalRows).toBe(4);
      expect(importResult.session.importedCount).toBe(4);
      expect(importResult.session.errorCount).toBe(0);
      expect(importResult.imported).toHaveLength(4);

      // Step 3: Verify transactions can be retrieved
      const listRequest = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse = await getTransactions(listRequest);

      expect(listResponse.status).toBe(200);

      const listResult = await listResponse.json();
      expect(listResult.transactions).toHaveLength(4);
      expect(listResult.pagination.total).toBe(4);

      // Step 4: Verify storage status is updated
      const statusRequest = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const statusResponse = await getStatus(statusRequest);

      expect(statusResponse.status).toBe(200);

      const statusResult = await statusResponse.json();
      expect(statusResult.connected).toBe(true);
      expect(statusResult.transactionCount).toBe(4);
      expect(statusResult.lastImport).toBeDefined();
    });

    it('should handle large CSV file import efficiently', async () => {
      // Generate a larger CSV file (1000 transactions)
      const csvLines = ['Date,Amount,Description,Category'];

      for (let i = 0; i < 1000; i++) {
        const date = new Date(2025, 0, (i % 31) + 1).toISOString().split('T')[0];
        const amount = (Math.random() * 200 - 100).toFixed(2);
        const description = `Transaction ${i + 1}`;
        const category = ['Food', 'Transport', 'Entertainment', 'Utilities'][i % 4];

        csvLines.push(`${date},${amount},${description},${category}`);
      }

      const csvContent = csvLines.join('\n');
      const file = new File([csvContent], 'large-transactions.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const importRequest = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      const startTime = Date.now();

      // This will fail because the route doesn't exist yet
      const importResponse = await POST(importRequest);
      const endTime = Date.now();

      expect(importResponse.status).toBe(200);

      const importResult = await importResponse.json();
      expect(importResult.session.status).toBe('completed');
      expect(importResult.session.totalRows).toBe(1000);
      expect(importResult.session.importedCount).toBe(1000);

      // Should complete within reasonable time (5 seconds)
      const importTime = endTime - startTime;
      expect(importTime).toBeLessThan(5000);
    });

    it('should handle CSV with mixed valid and invalid data', async () => {
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Valid Transaction,Food',
        'invalid-date,-25.50,Invalid Date,Dining',
        '2025-01-03,not-a-number,Invalid Amount,Transport',
        '2025-01-04,-100.00,Valid Transaction 2,Transport',
        '2025-01-05,,Missing Amount,Utilities'
      ].join('\n');

      const file = new File([csvContent], 'mixed-data.csv', { type: 'text/csv' });

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
      expect(importResult.session.status).toBe('completed');
      expect(importResult.session.totalRows).toBe(5);
      expect(importResult.session.importedCount).toBe(2); // Only valid transactions
      expect(importResult.session.errorCount).toBe(3); // Invalid rows

      expect(importResult.imported).toHaveLength(2);
      expect(importResult.errors).toHaveLength(3);

      // Verify error details
      importResult.errors.forEach((error: any) => {
        expect(error).toHaveProperty('row');
        expect(error).toHaveProperty('message');
        expect(error.row).toBeGreaterThan(1); // Header is row 1
      });
    });

    it('should handle CSV with different column orders', async () => {
      // CSV with columns in different order
      const csvContent = [
        'Description,Category,Amount,Date',
        'Grocery Store,Food,-50.00,2025-01-01',
        'Coffee Shop,Dining,-25.50,2025-01-02'
      ].join('\n');

      const file = new File([csvContent], 'reordered-columns.csv', { type: 'text/csv' });

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
      expect(importResult.session.status).toBe('completed');
      expect(importResult.session.importedCount).toBe(2);

      // Verify data was mapped correctly despite different column order
      const transactions = importResult.imported;
      expect(transactions[0].date).toBe('2025-01-01');
      expect(transactions[0].amount).toBe(-50.00);
      expect(transactions[0].description).toBe('Grocery Store');
      expect(transactions[0].category).toBe('Food');
    });

    it('should handle CSV with optional category column missing', async () => {
      const csvContent = [
        'Date,Amount,Description',
        '2025-01-01,-50.00,Grocery Store',
        '2025-01-02,-25.50,Coffee Shop'
      ].join('\n');

      const file = new File([csvContent], 'no-category.csv', { type: 'text/csv' });

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
      expect(importResult.session.status).toBe('completed');
      expect(importResult.session.importedCount).toBe(2);

      // Verify transactions have null/undefined category
      const transactions = importResult.imported;
      transactions.forEach((transaction: any) => {
        expect(transaction.category).toBeUndefined();
      });
    });

    it('should handle import session tracking across multiple imports', async () => {
      // First import
      const csvContent1 = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,First Import,Food'
      ].join('\n');

      const file1 = new File([csvContent1], 'import1.csv', { type: 'text/csv' });

      const formData1 = new FormData();
      formData1.append('file', file1);

      const importRequest1 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData1,
      });

      // This will fail because the route doesn't exist yet
      const importResponse1 = await POST(importRequest1);
      const importResult1 = await importResponse1.json();

      // Second import
      const csvContent2 = [
        'Date,Amount,Description,Category',
        '2025-01-02,-25.50,Second Import,Dining'
      ].join('\n');

      const file2 = new File([csvContent2], 'import2.csv', { type: 'text/csv' });

      const formData2 = new FormData();
      formData2.append('file', file2);

      const importRequest2 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData2,
      });

      // This will fail because the route doesn't exist yet
      const importResponse2 = await POST(importRequest2);
      const importResult2 = await importResponse2.json();

      // Verify each import has its own session
      expect(importResult1.session.id).not.toBe(importResult2.session.id);
      expect(importResult1.session.filename).toBe('import1.csv');
      expect(importResult2.session.filename).toBe('import2.csv');

      // Verify total transactions after both imports
      const listRequest = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse = await getTransactions(listRequest);
      const listResult = await listResponse.json();

      expect(listResult.pagination.total).toBe(2);
    });
  });
});