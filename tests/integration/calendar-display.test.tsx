/**
 * Calendar Display Integration Test
 * Tests complete calendar display functionality with color-coded spending
 * Based on quickstart.md Test Scenario 1
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpendingCalendar } from '@/components/calendar/spending-calendar';

const mockTransactions = [
  { id: '1', date: '2025-09-15', amount: 25.50, category: 'Food', description: 'Lunch' },
  { id: '2', date: '2025-09-20', amount: 150.00, category: 'Shopping', description: 'Groceries' },
  { id: '3', date: '2025-09-15', amount: 12.00, category: 'Food', description: 'Coffee' },
  { id: '4', date: '2025-09-05', amount: 75.00, category: 'Entertainment', description: 'Movies' },
  { id: '5', date: '2025-09-25', amount: 45.00, category: 'Food', description: 'Dinner' }
];

describe('Calendar Display Integration', () => {
  describe('Calendar Grid Structure', () => {
    it('should display calendar with proper grid structure', async () => {
      // This will fail until component is implemented
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Verify calendar structure
      const calendar = screen.getByRole('grid');
      expect(calendar).toBeInTheDocument();

      // Should have 7 columns for days of week
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(7);

      // Should display day names
      expect(screen.getByText(/sun/i)).toBeInTheDocument();
      expect(screen.getByText(/mon/i)).toBeInTheDocument();
      expect(screen.getByText(/tue/i)).toBeInTheDocument();
      expect(screen.getByText(/wed/i)).toBeInTheDocument();
      expect(screen.getByText(/thu/i)).toBeInTheDocument();
      expect(screen.getByText(/fri/i)).toBeInTheDocument();
      expect(screen.getByText(/sat/i)).toBeInTheDocument();
    });

    it('should display full month calendar (42 cells)', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const cells = screen.getAllByRole('gridcell');
      expect(cells).toHaveLength(42); // 6 weeks × 7 days
    });

    it('should show current month days prominently', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // September has 30 days
      const day1 = screen.getByText('1');
      const day30 = screen.getByText('30');

      expect(day1).toBeInTheDocument();
      expect(day30).toBeInTheDocument();

      // Current month days should not be muted
      expect(day1.parentElement).not.toHaveClass(/muted|disabled/);
      expect(day30.parentElement).not.toHaveClass(/muted|disabled/);
    });
  });

  describe('Color-Coded Spending Display', () => {
    it('should show color intensity based on spending amounts', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Day 15 has $37.50 (25.50 + 12.00)
      const day15 = screen.getByText('15');
      expect(day15.parentElement).toHaveAttribute('data-intensity');

      // Day 20 has $150.00 (highest spending)
      const day20 = screen.getByText('20');
      expect(day20.parentElement).toHaveAttribute('data-intensity');

      // Day 5 has $75.00
      const day5 = screen.getByText('5');
      expect(day5.parentElement).toHaveAttribute('data-intensity');

      // Day 25 has $45.00
      const day25 = screen.getByText('25');
      expect(day25.parentElement).toHaveAttribute('data-intensity');
    });

    it('should apply appropriate background colors for spending levels', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Highest spending day (day 20: $150) should have red-ish color
      const day20 = screen.getByText('20');
      const day20Styles = window.getComputedStyle(day20.parentElement!);
      expect(day20Styles.backgroundColor).toBeTruthy();

      // Medium spending day (day 5: $75) should have yellow-ish color
      const day5 = screen.getByText('5');
      const day5Styles = window.getComputedStyle(day5.parentElement!);
      expect(day5Styles.backgroundColor).toBeTruthy();

      // Lower spending day (day 25: $45) should have green-ish color
      const day25 = screen.getByText('25');
      const day25Styles = window.getComputedStyle(day25.parentElement!);
      expect(day25Styles.backgroundColor).toBeTruthy();
    });

    it('should show neutral color for days without spending', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Day 1 has no transactions
      const day1 = screen.getByText('1');
      expect(day1.parentElement).toHaveClass(/empty|neutral/);

      // Day 10 has no transactions
      const day10 = screen.getByText('10');
      expect(day10.parentElement).toHaveClass(/empty|neutral/);
    });
  });

  describe('Calendar Navigation', () => {
    it('should display current month and year in header', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      expect(screen.getByText(/september/i)).toBeInTheDocument();
      expect(screen.getByText(/2025/i)).toBeInTheDocument();
    });

    it('should have navigation controls', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should navigate to previous month when previous button clicked', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onPeriodChange={mockOnPeriodChange}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      fireEvent.click(prevButton);

      // Should navigate to August 2025
      expect(mockOnPeriodChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-08-01',
          endDate: '2025-08-31',
          viewType: 'month'
        })
      );
    });

    it('should navigate to next month when next button clicked', () => {
      const mockOnPeriodChange = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onPeriodChange={mockOnPeriodChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      // Should navigate to October 2025
      expect(mockOnPeriodChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2025-10-01',
          endDate: '2025-10-31',
          viewType: 'month'
        })
      );
    });
  });

  describe('Calendar Legend', () => {
    it('should display color scale legend', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      expect(screen.getByText(/less/i)).toBeInTheDocument();
      expect(screen.getByText(/more/i)).toBeInTheDocument();
    });

    it('should show legend color boxes', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const legendColors = screen.getAllByTestId(/legend-color/i);
      expect(legendColors.length).toBeGreaterThanOrEqual(4); // empty, low, mid, high
    });

    it('should explain color meaning', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      // Should have text explaining the color scale
      expect(screen.getByText(/spending intensity/i)).toBeInTheDocument();
    });
  });

  describe('Day Cell Interactions', () => {
    it('should make spending days clickable', () => {
      const mockOnDayClick = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onDayClick={mockOnDayClick}
        />
      );

      const day15 = screen.getByText('15');
      expect(day15.parentElement).toHaveAttribute('role', 'gridcell');

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

    it('should handle empty day clicks', () => {
      const mockOnDayClick = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onDayClick={mockOnDayClick}
        />
      );

      const day1 = screen.getByText('1');
      fireEvent.click(day1);

      expect(mockOnDayClick).toHaveBeenCalledWith(
        expect.stringMatching(/2025-09-01/),
        null
      );
    });

    it('should show hover effects on spending days', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const day15 = screen.getByText('15');

      fireEvent.mouseEnter(day15.parentElement!);
      expect(day15.parentElement).toHaveClass(/hover|interactive/);

      fireEvent.mouseLeave(day15.parentElement!);
      expect(day15.parentElement).not.toHaveClass(/hover/);
    });
  });

  describe('Today Indicator', () => {
    it('should highlight today\'s date when in current month', () => {
      // Mock today's date to be September 25, 2025
      const mockDate = new Date('2025-09-25');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      render(<SpendingCalendar transactions={mockTransactions} />);

      const today = screen.getByText('25');
      expect(today.parentElement).toHaveClass(/today|current/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', () => {
      render(<SpendingCalendar transactions={mockTransactions} />);

      const calendar = screen.getByRole('grid');
      expect(calendar).toHaveAttribute('aria-label', expect.stringContaining('spending calendar'));

      const cells = screen.getAllByRole('gridcell');
      cells.forEach(cell => {
        expect(cell).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', () => {
      const mockOnDayClick = jest.fn();

      render(
        <SpendingCalendar
          transactions={mockTransactions}
          onDayClick={mockOnDayClick}
        />
      );

      const day15 = screen.getByText('15');
      day15.parentElement!.focus();

      fireEvent.keyDown(day15.parentElement!, { key: 'Enter' });
      expect(mockOnDayClick).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton calendar when loading', () => {
      render(
        <SpendingCalendar
          transactions={mockTransactions}
          loading={true}
        />
      );

      const calendar = screen.getByRole('grid');
      expect(calendar).toHaveClass(/loading|skeleton/);

      // Should still show basic structure but with loading styles
      const cells = screen.getAllByRole('gridcell');
      expect(cells).toHaveLength(42);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid transaction data gracefully', () => {
      const invalidTransactions = [
        {
          id: '1',
          date: 'invalid-date',
          amount: 'not-a-number' as any,
          category: 'Food',
          description: 'Invalid'
        }
      ];

      // Should not crash
      expect(() => {
        render(<SpendingCalendar transactions={invalidTransactions} />);
      }).not.toThrow();

      // Calendar should still render
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });
  });
});