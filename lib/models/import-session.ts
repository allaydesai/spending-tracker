import { z } from 'zod';

export interface ImportSession {
  id: number;                    // Auto-generated primary key
  filename: string;               // Original CSV filename
  startedAt: string;             // ISO 8601 timestamp
  completedAt?: string;          // ISO 8601 timestamp (null if failed)
  totalRows: number;             // Total rows in CSV
  importedCount: number;         // Successfully imported transactions
  duplicateCount: number;        // Skipped duplicate transactions
  errorCount: number;            // Failed rows
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;         // Error details if failed
}

export interface ImportSessionInput {
  filename: string;
  totalRows: number;
}

export interface ImportSessionUpdate {
  completedAt?: string;
  importedCount?: number;
  duplicateCount?: number;
  errorCount?: number;
  status?: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

export const ImportSessionSchema = z.object({
  id: z.number().int().positive('Import session ID must be a positive integer'),
  filename: z.string().min(1, 'Filename is required'),
  startedAt: z.string().datetime('Started timestamp must be a valid ISO datetime'),
  completedAt: z.string().datetime('Completed timestamp must be a valid ISO datetime').optional(),
  totalRows: z.number().int().min(0, 'Total rows must be non-negative'),
  importedCount: z.number().int().min(0, 'Imported count must be non-negative'),
  duplicateCount: z.number().int().min(0, 'Duplicate count must be non-negative'),
  errorCount: z.number().int().min(0, 'Error count must be non-negative'),
  status: z.enum(['pending', 'completed', 'failed']),
  errorMessage: z.string().optional()
}).refine(
  (data) => data.importedCount + data.duplicateCount + data.errorCount <= data.totalRows,
  'Sum of imported, duplicate, and error counts cannot exceed total rows'
);

export const ImportSessionInputSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  totalRows: z.number().int().min(0, 'Total rows must be non-negative')
});

export const ImportSessionUpdateSchema = z.object({
  completedAt: z.string().datetime('Completed timestamp must be a valid ISO datetime').optional(),
  importedCount: z.number().int().min(0, 'Imported count must be non-negative').optional(),
  duplicateCount: z.number().int().min(0, 'Duplicate count must be non-negative').optional(),
  errorCount: z.number().int().min(0, 'Error count must be non-negative').optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  errorMessage: z.string().optional()
});

export const validateImportSession = (data: unknown): ImportSession => {
  return ImportSessionSchema.parse(data);
};

export const validateImportSessionInput = (data: unknown): ImportSessionInput => {
  return ImportSessionInputSchema.parse(data);
};

export const validateImportSessionUpdate = (data: unknown): ImportSessionUpdate => {
  return ImportSessionUpdateSchema.parse(data);
};