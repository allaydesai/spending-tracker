/**
 * Contract Test: GET /api/budget/config
 * Validates request/response schemas per contracts/budget-config-api.yaml
 *
 * Test cases:
 * - Success (200): Valid config loaded
 * - Validation error (400): Invalid YAML structure
 * - File not found (404): Config file missing
 * - Parse error (500): Malformed YAML
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'budget-config.yaml');
const BACKUP_PATH = path.join(process.cwd(), 'data', 'budget-config.yaml.test-backup');

describe('Budget Config API Contract Tests', () => {
  let configBackup: string | null = null;

  beforeEach(async () => {
    // Backup existing config if it exists
    try {
      configBackup = await fs.readFile(CONFIG_PATH, 'utf8');
      await fs.writeFile(BACKUP_PATH, configBackup);
    } catch (error) {
      configBackup = null;
    }
  });

  afterEach(async () => {
    // Restore original config
    if (configBackup !== null) {
      await fs.writeFile(CONFIG_PATH, configBackup);
      await fs.unlink(BACKUP_PATH).catch(() => {});
    } else {
      // Delete test config if no backup existed
      await fs.unlink(CONFIG_PATH).catch(() => {});
    }
  });

  describe('GET /api/budget/config', () => {
    it('should return 200 with valid config when file exists and is valid', async () => {
      // Arrange: Create valid config file
      const validConfig = `
budget:
  forecasted_income: 13437.98
  fixed_expenses:
    mortgage: 4581.34
    essential_services:
      wireless: 371.62
      insurance: 698.47
      utility: 300.00
    car_payment: 600.00
    additional_services:
      netflix: 20.99
      spotify: 10.99
    aaria_day_care: 484.00
  day_to_day_budget: 4000.00
  forecasted_interest: 1025.00
  interest_patterns:
    categories:
      - "Interest"
      - "Finance Charge"
    keywords:
      - "interest"
      - "apr"
`;
      await fs.writeFile(CONFIG_PATH, validConfig);

      // Act: Make request to API
      const response = await fetch('http://localhost:3000/api/budget/config');
      const data = await response.json();

      // Assert: Validate response schema
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('cached');

      // Validate BudgetConfig structure
      const { budget } = data.data;
      expect(budget).toHaveProperty('forecasted_income');
      expect(typeof budget.forecasted_income).toBe('number');
      expect(budget.forecasted_income).toBeGreaterThan(0);

      expect(budget).toHaveProperty('fixed_expenses');
      expect(budget.fixed_expenses).toHaveProperty('mortgage');
      expect(budget.fixed_expenses).toHaveProperty('essential_services');
      expect(budget.fixed_expenses.essential_services).toHaveProperty('wireless');
      expect(budget.fixed_expenses.essential_services).toHaveProperty('insurance');
      expect(budget.fixed_expenses.essential_services).toHaveProperty('utility');
      expect(budget.fixed_expenses).toHaveProperty('car_payment');
      expect(budget.fixed_expenses).toHaveProperty('additional_services');
      expect(budget.fixed_expenses).toHaveProperty('aaria_day_care');

      expect(budget).toHaveProperty('day_to_day_budget');
      expect(budget.day_to_day_budget).toBeGreaterThan(0);

      expect(budget).toHaveProperty('forecasted_interest');
      expect(budget.forecasted_interest).toBeGreaterThanOrEqual(0);

      expect(budget).toHaveProperty('interest_patterns');
      expect(Array.isArray(budget.interest_patterns.categories)).toBe(true);
      expect(budget.interest_patterns.categories.length).toBeGreaterThan(0);
      expect(Array.isArray(budget.interest_patterns.keywords)).toBe(true);
      expect(budget.interest_patterns.keywords.length).toBeGreaterThan(0);
    });

    it('should return 400 with validation error when config has invalid values', async () => {
      // Arrange: Create invalid config (negative income)
      const invalidConfig = `
budget:
  forecasted_income: -1000
  fixed_expenses:
    mortgage: -4581.34
    essential_services:
      wireless: 371.62
      insurance: 698.47
      utility: 300.00
    car_payment: 600.00
    additional_services:
      netflix: 20.99
    aaria_day_care: 484.00
  day_to_day_budget: 4000.00
  forecasted_interest: 1025.00
  interest_patterns:
    categories:
      - "Interest"
    keywords:
      - "interest"
`;
      await fs.writeFile(CONFIG_PATH, invalidConfig);

      // Act: Make request to API
      const response = await fetch('http://localhost:3000/api/budget/config');
      const data = await response.json();

      // Assert: Validate error response schema
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Validation error');
      expect(data).toHaveProperty('details');
      expect(Array.isArray(data.details)).toBe(true);

      // Validate error details structure
      expect(data.details.length).toBeGreaterThan(0);
      expect(data.details[0]).toHaveProperty('path');
      expect(data.details[0]).toHaveProperty('message');
      expect(Array.isArray(data.details[0].path)).toBe(true);
    });

    it('should return 404 when config file does not exist', async () => {
      // Arrange: Ensure config file doesn't exist
      await fs.unlink(CONFIG_PATH).catch(() => {});

      // Act: Make request to API
      const response = await fetch('http://localhost:3000/api/budget/config');
      const data = await response.json();

      // Assert: Validate error response schema
      expect(response.status).toBe(404);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Budget config file not found');
      expect(data).toHaveProperty('path');
      expect(data.path).toContain('budget-config.yaml');
      expect(data).toHaveProperty('hint');
      expect(data.hint).toContain('Create budget-config.yaml');
    });

    it('should return 500 when YAML is malformed', async () => {
      // Arrange: Create malformed YAML
      const malformedConfig = `
budget:
  forecasted_income: not-a-number
  fixed_expenses: [invalid structure without closing
`;
      await fs.writeFile(CONFIG_PATH, malformedConfig);

      // Act: Make request to API
      const response = await fetch('http://localhost:3000/api/budget/config');
      const data = await response.json();

      // Assert: Validate error response schema
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Failed to parse YAML');
      expect(data).toHaveProperty('details');
    });

    it('should support cache busting with bustCache query parameter', async () => {
      // Arrange: Create valid config
      const validConfig = `
budget:
  forecasted_income: 13437.98
  fixed_expenses:
    mortgage: 4581.34
    essential_services:
      wireless: 371.62
      insurance: 698.47
      utility: 300.00
    car_payment: 600.00
    additional_services:
      netflix: 20.99
    aaria_day_care: 484.00
  day_to_day_budget: 4000.00
  forecasted_interest: 1025.00
  interest_patterns:
    categories:
      - "Interest"
    keywords:
      - "interest"
`;
      await fs.writeFile(CONFIG_PATH, validConfig);

      // Act: Make first request (should cache)
      const response1 = await fetch('http://localhost:3000/api/budget/config');
      const data1 = await response1.json();

      // Make second request with bustCache=true
      const response2 = await fetch('http://localhost:3000/api/budget/config?bustCache=true');
      const data2 = await response2.json();

      // Assert: Both should return 200
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(data2.success).toBe(true);

      // Second request should not be from cache
      expect(data2.cached).toBe(false);
    });
  });
});
