import { TransactionService } from './transaction-service';
import { ImportService } from './import-service';

export interface StatsPeriod {
  period: string;
  income: number;
  expenses: number;
  count: number;
  netAmount: number;
}

export interface StatsCategory {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  avgAmount: number;
}

export interface StatsTotals {
  income: number;
  expenses: number;
  count: number;
  netAmount: number;
  avgIncomePerTransaction: number;
  avgExpensePerTransaction: number;
}

export interface ComprehensiveStats {
  totals: StatsTotals;
  byPeriod: StatsPeriod[];
  byCategory: StatsCategory[];
  trends: {
    monthOverMonth: number; // Percentage change
    incomeGrowth: number;
    expenseGrowth: number;
  };
  insights: {
    topExpenseCategory: string;
    avgDailySpending: number;
    avgMonthlyIncome: number;
    savingsRate: number; // Percentage
  };
  dateRange: {
    earliest: string | null;
    latest: string | null;
    totalDays: number;
  };
}

export class StatsService {
  private transactionService: TransactionService;
  private importService: ImportService;

  constructor() {
    this.transactionService = new TransactionService();
    this.importService = new ImportService();
  }

  /**
   * Get comprehensive statistics for a date range
   */
  async getComprehensiveStats(
    startDate?: string,
    endDate?: string,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<ComprehensiveStats> {
    try {
      // Get basic stats from transaction service
      const baseStats = await this.transactionService.getTransactionStats(startDate, endDate, groupBy);

      // Calculate enhanced totals
      const totals: StatsTotals = {
        income: baseStats.totals.income,
        expenses: baseStats.totals.expenses,
        count: baseStats.totals.count,
        netAmount: baseStats.totals.income - baseStats.totals.expenses,
        avgIncomePerTransaction: baseStats.totals.income / Math.max(1, this.countIncomeTransactions(baseStats.byPeriod)),
        avgExpensePerTransaction: baseStats.totals.expenses / Math.max(1, this.countExpenseTransactions(baseStats.byPeriod))
      };

      // Enhance period data
      const byPeriod: StatsPeriod[] = baseStats.byPeriod.map(period => ({
        ...period,
        netAmount: period.income - period.expenses
      }));

      // Enhance category data with percentages
      const totalCategoryAmount = baseStats.byCategory.reduce((sum, cat) => sum + cat.amount, 0);
      const byCategory: StatsCategory[] = baseStats.byCategory.map(category => ({
        ...category,
        percentage: totalCategoryAmount > 0 ? (category.amount / totalCategoryAmount) * 100 : 0,
        avgAmount: category.count > 0 ? category.amount / category.count : 0
      }));

      // Calculate trends
      const trends = await this.calculateTrends(byPeriod, startDate, endDate);

      // Generate insights
      const insights = this.generateInsights(totals, byCategory, byPeriod);

      // Get date range information
      const dateRange = await this.getDateRangeInfo(startDate, endDate);

      return {
        totals,
        byPeriod,
        byCategory,
        trends,
        insights,
        dateRange
      };
    } catch (error: any) {
      throw new Error(`Failed to get comprehensive stats: ${error.message}`);
    }
  }

  /**
   * Get quick dashboard stats
   */
  async getDashboardStats(days: number = 30): Promise<{
    currentPeriod: StatsTotals;
    previousPeriod: StatsTotals;
    changePercent: {
      income: number;
      expenses: number;
      netAmount: number;
    };
    topCategories: StatsCategory[];
    recentTrend: 'up' | 'down' | 'stable';
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const previousEndDate = new Date(startDate);
      const previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);

      // Get current period stats
      const currentStats = await this.transactionService.getTransactionStats(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Get previous period stats for comparison
      const previousStats = await this.transactionService.getTransactionStats(
        previousStartDate.toISOString().split('T')[0],
        previousEndDate.toISOString().split('T')[0]
      );

      const currentTotals: StatsTotals = {
        income: currentStats.totals.income,
        expenses: currentStats.totals.expenses,
        count: currentStats.totals.count,
        netAmount: currentStats.totals.income - currentStats.totals.expenses,
        avgIncomePerTransaction: 0,
        avgExpensePerTransaction: 0
      };

      const previousTotals: StatsTotals = {
        income: previousStats.totals.income,
        expenses: previousStats.totals.expenses,
        count: previousStats.totals.count,
        netAmount: previousStats.totals.income - previousStats.totals.expenses,
        avgIncomePerTransaction: 0,
        avgExpensePerTransaction: 0
      };

      // Calculate change percentages
      const changePercent = {
        income: this.calculatePercentChange(previousTotals.income, currentTotals.income),
        expenses: this.calculatePercentChange(previousTotals.expenses, currentTotals.expenses),
        netAmount: this.calculatePercentChange(previousTotals.netAmount, currentTotals.netAmount)
      };

      // Get top categories
      const totalCategoryAmount = currentStats.byCategory.reduce((sum, cat) => sum + cat.amount, 0);
      const topCategories: StatsCategory[] = currentStats.byCategory
        .slice(0, 5)
        .map(category => ({
          ...category,
          percentage: totalCategoryAmount > 0 ? (category.amount / totalCategoryAmount) * 100 : 0,
          avgAmount: category.count > 0 ? category.amount / category.count : 0
        }));

      // Determine trend
      const recentTrend = this.determineTrend(changePercent.netAmount);

      return {
        currentPeriod: currentTotals,
        previousPeriod: previousTotals,
        changePercent,
        topCategories,
        recentTrend
      };
    } catch (error: any) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get spending patterns analysis
   */
  async getSpendingPatterns(months: number = 6): Promise<{
    monthlyAverages: {
      income: number;
      expenses: number;
      netAmount: number;
    };
    categoryTrends: Array<{
      category: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      changePercent: number;
      monthlyAverage: number;
    }>;
    seasonalPatterns: {
      highestSpendingMonth: string;
      lowestSpendingMonth: string;
      volatility: number; // Standard deviation of monthly spending
    };
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const stats = await this.transactionService.getTransactionStats(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        'month'
      );

      // Calculate monthly averages
      const monthlyAverages = {
        income: stats.totals.income / months,
        expenses: stats.totals.expenses / months,
        netAmount: (stats.totals.income - stats.totals.expenses) / months
      };

      // Analyze category trends
      const categoryTrends = await this.analyzeCategoryTrends(stats.byCategory, months);

      // Find seasonal patterns
      const seasonalPatterns = this.analyzeSeasonalPatterns(stats.byPeriod);

      return {
        monthlyAverages,
        categoryTrends,
        seasonalPatterns
      };
    } catch (error: any) {
      throw new Error(`Failed to get spending patterns: ${error.message}`);
    }
  }

  /**
   * Get import statistics
   */
  async getImportStats(): Promise<{
    totalImports: number;
    successfulImports: number;
    failedImports: number;
    totalTransactionsImported: number;
    totalDuplicatesDetected: number;
    successRate: number;
    lastImportDate: string | null;
  }> {
    try {
      const importStats = await this.importService.getImportStats();
      const lastImportDate = await this.importService.getLastImportTimestamp();

      return {
        totalImports: importStats.totalSessions,
        successfulImports: importStats.completedSessions,
        failedImports: importStats.failedSessions,
        totalTransactionsImported: importStats.totalImported,
        totalDuplicatesDetected: importStats.totalDuplicates,
        successRate: importStats.successRate,
        lastImportDate
      };
    } catch (error: any) {
      throw new Error(`Failed to get import stats: ${error.message}`);
    }
  }

  /**
   * Calculate trends based on period data
   */
  private async calculateTrends(
    periods: StatsPeriod[],
    startDate?: string,
    endDate?: string
  ): Promise<{
    monthOverMonth: number;
    incomeGrowth: number;
    expenseGrowth: number;
  }> {
    if (periods.length < 2) {
      return { monthOverMonth: 0, incomeGrowth: 0, expenseGrowth: 0 };
    }

    // Get the last two periods for comparison
    const latest = periods[periods.length - 1];
    const previous = periods[periods.length - 2];

    const monthOverMonth = this.calculatePercentChange(previous.netAmount, latest.netAmount);
    const incomeGrowth = this.calculatePercentChange(previous.income, latest.income);
    const expenseGrowth = this.calculatePercentChange(previous.expenses, latest.expenses);

    return { monthOverMonth, incomeGrowth, expenseGrowth };
  }

  /**
   * Generate insights from the stats data
   */
  private generateInsights(
    totals: StatsTotals,
    categories: StatsCategory[],
    periods: StatsPeriod[]
  ): {
    topExpenseCategory: string;
    avgDailySpending: number;
    avgMonthlyIncome: number;
    savingsRate: number;
  } {
    const topExpenseCategory = categories.length > 0 ? categories[0].category : 'None';

    const totalDays = periods.length > 0 ? periods.length * 30 : 30; // Rough estimate
    const avgDailySpending = totals.expenses / totalDays;

    const avgMonthlyIncome = totals.income / Math.max(1, periods.length);

    const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income) * 100 : 0;

    return {
      topExpenseCategory,
      avgDailySpending,
      avgMonthlyIncome,
      savingsRate
    };
  }

  /**
   * Get date range information
   */
  private async getDateRangeInfo(startDate?: string, endDate?: string): Promise<{
    earliest: string | null;
    latest: string | null;
    totalDays: number;
  }> {
    try {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return {
          earliest: startDate,
          latest: endDate,
          totalDays
        };
      }

      const dateRange = await this.transactionService.getTransactionDateRange();
      let totalDays = 0;

      if (dateRange.earliest && dateRange.latest) {
        const start = new Date(dateRange.earliest);
        const end = new Date(dateRange.latest);
        totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        earliest: dateRange.earliest,
        latest: dateRange.latest,
        totalDays
      };
    } catch (error: any) {
      return { earliest: null, latest: null, totalDays: 0 };
    }
  }

  /**
   * Count income transactions from period data
   */
  private countIncomeTransactions(periods: any[]): number {
    return periods.reduce((total, period) => {
      // This is an approximation - in a real implementation,
      // you might want to track this more precisely
      return total + Math.ceil(period.income / 1000); // Rough estimate
    }, 0);
  }

  /**
   * Count expense transactions from period data
   */
  private countExpenseTransactions(periods: any[]): number {
    return periods.reduce((total, period) => {
      // This is an approximation - in a real implementation,
      // you might want to track this more precisely
      return total + Math.ceil(period.expenses / 100); // Rough estimate
    }, 0);
  }

  /**
   * Calculate percentage change between two values
   */
  private calculatePercentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }

  /**
   * Determine trend direction
   */
  private determineTrend(changePercent: number): 'up' | 'down' | 'stable' {
    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  }

  /**
   * Analyze category trends over time
   */
  private async analyzeCategoryTrends(
    categories: any[],
    months: number
  ): Promise<Array<{
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    monthlyAverage: number;
  }>> {
    // This is a simplified implementation
    // In a real system, you'd want to track category spending over time
    return categories.map(category => ({
      category: category.category,
      trend: 'stable' as const,
      changePercent: 0,
      monthlyAverage: category.amount / months
    }));
  }

  /**
   * Analyze seasonal spending patterns
   */
  private analyzeSeasonalPatterns(periods: StatsPeriod[]): {
    highestSpendingMonth: string;
    lowestSpendingMonth: string;
    volatility: number;
  } {
    if (periods.length === 0) {
      return {
        highestSpendingMonth: 'None',
        lowestSpendingMonth: 'None',
        volatility: 0
      };
    }

    let highest = periods[0];
    let lowest = periods[0];

    for (const period of periods) {
      if (period.expenses > highest.expenses) highest = period;
      if (period.expenses < lowest.expenses) lowest = period;
    }

    // Calculate volatility (standard deviation)
    const mean = periods.reduce((sum, p) => sum + p.expenses, 0) / periods.length;
    const variance = periods.reduce((sum, p) => sum + Math.pow(p.expenses - mean, 2), 0) / periods.length;
    const volatility = Math.sqrt(variance);

    return {
      highestSpendingMonth: highest.period,
      lowestSpendingMonth: lowest.period,
      volatility
    };
  }
}