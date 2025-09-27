/**
 * Calendar Component Contract
 * Defines the interface for the spending heatmap calendar component
 */

export interface SpendingCalendarProps {
  /**
   * Array of transactions to visualize
   * Required for calculating daily spending amounts
   */
  transactions: Transaction[];

  /**
   * Calendar display period
   * Defaults to current month if not specified
   */
  period?: CalendarPeriod;

  /**
   * Heatmap visual configuration
   * Uses default green-yellow-red scale if not specified
   */
  config?: Partial<HeatmapConfig>;

  /**
   * Callback when user clicks on a calendar day
   * @param date ISO date string of clicked day
   * @param spending Daily spending data for the day (null if no spending)
   */
  onDayClick?: (date: string, spending: DailySpending | null) => void;

  /**
   * Callback when calendar period changes
   * @param period New calendar period
   */
  onPeriodChange?: (period: CalendarPeriod) => void;

  /**
   * Loading state for data fetching
   * Shows skeleton calendar when true
   */
  loading?: boolean;

  /**
   * CSS class name for styling customization
   */
  className?: string;
}

export interface SpendingCalendarRef {
  /**
   * Navigate to a specific month/year
   * @param date ISO date string within target period
   */
  navigateTo(date: string): void;

  /**
   * Get current calendar period
   * @returns Current period configuration
   */
  getCurrentPeriod(): CalendarPeriod;

  /**
   * Refresh calendar data
   * Forces recalculation of daily spending and thresholds
   */
  refresh(): void;
}

export interface CalendarCellProps {
  /**
   * Calendar cell data
   */
  cell: CalendarCell;

  /**
   * Heatmap configuration for styling
   */
  config: HeatmapConfig;

  /**
   * Click handler for the cell
   */
  onClick?: (date: string, spending: DailySpending | null) => void;

  /**
   * Whether cell should show hover effects
   * Disabled on touch devices
   */
  allowHover?: boolean;

  /**
   * Size variant for responsive design
   */
  size?: 'sm' | 'md' | 'lg';
}

export interface CalendarHeaderProps {
  /**
   * Current calendar period
   */
  period: CalendarPeriod;

  /**
   * Period change handler
   */
  onPeriodChange: (period: CalendarPeriod) => void;

  /**
   * Summary metrics for the current period
   */
  metrics?: CalendarMetrics;

  /**
   * Show/hide the legend
   */
  showLegend?: boolean;

  /**
   * Heatmap config for legend colors
   */
  config: HeatmapConfig;
}

// Re-export types from data model for convenience
export type {
  DailySpending,
  CalendarPeriod,
  HeatmapConfig,
  CalendarCell,
  SpendingThresholds,
  CalendarMetrics,
  Transaction
} from './calendar-service';