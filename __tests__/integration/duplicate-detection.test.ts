import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transactions/import/route';
import { GET as getTransactions } from '@/app/api/transactions/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/import-service');
jest.mock('@/lib/services/transaction-service');

describe('Duplicate Detection Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Duplicate Prevention and Detection', () => {
    it('should detect exact duplicates in the same CSV file', async () => {
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-01,-50.00,Grocery Store,Food', // Exact duplicate
        '2025-01-02,-25.50,Coffee Shop,Dining'
      ].join('\n');

      const file = new File([csvContent], 'with-duplicates.csv', { type: 'text/csv' });

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
      expect(importResult.session.totalRows).toBe(3);
      expect(importResult.session.importedCount).toBe(2); // Only unique transactions
      expect(importResult.session.duplicateCount).toBe(1);

      expect(importResult.imported).toHaveLength(2);
      expect(importResult.duplicates).toHaveLength(1);

      // Verify duplicate information
      const duplicate = importResult.duplicates[0];
      expect(duplicate.row).toBe(3); // Third row (accounting for header)
      expect(duplicate.date).toBe('2025-01-01');
      expect(duplicate.amount).toBe(-50.00);
      expect(duplicate.description).toBe('Grocery Store');
      expect(duplicate.existingId).toBeDefined();
    });

    it('should detect duplicates across multiple import sessions', async () => {
      // First import
      const csvContent1 = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining'
      ].join('\n');

      const file1 = new File([csvContent1], 'first-import.csv', { type: 'text/csv' });

      const formData1 = new FormData();
      formData1.append('file', file1);

      const importRequest1 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData1,
      });

      // This will fail because the route doesn't exist yet
      const importResponse1 = await POST(importRequest1);
      const importResult1 = await importResponse1.json();

      expect(importResult1.session.importedCount).toBe(2);
      expect(importResult1.session.duplicateCount).toBe(0);

      // Second import with overlapping data
      const csvContent2 = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food', // Duplicate from first import
        '2025-01-03,-100.00,Gas Station,Transport' // New transaction
      ].join('\n');

      const file2 = new File([csvContent2], 'second-import.csv', { type: 'text/csv' });

      const formData2 = new FormData();
      formData2.append('file', file2);

      const importRequest2 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData2,
      });

      // This will fail because the route doesn't exist yet
      const importResponse2 = await POST(importRequest2);
      const importResult2 = await importResponse2.json();

      expect(importResult2.session.importedCount).toBe(1); // Only new transaction
      expect(importResult2.session.duplicateCount).toBe(1); // One duplicate detected

      expect(importResult2.imported).toHaveLength(1);
      expect(importResult2.imported[0].description).toBe('Gas Station');

      expect(importResult2.duplicates).toHaveLength(1);
      expect(importResult2.duplicates[0].description).toBe('Grocery Store');

      // Verify total count in database
      const listRequest = new NextRequest('http://localhost:3000/api/transactions');

      // This will fail because the route doesn't exist yet
      const listResponse = await getTransactions(listRequest);
      const listResult = await listResponse.json();

      expect(listResult.pagination.total).toBe(3); // 2 from first import + 1 new from second
    });

    it('should allow duplicates when skipDuplicates is false', async () => {
      // First import
      const csvContent1 = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food'
      ].join('\n');

      const file1 = new File([csvContent1], 'first-import.csv', { type: 'text/csv' });

      const formData1 = new FormData();
      formData1.append('file', file1);

      const importRequest1 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData1,
      });

      // This will fail because the route doesn't exist yet
      await POST(importRequest1);

      // Second import with skipDuplicates: false
      const csvContent2 = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food' // Same transaction
      ].join('\n');

      const file2 = new File([csvContent2], 'second-import.csv', { type: 'text/csv' });

      const formData2 = new FormData();
      formData2.append('file', file2);
      formData2.append('options', JSON.stringify({ skipDuplicates: false }));

      const importRequest2 = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData2,
      });

      // This will fail because the route doesn't exist yet
      const importResponse2 = await POST(importRequest2);
      const importResult2 = await importResponse2.json();

      // With skipDuplicates: false, should attempt to import duplicate
      // This might result in a database constraint error or special handling
      expect([200, 400].includes(importResponse2.status)).toBe(true);

      if (importResponse2.status === 200) {
        // If the system handles it gracefully, check the response
        expect(importResult2.session.status).toBeDefined();
      }
    });

    it('should handle near-duplicates correctly', async () => {
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-01,-50.00,Grocery Store ,Food', // Extra space in description
        '2025-01-01,-50.01,Grocery Store,Food', // Different amount
        '2025-01-02,-50.00,Grocery Store,Food', // Different date
        '2025-01-01,-50.00,grocery store,Food', // Different case
      ].join('\n');

      const file = new File([csvContent], 'near-duplicates.csv', { type: 'text/csv' });

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

      // All transactions should be imported as they're not exact duplicates
      // (depending on the duplicate detection strategy)
      expect(importResult.session.importedCount).toBeGreaterThan(0);

      // The system should only detect exact matches as duplicates
      // Near-duplicates should be imported as separate transactions
      const totalProcessed = importResult.session.importedCount + importResult.session.duplicateCount;
      expect(totalProcessed).toBe(5);
    });

    it('should handle duplicate detection with different category values', async () => {
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-01,-50.00,Grocery Store,Groceries', // Different category
        '2025-01-01,-50.00,Grocery Store,', // Empty category
        '2025-01-01,-50.00,Grocery Store,Food', // Exact duplicate
      ].join('\n');

      const file = new File([csvContent], 'category-variations.csv', { type: 'text/csv' });

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

      // Depending on duplicate detection logic:
      // If category is not part of the unique constraint, only one should be imported
      // If category is part of the unique constraint, multiple may be imported

      expect(importResult.session.totalRows).toBe(4);
      expect(importResult.session.importedCount + importResult.session.duplicateCount).toBe(4);

      // At least one should be detected as duplicate (the exact match)
      expect(importResult.session.duplicateCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle bulk duplicate detection efficiently', async () => {
      // Create a CSV with many duplicates to test performance
      const csvLines = ['Date,Amount,Description,Category'];

      // Add 100 unique transactions
      for (let i = 0; i < 100; i++) {
        csvLines.push(`2025-01-01,-${i + 1}.00,Transaction ${i + 1},Category${i % 5}`);
      }

      // Add 100 duplicates of the first 100 transactions
      for (let i = 0; i < 100; i++) {
        csvLines.push(`2025-01-01,-${i + 1}.00,Transaction ${i + 1},Category${i % 5}`);
      }

      const csvContent = csvLines.join('\n');
      const file = new File([csvContent], 'bulk-duplicates.csv', { type: 'text/csv' });

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
      expect(importResult.session.totalRows).toBe(200);
      expect(importResult.session.importedCount).toBe(100); // Only unique transactions
      expect(importResult.session.duplicateCount).toBe(100); // All duplicates detected

      // Should complete within reasonable time even with many duplicates
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000);
    });

    it('should provide detailed duplicate information', async () => {
      const csvContent = [
        'Date,Amount,Description,Category',
        '2025-01-01,-50.00,Grocery Store,Food',
        '2025-01-02,-25.50,Coffee Shop,Dining',
        '2025-01-01,-50.00,Grocery Store,Food', // Duplicate of row 2
        '2025-01-03,-100.00,Gas Station,Transport',
        '2025-01-02,-25.50,Coffee Shop,Dining', // Duplicate of row 3
      ].join('\n');

      const file = new File([csvContent], 'detailed-duplicates.csv', { type: 'text/csv' });

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
      expect(importResult.session.duplicateCount).toBe(2);
      expect(importResult.duplicates).toHaveLength(2);

      // Check duplicate details
      importResult.duplicates.forEach((duplicate: any) => {
        expect(duplicate).toHaveProperty('row');
        expect(duplicate).toHaveProperty('date');
        expect(duplicate).toHaveProperty('amount');
        expect(duplicate).toHaveProperty('description');
        expect(duplicate).toHaveProperty('existingId');

        expect(duplicate.row).toBeGreaterThan(1); // Should reference CSV row number
        expect(typeof duplicate.existingId).toBe('number');
        expect(duplicate.existingId).toBeGreaterThan(0);
      });

      // Verify row numbers are correct
      const duplicateRows = importResult.duplicates.map((d: any) => d.row).sort();
      expect(duplicateRows).toEqual([4, 6]); // Rows with duplicates (1-indexed, accounting for header)
    });
  });
});