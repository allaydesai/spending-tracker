/**
 * CalendarHeader Component Contract Test
 * Tests the CalendarHeader component props interface - must fail before implementation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { CalendarHeaderProps } from '@/specs/002-spending-heatmap-calendar/contracts/calendar-component';

const mockPeriod = {
  startDate: '2025-09-01',
  endDate: '2025-09-30',
  viewType: 'month' as const
};

const mockMetrics = {
  totalSpending: 1250.75,
  averageDailySpending: 41.69,
  daysWithSpending: 18,
  totalDays: 30,
  highestSpendingDay: {
    date: '2025-09-15',
    amount: 150.00,
    transactionCount: 4,
    categories: { Food: 75.00, Shopping: 75.00 }
  },
  spendingDistribution: {
    min: 5.50,
    max: 150.00,
    median: 35.00,
    percentiles: {
      p25: 20.00,
      p50: 35.00,
      p75: 65.00,
      p90: 120.00
    }
  }
};

const mockConfig = {
  colorScale: {
    min: 'hsl(120, 50%, 90%)',
    mid: 'hsl(60, 50%, 70%)',
    max: 'hsl(0, 50%, 50%)',
    empty: 'hsl(0, 0%, 95%)'
  },
  thresholds: {
    low: 25,
    high: 75
  }
};

describe('CalendarHeader Component Contract', () => {
  describe('Required Props', () => {
    it('should accept period prop', () => {
      const mockOnPeriodChange = jest.fn();

      // This will fail until component is implemented
      expect(() => {
        render(
          <CalendarHeader
            period={mockPeriod}
            onPeriodChange={mockOnPeriodChange}
            config={mockConfig}
          />
        );
      }).not.toThrow();
    });

    it('should accept onPeriodChange callback', () => {
      const mockOnPeriodChange = jest.fn();

      expect(() => {
        render(
          <CalendarHeader
            period={mockPeriod}
            onPeriodChange={mockOnPeriodChange}
            config={mockConfig}
          />
        );
      }).not.toThrow();
    });

    it('should accept config prop', () => {
      const mockOnPeriodChange = jest.fn();

      expect(() => {
        render(
          <CalendarHeader
            period={mockPeriod}
            onPeriodChange={mockOnPeriodChange}
            config={mockConfig}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Optional Props', () => {
    it('should accept optional metrics prop', () => {
      const mockOnPeriodChange = jest.fn();

      expect(() => {
        render(
          <CalendarHeader
            period={mockPeriod}
            onPeriodChange={mockOnPeriodChange}
            config={mockConfig}
            metrics={mockMetrics}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional showLegend prop', () => {
      const mockOnPeriodChange = jest.fn();

      expect(() => {
        render(
          <CalendarHeader
            period={mockPeriod}
            onPeriodChange={mockOnPeriodChange}
            config={mockConfig}
            showLegend={false}
          />
        );
      }).not.toThrow();
    });
  });

  describe('DOM Structure', () => {
    it('should render navigation controls', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should display current period label', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      // Should show month and year
      expect(screen.getByText(/september/i)).toBeInTheDocument();
      expect(screen.getByText(/2025/i)).toBeInTheDocument();
    });

    it('should render legend when showLegend is true or undefined', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
          showLegend={true}
        />
      );

      expect(screen.getByText(/less/i)).toBeInTheDocument();
      expect(screen.getByText(/more/i)).toBeInTheDocument();
    });

    it('should hide legend when showLegend is false', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
          showLegend={false}
        />
      );

      expect(screen.queryByText(/less/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/more/i)).not.toBeInTheDocument();
    });

    it('should display metrics when provided', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
          metrics={mockMetrics}
        />
      );

      expect(screen.getByText(/1,?250\.75/)).toBeInTheDocument(); // Total spending
      expect(screen.getByText(/41\.69/)).toBeInTheDocument(); // Average daily
    });
  });

  describe('Navigation Behavior', () => {
    it('should call onPeriodChange when previous button is clicked', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);

      expect(mockOnPeriodChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-08-01', // Previous month
          endDate: '2025-08-31',
          viewType: 'month'
        })
      );
    });

    it('should call onPeriodChange when next button is clicked', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnPeriodChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-10-01', // Next month
          endDate: '2025-10-31',
          viewType: 'month'
        })
      );
    });

    it('should handle different view types', () => {
      const yearPeriod = {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        viewType: 'year' as const
      };

      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={yearPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnPeriodChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2026-01-01', // Next year
          endDate: '2026-12-31',
          viewType: 'year'
        })
      );
    });
  });

  describe('Legend Component', () => {
    it('should render color scale legend', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      // Should show color boxes for different intensity levels
      const legendItems = screen.getAllByTestId(/legend-color/i);
      expect(legendItems.length).toBeGreaterThan(3); // At least min, mid, max colors
    });

    it('should use config colors in legend', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      const legendItems = screen.getAllByTestId(/legend-color/i);

      // Check that colors from config are applied
      expect(legendItems[0]).toHaveStyle({
        backgroundColor: mockConfig.colorScale.empty
      });
    });
  });

  describe('Metrics Display', () => {
    it('should format currency amounts correctly', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
          metrics={mockMetrics}
        />
      );

      // Should format total spending with currency symbol/formatting
      expect(screen.getByText(/\$1,?250\.75/)).toBeInTheDocument();
    });

    it('should display spending statistics', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
          metrics={mockMetrics}
        />
      );

      expect(screen.getByText(/18.*days with spending/i)).toBeInTheDocument();
      expect(screen.getByText(/30.*total days/i)).toBeInTheDocument();
    });

    it('should handle missing metrics gracefully', () => {
      const mockOnPeriodChange = jest.fn();

      expect(() => {
        render(
          <CalendarHeader
            period={mockPeriod}
            onPeriodChange={mockOnPeriodChange}
            config={mockConfig}
            metrics={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible navigation buttons', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).toHaveAttribute('aria-label', expect.stringContaining('Previous'));
      expect(nextButton).toHaveAttribute('aria-label', expect.stringContaining('Next'));
    });

    it('should have semantic heading for period', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should provide legend description for screen readers', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      expect(screen.getByLabelText(/color legend/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for buttons', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <CalendarHeader
          period={mockPeriod}
          onPeriodChange={mockOnPeriodChange}
          config={mockConfig}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      nextButton.focus();

      fireEvent.keyDown(nextButton, { key: 'Enter' });
      expect(mockOnPeriodChange).toHaveBeenCalled();
    });
  });
});