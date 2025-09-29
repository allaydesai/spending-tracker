import { TransactionRepository, TransactionQueryOptions, PaginatedResult } from '@/lib/db/repositories/transaction-repository';
import { Transaction, TransactionInput, validateTransactionInput } from '@/lib/types/transaction';

export interface TransactionStats {
  totals: {
    income: number;
    expenses: number;
    count: number;
  };
  byPeriod: Array<{
    period: string;
    income: number;
    expenses: number;
    count: number;
  }>;
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export class TransactionService {
  private repository: TransactionRepository;

  constructor() {
    this.repository = new TransactionRepository();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(input: TransactionInput): Promise<Transaction> {
    try {
      // Validate input
      const validatedInput = validateTransactionInput(input);

      // Create transaction
      return await this.repository.create(validatedInput);
    } catch (error: any) {
      if (error.message.includes('Duplicate transaction')) {
        throw new Error(`Transaction already exists: ${input.date}, ${input.amount}, ${input.description}`);
      }
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Bulk create transactions with duplicate handling
   */
  async createTransactions(inputs: TransactionInput[]): Promise<{
    created: Transaction[];
    duplicates: Array<{ input: TransactionInput; existingId: number }>;
    errors: Array<{ input: TransactionInput; error: string }>;
  }> {
    const validInputs: TransactionInput[] = [];
    const errors: Array<{ input: TransactionInput; error: string }> = [];

    // Validate all inputs first
    for (const input of inputs) {
      try {
        const validatedInput = validateTransactionInput(input);
        validInputs.push(validatedInput);
      } catch (error: any) {
        errors.push({ input, error: error.message });
      }
    }

    try {
      const result = await this.repository.createMany(validInputs);
      return {
        created: result.created,
        duplicates: result.duplicates,
        errors
      };
    } catch (error: any) {
      throw new Error(`Failed to create transactions: ${error.message}`);
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: number): Promise<Transaction> {
    try {
      return await this.repository.findById(id);
    } catch (error: any) {
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  /**
   * Get transactions with filtering, sorting, and pagination
   */
  async getTransactions(options: TransactionQueryOptions = {}): Promise<PaginatedResult<Transaction>> {
    try {
      // Validate date formats if provided
      if (options.startDate && !this.isValidDate(options.startDate)) {
        throw new Error('Invalid start date format. Use YYYY-MM-DD');
      }

      if (options.endDate && !this.isValidDate(options.endDate)) {
        throw new Error('Invalid end date format. Use YYYY-MM-DD');
      }

      // Validate date range
      if (options.startDate && options.endDate && options.startDate > options.endDate) {
        throw new Error('Start date cannot be after end date');
      }

      return await this.repository.findMany(options);
    } catch (error: any) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Delete transaction by ID
   */
  async deleteTransaction(id: number): Promise<boolean> {
    try {
      const deleted = await this.repository.deleteById(id);
      if (!deleted) {
        throw new Error(`Transaction with ID ${id} not found`);
      }
      return true;
    } catch (error: any) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    startDate?: string,
    endDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<TransactionStats> {
    try {
      // Validate date formats if provided
      if (startDate && !this.isValidDate(startDate)) {
        throw new Error('Invalid start date format. Use YYYY-MM-DD');
      }

      if (endDate && !this.isValidDate(endDate)) {
        throw new Error('Invalid end date format. Use YYYY-MM-DD');
      }

      // Validate groupBy parameter
      const validGroupBy = ['day', 'week', 'month'];
      if (!validGroupBy.includes(groupBy)) {
        throw new Error(`Invalid groupBy parameter. Must be one of: ${validGroupBy.join(', ')}`);
      }

      // Get overall statistics
      const stats = await this.repository.getStats(startDate, endDate);

      // Get statistics by period
      const byPeriod = await this.repository.getByPeriod(groupBy, startDate, endDate);

      // Get statistics by category
      const byCategory = await this.repository.getByCategory(startDate, endDate);

      return {
        totals: {
          income: stats.totalIncome,
          expenses: stats.totalExpenses,
          count: stats.totalCount
        },
        byPeriod,
        byCategory
      };
    } catch (error: any) {
      throw new Error(`Failed to get transaction stats: ${error.message}`);
    }
  }

  /**
   * Get transaction count with optional filters
   */
  async getTransactionCount(filters: {
    startDate?: string;
    endDate?: string;
    category?: string;
  } = {}): Promise<number> {
    try {
      // Validate date formats if provided
      if (filters.startDate && !this.isValidDate(filters.startDate)) {
        throw new Error('Invalid start date format. Use YYYY-MM-DD');
      }

      if (filters.endDate && !this.isValidDate(filters.endDate)) {
        throw new Error('Invalid end date format. Use YYYY-MM-DD');
      }

      return await this.repository.count(filters);
    } catch (error: any) {
      throw new Error(`Failed to get transaction count: ${error.message}`);
    }
  }

  /**
   * Check if a transaction exists (for duplicate detection)
   */
  async checkTransactionExists(date: string, amount: number, description: string): Promise<number | null> {
    try {
      return await this.repository.exists(date, amount, description);
    } catch (error: any) {
      throw new Error(`Failed to check transaction existence: ${error.message}`);
    }
  }

  /**
   * Get transactions for a specific date range (helper method)
   */
  async getTransactionsInDateRange(
    startDate: string,
    endDate: string,
    options: Omit<TransactionQueryOptions, 'startDate' | 'endDate'> = {}
  ): Promise<PaginatedResult<Transaction>> {
    return this.getTransactions({
      ...options,
      startDate,
      endDate
    });
  }

  /**
   * Get transactions by category
   */
  async getTransactionsByCategory(
    category: string,
    options: Omit<TransactionQueryOptions, 'category'> = {}
  ): Promise<PaginatedResult<Transaction>> {
    return this.getTransactions({
      ...options,
      category
    });
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    const result = await this.getTransactions({
      sortBy: 'date',
      sortOrder: 'desc',
      limit
    });
    return result.data;
  }

  /**
   * Get income transactions
   */
  async getIncomeTransactions(options: TransactionQueryOptions = {}): Promise<PaginatedResult<Transaction>> {
    const result = await this.getTransactions(options);

    // Filter to only include positive amounts (income)
    const incomeTransactions = result.data.filter(t => t.amount > 0);

    return {
      data: incomeTransactions,
      pagination: {
        ...result.pagination,
        total: incomeTransactions.length
      }
    };
  }

  /**
   * Get expense transactions
   */
  async getExpenseTransactions(options: TransactionQueryOptions = {}): Promise<PaginatedResult<Transaction>> {
    const result = await this.getTransactions(options);

    // Filter to only include negative amounts (expenses)
    const expenseTransactions = result.data.filter(t => t.amount < 0);

    return {
      data: expenseTransactions,
      pagination: {
        ...result.pagination,
        total: expenseTransactions.length
      }
    };
  }

  /**
   * Get unique categories
   */
  async getUniqueCategories(): Promise<string[]> {
    try {
      const stats = await this.repository.getByCategory();
      return stats.map(s => s.category).filter(c => c !== 'Uncategorized');
    } catch (error: any) {
      throw new Error(`Failed to get unique categories: ${error.message}`);
    }
  }

  /**
   * Get date range of all transactions
   */
  async getTransactionDateRange(): Promise<{ earliest: string | null; latest: string | null }> {
    try {
      const stats = await this.repository.getStats();

      if (stats.totalCount === 0) {
        return { earliest: null, latest: null };
      }

      // Get first and last transaction dates
      const firstTransaction = await this.getTransactions({
        sortBy: 'date',
        sortOrder: 'asc',
        limit: 1
      });

      const lastTransaction = await this.getTransactions({
        sortBy: 'date',
        sortOrder: 'desc',
        limit: 1
      });

      return {
        earliest: firstTransaction.data[0]?.date || null,
        latest: lastTransaction.data[0]?.date || null
      };
    } catch (error: any) {
      throw new Error(`Failed to get transaction date range: ${error.message}`);
    }
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private isValidDate(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
  }
}