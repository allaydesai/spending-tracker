# Quickstart: Spending Heatmap Calendar

This quickstart validates the implementation by walking through the core user scenarios from the feature specification.

## Prerequisites

- Next.js development server running (`npm run dev`)
- Sample transaction data loaded in the application
- Calendar component integrated into dashboard

## Test Scenario 1: Calendar Display

**Goal**: Verify calendar shows color-coded spending amounts

### Steps
1. Navigate to dashboard with spending heatmap calendar
2. Observe calendar grid displays current month
3. Check that days with spending show color intensity
4. Verify days without spending show neutral color

### Expected Results
- Calendar grid displays 7 columns (days of week)
- Current month days clearly visible
- Color intensity correlates with spending amounts
- Empty days show neutral background color
- Calendar legend shows color scale explanation

### Validation Script
```typescript
// Integration test: Calendar displays correctly
it('should display calendar with color-coded spending', async () => {
  const transactions = [
    { date: '2025-09-15', amount: 25.50, category: 'Food' },
    { date: '2025-09-20', amount: 150.00, category: 'Shopping' }
  ];

  render(<SpendingCalendar transactions={transactions} />);

  // Verify calendar structure
  expect(screen.getByRole('grid')).toBeInTheDocument();
  expect(screen.getAllByRole('gridcell')).toHaveLength(42); // 6 weeks × 7 days

  // Verify spending days are colored
  const day15 = screen.getByText('15');
  const day20 = screen.getByText('20');
  expect(day15).toHaveClass(/bg-/); // Has background color
  expect(day20).toHaveClass(/bg-/); // Has background color

  // Verify empty days are neutral
  const day1 = screen.getByText('1');
  expect(day1).toHaveClass('bg-gray-50'); // Neutral color
});
```

## Test Scenario 2: Pattern Identification

**Goal**: Verify users can identify spending patterns visually

### Steps
1. Load calendar with diverse spending data across multiple weeks
2. Observe visual patterns in calendar display
3. Identify weekend spending trends
4. Identify end-of-month bill patterns

### Expected Results
- Weekend days show different spending patterns than weekdays
- End-of-month days show higher spending (bills)
- Visual patterns are immediately recognizable
- Color intensity clearly distinguishes high vs. low spending days

### Validation Script
```typescript
// Integration test: Pattern identification
it('should display spending patterns clearly', async () => {
  const weekendSpending = [
    { date: '2025-09-06', amount: 75.00, category: 'Entertainment' }, // Saturday
    { date: '2025-09-07', amount: 120.00, category: 'Dining' }, // Sunday
  ];
  const billSpending = [
    { date: '2025-09-30', amount: 1200.00, category: 'Rent' }, // End of month
    { date: '2025-09-29', amount: 85.00, category: 'Utilities' },
  ];

  render(<SpendingCalendar transactions={[...weekendSpending, ...billSpending]} />);

  // Weekend pattern should be visible
  const saturday = screen.getByText('6');
  const sunday = screen.getByText('7');
  expect(saturday.parentElement).toHaveAttribute('data-intensity');
  expect(sunday.parentElement).toHaveAttribute('data-intensity');

  // End-of-month high spending should be most intense
  const day30 = screen.getByText('30');
  expect(day30.parentElement).toHaveClass(/bg-red/); // High intensity color
});
```

## Test Scenario 3: Transaction Drill-Down

**Goal**: Verify clicking on a day shows detailed transactions

### Steps
1. Click on a day with spending activity
2. Verify transaction details appear
3. Check that transaction table updates
4. Verify related components update (pie chart, etc.)

### Expected Results
- Clicking day triggers drill-down interface
- Transaction table shows only selected day's transactions
- Date filter updates to selected day
- Related dashboard components reflect filtered data
- Loading states appear during data fetching

### Validation Script
```typescript
// Integration test: Transaction drill-down
it('should show transaction details when day is clicked', async () => {
  const dayTransactions = [
    { date: '2025-09-15', amount: 25.50, category: 'Food', description: 'Lunch' },
    { date: '2025-09-15', amount: 12.00, category: 'Food', description: 'Coffee' }
  ];

  const mockOnDayClick = jest.fn();
  render(
    <SpendingCalendar
      transactions={dayTransactions}
      onDayClick={mockOnDayClick}
    />
  );

  // Click on day 15
  const day15 = screen.getByText('15');
  fireEvent.click(day15);

  // Verify callback called with correct data
  expect(mockOnDayClick).toHaveBeenCalledWith('2025-09-15', {
    date: '2025-09-15',
    amount: 37.50,
    transactionCount: 2,
    categories: { Food: 37.50 }
  });
});
```

## Test Scenario 4: Empty State Handling

**Goal**: Verify calendar handles days with no transactions

### Steps
1. View calendar period with no transaction data
2. Click on empty day
3. Check empty state messaging
4. Verify no errors occur

### Expected Results
- Empty days show neutral styling
- Clicking empty day shows "No transactions" message
- Calendar structure remains intact
- No JavaScript errors in console

### Validation Script
```typescript
// Integration test: Empty state handling
it('should handle empty days gracefully', async () => {
  const mockOnDayClick = jest.fn();
  render(<SpendingCalendar transactions={[]} onDayClick={mockOnDayClick} />);

  // Click on any day (should be empty)
  const day1 = screen.getByText('1');
  fireEvent.click(day1);

  // Verify callback called with null spending
  expect(mockOnDayClick).toHaveBeenCalledWith(
    expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
    null
  );

  // Verify no error states
  expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
});
```

## Test Scenario 5: Mobile Responsiveness

**Goal**: Verify calendar works on mobile devices

### Steps
1. Resize browser to mobile width (375px)
2. Interact with calendar on touch device
3. Check touch targets meet minimum size requirements
4. Verify calendar remains usable

### Expected Results
- Calendar cells are at least 44px for touch
- Calendar fits within mobile viewport
- Touch interactions work smoothly
- No horizontal scrolling required
- Text remains readable at mobile sizes

### Validation Script
```typescript
// Integration test: Mobile responsiveness
it('should be usable on mobile devices', async () => {
  // Mock mobile viewport
  global.innerWidth = 375;
  global.dispatchEvent(new Event('resize'));

  render(<SpendingCalendar transactions={mockTransactions} />);

  // Check minimum touch target size
  const cells = screen.getAllByRole('gridcell');
  cells.forEach(cell => {
    const styles = window.getComputedStyle(cell);
    const minSize = 44; // pixels
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(minSize);
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(minSize);
  });

  // Verify no horizontal overflow
  const calendar = screen.getByRole('grid');
  expect(calendar.scrollWidth).toBeLessThanOrEqual(375);
});
```

## Performance Validation

### Load Time Requirements
- Initial calendar render: < 1 second
- Day selection response: < 500ms
- Month navigation: < 500ms

### Memory Usage
- Calendar component memory: < 50MB
- No memory leaks on month navigation
- Efficient re-renders with large datasets

### Accessibility
- Keyboard navigation functional
- Screen reader compatibility
- Color contrast meets WCAG AA standards
- Focus indicators visible