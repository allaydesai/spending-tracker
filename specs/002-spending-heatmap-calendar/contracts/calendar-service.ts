/**
 * Calendar Service Contract
 * Defines the interface for calendar data operations
 */

export interface CalendarService {
  /**
   * Get daily spending data for a date range
   * @param startDate ISO date string (YYYY-MM-DD)
   * @param endDate ISO date string (YYYY-MM-DD)
   * @returns Promise resolving to daily spending data
   */
  getDailySpending(startDate: string, endDate: string): Promise<DailySpending[]>;

  /**
   * Get transactions for a specific day
   * @param date ISO date string (YYYY-MM-DD)
   * @returns Promise resolving to transactions for the day
   */
  getTransactionsForDay(date: string): Promise<Transaction[]>;

  /**
   * Calculate spending thresholds for color scaling
   * @param dailySpending Array of daily spending data
   * @returns Calculated thresholds for visualization
   */
  calculateThresholds(dailySpending: DailySpending[]): SpendingThresholds;

  /**
   * Generate calendar cells for a given period
   * @param period Calendar period configuration
   * @param dailySpending Daily spending data
   * @param config Heatmap configuration
   * @returns Array of calendar cells ready for rendering
   */
  generateCalendarCells(
    period: CalendarPeriod,
    dailySpending: DailySpending[],
    config: HeatmapConfig
  ): CalendarCell[];
}

// Type definitions from data-model.md
interface DailySpending {
  date: string;
  amount: number;
  transactionCount: number;
  categories: Record<string, number>;
}

interface CalendarPeriod {
  startDate: string;
  endDate: string;
  viewType: 'month' | 'year' | 'all';
}

interface HeatmapConfig {
  colorScale: {
    min: string;
    mid: string;
    max: string;
    empty: string;
  };
  thresholds: {
    low: number;
    high: number;
  };
}

interface CalendarCell {
  date: string;
  spending: DailySpending | null;
  intensity: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

interface SpendingThresholds {
  min: number;
  max: number;
  median: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
}