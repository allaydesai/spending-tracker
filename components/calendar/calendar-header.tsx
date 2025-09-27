'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarPeriod } from '@/lib/types/calendar-period';
import { CalendarMetrics } from '@/lib/types/calendar-cell';
import { HeatmapConfig } from '@/lib/types/heatmap-config';
import { addMonths, subMonths, addYears, subYears, format } from 'date-fns';

export interface CalendarHeaderProps {
  period: CalendarPeriod;
  onPeriodChange: (period: CalendarPeriod) => void;
  metrics?: CalendarMetrics;
  showLegend?: boolean;
  config: HeatmapConfig;
}

const ColorLegend: React.FC<{ config: HeatmapConfig }> = ({ config }) => {
  const legendColors = [
    { color: config.colorScale.empty, label: 'No spending' },
    { color: config.colorScale.min, label: 'Low' },
    { color: config.colorScale.mid, label: 'Medium' },
    { color: config.colorScale.max, label: 'High' }
  ];

  return (
    <div className="flex items-center gap-2" aria-label="Color legend for spending intensity">
      <span className="text-sm text-gray-600">Less</span>
      <div className="flex gap-1">
        {legendColors.map((item, index) => (
          <div
            key={index}
            data-testid={`legend-color-${index}`}
            className="w-3 h-3 border border-gray-300"
            style={{ backgroundColor: item.color }}
            title={item.label}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">More</span>
    </div>
  );
};

const MetricsDisplay: React.FC<{ metrics: CalendarMetrics }> = ({ metrics }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Total: </span>
        <span className="font-semibold">{formatCurrency(metrics.totalSpending)}</span>
      </div>
      <div>
        <span className="text-gray-600">Average: </span>
        <span className="font-semibold">{formatCurrency(metrics.averageDailySpending)}</span>
      </div>
      <div>
        <span className="text-gray-600">Days with spending: </span>
        <span className="font-semibold">{metrics.daysWithSpending} of {metrics.totalDays}</span>
      </div>
      {metrics.highestSpendingDay && (
        <div>
          <span className="text-gray-600">Highest: </span>
          <span className="font-semibold">
            {formatCurrency(metrics.highestSpendingDay.amount)}
          </span>
        </div>
      )}
    </div>
  );
};

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  period,
  onPeriodChange,
  metrics,
  showLegend = true,
  config
}) => {
  const navigatePrevious = () => {
    const currentDate = new Date(period.startDate + 'T12:00:00');

    if (period.viewType === 'month') {
      const prevMonth = subMonths(currentDate, 1);
      onPeriodChange({
        startDate: format(prevMonth, 'yyyy-MM-01'),
        endDate: format(new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0), 'yyyy-MM-dd'),
        viewType: 'month'
      });
    } else if (period.viewType === 'year') {
      const prevYear = subYears(currentDate, 1);
      onPeriodChange({
        startDate: format(prevYear, 'yyyy-01-01'),
        endDate: format(prevYear, 'yyyy-12-31'),
        viewType: 'year'
      });
    }
  };

  const navigateNext = () => {
    const currentDate = new Date(period.startDate + 'T12:00:00');

    if (period.viewType === 'month') {
      const nextMonth = addMonths(currentDate, 1);
      onPeriodChange({
        startDate: format(nextMonth, 'yyyy-MM-01'),
        endDate: format(new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0), 'yyyy-MM-dd'),
        viewType: 'month'
      });
    } else if (period.viewType === 'year') {
      const nextYear = addYears(currentDate, 1);
      onPeriodChange({
        startDate: format(nextYear, 'yyyy-01-01'),
        endDate: format(nextYear, 'yyyy-12-31'),
        viewType: 'year'
      });
    }
  };

  const getPeriodLabel = (): string => {
    // Parse date with local timezone to avoid timezone issues
    const startDate = new Date(period.startDate + 'T12:00:00');

    if (period.viewType === 'month') {
      return format(startDate, 'MMMM yyyy');
    } else if (period.viewType === 'year') {
      return format(startDate, 'yyyy');
    }

    return `${period.startDate} to ${period.endDate}`;
  };

  return (
    <div className="space-y-4">
      {/* Navigation and Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigatePrevious}
            aria-label={`Previous ${period.viewType}`}
            className="h-10 w-10 min-h-10 min-w-10 sm:h-8 sm:w-8" // Larger touch targets on mobile
          >
            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>

          <h2 className="text-base font-semibold sm:text-lg" role="heading" aria-level={2}>
            {getPeriodLabel()}
          </h2>

          <Button
            variant="outline"
            size="icon"
            onClick={navigateNext}
            aria-label={`Next ${period.viewType}`}
            className="h-10 w-10 min-h-10 min-w-10 sm:h-8 sm:w-8" // Larger touch targets on mobile
          >
            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {showLegend && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-xs text-gray-600 sm:text-sm">Spending Intensity:</span>
            <ColorLegend config={config} />
          </div>
        )}
      </div>

      {/* Metrics Display */}
      {metrics && (
        <div className="bg-gray-50 rounded-lg p-4">
          <MetricsDisplay metrics={metrics} />
        </div>
      )}
    </div>
  );
};

CalendarHeader.displayName = 'CalendarHeader';