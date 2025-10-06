# Quickstart: Budget Overview Component

**Feature**: Budget Overview Component (005)
**Date**: 2025-10-05
**Purpose**: End-to-end validation and integration test scenarios

## Prerequisites

1. **Development environment running**
   ```bash
   npm run dev
   # Server running on http://localhost:3000
   ```

2. **Budget config file created**
   ```bash
   # File exists at: data/budget-config.yaml
   # Contains valid budget configuration
   ```

3. **Sample transaction data loaded**
   ```bash
   # At least one month of transaction data imported
   # Includes income, expenses, and interest transactions
   ```

4. **Tests passing**
   ```bash
   npm run test
   # All contract and unit tests pass
   ```

---

## Scenario 1: Budget Overview Displays Correctly (Acceptance #1)

**Given**: User has configured budget in YAML and has transaction data for current month
**When**: User views the dashboard
**Then**: Budget overview displays all KPIs accurately within 1 second

### Steps

1. **Open dashboard**
   ```
   Navigate to: http://localhost:3000
   ```

2. **Verify budget overview renders**
   - [ ] Budget Overview component visible on page
   - [ ] Component renders within 1 second (check DevTools Performance tab)
   - [ ] No console errors

3. **Verify all sections present**
   - [ ] Budget header with month name (e.g., "October 2025")
   - [ ] Income section (forecasted + actual MTD)
   - [ ] Fixed Expenses section with total
   - [ ] Day-to-Day Variable Expenses section
   - [ ] Savings section (forecasted + actual MTD)
   - [ ] Interest Tracking section (forecasted + paid MTD)

4. **Verify calculations accurate**
   - [ ] Total Fixed Expenses = sum of all fixed items
   - [ ] Budget Remaining = Day-to-Day Budget - Actual Variable Spending MTD
   - [ ] Forecasted Savings = Income - Fixed - Subscriptions - Day-to-Day Budget
   - [ ] All percentages display correctly (e.g., "46.3%" not "0.463")

### Expected Output

```
╔══════════════════════════════════════════════════════╗
║           BUDGET OVERVIEW - October 2025             ║
╠══════════════════════════════════════════════════════╣
║  Day 15 of 31 (48% through month)                   ║
║  Progress bar showing month progress                 ║
╠══════════════════════════════════════════════════════╣
║  INCOME                                              ║
║  Forecasted: $13,437.98                              ║
║  Actual MTD: $6,800.00 (50.6%)                       ║
╠══════════════════════════════════════════════════════╣
║  FIXED EXPENSES                        [Expand ▼]    ║
║  Total: $7,588.94                                    ║
╠══════════════════════════════════════════════════════╣
║  DAY-TO-DAY VARIABLE EXPENSES                        ║
║  Budget: $4,000.00                                   ║
║  Spent: $1,850.00 (46.3%)                            ║
║  Remaining: $2,150.00                                ║
║  [Progress bar - GREEN]                              ║
║                                                      ║
║  Daily Burn Rate:                                    ║
║  • Actual: $123.33/day                               ║
║  • Target: $129.03/day                               ║
║  • Status: ✓ Under target by $5.70/day     [GREEN]  ║
╠══════════════════════════════════════════════════════╣
║  SAVINGS                                             ║
║  Forecasted: $1,849.04                               ║
║  Actual MTD: $2,361.06 (ahead by $512.02)            ║
╠══════════════════════════════════════════════════════╣
║  INTEREST TRACKING                                   ║
║  Forecasted: $1,025.00                               ║
║  Paid MTD: $512.50 (50.0%)                           ║
╚══════════════════════════════════════════════════════╝
```

---

## Scenario 2: Progress Indicator Shows Correct Status (Acceptance #2)

**Given**: Budget overview is displayed
**When**: User has spent $2,000 of $4,000 budget on day 15 of 30-day month
**Then**: Progress indicator shows 50% budget used, 50% time elapsed, green color

### Steps

1. **Set up test data**
   ```typescript
   // Configure test: October 2025, reference date = Oct 15
   // Day-to-day budget = $4,000
   // Actual spending = $2,000
   ```

2. **Verify progress bar**
   - [ ] Progress bar shows 50% filled
   - [ ] Label shows "Spent: $2,000.00 (50.0%)"
   - [ ] Label shows "Remaining: $2,000.00"

3. **Verify time tracking**
   - [ ] Displays "Day 15 of 30 (50% through month)"
   - [ ] Month progress bar shows 50%

4. **Verify color coding**
   - [ ] Progress bar is GREEN (50% used at 50% through month = on track)
   - [ ] Burn rate indicator is GREEN (ratio <= 1.0)

### Expected Output

```
DAY-TO-DAY VARIABLE EXPENSES
Budget: $4,000.00
Spent: $2,000.00 (50.0%)
Remaining: $2,000.00
[████████████████████░░░░░░░░░░░░░░░░░░░░] GREEN
```

---

## Scenario 3: Burn Rate Displays Correctly (Acceptance #3)

**Given**: User is viewing budget metrics
**When**: Actual spending is $2,000 over 15 days
**Then**: Shows actual burn rate ($133/day) vs target ($129/day) with color coding

### Steps

1. **Verify burn rate calculation**
   - [ ] Actual Burn Rate = $2,000 / 15 days = $133.33/day
   - [ ] Target Burn Rate = $4,000 / 31 days = $129.03/day
   - [ ] Variance = $133.33 - $129.03 = $4.30/day (over target)

2. **Verify display**
   - [ ] Shows "Actual: $133.33/day"
   - [ ] Shows "Target: $129.03/day"
   - [ ] Shows "⚠ Over target by $4.30/day" or similar indicator
   - [ ] Color: YELLOW or RED (depending on percentage over)

### Expected Output

```
Daily Burn Rate:
• Actual: $133.33/day
• Target: $129.03/day
• Status: ⚠ Over target by $4.30/day     [YELLOW]
```

---

## Scenario 4: Collapsible Breakdown Works (Acceptance #4)

**Given**: Fixed expenses and subscriptions are collapsed
**When**: User clicks to expand breakdown
**Then**: All line items appear with amounts summing to total

### Steps

1. **Verify initial state (collapsed)**
   - [ ] Fixed Expenses shows total: $7,588.94
   - [ ] Expand button visible (▼ or "Show breakdown")
   - [ ] Line items hidden

2. **Click expand button**
   - [ ] Click "Expand" or ▼ icon
   - [ ] Transition animates smoothly

3. **Verify expanded state**
   - [ ] Shows "Mortgage: $4,581.34"
   - [ ] Shows "Essential Services: $1,370.09" with nested items:
     - Wireless: $371.62
     - Insurance: $698.47
     - Utility: $300.00
   - [ ] Shows "Car Payment: $600.00"
   - [ ] Shows "Aaria Day Care: $484.00"
   - [ ] Shows "Additional Services: $553.51" (optionally expandable)

4. **Verify totals**
   - [ ] Sum of line items = $7,588.94 (matches total)
   - [ ] No rounding errors

5. **Verify collapse**
   - [ ] Click "Collapse" or ▲ icon
   - [ ] Line items hide, total remains visible

### Expected Output (Expanded)

```
FIXED EXPENSES                          [Collapse ▲]
Total: $7,588.94

• Mortgage:                         $4,581.34
• Essential Services:               $1,370.09
  - Wireless (Roger+Bell+ATT):        $371.62
  - Insurance (Car+Home):             $698.47
  - Utility (Hydro+Gas):              $300.00
• Car Payment:                        $600.00
• Aaria Day Care:                     $484.00
• Additional Services:                $553.51  [Expand ▼]
```

---

## Scenario 5: Interest Tracking Displays Correctly (Acceptance #5)

**Given**: User is viewing budget overview
**When**: Interest transactions exist in current month
**Then**: Component shows forecasted interest and actual interest paid MTD

### Steps

1. **Verify interest section present**
   - [ ] "Interest Tracking" section visible
   - [ ] Labeled as contextual/informational (not part of savings calc)

2. **Verify forecasted interest**
   - [ ] Shows "Forecasted: $1,025.00" (from config)

3. **Verify actual interest MTD**
   - [ ] Calculates interest from transactions matching patterns
   - [ ] Categories: "Interest", "Interest & Charges", "Finance Charge"
   - [ ] Keywords: "interest", "finance charge", "apr"
   - [ ] Shows "Paid MTD: $512.50" (sum of matching transactions)

4. **Verify percentage**
   - [ ] Shows percentage of forecasted: "50.0%" (512.50 / 1025.00)

5. **Verify not double-counted**
   - [ ] Interest NOT subtracted from savings calculation
   - [ ] Already included in transaction data (no duplicate deduction)

### Expected Output

```
INTEREST TRACKING (Contextual)
Forecasted: $1,025.00
Paid MTD: $512.50 (50.0%)

Note: Interest is tracked for visibility but not
deducted from savings (already in transactions).
```

---

## Scenario 6: Config Hot-Reload Works (Acceptance #6)

**Given**: User modifies budget YAML config file
**When**: User refreshes dashboard
**Then**: All calculations update to reflect new values

### Steps

1. **Record initial values**
   - [ ] Note current budget totals
   - [ ] Note current day-to-day budget

2. **Modify config file**
   ```bash
   # Edit data/budget-config.yaml
   # Change: day_to_day_budget: 4000.00 → 5000.00
   # Change: mortgage: 4581.34 → 4600.00
   # Save file
   ```

3. **Refresh dashboard**
   - [ ] Press Ctrl+R or Cmd+R
   - [ ] Or click browser refresh button

4. **Verify updates**
   - [ ] Day-to-Day Budget now shows $5,000.00 (was $4,000.00)
   - [ ] Mortgage now shows $4,600.00 (was $4,581.34)
   - [ ] Total Fixed Expenses increased by $18.66
   - [ ] Budget Remaining recalculated with new budget
   - [ ] Forecasted Savings recalculated

5. **Verify no errors**
   - [ ] No console errors
   - [ ] No validation errors
   - [ ] Config loaded from disk (not cached)

---

## Scenario 7: Over-Budget State Displays Correctly (Acceptance #7)

**Given**: User has exceeded variable expense budget
**When**: Viewing progress bar
**Then**: Displays red color and shows negative remaining budget

### Steps

1. **Set up over-budget scenario**
   ```typescript
   // Test data: Day-to-day budget = $4,000
   // Actual spending = $4,500 (over by $500)
   ```

2. **Verify progress bar**
   - [ ] Progress bar shows >100% (e.g., 112.5%)
   - [ ] Color: RED
   - [ ] Label: "Spent: $4,500.00 (112.5%)"

3. **Verify budget remaining**
   - [ ] Shows negative value: "Remaining: -$500.00"
   - [ ] Color: RED
   - [ ] Warning indicator: "⚠ Over budget"

4. **Verify burn rate**
   - [ ] Status: RED (significantly over target)
   - [ ] Shows variance: "Over target by $X/day"

### Expected Output

```
DAY-TO-DAY VARIABLE EXPENSES
Budget: $4,000.00
Spent: $4,500.00 (112.5%)
Remaining: -$500.00          ⚠ OVER BUDGET
[███████████████████████████████████░░░░░] RED

Daily Burn Rate:
• Actual: $150.00/day
• Target: $129.03/day
• Status: ⚠ Over target by $20.97/day     [RED]
```

---

## Edge Case Testing

### Edge Case 1: Missing YAML Config

1. **Rename config file**
   ```bash
   mv data/budget-config.yaml data/budget-config.yaml.bak
   ```

2. **Refresh dashboard**
   - [ ] Error message displays: "Budget config file not found"
   - [ ] Hint: "Create budget-config.yaml in the data directory"
   - [ ] Dashboard still functional (rest of app works)
   - [ ] No crash or white screen

3. **Restore config**
   ```bash
   mv data/budget-config.yaml.bak data/budget-config.yaml
   ```

---

### Edge Case 2: Malformed YAML Config

1. **Corrupt YAML file**
   ```yaml
   # Edit data/budget-config.yaml
   budget:
     forecasted_income: not-a-number  # Invalid
   ```

2. **Refresh dashboard**
   - [ ] Error message displays: "Validation error"
   - [ ] Shows field path: "budget.forecasted_income"
   - [ ] Shows error: "Income must be positive" or "Expected number, received string"
   - [ ] No crash

3. **Fix YAML file**
   ```yaml
   budget:
     forecasted_income: 13437.98  # Valid
   ```

---

### Edge Case 3: First Day of Month

1. **Set reference date to Oct 1**
   ```typescript
   // Test data: referenceDate = "2025-10-01"
   // daysElapsed = 1, totalDays = 31
   ```

2. **Verify calculations**
   - [ ] Month progress: "Day 1 of 31 (3% through month)"
   - [ ] Burn rate uses day 1 divisor (doesn't crash on division by zero)
   - [ ] Color coding handles edge case (see research.md algorithm)

---

### Edge Case 4: Last Day of Month

1. **Set reference date to Oct 31**
   ```typescript
   // Test data: referenceDate = "2025-10-31"
   // daysElapsed = 31, totalDays = 31
   ```

2. **Verify calculations**
   - [ ] Month progress: "Day 31 of 31 (100% through month)"
   - [ ] Budget usage compared to 100% time elapsed
   - [ ] Status color accurate for end of month

---

### Edge Case 5: No Transactions for Current Month

1. **Clear current month transactions**
   ```typescript
   // Test data: currentMonthTransactions = []
   ```

2. **Verify display**
   - [ ] Actual Income MTD: $0.00
   - [ ] Actual Variable Spending MTD: $0.00
   - [ ] Budget Remaining: $4,000.00 (full budget)
   - [ ] Status: GREEN (0% used)
   - [ ] No errors or crashes

---

### Edge Case 6: Negative Transactions (Refunds)

1. **Add refund transaction**
   ```typescript
   // Transaction: amount = +50.00 (refund on expense)
   // Category: "Groceries"
   ```

2. **Verify calculation**
   - [ ] Refund reduces actual variable spending
   - [ ] Budget remaining increases
   - [ ] No double-counting issues

---

## Mobile Responsiveness Testing

### Test on 320px Width (iPhone SE)

1. **Resize browser to 320px width**
   - [ ] Component renders without horizontal scroll
   - [ ] All text readable (no truncation)
   - [ ] Touch targets >= 44px (expand/collapse buttons)
   - [ ] Progress bars display correctly (not broken)

2. **Verify collapsible sections**
   - [ ] Sections collapsed by default on mobile
   - [ ] Tap to expand works smoothly
   - [ ] No layout shift when expanding

3. **Verify stacked layout**
   - [ ] Metrics stack vertically
   - [ ] No overlapping text
   - [ ] Adequate spacing between sections

---

## Performance Testing

### Performance Target: <1 Second Render

1. **Open DevTools Performance tab**
2. **Start recording**
3. **Load dashboard**
4. **Stop recording**
5. **Verify metrics**
   - [ ] Component render time < 200ms
   - [ ] API fetch time < 100ms
   - [ ] Total to interactive < 1000ms
   - [ ] No layout thrashing
   - [ ] No excessive re-renders

### Memory Test

1. **Open DevTools Memory profiler**
2. **Take heap snapshot**
3. **Verify**
   - [ ] BudgetMetrics memory < 10KB
   - [ ] No memory leaks on re-render
   - [ ] Memoization working (no recalculation on unrelated state changes)

---

## Accessibility Testing

1. **Keyboard navigation**
   - [ ] Tab through all interactive elements
   - [ ] Expand/collapse works with Enter/Space
   - [ ] Focus visible on all elements

2. **Screen reader**
   - [ ] Budget amounts announced correctly
   - [ ] Progress percentages announced
   - [ ] Color status conveyed via text (not color alone)

3. **Color contrast**
   - [ ] Green: AA contrast on white background
   - [ ] Yellow: AA contrast on white background
   - [ ] Red: AA contrast on white background
   - [ ] Text readable by colorblind users

---

## Success Criteria

**All scenarios pass**: ✅
**All edge cases handled**: ✅
**Mobile responsive**: ✅
**Performance <1s**: ✅
**Accessible**: ✅

**Feature ready for production**: ✅

---

## Troubleshooting

**Issue**: Budget overview not rendering
- Check console for errors
- Verify budget-config.yaml exists and is valid
- Check API route /api/budget/config returns 200

**Issue**: Calculations incorrect
- Verify current month transactions loaded
- Check YAML config values match expected totals
- Run unit tests: `npm run test lib/budget`

**Issue**: Progress bar wrong color
- Check month progress vs budget usage ratio
- Verify color coding algorithm (see data-model.md)
- Test edge case: first/last day of month

**Issue**: Hot-reload not working
- Hard refresh with Ctrl+Shift+R (bypass cache)
- Check API route cache TTL (should be 5 minutes)
- Restart dev server: `npm run dev`

---

**Quickstart Complete**: All acceptance scenarios and edge cases documented. Ready for implementation and testing.
