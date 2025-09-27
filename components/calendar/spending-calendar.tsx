'use client';

import * as React from 'react';
import { CalendarService } from '@/lib/services/calendar-service';
import { CalendarCell } from './calendar-cell';
import { CalendarHeader } from './calendar-header';
import { cn } from '@/lib/utils';
import { CalendarPeriod } from '@/lib/types/calendar-period';
import { HeatmapConfig, defaultHeatmapConfig } from '@/lib/types/heatmap-config';
import { DailySpending, CalendarMetrics } from '@/lib/types/calendar-cell';
import { Transaction } from '@/lib/data-processor';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface SpendingCalendarProps {
  transactions: Transaction[];
  period?: CalendarPeriod;
  config?: Partial<HeatmapConfig>;
  onDayClick?: (date: string, spending: DailySpending | null) => void;
  onPeriodChange?: (period: CalendarPeriod) => void;
  loading?: boolean;
  className?: string;
}

export interface SpendingCalendarRef {
  navigateTo(date: string): void;
  getCurrentPeriod(): CalendarPeriod;
  refresh(): void;
}

const getTransactionBasedPeriod = (transactions: Transaction[]): CalendarPeriod => {
  // If no transactions, default to current month
  if (transactions.length === 0) {
    const now = new Date();
    const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(now), 'yyyy-MM-dd');
    return { startDate, endDate, viewType: 'month' };
  }

  // Find the most recent month with transactions
  const sortedDates = transactions
    .map(t => {
      // Ensure local timezone interpretation by adding time component
      const dateStr = typeof t.date === 'string' ? t.date : format(t.date, 'yyyy-MM-dd');
      return new Date(dateStr + 'T12:00:00');
    })
    .sort((a, b) => b.getTime() - a.getTime()); // Sort descending (most recent first)

  const mostRecentDate = sortedDates[0];
  const startDate = format(startOfMonth(mostRecentDate), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(mostRecentDate), 'yyyy-MM-dd');

  return { startDate, endDate, viewType: 'month' };
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const SpendingCalendar = React.forwardRef<SpendingCalendarRef, SpendingCalendarProps>(
  ({ transactions, period, config, onDayClick, onPeriodChange, loading = false, className }, ref) => {
    const [currentPeriod, setCurrentPeriod] = React.useState<CalendarPeriod>(
      period || getTransactionBasedPeriod(transactions)
    );

    const [calendarService] = React.useState(() => new CalendarService(transactions));
    const [dailySpending, setDailySpending] = React.useState<DailySpending[]>([]);
    const [calendarCells, setCalendarCells] = React.useState<any[]>([]);
    const [metrics, setMetrics] = React.useState<CalendarMetrics | undefined>();
    const [isLoading, setIsLoading] = React.useState(false);
  const [focusedCellIndex, setFocusedCellIndex] = React.useState<number>(-1);

    const fullConfig: HeatmapConfig = React.useMemo(() => ({
      ...defaultHeatmapConfig,
      ...config
    }), [config]);

    // Update service transactions when prop changes
    React.useEffect(() => {
      calendarService.updateTransactions(transactions);

      // Update period to transaction-based period if no explicit period is set
      if (!period && transactions.length > 0) {
        const newPeriod = getTransactionBasedPeriod(transactions);
        setCurrentPeriod(newPeriod);
      }
    }, [transactions, calendarService, period]);

    // Update period when prop changes
    React.useEffect(() => {
      if (period) {
        setCurrentPeriod(period);
      }
    }, [period]);

    // Fetch data when period or transactions change
    React.useEffect(() => {
      const fetchData = async () => {
        if (loading) return;

        setIsLoading(true);
        try {
          const spending = await calendarService.getDailySpending(
            currentPeriod.startDate,
            currentPeriod.endDate
          );
          setDailySpending(spending);

          const cells = calendarService.generateCalendarCells(currentPeriod, spending, fullConfig);
          setCalendarCells(cells);

          // Calculate metrics
          const thresholds = calendarService.calculateThresholds(spending);
          const totalSpending = spending.reduce((sum, ds) => sum + ds.amount, 0);
          const daysWithSpending = spending.filter(ds => ds.amount > 0).length;
          const totalDays = spending.length;
          const averageDailySpending = totalDays > 0 ? totalSpending / totalDays : 0;
          const highestSpendingDay = spending.reduce((max, ds) =>
            ds.amount > (max?.amount || 0) ? ds : max, null as DailySpending | null
          );

          setMetrics({
            totalSpending,
            averageDailySpending,
            daysWithSpending,
            totalDays,
            highestSpendingDay,
            spendingDistribution: thresholds
          });
        } catch (error) {
          console.error('Error fetching calendar data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [currentPeriod, transactions, calendarService, fullConfig, loading]);

    const handlePeriodChange = (newPeriod: CalendarPeriod) => {
      setCurrentPeriod(newPeriod);
      onPeriodChange?.(newPeriod);
    };

    const handleDayClick = (date: string, spending: DailySpending | null) => {
      onDayClick?.(date, spending);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (calendarCells.length === 0) return;

      const currentIndex = focusedCellIndex >= 0 ? focusedCellIndex : Math.floor(calendarCells.length / 2);
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          newIndex = Math.min(calendarCells.length - 1, currentIndex + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          newIndex = Math.max(0, currentIndex - 7);
          break;
        case 'ArrowDown':
          event.preventDefault();
          newIndex = Math.min(calendarCells.length - 1, currentIndex + 7);
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = calendarCells.length - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < calendarCells.length) {
            const cell = calendarCells[currentIndex];
            handleDayClick(cell.date, cell.spending);
          }
          break;
        default:
          return;
      }

      setFocusedCellIndex(newIndex);
    };

    // Imperative API for ref
    React.useImperativeHandle(ref, () => ({
      navigateTo: (date: string) => {
        const targetDate = new Date(date);
        const newPeriod: CalendarPeriod = {
          startDate: format(startOfMonth(targetDate), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(targetDate), 'yyyy-MM-dd'),
          viewType: 'month'
        };
        setCurrentPeriod(newPeriod);
        onPeriodChange?.(newPeriod);
      },
      getCurrentPeriod: () => currentPeriod,
      refresh: () => {
        // Trigger a re-fetch by updating the period to itself
        setCurrentPeriod(prev => ({ ...prev }));
      }
    }), [currentPeriod, onPeriodChange]);

    const showLoading = loading || isLoading;

    return (
      <div className={cn('space-y-4', className)}>
        <CalendarHeader
          period={currentPeriod}
          onPeriodChange={handlePeriodChange}
          metrics={metrics}
          config={fullConfig}
        />

        <div className="space-y-2">
          {/* Day headers */}
          <div
            role="row"
            className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-600"
          >
            {DAY_NAMES.map((day) => (
              <div key={day} role="columnheader" className="py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            role="grid"
            aria-label="Spending calendar for selected period"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (focusedCellIndex === -1 && calendarCells.length > 0) {
                // Find today's cell or fallback to middle cell
                const todayIndex = calendarCells.findIndex(cell => cell.isToday);
                setFocusedCellIndex(todayIndex >= 0 ? todayIndex : Math.floor(calendarCells.length / 2));
              }
            }}
            className={cn(
              'grid grid-cols-7 gap-1 focus:outline-none overflow-x-auto',
              showLoading && 'loading skeleton opacity-50'
            )}
          >
            {calendarCells.map((cell, index) => (
              <CalendarCell
                key={cell.date}
                cell={cell}
                config={fullConfig}
                onClick={onDayClick ? handleDayClick : undefined}
                allowHover={!showLoading}
                size="md"
                isFocused={index === focusedCellIndex}
              />
            ))}

            {/* Show empty cells when loading */}
            {showLoading && calendarCells.length === 0 && (
              Array.from({ length: 42 }).map((_, i) => (
                <div
                  key={i}
                  role="gridcell"
                  className="min-h-11 min-w-11 border border-gray-200 bg-gray-100 animate-pulse"
                />
              ))
            )}
          </div>
        </div>

        {/* Error state */}
        {!showLoading && calendarCells.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No calendar data available for this period.
          </div>
        )}
      </div>
    );
  }
);

SpendingCalendar.displayName = 'SpendingCalendar';