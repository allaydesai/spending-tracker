import { z } from 'zod';

export interface CalendarPeriod {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  viewType: 'month' | 'year' | 'all';
}

export const CalendarPeriodSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  viewType: z.enum(['month', 'year', 'all'], {
    errorMap: () => ({ message: 'View type must be month, year, or all' })
  })
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return startDate <= endDate;
}, {
  message: 'Start date must be before or equal to end date',
  path: ['endDate']
}).refine((data) => {
  if (data.viewType !== 'all') {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const diffYears = endDate.getFullYear() - startDate.getFullYear();
    const diffMonths = diffYears * 12 + (endDate.getMonth() - startDate.getMonth());
    return diffMonths <= 60; // Max 5 years for performance
  }
  return true;
}, {
  message: 'Date range must not exceed 5 years for performance',
  path: ['endDate']
});

export const validateCalendarPeriod = (data: unknown): CalendarPeriod => {
  return CalendarPeriodSchema.parse(data);
};