import { NextRequest } from 'next/server';
import { GET } from '@/app/api/storage/status/route';

// Mock the database modules
jest.mock('@/lib/db/connection');
jest.mock('@/lib/db/config');

describe('/api/storage/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/storage/status', () => {
    it('should return storage status with correct schema', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('connected');
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('databaseSize');
      expect(result).toHaveProperty('lastImport');
      expect(result).toHaveProperty('version');

      expect(typeof result.connected).toBe('boolean');
      expect(typeof result.transactionCount).toBe('number');
      expect(typeof result.databaseSize).toBe('number');
      expect(typeof result.version).toBe('string');

      // lastImport can be null or a string
      if (result.lastImport !== null) {
        expect(typeof result.lastImport).toBe('string');
        // Verify it's a valid ISO date string
        expect(new Date(result.lastImport).toISOString()).toBe(result.lastImport);
      }
    });

    it('should show connected status when database is available', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.connected).toBe(true);
    });

    it('should return non-negative values for counts and sizes', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.transactionCount).toBeGreaterThanOrEqual(0);
      expect(result.databaseSize).toBeGreaterThanOrEqual(0);
    });

    it('should include database version information', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result.version).toBeDefined();
      expect(result.version.length).toBeGreaterThan(0);
    });

    it('should handle database connection errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // In a real scenario where database is not available, this should still return a valid response
      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      // Should either succeed or return a structured error
      expect([200, 500].includes(response.status)).toBe(true);

      const result = await response.json();

      if (response.status === 200) {
        expect(result).toHaveProperty('connected');
      } else {
        expect(result).toHaveProperty('message');
      }
    });

    it('should provide accurate transaction count', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // The count should be an integer
      expect(Number.isInteger(result.transactionCount)).toBe(true);
      expect(result.transactionCount).toBeGreaterThanOrEqual(0);
    });

    it('should provide database size in bytes', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Database size should be in bytes (positive integer)
      expect(Number.isInteger(result.databaseSize)).toBe(true);
      expect(result.databaseSize).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty database state', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // Even with empty database, all fields should be present
      expect(result).toHaveProperty('connected');
      expect(result).toHaveProperty('transactionCount');
      expect(result).toHaveProperty('databaseSize');
      expect(result).toHaveProperty('lastImport');
      expect(result).toHaveProperty('version');

      // With empty database, lastImport should be null
      if (result.transactionCount === 0) {
        expect(result.lastImport).toBeNull();
      }
    });

    it('should show lastImport timestamp after imports', async () => {
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      const result = await response.json();

      // If there are transactions, lastImport should be a valid timestamp
      if (result.transactionCount > 0 && result.lastImport !== null) {
        expect(typeof result.lastImport).toBe('string');

        // Should be a valid date
        const importDate = new Date(result.lastImport);
        expect(importDate.getTime()).not.toBeNaN();

        // Should be in the past or now
        expect(importDate.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should be performant and respond quickly', async () => {
      const startTime = Date.now();
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);

      // Status endpoint should respond quickly (under 1 second)
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000);
    });

    it('should not require any parameters', async () => {
      // Test without any query parameters
      const request = new NextRequest('http://localhost:3000/api/storage/status');

      // This will fail because the route doesn't exist yet
      const response = await GET(request);

      expect(response.status).toBe(200);

      // Test with query parameters (should ignore them)
      const requestWithParams = new NextRequest('http://localhost:3000/api/storage/status?ignored=param');

      // This will fail because the route doesn't exist yet
      const responseWithParams = await GET(requestWithParams);

      expect(responseWithParams.status).toBe(200);
    });
  });
});