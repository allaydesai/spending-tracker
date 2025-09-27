/**
 * SpendingCalendar Component Contract Test
 * Tests the SpendingCalendar component interface - must fail before implementation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { SpendingCalendar } from '@/components/calendar/spending-calendar';
import { SpendingCalendarProps, SpendingCalendarRef } from '@/specs/002-spending-heatmap-calendar/contracts/calendar-component';

// Mock transaction data for testing
const mockTransactions = [
  {
    id: '1',
    date: '2025-09-15',
    amount: 25.50,
    description: 'Lunch',
    category: 'Food'
  },
  {
    id: '2',
    date: '2025-09-15',
    amount: 12.00,
    description: 'Coffee',
    category: 'Food'
  },
  {
    id: '3',
    date: '2025-09-20',
    amount: 150.00,
    description: 'Groceries',
    category: 'Shopping'
  }
];

describe('SpendingCalendar Component Contract', () => {
  describe('Props Interface', () => {
    it('should accept required transactions prop', () => {
      // This will fail until component is implemented
      expect(() => {
        render(<SpendingCalendar transactions={mockTransactions} />);
      }).not.toThrow();
    });

    it('should accept optional period prop', () => {
      const customPeriod = {
        startDate: '2025-09-01',
        endDate: '2025-09-30',
        viewType: 'month' as const
      };

      expect(() => {
        render(
          <SpendingCalendar
            transactions={mockTransactions}
            period={customPeriod}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional config prop', () => {
      const customConfig = {
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

      expect(() => {
        render(
          <SpendingCalendar
            transactions={mockTransactions}
            config={customConfig}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional onDayClick callback', () => {
      const mockOnDayClick = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onDayClick={mockOnDayClick}
        />
      );

      // Should render without throwing
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should accept optional onPeriodChange callback', () => {
      const mockOnPeriodChange = jest.fn();

      expect(() => {
        render(
          <SpendingCalendar
            transactions={mockTransactions}
            onPeriodChange={mockOnPeriodChange}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional loading prop', () => {
      render(
        <SpendingCalendar
          transactions={mockTransactions}
          loading={true}
        />
      );

      // Should show loading state
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('should accept optional className prop', () => {
      const customClass = 'custom-calendar-class';

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          className={customClass}
        />
      );

      const calendar = screen.getByRole('grid');
      expect(calendar).toHaveClass(customClass);
    });
  });

  describe('Callback Behaviors', () => {
    it('should call onDayClick with correct parameters when day is clicked', () => {
      const mockOnDayClick = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onDayClick={mockOnDayClick}
        />
      );

      // Click on day 15 (has spending data)
      const day15 = screen.getByText('15');
      fireEvent.click(day15);

      expect(mockOnDayClick).toHaveBeenCalledWith(
        '2025-09-15',
        expect.objectContaining({
          date: '2025-09-15',
          amount: 37.50, // 25.50 + 12.00
          transactionCount: 2,
          categories: expect.objectContaining({
            Food: 37.50
          })
        })
      );
    });

    it('should call onDayClick with null spending for empty days', () => {
      const mockOnDayClick = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onDayClick={mockOnDayClick}
        />
      );

      // Click on day 1 (no spending data)
      const day1 = screen.getByText('1');
      fireEvent.click(day1);

      expect(mockOnDayClick).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
        null
      );
    });

    it('should call onPeriodChange when period navigation occurs', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onPeriodChange={mockOnPeriodChange}
        />
      );

      // Navigate to next month (assuming navigation controls exist)
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockOnPeriodChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          endDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          viewType: expect.any(String)
        })
      );
    });
  });

  describe('Ref Interface', () => {
    it('should expose navigateTo method', () => {
      const ref = React.createRef<SpendingCalendarRef>();

      render(
        <SpendingCalendar
          ref={ref}
          transactions={mockTransactions}
        />
      );

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.navigateTo).toBe('function');
    });

    it('should expose getCurrentPeriod method', () => {
      const ref = React.createRef<SpendingCalendarRef>();

      render(
        <SpendingCalendar
          ref={ref}
          transactions={mockTransactions}
        />
      );

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.getCurrentPeriod).toBe('function');

      const period = ref.current?.getCurrentPeriod();
      expect(period).toEqual(
        expect.objectContaining({
          startDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          endDate: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          viewType: expect.any(String)
        })
      );
    });

    it('should expose refresh method', () => {
      const ref = React.createRef<SpendingCalendarRef>();

      render(
        <SpendingCalendar
          ref={ref}
          transactions={mockTransactions}
        />
      );

      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.refresh).toBe('function');

      // Should not throw when called
      expect(() => {
        ref.current?.refresh();
      }).not.toThrow();
    });
  });

  describe('DOM Structure', () => {
    it('should render calendar as accessible grid', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const calendar = screen.getByRole('grid');
      expect(calendar).toBeInTheDocument();
    });

    it('should render calendar cells as gridcells', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const cells = screen.getAllByRole('gridcell');
      expect(cells.length).toBeGreaterThan(0);
      expect(cells.length).toBeLessThanOrEqual(42); // Max 6 weeks
    });

    it('should render month header with navigation', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Check for navigation elements
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should render color legend', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Legend should explain color coding
      expect(screen.getByText(/less/i)).toBeInTheDocument();
      expect(screen.getByText(/more/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when loading is true', () => {
      render(
        <SpendingCalendar
          transactions={mockTransactions}
          loading={true}
        />
      );

      const calendar = screen.getByRole('grid');
      expect(calendar).toHaveClass(/loading|skeleton/);
    });
  });

  describe('Error Boundaries', () => {
    it('should handle invalid transaction data gracefully', () => {
      const invalidTransactions = [
        {
          id: '1',
          date: 'invalid-date',
          amount: 'not-a-number' as any,
          description: 'Invalid transaction',
          category: 'Test'
        }
      ];

      // Should not crash, might show error state
      expect(() => {
        render(<SpendingCalendar transactions={invalidTransactions} />);
      }).not.toThrow();
    });
  });
});

// Import React for ref testing
import * as React from 'react';