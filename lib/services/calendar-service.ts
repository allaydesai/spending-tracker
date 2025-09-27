import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameMonth } from 'date-fns';
import { DailySpending } from '@/lib/types/daily-spending';
import { CalendarPeriod } from '@/lib/types/calendar-period';
import { HeatmapConfig } from '@/lib/types/heatmap-config';
import { CalendarCell, SpendingThresholds } from '@/lib/types/calendar-cell';
import { Transaction } from '@/lib/data-processor';

export interface CalendarService {
  getDailySpending(startDate: string, endDate: string): Promise<DailySpending[]>;
  getTransactionsForDay(date: string): Promise<Transaction[]>;
  calculateThresholds(dailySpending: DailySpending[]): SpendingThresholds;
  generateCalendarCells(period: CalendarPeriod, dailySpending: DailySpending[], config: HeatmapConfig): CalendarCell[];
}

export class CalendarService implements CalendarService {
  private transactions: Transaction[];

  constructor(transactions: Transaction[] = []) {
    this.transactions = transactions;
  }

  updateTransactions(transactions: Transaction[]) {
    this.transactions = transactions;
  }

  async getDailySpending(startDate: string, endDate: string): Promise<DailySpending[]> {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    if (start > end) {
      throw new Error('Start date must be before or equal to end date.');
    }

    const dailySpendingMap = new Map<string, DailySpending>();

    // Process transactions within date range
    this.transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate >= start && transactionDate <= end) {
        // Treat spending consistently across data sources:
        // - Some sources store expenses as positive (debit), others as negative (single amount column)
        // - Always aggregate absolute expense amount, but exclude clear income/transfer rows
        const isIncomeCategory = (transaction.category || '').toLowerCase() === 'income';
        const isTransfer = Boolean((transaction as any).isTransfer);
        if (!isIncomeCategory && !isTransfer && transaction.amount !== 0) {
          const expenseAmount = transaction.amount > 0 ? transaction.amount : Math.abs(transaction.amount);
          const dateKey = format(transactionDate, 'yyyy-MM-dd');

          if (!dailySpendingMap.has(dateKey)) {
            dailySpendingMap.set(dateKey, {
              date: dateKey,
              amount: 0,
              transactionCount: 0,
              categories: {}
            });
          }

          const dailySpending = dailySpendingMap.get(dateKey)!;
          dailySpending.amount += expenseAmount;
          dailySpending.transactionCount += 1;

          if (!dailySpending.categories[transaction.category]) {
            dailySpending.categories[transaction.category] = 0;
          }
          dailySpending.categories[transaction.category] += expenseAmount;
        }
      }
    });

    return Array.from(dailySpendingMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTransactionsForDay(date: string): Promise<Transaction[]> {
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format.');
    }

    return this.transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return format(transactionDate, 'yyyy-MM-dd') === date;
    });
  }

  calculateThresholds(dailySpending: DailySpending[]): SpendingThresholds {
    if (dailySpending.length === 0) {
      return {
        min: 0,
        max: 0,
        median: 0,
        percentiles: { p25: 0, p50: 0, p75: 0, p90: 0 }
      };
    }

    const amounts = dailySpending.map(ds => ds.amount).sort((a, b) => a - b);

    const getPercentile = (arr: number[], percentile: number): number => {
      const index = (percentile / 100) * (arr.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);

      if (lower === upper) {
        return arr[lower];
      }

      const weight = index - lower;
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };

    return {
      min: amounts[0],
      max: amounts[amounts.length - 1],
      median: getPercentile(amounts, 50),
      percentiles: {
        p25: getPercentile(amounts, 25),
        p50: getPercentile(amounts, 50),
        p75: getPercentile(amounts, 75),
        p90: getPercentile(amounts, 90)
      }
    };
  }

  generateCalendarCells(period: CalendarPeriod, dailySpending: DailySpending[], config: HeatmapConfig): CalendarCell[] {
    // Parse dates with explicit local time to avoid timezone issues
    const startDate = new Date(period.startDate + 'T12:00:00');
    const endDate = new Date(period.endDate + 'T12:00:00');

    // For month view, show full calendar grid (start of first week to end of last week of the month)
    // For other views, just use the specified range
    const calendarStart = period.viewType === 'month'
      ? startOfWeek(startOfMonth(startDate), { weekStartsOn: 0 })
      : startDate;
    const calendarEnd = period.viewType === 'month'
      ? endOfWeek(endOfMonth(startDate), { weekStartsOn: 0 }) // Use startDate for month, not endDate
      : endDate;

    const allDates = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Create spending lookup map
    const spendingMap = new Map<string, DailySpending>();
    dailySpending.forEach(ds => spendingMap.set(ds.date, ds));

    // Calculate thresholds for intensity scaling
    const thresholds = this.calculateThresholds(dailySpending);

    return allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const spending = spendingMap.get(dateStr) || null;

      // Calculate intensity (0-1 scale) based on config thresholds
      let intensity = 0;
      if (spending && spending.amount > 0) {
        if (spending.amount <= config.thresholds.low) {
          // Scale from 0 to 0.5 for amounts up to low threshold
          intensity = (spending.amount / config.thresholds.low) * 0.5;
        } else if (spending.amount <= config.thresholds.high) {
          // Scale from 0.5 to 1.0 for amounts between low and high thresholds
          const range = config.thresholds.high - config.thresholds.low;
          const position = (spending.amount - config.thresholds.low) / range;
          intensity = 0.5 + (position * 0.5);
        } else {
          // Cap at 1.0 for amounts above high threshold
          intensity = 1.0;
        }
      }

      return {
        date: dateStr,
        spending,
        intensity,
        isCurrentMonth: period.viewType === 'month' ? isSameMonth(date, startDate) : true,
        isToday: isToday(date)
      };
    });
  }

  // Method to update transactions (useful for testing and dynamic data)
  updateTransactions(transactions: Transaction[]) {
    this.transactions = transactions;
  }
}

// Export types for convenience
export type {
  DailySpending,
  CalendarPeriod,
  HeatmapConfig,
  CalendarCell,
  SpendingThresholds,
  Transaction
};