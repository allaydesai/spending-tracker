import { z } from 'zod';

export interface DailySpending {
  date: string; // ISO date string (YYYY-MM-DD)
  amount: number; // Total spending amount for the day
  transactionCount: number; // Number of transactions for the day
  categories: Record<string, number>; // Category breakdown
}

export const DailySpendingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  transactionCount: z.number().int().min(0, 'Transaction count must be non-negative integer'),
  categories: z.record(z.string(), z.number().min(0, 'Category amounts must be non-negative'))
}).refine((data) => {
  const categoryTotal = Object.values(data.categories).reduce((sum, amount) => sum + amount, 0);
  return Math.abs(categoryTotal - data.amount) < 0.01; // Allow for small floating point differences
}, {
  message: 'Category amounts must sum to total amount',
  path: ['categories']
});

export const validateDailySpending = (data: unknown): DailySpending => {
  return DailySpendingSchema.parse(data);
};