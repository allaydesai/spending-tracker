'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CalendarCell as CalendarCellData, DailySpending } from '@/lib/types/calendar-cell';
import { HeatmapConfig } from '@/lib/types/heatmap-config';

export interface CalendarCellProps {
  cell: CalendarCellData;
  config: HeatmapConfig;
  onClick?: (date: string, spending: DailySpending | null) => void;
  allowHover?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isFocused?: boolean;
}

const sizeClasses = {
  sm: 'min-h-8 min-w-8 text-xs',
  md: 'min-h-11 min-w-11 text-sm sm:min-h-11 sm:min-w-11 sm:text-sm', // Ensure mobile compatibility
  lg: 'min-h-14 min-w-14 text-base sm:min-h-14 sm:min-w-14 sm:text-base'
};

const interpolateColor = (intensity: number, config: HeatmapConfig): string => {
  if (intensity === 0) {
    return config.colorScale.empty;
  }

  if (intensity <= 0.33) {
    // Between empty and min
    return config.colorScale.min;
  } else if (intensity <= 0.66) {
    // Between min and mid
    return config.colorScale.mid;
  } else {
    // Between mid and max
    return config.colorScale.max;
  }
};

export const CalendarCell = React.forwardRef<HTMLButtonElement, CalendarCellProps>(
  ({ cell, config, onClick, allowHover = true, size = 'md', isFocused = false }, ref) => {
    const dayNumber = parseInt(cell.date.split('-')[2], 10);

    const handleClick = () => {
      onClick?.(cell.date, cell.spending);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    };

    const backgroundColor = interpolateColor(cell.intensity, config);

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    const getAriaLabel = (): string => {
      const date = new Date(cell.date);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      if (cell.spending) {
        return `${dateStr}, ${formatCurrency(cell.spending.amount)} spent, ${
          cell.spending.transactionCount
        } transactions`;
      }

      return `${dateStr}, no transactions`;
    };

    return (
      <button
        ref={ref}
        role="gridcell"
        tabIndex={-1}
        onClick={onClick ? handleClick : undefined}
        onKeyDown={onClick ? handleKeyDown : undefined}
        aria-label={getAriaLabel()}
        style={{ backgroundColor }}
        className={cn(
          'relative flex items-center justify-center border border-gray-200 transition-all duration-200',
          sizeClasses[size],
          cell.isToday && 'ring-2 ring-blue-500 ring-inset today current',
          !cell.isCurrentMonth && 'text-gray-400 muted disabled other-month',
          cell.intensity === 0 && 'empty neutral',
          onClick && 'cursor-pointer focus:outline-none',
          isFocused && 'ring-2 ring-blue-600 ring-offset-1 z-10',
          !isFocused && onClick && 'focus:ring-2 focus:ring-blue-500',
          allowHover && onClick && 'hover:ring-1 hover:ring-gray-400 hover interactive',
          !allowHover && 'hover:ring-0'
        )}
        data-intensity={cell.intensity}
      >
        <span
          className={cn(
            'font-medium',
            cell.isToday && 'text-blue-600 font-bold',
            !cell.isCurrentMonth && 'text-gray-400'
          )}
        >
          {dayNumber}
        </span>

        {cell.spending && cell.spending.transactionCount > 0 && (
          <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-white rounded-full opacity-75" />
        )}
      </button>
    );
  }
);

CalendarCell.displayName = 'CalendarCell';