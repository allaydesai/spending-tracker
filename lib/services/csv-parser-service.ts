import { parse } from 'csv-parse';
import { TransactionInput } from '@/lib/types/transaction';
import { ImportError } from '@/lib/models/import-result';

export interface CSVParseOptions {
  skipHeader?: boolean;
  delimiter?: string;
  encoding?: BufferEncoding;
  maxFileSize?: number;
}

export interface CSVParseResult {
  transactions: TransactionInput[];
  errors: ImportError[];
  totalRows: number;
  validRows: number;
}

export interface CSVColumnMapping {
  date: number;
  amount: number;
  description: number;
  category?: number;
  type?: number;
}

export class CSVParserService {
  private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly REQUIRED_COLUMNS = ['date', 'amount', 'description'];
  private static readonly OPTIONAL_COLUMNS = ['category'];

  /**
   * Parse CSV file buffer into transaction data
   */
  async parseCSV(
    fileBuffer: Buffer,
    filename: string,
    options: CSVParseOptions = {}
  ): Promise<CSVParseResult> {
    const {
      skipHeader = true,
      delimiter = ',',
      encoding = 'utf8',
      maxFileSize = CSVParserService.DEFAULT_MAX_FILE_SIZE
    } = options;

    // Check file size
    if (fileBuffer.length > maxFileSize) {
      throw new Error(`File size ${fileBuffer.length} bytes exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    const fileContent = fileBuffer.toString(encoding);
    const transactions: TransactionInput[] = [];
    const errors: ImportError[] = [];
    let totalRows = 0;
    let validRows = 0;
    let columnMapping: CSVColumnMapping | null = null;

    return new Promise((resolve, reject) => {
      const parser = parse({
        delimiter,
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });

      let isFirstRow = true;

      parser.on('data', (row: string[]) => {
        totalRows++;
        const rowNumber = totalRows;

        try {
          // Handle header row
          if (isFirstRow && skipHeader) {
            columnMapping = this.detectColumnMapping(row);
            if (!columnMapping) {
              errors.push({
                row: rowNumber,
                message: 'Unable to detect required columns. Expected columns: Date, Amount, Description',
                data: row
              });
              return;
            }
            isFirstRow = false;
            return;
          }

          // Skip if we don't have column mapping
          if (!columnMapping) {
            errors.push({
              row: rowNumber,
              message: 'No column mapping available. Check CSV header row.',
              data: row
            });
            return;
          }

          // Parse transaction from row
          const transaction = this.parseTransactionFromRow(row, columnMapping, rowNumber);
          if (transaction) {
            transactions.push(transaction);
            validRows++;
          }
        } catch (error: any) {
          errors.push({
            row: rowNumber,
            message: error.message,
            data: row
          });
        }

        isFirstRow = false;
      });

      parser.on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });

      parser.on('end', () => {
        resolve({
          transactions,
          errors,
          totalRows: skipHeader ? totalRows - 1 : totalRows, // Exclude header from count
          validRows
        });
      });

      // Start parsing
      parser.write(fileContent);
      parser.end();
    });
  }

  /**
   * Detect column mapping from header row
   */
  private detectColumnMapping(headerRow: string[]): CSVColumnMapping | null {
    const mapping: Partial<CSVColumnMapping> = {};
    const normalizedHeaders = headerRow.map(h => h.toLowerCase().trim());

    // Find date column
    const dateIndex = normalizedHeaders.findIndex(h =>
      h.includes('date') || h.includes('day') || h.includes('time')
    );
    if (dateIndex === -1) return null;
    mapping.date = dateIndex;

    // Find amount column
    const amountIndex = normalizedHeaders.findIndex(h =>
      h.includes('amount') || h.includes('value') || h.includes('sum') ||
      h.includes('total') || h.includes('price') || h.includes('cost')
    );
    if (amountIndex === -1) return null;
    mapping.amount = amountIndex;

    // Find description column
    const descriptionIndex = normalizedHeaders.findIndex(h =>
      h.includes('description') || h.includes('detail') || h.includes('merchant') ||
      h.includes('vendor') || h.includes('payee') || h.includes('memo') ||
      h.includes('note') || h.includes('reference')
    );
    if (descriptionIndex === -1) return null;
    mapping.description = descriptionIndex;

    // Find category column (optional) - prioritize 'category' over 'type'
    let categoryIndex = normalizedHeaders.findIndex(h => h.includes('category'));
    if (categoryIndex === -1) {
      categoryIndex = normalizedHeaders.findIndex(h =>
        h.includes('class') || h.includes('group') || h.includes('tag')
      );
    }
    if (categoryIndex !== -1) {
      mapping.category = categoryIndex;
    }

    // Find type column (optional) - separate from category
    const typeIndex = normalizedHeaders.findIndex(h => h.includes('type'));
    if (typeIndex !== -1) {
      mapping.type = typeIndex;
    }

    return mapping as CSVColumnMapping;
  }

  /**
   * Parse a single transaction from a CSV row
   */
  private parseTransactionFromRow(
    row: string[],
    mapping: CSVColumnMapping,
    rowNumber: number
  ): TransactionInput | null {
    const errors: string[] = [];

    // Extract values
    const dateStr = row[mapping.date]?.trim();
    const amountStr = row[mapping.amount]?.trim();
    const description = row[mapping.description]?.trim();
    const category = mapping.category !== undefined ? row[mapping.category]?.trim() : undefined;
    const type = mapping.type !== undefined ? row[mapping.type]?.trim() : undefined;

    // Validate required fields
    if (!dateStr) {
      errors.push('Date is required');
    }

    if (!amountStr) {
      errors.push('Amount is required');
    }

    if (!description) {
      errors.push('Description is required');
    }

    if (errors.length > 0) {
      throw new Error(`Row ${rowNumber}: ${errors.join(', ')}`);
    }

    // Parse and validate date
    const date = this.parseDate(dateStr, rowNumber);

    // Parse and validate amount
    const amount = this.parseAmount(amountStr, type, rowNumber);

    // Validate description length
    if (description.length > 500) {
      throw new Error(`Row ${rowNumber}: Description too long (max 500 characters)`);
    }

    // Validate category length
    if (category && category.length > 100) {
      throw new Error(`Row ${rowNumber}: Category too long (max 100 characters)`);
    }

    return {
      date,
      amount,
      description,
      category: category || undefined
    };
  }

  /**
   * Parse date string to YYYY-MM-DD format
   */
  private parseDate(dateStr: string, rowNumber: number): string {
    // Try different date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      /^\d{2}\/\d{2}\/\d{2}$/, // MM/DD/YY
    ];

    let parsedDate: Date | null = null;

    // Try YYYY-MM-DD format first
    if (dateFormats[0].test(dateStr)) {
      parsedDate = new Date(dateStr);
    }
    // Try MM/DD/YYYY format
    else if (dateFormats[1].test(dateStr)) {
      const [month, day, year] = dateStr.split('/');
      parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    // Try MM-DD-YYYY format
    else if (dateFormats[2].test(dateStr)) {
      const [month, day, year] = dateStr.split('-');
      parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    // Try YYYY/MM/DD format
    else if (dateFormats[3].test(dateStr)) {
      const [year, month, day] = dateStr.split('/');
      parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    // Try MM/DD/YY format
    else if (dateFormats[4].test(dateStr)) {
      const [month, day, yearShort] = dateStr.split('/');
      const year = parseInt(yearShort) < 50 ? `20${yearShort}` : `19${yearShort}`;
      parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    }
    // Try general Date parsing as fallback
    else {
      parsedDate = new Date(dateStr);
    }

    // Validate parsed date
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      throw new Error(`Row ${rowNumber}: Invalid date format "${dateStr}". Expected formats: YYYY-MM-DD, MM/DD/YYYY, etc.`);
    }

    // Check if date is not in the future
    const today = new Date();
    if (parsedDate > today) {
      throw new Error(`Row ${rowNumber}: Date "${dateStr}" cannot be in the future`);
    }

    // Return in YYYY-MM-DD format
    return parsedDate.toISOString().split('T')[0];
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string, type: string | undefined, rowNumber: number): number {
    // Remove common currency symbols and whitespace
    let cleanAmount = amountStr.replace(/[$£€¥₹,\s]/g, '');

    // Handle parentheses as negative (accounting format)
    const isNegativeParens = cleanAmount.startsWith('(') && cleanAmount.endsWith(')');
    if (isNegativeParens) {
      cleanAmount = cleanAmount.slice(1, -1);
    }

    // Parse the number
    const amount = parseFloat(cleanAmount);

    if (isNaN(amount)) {
      throw new Error(`Row ${rowNumber}: Invalid amount format "${amountStr}"`);
    }

    if (amount === 0) {
      throw new Error(`Row ${rowNumber}: Amount cannot be zero`);
    }

    if (Math.abs(amount) > 999999.99) {
      throw new Error(`Row ${rowNumber}: Amount "${amount}" exceeds maximum allowed value`);
    }

    // Apply negative sign if it was in parentheses
    let finalAmount = isNegativeParens ? -Math.abs(amount) : amount;

    // Apply sign based on transaction type
    if (type) {
      const normalizedType = type.toLowerCase();
      if (normalizedType === 'credit') {
        // Credits are income (positive)
        finalAmount = Math.abs(finalAmount);
      } else if (normalizedType === 'debit') {
        // Debits are expenses (negative)
        finalAmount = -Math.abs(finalAmount);
      }
    }

    return finalAmount;
  }

  /**
   * Validate CSV file format before parsing
   */
  async validateCSVFormat(fileBuffer: Buffer, filename: string): Promise<{
    isValid: boolean;
    errors: string[];
    columnMapping?: CSVColumnMapping;
  }> {
    const errors: string[] = [];

    // Check file extension
    if (!filename.toLowerCase().endsWith('.csv')) {
      errors.push('File must have a .csv extension');
    }

    // Check file size
    if (fileBuffer.length === 0) {
      errors.push('File is empty');
      return { isValid: false, errors };
    }

    if (fileBuffer.length > CSVParserService.DEFAULT_MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${CSVParserService.DEFAULT_MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    try {
      // Try to read the first few lines to validate structure
      const fileContent = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
      const lines = fileContent.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        errors.push('File appears to be empty or contains no valid data');
        return { isValid: false, errors };
      }

      // Parse the header line
      const headerLine = lines[0];
      const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));

      if (headers.length < 3) {
        errors.push('CSV must contain at least 3 columns (Date, Amount, Description)');
      }

      // Try to detect column mapping
      const columnMapping = this.detectColumnMapping(headers);
      if (!columnMapping) {
        errors.push('Unable to detect required columns. Please ensure your CSV has columns for Date, Amount, and Description');
      }

      return {
        isValid: errors.length === 0,
        errors,
        columnMapping: columnMapping || undefined
      };
    } catch (error: any) {
      errors.push(`Failed to parse CSV structure: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Get sample data from CSV for preview
   */
  async getCSVPreview(fileBuffer: Buffer, maxRows: number = 5): Promise<{
    headers: string[];
    sampleRows: string[][];
    totalEstimatedRows: number;
  }> {
    const fileContent = fileBuffer.toString('utf8', 0, Math.min(2048, fileBuffer.length));
    const lines = fileContent.split('\n').filter(line => line.trim());

    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
    const sampleRows = lines.slice(1, maxRows + 1).map(line =>
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    // Estimate total rows
    const fullContent = fileBuffer.toString('utf8');
    const totalLines = fullContent.split('\n').filter(line => line.trim()).length;
    const totalEstimatedRows = Math.max(0, totalLines - 1); // Subtract header

    return {
      headers,
      sampleRows,
      totalEstimatedRows
    };
  }
}