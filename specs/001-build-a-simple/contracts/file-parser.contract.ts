/**
 * File Parser Service Contract
 *
 * Defines the interface for parsing CSV and Excel files
 * containing transaction data.
 */

export interface FileParserService {
  /**
   * Parse a CSV or Excel file and return transactions
   * @param file - The uploaded file
   * @returns Promise resolving to parsed transactions
   * @throws ParseError if file format is invalid
   */
  parseFile(file: File): Promise<Transaction[]>;

  /**
   * Validate file format before parsing
   * @param file - The file to validate
   * @returns true if file can be parsed
   */
  validateFileFormat(file: File): boolean;

  /**
   * Get supported file extensions
   * @returns Array of supported extensions
   */
  getSupportedExtensions(): string[];
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  merchant: string;
  account?: string;
  isTransfer: boolean;
}

export interface ParseResult {
  transactions: Transaction[];
  errors: ParseError[];
  warnings: string[];
}

export interface ParseError {
  row: number;
  field: string;
  value: any;
  message: string;
}

/**
 * CSV format requirements:
 * - UTF-8 encoding
 * - Comma-separated values
 * - Header row with exact column names
 * - Required columns: date, amount, category, description, merchant
 * - Optional columns: account, is_transfer
 */
export interface CSVFormat {
  encoding: 'utf-8';
  delimiter: ',';
  headers: string[];
  requiredColumns: ['date', 'amount', 'category', 'description', 'merchant'];
  optionalColumns: ['account', 'is_transfer'];
}

/**
 * Excel format requirements:
 * - .xlsx format only
 * - Single sheet named "Transactions" (or first sheet if unnamed)
 * - Same column requirements as CSV
 */
export interface ExcelFormat {
  extension: '.xlsx';
  sheetName: 'Transactions' | 'first';
  columns: CSVFormat['requiredColumns'] & CSVFormat['optionalColumns'];
}

/**
 * Validation rules for transaction data
 */
export interface ValidationRules {
  date: {
    format: 'YYYY-MM-DD';
    singleMonth: true;
  };
  amount: {
    type: 'number';
    separator: '.';
    noThousandsSeparator: true;
  };
  category: {
    required: true;
    minLength: 1;
  };
  description: {
    required: true;
    minLength: 1;
  };
  merchant: {
    required: true;
    minLength: 1;
  };
  account: {
    optional: true;
  };
  isTransfer: {
    type: 'boolean';
    default: false;
  };
}

/**
 * Contract tests must verify:
 * 1. Valid CSV files are parsed correctly
 * 2. Valid Excel files are parsed correctly
 * 3. Invalid file formats throw appropriate errors
 * 4. Missing required columns throw errors
 * 5. Invalid data types throw errors
 * 6. Multiple months in data throw errors
 * 7. Duplicate transactions are removed
 * 8. Optional columns are handled correctly
 * 9. Transfer transactions are flagged properly
 * 10. Large files (10k+ transactions) are handled efficiently
 */