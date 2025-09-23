/**
 * Data Processor Service Contract
 *
 * Defines the interface for processing transaction data
 * and calculating KPIs and category summaries.
 */

export interface DataProcessorService {
  /**
   * Calculate KPIs from transaction data
   * @param transactions - Array of transactions
   * @returns Calculated KPI metrics
   */
  calculateKPIs(transactions: Transaction[]): KPI;

  /**
   * Generate category summary data for charts
   * @param transactions - Array of transactions
   * @returns Category summaries for visualization
   */
  generateCategorySummary(transactions: Transaction[]): CategorySummary[];

  /**
   * Apply filters to transaction data
   * @param transactions - Source transactions
   * @param filter - Filter criteria
   * @returns Filtered transactions
   */
  applyFilters(transactions: Transaction[], filter: Filter): Transaction[];

  /**
   * Sort transactions by specified field and direction
   * @param transactions - Transactions to sort
   * @param sortConfig - Sort configuration
   * @returns Sorted transactions
   */
  sortTransactions(transactions: Transaction[], sortConfig: SortConfig): Transaction[];

  /**
   * Remove duplicate transactions
   * @param transactions - Transactions to deduplicate
   * @returns Unique transactions
   */
  removeDuplicates(transactions: Transaction[]): Transaction[];

  /**
   * Validate that all transactions are within the same month
   * @param transactions - Transactions to validate
   * @returns true if all in same month
   * @throws ValidationError if multiple months found
   */
  validateSingleMonth(transactions: Transaction[]): boolean;
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

export interface CategorySummary {
  category: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  isIncome: boolean;
}

export interface Filter {
  categories: string[];
  merchants: string[];
  amountMin?: number;
  amountMax?: number;
  searchText: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SortConfig {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

/**
 * Business rules for data processing:
 * 1. Transfer transactions (isTransfer=true) are excluded from KPI calculations
 * 2. Spending = sum of negative amounts (excluding transfers)
 * 3. Income = sum of positive amounts (excluding transfers)
 * 4. Net = Income + Spending (spending is negative)
 * 5. Category percentages based on total spending or income respectively
 * 6. Duplicates identified by: date + amount + merchant + description
 * 7. All transactions must be within same calendar month
 * 8. CAD currency format assumed
 */

/**
 * Contract tests must verify:
 * 1. KPI calculations exclude transfer transactions
 * 2. KPI totals reconcile with transaction sums
 * 3. Category summaries separate income/expense correctly
 * 4. Category percentages sum to 100% (within tolerance)
 * 5. Filters work independently and in combination
 * 6. Text search is case-insensitive
 * 7. Amount range filters work with negative values
 * 8. Sorting works for all transaction fields
 * 9. Duplicate removal works correctly
 * 10. Single month validation catches multi-month data
 * 11. Performance is acceptable for 10k+ transactions
 */