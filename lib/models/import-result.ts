import { z } from 'zod';
import { Transaction } from '@/lib/types/transaction';
import { ImportSession } from './import-session';

export interface ImportResult {
  session: ImportSession;        // Import session details
  imported: Transaction[];       // Newly imported transactions
  duplicates: DuplicateInfo[];   // Information about skipped duplicates
  errors: ImportError[];         // Detailed error information
}

export interface DuplicateInfo {
  row: number;                   // CSV row number
  date: string;
  amount: number;
  description: string;
  existingId: number;           // ID of existing transaction
}

export interface ImportError {
  row: number;                   // CSV row number
  field?: string;                // Field that caused error
  message: string;               // Error description
  data: any;                     // Raw row data for debugging
}

export interface ImportOptions {
  skipDuplicates?: boolean;      // Skip duplicate transactions instead of failing
  validateOnly?: boolean;        // Validate without importing
}

export const DuplicateInfoSchema = z.object({
  row: z.number().int().positive('Row number must be positive'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.number(),
  description: z.string().min(1, 'Description is required'),
  existingId: z.number().int().positive('Existing ID must be positive')
});

export const ImportErrorSchema = z.object({
  row: z.number().int().positive('Row number must be positive'),
  field: z.string().optional(),
  message: z.string().min(1, 'Error message is required'),
  data: z.any()
});

export const ImportOptionsSchema = z.object({
  skipDuplicates: z.boolean().default(true),
  validateOnly: z.boolean().default(false)
});

export const ImportResultSchema = z.object({
  session: z.any(), // ImportSessionSchema would be imported here
  imported: z.array(z.any()), // TransactionSchema would be imported here
  duplicates: z.array(DuplicateInfoSchema),
  errors: z.array(ImportErrorSchema)
});

export const validateDuplicateInfo = (data: unknown): DuplicateInfo => {
  return DuplicateInfoSchema.parse(data);
};

export const validateImportError = (data: unknown): ImportError => {
  return ImportErrorSchema.parse(data);
};

export const validateImportOptions = (data: unknown): ImportOptions => {
  return ImportOptionsSchema.parse(data);
};

export const validateImportResult = (data: unknown): ImportResult => {
  return ImportResultSchema.parse(data);
};