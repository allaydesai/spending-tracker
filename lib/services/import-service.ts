import { CSVParserService } from './csv-parser-service';
import { TransactionService } from './transaction-service';
import { ImportSessionRepository } from '@/lib/db/repositories/import-session-repository';
import { ImportSession } from '@/lib/models/import-session';
import { ImportResult, ImportOptions, DuplicateInfo, ImportError } from '@/lib/models/import-result';
import { Transaction, TransactionInput } from '@/lib/types/transaction';

export class ImportService {
  private csvParser: CSVParserService;
  private transactionService: TransactionService;
  private importSessionRepository: ImportSessionRepository;

  constructor() {
    this.csvParser = new CSVParserService();
    this.transactionService = new TransactionService();
    this.importSessionRepository = new ImportSessionRepository();
  }

  /**
   * Import transactions from a CSV file
   */
  async importFromCSV(
    fileBuffer: Buffer,
    filename: string,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const { skipDuplicates = true, validateOnly = false } = options;

    // Create import session
    let importSession: ImportSession;

    try {
      // Step 1: Validate CSV format
      const validation = await this.csvParser.validateCSVFormat(fileBuffer, filename);
      if (!validation.isValid) {
        throw new Error(`Invalid CSV format: ${validation.errors.join(', ')}`);
      }

      // Step 2: Parse CSV content
      const parseResult = await this.csvParser.parseCSV(fileBuffer, filename);

      if (parseResult.transactions.length === 0 && parseResult.errors.length === 0) {
        throw new Error('CSV file contains no valid transaction data');
      }

      // Step 3: Create import session
      importSession = await this.importSessionRepository.create({
        filename,
        totalRows: parseResult.totalRows
      });

      // Step 4: If validate-only mode, return early
      if (validateOnly) {
        await this.importSessionRepository.markCompleted(importSession.id, {
          importedCount: 0,
          duplicateCount: 0,
          errorCount: parseResult.errors.length
        });

        return {
          session: await this.importSessionRepository.findById(importSession.id),
          imported: [],
          duplicates: [],
          errors: this.convertToImportErrors(parseResult.errors)
        };
      }

      // Step 5: Process transactions (with duplicate handling)
      const processResult = await this.processTransactions(
        parseResult.transactions,
        skipDuplicates
      );

      // Step 6: Mark session as completed
      await this.importSessionRepository.markCompleted(importSession.id, {
        importedCount: processResult.imported.length,
        duplicateCount: processResult.duplicates.length,
        errorCount: parseResult.errors.length + processResult.errors.length
      });

      // Step 7: Return complete result
      const completedSession = await this.importSessionRepository.findById(importSession.id);

      return {
        session: completedSession,
        imported: processResult.imported,
        duplicates: processResult.duplicates,
        errors: [
          ...this.convertToImportErrors(parseResult.errors),
          ...processResult.errors
        ]
      };

    } catch (error: any) {
      // Mark session as failed if it was created
      if (importSession!) {
        try {
          await this.importSessionRepository.markFailed(importSession.id, error.message);
        } catch (updateError) {
          console.error('Failed to update import session status:', updateError);
        }
      }

      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Process transactions with duplicate detection and error handling
   */
  private async processTransactions(
    transactions: TransactionInput[],
    skipDuplicates: boolean
  ): Promise<{
    imported: Transaction[];
    duplicates: DuplicateInfo[];
    errors: ImportError[];
  }> {
    const imported: Transaction[] = [];
    const duplicates: DuplicateInfo[] = [];
    const errors: ImportError[] = [];

    if (skipDuplicates) {
      // Use bulk import with duplicate detection
      try {
        const bulkResult = await this.transactionService.createTransactions(transactions);

        imported.push(...bulkResult.created);

        // Convert duplicate info
        for (const duplicate of bulkResult.duplicates) {
          const rowIndex = transactions.indexOf(duplicate.input) + 2; // +2 for 1-based index and header
          duplicates.push({
            row: rowIndex,
            date: duplicate.input.date,
            amount: duplicate.input.amount,
            description: duplicate.input.description,
            existingId: duplicate.existingId
          });
        }

        // Convert bulk errors
        for (const error of bulkResult.errors) {
          const rowIndex = transactions.indexOf(error.input) + 2;
          errors.push({
            row: rowIndex,
            message: error.error,
            data: error.input
          });
        }

      } catch (error: any) {
        throw new Error(`Bulk import failed: ${error.message}`);
      }
    } else {
      // Process transactions one by one (without skipping duplicates)
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const rowNumber = i + 2; // +2 for 1-based index and header

        try {
          const created = await this.transactionService.createTransaction(transaction);
          imported.push(created);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            // Check if the duplicate exists
            const existingId = await this.transactionService.checkTransactionExists(
              transaction.date,
              transaction.amount,
              transaction.description
            );

            if (existingId) {
              duplicates.push({
                row: rowNumber,
                date: transaction.date,
                amount: transaction.amount,
                description: transaction.description,
                existingId
              });
            } else {
              errors.push({
                row: rowNumber,
                message: error.message,
                data: transaction
              });
            }
          } else {
            errors.push({
              row: rowNumber,
              message: error.message,
              data: transaction
            });
          }
        }
      }
    }

    return { imported, duplicates, errors };
  }

  /**
   * Convert CSV parse errors to ImportError format
   */
  private convertToImportErrors(parseErrors: any[]): ImportError[] {
    return parseErrors.map(error => ({
      row: error.row,
      field: error.field,
      message: error.message,
      data: error.data
    }));
  }

  /**
   * Get preview of CSV file without importing
   */
  async previewCSV(fileBuffer: Buffer, filename: string): Promise<{
    isValid: boolean;
    errors: string[];
    preview: {
      headers: string[];
      sampleRows: string[][];
      estimatedRows: number;
    };
    columnMapping?: any;
  }> {
    try {
      // Validate format
      const validation = await this.csvParser.validateCSVFormat(fileBuffer, filename);

      // Get preview data
      const preview = await this.csvParser.getCSVPreview(fileBuffer, 5);

      return {
        isValid: validation.isValid,
        errors: validation.errors,
        preview: {
          headers: preview.headers,
          sampleRows: preview.sampleRows,
          estimatedRows: preview.totalEstimatedRows
        },
        columnMapping: validation.columnMapping
      };
    } catch (error: any) {
      return {
        isValid: false,
        errors: [error.message],
        preview: {
          headers: [],
          sampleRows: [],
          estimatedRows: 0
        }
      };
    }
  }

  /**
   * Get import session by ID
   */
  async getImportSession(id: number): Promise<ImportSession> {
    try {
      return await this.importSessionRepository.findById(id);
    } catch (error: any) {
      throw new Error(`Failed to get import session: ${error.message}`);
    }
  }

  /**
   * Get recent import sessions
   */
  async getRecentImportSessions(limit: number = 10): Promise<ImportSession[]> {
    try {
      return await this.importSessionRepository.getRecent(limit);
    } catch (error: any) {
      throw new Error(`Failed to get recent import sessions: ${error.message}`);
    }
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    pendingSessions: number;
    totalImported: number;
    totalDuplicates: number;
    totalErrors: number;
    successRate: number;
  }> {
    try {
      const stats = await this.importSessionRepository.getStats();
      const successRateData = await this.importSessionRepository.getSuccessRate();

      return {
        ...stats,
        successRate: successRateData.successRate
      };
    } catch (error: any) {
      throw new Error(`Failed to get import stats: ${error.message}`);
    }
  }

  /**
   * Get the last successful import timestamp
   */
  async getLastImportTimestamp(): Promise<string | null> {
    try {
      const lastImport = await this.importSessionRepository.getLastSuccessfulImport();
      return lastImport?.completedAt || null;
    } catch (error: any) {
      console.error('Failed to get last import timestamp:', error);
      return null;
    }
  }

  /**
   * Check if there are any pending import sessions
   */
  async hasPendingImports(): Promise<boolean> {
    try {
      return await this.importSessionRepository.hasPendingSessions();
    } catch (error: any) {
      console.error('Failed to check pending imports:', error);
      return false;
    }
  }

  /**
   * Cancel pending import session
   */
  async cancelImport(sessionId: number): Promise<void> {
    try {
      const session = await this.importSessionRepository.findById(sessionId);

      if (session.status !== 'pending') {
        throw new Error(`Cannot cancel import session with status: ${session.status}`);
      }

      await this.importSessionRepository.markFailed(sessionId, 'Import cancelled by user');
    } catch (error: any) {
      throw new Error(`Failed to cancel import: ${error.message}`);
    }
  }

  /**
   * Clean up old import sessions
   */
  async cleanupOldImportSessions(olderThanDays: number = 30): Promise<number> {
    try {
      return await this.importSessionRepository.deleteOlderThan(olderThanDays);
    } catch (error: any) {
      console.error('Failed to cleanup old import sessions:', error);
      return 0;
    }
  }

  /**
   * Validate import options
   */
  private validateImportOptions(options: ImportOptions): void {
    if (typeof options.skipDuplicates !== 'undefined' && typeof options.skipDuplicates !== 'boolean') {
      throw new Error('skipDuplicates option must be a boolean');
    }

    if (typeof options.validateOnly !== 'undefined' && typeof options.validateOnly !== 'boolean') {
      throw new Error('validateOnly option must be a boolean');
    }
  }

  /**
   * Get detailed import result with additional metadata
   */
  async getDetailedImportResult(sessionId: number): Promise<ImportResult & {
    metadata: {
      duration?: number;
      fileSize?: number;
      processingRate?: number; // transactions per second
    };
  }> {
    try {
      const session = await this.importSessionRepository.findById(sessionId);

      // Calculate metadata
      const startTime = new Date(session.startedAt).getTime();
      const endTime = session.completedAt ? new Date(session.completedAt).getTime() : Date.now();
      const duration = endTime - startTime;

      const processingRate = session.totalRows > 0 && duration > 0
        ? (session.totalRows / (duration / 1000))
        : 0;

      // Note: For a complete implementation, you would store and retrieve
      // the actual imported transactions, duplicates, and errors
      // This is a simplified version showing the structure

      return {
        session,
        imported: [], // Would need to be retrieved from a separate store
        duplicates: [], // Would need to be retrieved from a separate store
        errors: [], // Would need to be retrieved from a separate store
        metadata: {
          duration,
          processingRate: Math.round(processingRate * 100) / 100
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to get detailed import result: ${error.message}`);
    }
  }
}