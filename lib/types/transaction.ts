import { z } from 'zod';

export interface Transaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  description: string;
  category: string;
}

export const TransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required')
});

export const validateTransaction = (data: unknown): Transaction => {
  return TransactionSchema.parse(data);
};