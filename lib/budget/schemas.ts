/**
 * Budget Validation Schemas
 * Zod schemas for runtime validation of budget configuration
 */

import { z } from 'zod';

/**
 * Zod schema for budget configuration YAML validation
 * Enforces type safety and business rules at runtime
 */
export const BudgetConfigSchema = z.object({
  budget: z.object({
    forecasted_income: z
      .number()
      .positive("Income must be positive"),

    fixed_expenses: z.object({
      mortgage: z
        .number()
        .nonnegative("Mortgage cannot be negative"),

      essential_services: z.object({
        wireless: z
          .number()
          .nonnegative("Wireless cost cannot be negative"),
        insurance: z
          .number()
          .nonnegative("Insurance cost cannot be negative"),
        utility: z
          .number()
          .nonnegative("Utility cost cannot be negative"),
      }),

      car_payment: z
        .number()
        .nonnegative("Car payment cannot be negative"),

      additional_services: z.record(
        z.string(),
        z.number().nonnegative("Subscription cost cannot be negative")
      ),

      aaria_day_care: z
        .number()
        .nonnegative("Day care cost cannot be negative"),
    }),

    day_to_day_budget: z
      .number()
      .positive("Day-to-day budget must be positive"),

    forecasted_interest: z
      .number()
      .nonnegative("Forecasted interest cannot be negative"),

    interest_patterns: z.object({
      categories: z
        .array(z.string())
        .min(1, "At least one interest category required"),
      keywords: z
        .array(z.string())
        .min(1, "At least one interest keyword required"),
    }),
  })
});

/**
 * TypeScript type inferred from Zod schema
 * Ensures type and schema stay in sync
 */
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;
