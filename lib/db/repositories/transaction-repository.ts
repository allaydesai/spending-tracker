import { getDatabase } from '../connection';
import { Transaction, TransactionInput } from '@/lib/types/transaction';
import { DATABASE_CONFIG } from '../config';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
}

export interface TransactionSort {
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface TransactionQueryOptions extends TransactionFilters, TransactionSort, PaginationOptions {}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class TransactionRepository {
  private db = getDatabase();

  constructor() {
    // Ensure the database is connected
    this.db = getDatabase();
  }

  /**
   * Create a new transaction
   */
  async create(input: TransactionInput): Promise<Transaction> {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (date, amount, description, category)
      VALUES (?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(input.date, input.amount, input.description, input.category || null);
      return this.findById(result.lastInsertRowid as number);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(`Duplicate transaction: ${input.date}, ${input.amount}, ${input.description}`);
      }
      throw error;
    }
  }

  /**
   * Bulk insert transactions with duplicate detection
   */
  async createMany(inputs: TransactionInput[]): Promise<{
    created: Transaction[];
    duplicates: Array<{ input: TransactionInput; existingId: number }>;
  }> {
    const created: Transaction[] = [];
    const duplicates: Array<{ input: TransactionInput; existingId: number }> = [];

    const insertStmt = this.db.prepare(`
      INSERT INTO transactions (date, amount, description, category)
      VALUES (?, ?, ?, ?)
    `);

    const findDuplicateStmt = this.db.prepare(`
      SELECT id FROM transactions
      WHERE date = ? AND amount = ? AND description = ?
    `);

    // Use a transaction for atomicity
    const transaction = this.db.transaction(() => {
      for (const input of inputs) {
        try {
          const result = insertStmt.run(
            input.date,
            input.amount,
            input.description,
            input.category || null
          );

          const newTransaction = this.findByIdSync(result.lastInsertRowid as number);
          created.push(newTransaction);
        } catch (error: any) {
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            // Find the existing transaction ID
            const existing = findDuplicateStmt.get(input.date, input.amount, input.description) as { id: number } | undefined;
            if (existing) {
              duplicates.push({ input, existingId: existing.id });
            }
          } else {
            throw error;
          }
        }
      }
    });

    transaction();

    return { created, duplicates };
  }

  /**
   * Find transaction by ID
   */
  async findById(id: number): Promise<Transaction> {
    const transaction = this.findByIdSync(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  /**
   * Synchronous version of findById (for internal use)
   */
  private findByIdSync(id: number): Transaction {
    const stmt = this.db.prepare(`
      SELECT id, date, amount, description, category, created_at as createdAt
      FROM transactions
      WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (!result) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    return result;
  }

  /**
   * Find transactions with filtering, sorting, and pagination
   */
  async findMany(options: TransactionQueryOptions = {}): Promise<PaginatedResult<Transaction>> {
    const {
      startDate,
      endDate,
      category,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = DATABASE_CONFIG.DEFAULT_PAGE_SIZE
    } = options;

    // Validate pagination parameters
    if (page < 1) throw new Error('Page must be 1 or greater');
    if (limit < 1 || limit > DATABASE_CONFIG.MAX_PAGE_SIZE) {
      throw new Error(`Limit must be between 1 and ${DATABASE_CONFIG.MAX_PAGE_SIZE}`);
    }

    // Build WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      whereConditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('date <= ?');
      params.push(endDate);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort parameters
    const validSortColumns = ['date', 'amount', 'category'];
    if (!validSortColumns.includes(sortBy)) {
      throw new Error(`Invalid sortBy field: ${sortBy}`);
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      throw new Error(`Invalid sortOrder: ${sortOrder}`);
    }

    // Get total count
    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      ${whereClause}
    `);

    const countResult = countStmt.get(...params) as { count: number };
    const total = countResult.count;

    // Get paginated data
    const offset = (page - 1) * limit;
    const dataStmt = this.db.prepare(`
      SELECT id, date, amount, description, category, created_at as createdAt
      FROM transactions
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `);

    const data = dataStmt.all(...params, limit, offset) as Transaction[];

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Delete transaction by ID
   */
  async deleteById(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get transaction statistics
   */
  async getStats(startDate?: string, endDate?: string): Promise<{
    totalCount: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
  }> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      whereConditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalCount,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as totalExpenses,
        COALESCE(SUM(amount), 0) as netAmount
      FROM transactions
      ${whereClause}
    `);

    return stmt.get(...params) as any;
  }

  /**
   * Get transactions grouped by period
   */
  async getByPeriod(
    groupBy: 'day' | 'week' | 'month' = 'month',
    startDate?: string,
    endDate?: string
  ): Promise<Array<{
    period: string;
    income: number;
    expenses: number;
    count: number;
  }>> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      whereConditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    let dateFormat: string;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%W';
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        break;
    }

    const stmt = this.db.prepare(`
      SELECT
        strftime('${dateFormat}', date) as period,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as expenses,
        COUNT(*) as count
      FROM transactions
      ${whereClause}
      GROUP BY strftime('${dateFormat}', date)
      ORDER BY period
    `);

    return stmt.all(...params) as any[];
  }

  /**
   * Get transactions grouped by category
   */
  async getByCategory(startDate?: string, endDate?: string): Promise<Array<{
    category: string;
    amount: number;
    count: number;
  }>> {
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      whereConditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const stmt = this.db.prepare(`
      SELECT
        COALESCE(category, 'Uncategorized') as category,
        COALESCE(SUM(ABS(amount)), 0) as amount,
        COUNT(*) as count
      FROM transactions
      ${whereClause}
      GROUP BY category
      ORDER BY amount DESC
    `);

    return stmt.all(...params) as any[];
  }

  /**
   * Check if a transaction exists (for duplicate detection)
   */
  async exists(date: string, amount: number, description: string): Promise<number | null> {
    const stmt = this.db.prepare(`
      SELECT id FROM transactions
      WHERE date = ? AND amount = ? AND description = ?
    `);

    const result = stmt.get(date, amount, description) as { id: number } | undefined;
    return result ? result.id : null;
  }

  /**
   * Get total count of transactions
   */
  async count(filters: TransactionFilters = {}): Promise<number> {
    const { startDate, endDate, category } = filters;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (startDate) {
      whereConditions.push('date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('date <= ?');
      params.push(endDate);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM transactions
      ${whereClause}
    `);

    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}