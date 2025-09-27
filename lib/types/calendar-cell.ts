import { z } from 'zod';
import { DailySpending, DailySpendingSchema } from './daily-spending';

// Re-export DailySpending for convenience
export { DailySpending } from './daily-spending';

export interface CalendarCell {
  date: string; // ISO date string
  spending: DailySpending | null;
  intensity: number; // 0-1 scale for color intensity
  isCurrentMonth: boolean; // For month view styling
  isToday: boolean; // Highlight today's cell
}

export const CalendarCellSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  spending: DailySpendingSchema.nullable(),
  intensity: z.number().min(0).max(1, 'Intensity must be between 0 and 1'),
  isCurrentMonth: z.boolean(),
  isToday: z.boolean()
});

export const validateCalendarCell = (data: unknown): CalendarCell => {
  return CalendarCellSchema.parse(data);
};

export interface SpendingThresholds {
  min: number; // Minimum spending amount in dataset
  max: number; // Maximum spending amount in dataset
  median: number; // Median spending for mid-range color
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}

export const SpendingThresholdsSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  median: z.number().min(0),
  percentiles: z.object({
    p25: z.number().min(0),
    p50: z.number().min(0),
    p75: z.number().min(0),
    p90: z.number().min(0)
  })
}).refine((data) => data.min <= data.max, {
  message: 'Min must be less than or equal to max',
  path: ['max']
});

export interface CalendarMetrics {
  totalSpending: number;
  averageDailySpending: number;
  daysWithSpending: number;
  totalDays: number;
  highestSpendingDay: DailySpending | null;
  spendingDistribution: SpendingThresholds;
}

export const CalendarMetricsSchema = z.object({
  totalSpending: z.number().min(0),
  averageDailySpending: z.number().min(0),
  daysWithSpending: z.number().int().min(0),
  totalDays: z.number().int().min(0),
  highestSpendingDay: DailySpendingSchema.nullable(),
  spendingDistribution: SpendingThresholdsSchema
});