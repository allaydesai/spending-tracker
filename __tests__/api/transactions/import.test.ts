import { NextRequest } from 'next/server';
import { POST } from '@/app/api/transactions/import/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/services/import-service');

describe('/api/transactions/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/transactions/import', () => {
    it('should accept a CSV file and return import results', async () => {
      // Test data
      const csvContent = 'Date,Amount,Description,Category\n2025-01-01,-50.00,Grocery Store,Food';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('imported');
      expect(result).toHaveProperty('duplicates');
      expect(result).toHaveProperty('errors');

      expect(result.session).toHaveProperty('id');
      expect(result.session).toHaveProperty('filename', 'transactions.csv');
      expect(result.session).toHaveProperty('status', 'completed');
      expect(result.session).toHaveProperty('totalRows', 1);
      expect(result.session).toHaveProperty('importedCount', 1);
      expect(result.session).toHaveProperty('duplicateCount', 0);
      expect(result.session).toHaveProperty('errorCount', 0);

      expect(Array.isArray(result.imported)).toBe(true);
      expect(result.imported).toHaveLength(1);

      const transaction = result.imported[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('date', '2025-01-01');
      expect(transaction).toHaveProperty('amount', -50.00);
      expect(transaction).toHaveProperty('description', 'Grocery Store');
      expect(transaction).toHaveProperty('category', 'Food');
      expect(transaction).toHaveProperty('createdAt');
    });

    it('should handle duplicate detection', async () => {
      const csvContent = 'Date,Amount,Description,Category\n2025-01-01,-50.00,Grocery Store,Food\n2025-01-01,-50.00,Grocery Store,Food';
      const file = new File([csvContent], 'duplicates.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.session.duplicateCount).toBeGreaterThan(0);
      expect(Array.isArray(result.duplicates)).toBe(true);
    });

    it('should reject files larger than 10MB', async () => {
      // Create a large file (mock)
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(413);
    });

    it('should reject non-CSV files', async () => {
      const file = new File(['not a csv'], 'file.txt', { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('CSV');
    });

    it('should handle malformed CSV data', async () => {
      const csvContent = 'Date,Amount,Description\ninvalid-date,not-a-number,description';
      const file = new File([csvContent], 'invalid.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.session.errorCount).toBeGreaterThan(0);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors).toHaveLength(result.session.errorCount);
    });

    it('should support skipDuplicates option', async () => {
      const csvContent = 'Date,Amount,Description,Category\n2025-01-01,-50.00,Grocery Store,Food';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify({ skipDuplicates: false }));

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should support validateOnly option', async () => {
      const csvContent = 'Date,Amount,Description,Category\n2025-01-01,-50.00,Grocery Store,Food';
      const file = new File([csvContent], 'transactions.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify({ validateOnly: true }));

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.session.status).toBe('completed');
      // In validate-only mode, no data should be actually imported
      expect(result.session.importedCount).toBe(0);
    });

    it('should require a file in the request', async () => {
      const formData = new FormData();
      // No file attached

      const request = new NextRequest('http://localhost:3000/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      // This will fail because the route doesn't exist yet
      const response = await POST(request);

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('file');
    });
  });
});