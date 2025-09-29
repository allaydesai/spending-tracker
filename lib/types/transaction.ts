import { z } from 'zod';

export interface Transaction {
  id: number;                    // Auto-generated primary key
  date: string;                   // ISO 8601 date (YYYY-MM-DD)
  amount: number;                 // Decimal amount (positive or negative)
  description: string;            // Transaction description/merchant
  category?: string;              // Optional category classification
  createdAt: string;             // ISO 8601 timestamp of record creation
}

export interface TransactionInput {
  date: string;
  amount: number;
  description: string;
  category?: string;
}

export const TransactionSchema = z.object({
  id: z.number().int().positive('Transaction ID must be a positive integer'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().refine(val => val !== 0, 'Amount cannot be zero'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  category: z.string().max(100, 'Category must be 100 characters or less').optional(),
  createdAt: z.string().datetime('Created timestamp must be a valid ISO datetime')
});

export const TransactionInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(date => {
      const parsedDate = new Date(date);
      const today = new Date();
      return parsedDate <= today;
    }, 'Date cannot be in the future'),
  amount: z.number().refine(val => val !== 0, 'Amount cannot be zero')
    .refine(val => Math.abs(val) <= 999999.99, 'Amount must be within reasonable range'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or less'),
  category: z.string().max(100, 'Category must be 100 characters or less').optional()
});

export const validateTransaction = (data: unknown): Transaction => {
  return TransactionSchema.parse(data);
};

export const validateTransactionInput = (data: unknown): TransactionInput => {
  return TransactionInputSchema.parse(data);
};