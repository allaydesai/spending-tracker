/**
 * Export Service Contract
 *
 * Defines the interface for exporting filtered transaction data
 * to CSV and PDF formats.
 */

export interface ExportService {
  /**
   * Export transactions to CSV format
   * @param transactions - Transactions to export
   * @param filename - Optional filename (defaults to generated name)
   * @returns Promise resolving when download starts
   */
  exportToCSV(transactions: Transaction[], filename?: string): Promise<void>;

  /**
   * Export transactions to PDF format
   * @param transactions - Transactions to export
   * @param kpi - KPI data for summary
   * @param filename - Optional filename (defaults to generated name)
   * @returns Promise resolving when download starts
   */
  exportToPDF(
    transactions: Transaction[],
    kpi: KPI,
    filename?: string
  ): Promise<void>;

  /**
   * Generate filename based on data and current date
   * @param transactions - Transactions for period extraction
   * @param format - File format extension
   * @returns Generated filename
   */
  generateFilename(transactions: Transaction[], format: 'csv' | 'pdf'): string;

  /**
   * Validate that data can be exported
   * @param transactions - Transactions to validate
   * @returns true if data is exportable
   */
  validateExportData(transactions: Transaction[]): boolean;
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

export interface KPI {
  totalSpending: number;
  totalIncome: number;
  netAmount: number;
  transactionCount: number;
  period: string;
}

/**
 * CSV Export Format:
 * - UTF-8 encoding
 * - Comma-separated values
 * - Header row with column names
 * - Date format: YYYY-MM-DD
 * - Amount format: decimal with 2 places
 * - Boolean format: true/false
 */
export interface CSVExportFormat {
  encoding: 'utf-8';
  delimiter: ',';
  headers: string[];
  dateFormat: 'YYYY-MM-DD';
  amountPrecision: 2;
  booleanFormat: 'true' | 'false';
}

/**
 * PDF Export Format:
 * - Single page layout
 * - Summary section with KPIs
 * - Transaction table with pagination
 * - Header with export date and period
 * - Footer with page numbers
 */
export interface PDFExportFormat {
  pageSize: 'A4';
  orientation: 'portrait';
  sections: {
    header: {
      title: string;
      exportDate: string;
      period: string;
    };
    summary: {
      kpis: KPI;
    };
    transactions: {
      table: Transaction[];
      pagination: boolean;
    };
    footer: {
      pageNumbers: boolean;
      generatedBy: string;
    };
  };
}

/**
 * Filename generation rules:
 * - CSV: "transactions-{period}-{date}.csv"
 * - PDF: "spending-report-{period}-{date}.pdf"
 * - Period format: "YYYY-MM"
 * - Date format: "YYYY-MM-DD"
 * - Example: "transactions-2025-09-2025-09-22.csv"
 */
export interface FilenameRules {
  csvPattern: 'transactions-{period}-{date}.csv';
  pdfPattern: 'spending-report-{period}-{date}.pdf';
  periodFormat: 'YYYY-MM';
  dateFormat: 'YYYY-MM-DD';
}

/**
 * Export validation rules:
 * 1. At least one transaction must be present
 * 2. All transactions must have valid data
 * 3. File size should not exceed browser limits
 * 4. Export should complete within 10 seconds
 */
export interface ExportValidation {
  minTransactions: 1;
  maxFileSize: number; // bytes
  maxProcessingTime: 10000; // milliseconds
}

/**
 * Contract tests must verify:
 * 1. CSV export produces valid CSV format
 * 2. CSV headers match transaction fields
 * 3. CSV data matches source transactions exactly
 * 4. PDF export produces valid PDF document
 * 5. PDF includes summary section with KPIs
 * 6. PDF transaction table matches filtered data
 * 7. Filename generation follows naming rules
 * 8. Export handles empty transaction list gracefully
 * 9. Export handles large datasets (1000+ transactions)
 * 10. Export triggers browser download correctly
 * 11. Export preserves data precision and formatting
 * 12. PDF layout is readable and well-formatted
 */