/**
 * Unit Tests: config-loader
 * Tests YAML parsing, Zod validation, error handling
 * Reference: data-model.md lines 52-101
 *
 * These tests MUST fail initially (TDD approach)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { loadBudgetConfig, validateConfig } from '../../lib/budget/config-loader';

const TEST_CONFIG_PATH = path.join(process.cwd(), 'data', 'test-budget-config.yaml');

describe('config-loader', () => {
  afterEach(async () => {
    // Cleanup test config file
    await fs.unlink(TEST_CONFIG_PATH).catch(() => {});
  });

  describe('loadBudgetConfig', () => {
    it('should load and parse valid YAML configuration', async () => {
      // Arrange
      const validYaml = `
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
    keywords:
      - "interest"
`;
      await fs.writeFile(TEST_CONFIG_PATH, validYaml);

      // Act
      const config = await loadBudgetConfig(TEST_CONFIG_PATH);

      // Assert
      expect(config).toBeDefined();
      expect(config.budget.forecasted_income).toBe(13437.98);
      expect(config.budget.fixed_expenses.mortgage).toBe(4581.34);
      expect(config.budget.fixed_expenses.essential_services.wireless).toBe(371.62);
      expect(config.budget.day_to_day_budget).toBe(4000.00);
      expect(config.budget.forecasted_interest).toBe(1025.00);
      expect(config.budget.interest_patterns.categories).toContain('Interest');
      expect(config.budget.interest_patterns.keywords).toContain('interest');
    });

    it('should throw error when file does not exist', async () => {
      // Act & Assert
      await expect(loadBudgetConfig('/nonexistent/path.yaml'))
        .rejects
        .toThrow(/not found|ENOENT/i);
    });

    it('should throw error when YAML is malformed', async () => {
      // Arrange
      const malformedYaml = `
budget:
  forecasted_income: [unclosed array
  fixed_expenses:
`;
      await fs.writeFile(TEST_CONFIG_PATH, malformedYaml);

      // Act & Assert
      await expect(loadBudgetConfig(TEST_CONFIG_PATH))
        .rejects
        .toThrow(/parse|yaml/i);
    });

    it('should throw Zod validation error when income is negative', async () => {
      // Arrange
      const invalidYaml = `
budget:
  forecasted_income: -1000
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
      await fs.writeFile(TEST_CONFIG_PATH, invalidYaml);

      // Act & Assert
      await expect(loadBudgetConfig(TEST_CONFIG_PATH))
        .rejects
        .toThrow(/Income must be positive/i);
    });

    it('should throw Zod validation error when day_to_day_budget is zero', async () => {
      // Arrange
      const invalidYaml = `
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
  day_to_day_budget: 0
  forecasted_interest: 1025.00
  interest_patterns:
    categories:
      - "Interest"
    keywords:
      - "interest"
`;
      await fs.writeFile(TEST_CONFIG_PATH, invalidYaml);

      // Act & Assert
      await expect(loadBudgetConfig(TEST_CONFIG_PATH))
        .rejects
        .toThrow(/Day-to-day budget must be positive/i);
    });

    it('should throw error when interest_patterns.categories is empty', async () => {
      // Arrange
      const invalidYaml = `
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
    categories: []
    keywords:
      - "interest"
`;
      await fs.writeFile(TEST_CONFIG_PATH, invalidYaml);

      // Act & Assert
      await expect(loadBudgetConfig(TEST_CONFIG_PATH))
        .rejects
        .toThrow(/At least one interest category required/i);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config object', () => {
      // Arrange
      const validConfig = {
        budget: {
          forecasted_income: 13437.98,
          fixed_expenses: {
            mortgage: 4581.34,
            essential_services: {
              wireless: 371.62,
              insurance: 698.47,
              utility: 300.00,
            },
            car_payment: 600.00,
            additional_services: {
              netflix: 20.99,
              spotify: 10.99,
            },
            aaria_day_care: 484.00,
          },
          day_to_day_budget: 4000.00,
          forecasted_interest: 1025.00,
          interest_patterns: {
            categories: ['Interest'],
            keywords: ['interest'],
          },
        },
      };

      // Act
      const result = validateConfig(validConfig);

      // Assert
      expect(result).toEqual(validConfig);
    });

    it('should throw error for negative subscription costs', () => {
      // Arrange
      const invalidConfig = {
        budget: {
          forecasted_income: 13437.98,
          fixed_expenses: {
            mortgage: 4581.34,
            essential_services: {
              wireless: 371.62,
              insurance: 698.47,
              utility: 300.00,
            },
            car_payment: 600.00,
            additional_services: {
              netflix: -20.99, // Invalid
            },
            aaria_day_care: 484.00,
          },
          day_to_day_budget: 4000.00,
          forecasted_interest: 1025.00,
          interest_patterns: {
            categories: ['Interest'],
            keywords: ['interest'],
          },
        },
      };

      // Act & Assert
      expect(() => validateConfig(invalidConfig))
        .toThrow(/Subscription cost cannot be negative/i);
    });

    it('should provide detailed error path for nested validation errors', () => {
      // Arrange
      const invalidConfig = {
        budget: {
          forecasted_income: 13437.98,
          fixed_expenses: {
            mortgage: 4581.34,
            essential_services: {
              wireless: -371.62, // Invalid nested field
              insurance: 698.47,
              utility: 300.00,
            },
            car_payment: 600.00,
            additional_services: {},
            aaria_day_care: 484.00,
          },
          day_to_day_budget: 4000.00,
          forecasted_interest: 1025.00,
          interest_patterns: {
            categories: ['Interest'],
            keywords: ['interest'],
          },
        },
      };

      // Act & Assert
      try {
        validateConfig(invalidConfig);
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('Wireless cost cannot be negative');
        // Should include path information
        expect(error.issues || error.errors).toBeDefined();
      }
    });
  });
});
