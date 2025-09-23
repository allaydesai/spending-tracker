import { Transaction, KPI, CategorySummary } from './models'
import { Filter, SortConfig } from './state'

export interface FileParserService {
  parseFile(file: File): Promise<Transaction[]>
  validateFileFormat(file: File): boolean
  getSupportedExtensions(): string[]
}

export interface DataProcessorService {
  calculateKPIs(transactions: Transaction[]): KPI
  generateCategorySummary(transactions: Transaction[]): CategorySummary[]
  applyFilters(transactions: Transaction[], filter: Filter): Transaction[]
  sortTransactions(transactions: Transaction[], sortConfig: SortConfig): Transaction[]
  removeDuplicates(transactions: Transaction[]): Transaction[]
  validateSingleMonth(transactions: Transaction[]): boolean
}

export interface ExportService {
  exportToCSV(transactions: Transaction[], filename?: string): Promise<void>
  exportToPDF(
    transactions: Transaction[],
    kpi: KPI,
    filename?: string
  ): Promise<void>
  generateFilename(transactions: Transaction[], format: 'csv' | 'pdf'): string
  validateExportData(transactions: Transaction[]): boolean
}

export interface StorageService {
  saveTransactions(transactions: Transaction[]): void
  loadTransactions(): Transaction[] | null
  saveFilters(filter: Filter): void
  loadFilters(): Filter | null
  clear(): void
}