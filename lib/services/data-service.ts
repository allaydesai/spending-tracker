interface Transaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  category?: string;
  createdAt: string;
}

interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TransactionStats {
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

interface StorageStatus {
  connected: boolean;
  transactionCount: number;
  databaseSize: number;
  lastImport: string | null;
  version: string;
}

export type DataSource = 'file' | 'database';

export class DataService {
  private dataSource: DataSource = 'file';

  setDataSource(source: DataSource) {
    this.dataSource = source;
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Get transactions based on current data source
   */
  async getTransactions(options: {
    startDate?: string;
    endDate?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'amount' | 'category';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedTransactions> {
    if (this.dataSource === 'database') {
      return this.getTransactionsFromDatabase(options);
    } else {
      return this.getTransactionsFromFile(options);
    }
  }

  /**
   * Get statistics based on current data source
   */
  async getStatistics(options: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  } = {}): Promise<TransactionStats> {
    if (this.dataSource === 'database') {
      return this.getStatisticsFromDatabase(options);
    } else {
      return this.getStatisticsFromFile(options);
    }
  }

  /**
   * Get storage status
   */
  async getStorageStatus(): Promise<StorageStatus> {
    if (this.dataSource === 'database') {
      return this.getDatabaseStatus();
    } else {
      return this.getFileStorageStatus();
    }
  }

  /**
   * Get all transactions (for file-based operations)
   */
  async getAllTransactions(): Promise<Transaction[]> {
    if (this.dataSource === 'database') {
      // Get all transactions from database (with pagination)
      const result = await this.getTransactionsFromDatabase({ limit: 1000 });
      return result.transactions;
    } else {
      const result = await this.getTransactionsFromFile({ limit: 1000 });
      return result.transactions;
    }
  }

  /**
   * Fetch transactions from database API
   */
  private async getTransactionsFromDatabase(options: {
    startDate?: string;
    endDate?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'amount' | 'category';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedTransactions> {
    try {
      const params = new URLSearchParams();

      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.category) params.append('category', options.category);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const response = await fetch(`/api/transactions?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        transactions: data.transactions || [],
        pagination: data.pagination || {
          page: 1,
          limit: 100,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      console.error('Error fetching transactions from database:', error);
      return {
        transactions: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Fetch statistics from database API
   */
  private async getStatisticsFromDatabase(options: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<TransactionStats> {
    try {
      const params = new URLSearchParams();

      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.groupBy) params.append('groupBy', options.groupBy);

      const response = await fetch(`/api/transactions/stats?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics from database:', error);
      return {
        totals: { income: 0, expenses: 0, count: 0 },
        byPeriod: [],
        byCategory: []
      };
    }
  }

  /**
   * Get database status
   */
  private async getDatabaseStatus(): Promise<StorageStatus> {
    try {
      const response = await fetch('/api/storage/status');

      if (!response.ok) {
        throw new Error(`Failed to fetch storage status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching storage status:', error);
      return {
        connected: false,
        transactionCount: 0,
        databaseSize: 0,
        lastImport: null,
        version: '0'
      };
    }
  }

  /**
   * Get transactions from localStorage (file-based)
   */
  private async getTransactionsFromFile(options: {
    startDate?: string;
    endDate?: string;
    category?: string;
    page?: number;
    limit?: number;
    sortBy?: 'date' | 'amount' | 'category';
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedTransactions> {
    try {
      const savedData = localStorage.getItem("spending-tracker-data");

      if (!savedData) {
        return {
          transactions: [],
          pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
        };
      }

      const parsed = JSON.parse(savedData);
      const rawTransactions = Array.isArray(parsed) ? parsed : parsed.transactions;

      if (!rawTransactions || !Array.isArray(rawTransactions)) {
        return {
          transactions: [],
          pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
        };
      }

      // Convert to API format
      let transactions: Transaction[] = rawTransactions.map((t: any, index: number) => ({
        id: index + 1,
        date: typeof t.date === 'string' ? t.date : new Date(t.date).toISOString().split('T')[0],
        amount: t.amount,
        description: t.description,
        category: t.category,
        createdAt: new Date().toISOString()
      }));

      // Apply filters
      if (options.startDate) {
        transactions = transactions.filter(t => t.date >= options.startDate!);
      }
      if (options.endDate) {
        transactions = transactions.filter(t => t.date <= options.endDate!);
      }
      if (options.category) {
        transactions = transactions.filter(t => t.category === options.category);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'date';
      const sortOrder = options.sortOrder || 'desc';

      transactions.sort((a, b) => {
        let aVal, bVal;

        switch (sortBy) {
          case 'amount':
            aVal = a.amount;
            bVal = b.amount;
            break;
          case 'category':
            aVal = a.category || '';
            bVal = b.category || '';
            break;
          default:
            aVal = a.date;
            bVal = b.date;
        }

        if (sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 100;
      const total = transactions.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedTransactions = transactions.slice(startIndex, startIndex + limit);

      return {
        transactions: paginatedTransactions,
        pagination: { page, limit, total, totalPages }
      };
    } catch (error) {
      console.error('Error reading transactions from file:', error);
      return {
        transactions: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Get statistics from localStorage (file-based)
   */
  private async getStatisticsFromFile(options: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<TransactionStats> {
    try {
      const allTransactions = await this.getTransactionsFromFile({ limit: 1000 });
      const transactions = allTransactions.transactions;

      // Calculate totals (updated for new sign convention)
      const income = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = Math.abs(transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));

      // Calculate by category
      const categoryMap = new Map<string, { amount: number; count: number }>();

      transactions.forEach(t => {
        const category = t.category || 'Uncategorized';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        categoryMap.set(category, {
          amount: existing.amount + Math.abs(t.amount),
          count: existing.count + 1
        });
      });

      const byCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          count: data.count
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate by period (simplified - just return monthly for now)
      const periodMap = new Map<string, { income: number; expenses: number; count: number }>();

      transactions.forEach(t => {
        const period = t.date.substring(0, 7); // YYYY-MM
        const existing = periodMap.get(period) || { income: 0, expenses: 0, count: 0 };

        if (t.amount > 0) {
          existing.income += t.amount;
        } else {
          existing.expenses += Math.abs(t.amount);
        }
        existing.count += 1;

        periodMap.set(period, existing);
      });

      const byPeriod = Array.from(periodMap.entries())
        .map(([period, data]) => ({
          period,
          income: data.income,
          expenses: data.expenses,
          count: data.count
        }))
        .sort((a, b) => a.period.localeCompare(b.period));

      return {
        totals: {
          income,
          expenses,
          count: transactions.length
        },
        byPeriod,
        byCategory
      };
    } catch (error) {
      console.error('Error calculating statistics from file:', error);
      return {
        totals: { income: 0, expenses: 0, count: 0 },
        byPeriod: [],
        byCategory: []
      };
    }
  }

  /**
   * Get file storage status
   */
  private async getFileStorageStatus(): Promise<StorageStatus> {
    try {
      const savedData = localStorage.getItem("spending-tracker-data");

      if (!savedData) {
        return {
          connected: true,
          transactionCount: 0,
          databaseSize: 0,
          lastImport: null,
          version: 'file-based'
        };
      }

      const parsed = JSON.parse(savedData);
      const rawTransactions = Array.isArray(parsed) ? parsed : parsed.transactions;
      const lastUpdated = parsed.lastUpdated;

      return {
        connected: true,
        transactionCount: rawTransactions?.length || 0,
        databaseSize: new Blob([savedData]).size,
        lastImport: lastUpdated || null,
        version: 'file-based'
      };
    } catch (error) {
      return {
        connected: false,
        transactionCount: 0,
        databaseSize: 0,
        lastImport: null,
        version: 'file-based'
      };
    }
  }
}

// Create a singleton instance
export const dataService = new DataService();