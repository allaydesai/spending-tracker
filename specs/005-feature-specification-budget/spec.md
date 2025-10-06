# Feature Specification: Budget Overview Component

**Feature Branch**: `005-feature-specification-budget`
**Created**: 2025-10-05
**Status**: Draft
**Parent Feature**: CSV Transaction Dashboard (001-build-a-simple)
**Input**: Enhancement to existing expense tracker app to add budget tracking and progress visualization

## Summary

Add a budget overview component to the existing expense tracker dashboard that displays monthly budget progress, comparing actual spending against forecasted budgets. The component visualizes fixed expenses, variable subscriptions, and day-to-day spending with progress indicators, burn rate analysis, and interest tracking. Budget configuration is managed through a YAML file for easy modification without UI complexity.

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story

A user wants to track their monthly budget progress by comparing actual spending against their pre-configured budget. They have fixed expenses (mortgage, utilities, insurance) and variable subscriptions that are excluded from transaction imports to avoid double counting. The focus is on day-to-day variable expenses - staying within the $4,000 budget to achieve the savings goal of $1,849. The user needs to see at a glance:
- How much of their variable expense budget remains
- Whether they're on track based on days elapsed in the month
- Their daily burn rate vs. target
- Their true net position (income minus all fixed expenses minus actual spending)
- Interest paid so far (contextual information)
- Breakdown of fixed expenses and subscriptions

### Acceptance Scenarios

1. **Given** a user has configured their budget in the YAML file and has transaction data for the current month, **When** they view the dashboard, **Then** the budget overview displays all KPIs with accurate calculations within 1 second

2. **Given** the budget overview is displayed, **When** the user has spent $2,000 of their $4,000 variable budget on day 15 of a 30-day month, **Then** the progress indicator shows 50% budget used and 50% time elapsed with green/yellow/red color coding

3. **Given** the user is viewing budget metrics, **When** they see the daily burn rate, **Then** it shows both actual burn rate (e.g., "$133/day") and target burn rate (e.g., "target: $129/day") with color coding

4. **Given** fixed expenses and subscriptions are collapsed, **When** the user clicks to expand the breakdown, **Then** all line items appear with individual amounts summing to the totals

5. **Given** the user is viewing the budget overview, **When** interest-bearing transactions exist in the current month, **Then** the component displays both forecasted interest ($1,025.00) and actual interest paid month-to-date

6. **Given** the user modifies the budget YAML config file, **When** they refresh the dashboard, **Then** all budget calculations update to reflect the new values

7. **Given** the user has exceeded their variable expense budget, **When** viewing the progress bar, **Then** it displays red color coding and shows negative remaining budget

8. **Given** the user is viewing the budget overview for September 2025 with $14,767.45 actual income, $6,472.02 in total spending (all imported transactions), and $7,588.94 in monthly fixed costs (from config), **When** the Net metric is calculated, **Then** it displays $706.49 as the net amount (14,767.45 - 6,472.02 - 7,588.94 = 706.49)

### Edge Cases

- What happens when the YAML config file is missing or malformed?
- How does the system handle mid-month config changes (e.g., adding a new subscription on day 15)?
- What happens when actual income month-to-date differs significantly from forecasted income?
- How does the component display on narrow mobile screens with all metrics visible?
- What happens when the current date is the 1st of the month (day 1)?
- How does the system handle months with different day counts (28, 29, 30, 31 days)?
- What happens when there are no transactions yet for the current month?
- How does the component handle negative variable expenses (refunds/returns)?
- What happens when interest transactions are categorized inconsistently?

---

## Requirements *(mandatory)*

### Functional Requirements

**Budget Configuration:**
- **FR-001**: System MUST load budget configuration from a YAML file (`budget-config.yaml`) located in the project root or data directory
- **FR-002**: YAML config MUST support fixed expenses with line-item breakdown (Mortgage, Essential Services breakdown, Car Payment, Additional Services, Aaria Day Care)
- **FR-003**: YAML config MUST support variable subscriptions with line-item breakdown (see Essential Services and Additional Services structure)
- **FR-004**: YAML config MUST define forecasted monthly income, day-to-day variable expense budget, and forecasted interest on debt
- **FR-005**: System MUST validate YAML config on load and display clear error messages for malformed data
- **FR-006**: System MUST support hot-reload of config changes on dashboard refresh (no app restart required)

**Budget Calculations:**
- **FR-007**: System MUST calculate Total Monthly Expenses (Fixed) by summing all fixed expense line items from config
- **FR-008**: System MUST calculate Total Monthly Expenses (Variable Subscriptions) by summing all subscription line items from config
- **FR-009**: System MUST calculate Forecasted Savings as: `Total Income - Fixed Expenses - Variable Subscriptions - Day to Day Budget`
- **FR-010**: System MUST calculate Actual Income MTD from positive transaction amounts in current month
- **FR-011**: System MUST calculate Actual Variable Spending MTD from imported transactions (excludes fixed and subscription transactions)
- **FR-012**: System MUST calculate Budget Remaining as: `Day to Day Budget - Actual Variable Spending MTD`
- **FR-013**: System MUST calculate Actual Savings MTD as: `Actual Income MTD - Fixed Expenses - Variable Subscriptions - Actual Variable Spending MTD`
- **FR-014**: System MUST calculate Interest Paid MTD by summing all interest-related transactions in current month
- **FR-015**: System MUST calculate Net as: `Total Income - Total Spending (all imported transactions including interest) - Monthly Fixed`, where Total Income uses forecasted value for current month and actual value for previous months, Monthly Fixed is the sum of Total Fixed Expenses ($7,035.43) and Total Variable Subscriptions ($553.51) from config = $7,588.94, and Total Spending includes ALL negative transactions from imports

**Progress Tracking:**
- **FR-016**: System MUST display month progress as percentage (e.g., "Day 15 of 30 = 50%")
- **FR-017**: System MUST display budget usage as percentage (e.g., "$2,000 spent of $4,000 = 50%")
- **FR-018**: System MUST calculate daily burn rate as: `Actual Variable Spending MTD / Days Elapsed`
- **FR-019**: System MUST calculate target daily burn rate as: `Day to Day Budget / Total Days in Month`
- **FR-020**: System MUST display variance between actual and target burn rates

**Visual Indicators:**
- **FR-021**: System MUST display progress bar for Day to Day Budget showing spent vs. remaining
- **FR-022**: System MUST apply color coding: Green (≤75% budget used), Yellow (76-95%), Red (≥96%)
- **FR-023**: System MUST adjust color coding based on time elapsed (e.g., Red if 80% budget used but only 50% through month)
- **FR-024**: System MUST display visual indicator when over budget (negative remaining budget)

**Breakdown Display:**
- **FR-025**: System MUST provide collapsible/expandable section for Fixed Expenses breakdown
- **FR-026**: Fixed Expenses breakdown MUST show: Mortgage, Essential Services (with sub-items), Car Payment, Additional Services, Aaria Day Care
- **FR-027**: Essential Services MUST expand to show: Wireless (Roger+Bell+ATT), Insurance (Car+Home), Utility (Hydro+Gas)
- **FR-028**: System MUST provide collapsible/expandable section for Variable Subscriptions breakdown
- **FR-029**: Variable Subscriptions breakdown MUST show all line items from Additional Services config section
- **FR-030**: All breakdowns MUST display individual amounts and calculate accurate totals

**Interest Tracking:**
- **FR-031**: System MUST display Interest section separately from main budget calculation
- **FR-032**: System MUST show Forecasted Interest (from config) and Actual Interest Paid MTD (from transactions)
- **FR-033**: System MUST identify interest transactions by category or description pattern (configurable in YAML)
- **FR-034**: Interest MUST NOT be subtracted from savings calculation (already in transactions, avoid double counting)

**UI/UX Requirements:**
- **FR-035**: Component MUST integrate into existing single-page dashboard layout without requiring navigation
- **FR-036**: Component MUST be responsive and fully functional on mobile devices (320px+ width)
- **FR-037**: Component MUST render within 1 second of dashboard load
- **FR-038**: Component MUST maintain readability with all metrics visible without horizontal scrolling
- **FR-039**: Expanded breakdowns MUST be accessible via touch on mobile devices (44px+ touch targets)

**Data Integration:**
- **FR-040**: Budget calculations MUST work with both database and file storage modes
- **FR-041**: System MUST query current month transactions from selected data source (database or localStorage)
- **FR-042**: System MUST handle timezone correctly when determining "current month" boundaries
- **FR-043**: System MUST exclude fixed expense and subscription transactions from imports (per existing app logic)

### Key Entities *(include if feature involves data)*

**BudgetConfig**
- Source: YAML configuration file
- Purpose: Stores budget parameters and expense breakdowns
- Fields:
  - `forecasted_income` (number): Expected monthly income
  - `fixed_expenses` (object): Breakdown of fixed monthly costs
    - `mortgage` (number)
    - `essential_services` (object): Utilities breakdown
      - `wireless` (number)
      - `insurance` (number)
      - `utility` (number)
    - `car_payment` (number)
    - `additional_services` (object): Subscription breakdown
    - `aaria_day_care` (number)
  - `day_to_day_budget` (number): Variable expense budget target
  - `forecasted_interest` (number): Expected interest on debt
  - `interest_patterns` (array): Categories/keywords to identify interest transactions

**BudgetMetrics**
- Source: Calculated from BudgetConfig + Transaction data
- Purpose: Real-time budget performance metrics
- Fields:
  - `total_fixed_expenses` (number): Sum of all fixed costs
  - `total_variable_subscriptions` (number): Sum of all subscriptions
  - `forecasted_savings` (number): Expected end-of-month savings
  - `actual_income_mtd` (number): Income received so far
  - `actual_variable_spending_mtd` (number): Day-to-day spending so far
  - `budget_remaining` (number): Day-to-day budget left
  - `actual_savings_mtd` (number): Current savings position
  - `interest_paid_mtd` (number): Interest paid so far
  - `net` (number): Total Income - Total Spending (all imported transactions) - Monthly Fixed ($7,588.94) (uses forecasted income for current month, actual for past months)

**ProgressIndicators**
- Source: Calculated from BudgetMetrics + Date
- Purpose: Time-based progress tracking
- Fields:
  - `days_elapsed` (number): Days completed in current month
  - `total_days` (number): Total days in current month
  - `month_progress_percent` (number): Percentage of month completed
  - `budget_usage_percent` (number): Percentage of variable budget used
  - `actual_burn_rate` (number): Average spending per day so far
  - `target_burn_rate` (number): Target spending per day
  - `burn_rate_variance` (number): Difference between actual and target
  - `status_color` (enum): green | yellow | red

---

## Data Format Example

### YAML Configuration Structure

```yaml
# budget-config.yaml

budget:
  # Income forecast
  forecasted_income: 13437.98

  # Fixed monthly expenses (excluded from transaction imports)
  fixed_expenses:
    mortgage: 4581.34

    essential_services:
      wireless: 371.62      # Roger + Bell + ATT
      insurance: 698.47     # Car + Home
      utility: 300.00       # Hydro + Gas
      # Total Essential Services: $1,370.09

    car_payment: 600.00
    aaria_day_care: 484.00

    # Additional Services (Variable Subscriptions)
    additional_services:
      netflix: 20.99
      spotify: 10.99
      amazon_prime: 14.99
      gym_membership: 45.00
      cloud_storage: 9.99
      # ... other subscriptions
      # Total Additional Services: $553.51

    # Total Fixed Expenses: $7,588.94

  # Variable expense budget (day-to-day spending)
  day_to_day_budget: 4000.00

  # Interest tracking (contextual information)
  forecasted_interest: 1025.00

  # Patterns to identify interest transactions
  interest_patterns:
    categories:
      - "Interest"
      - "Interest & Charges"
      - "Finance Charge"
    keywords:
      - "interest"
      - "finance charge"
      - "apr"

  # Derived calculations (for reference, not stored)
  # forecasted_savings = forecasted_income - total_fixed_expenses - day_to_day_budget
  # forecasted_savings = 13437.98 - 7588.94 - 4000.00 = 1849.04
```

### Example Budget Display (Expanded State)

```
╔══════════════════════════════════════════════════════╗
║           BUDGET OVERVIEW - October 2025             ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Day 15 of 31 (48% through month)                   ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░        ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  INCOME                                              ║
║  Forecasted: $13,437.98                              ║
║  Actual MTD: $6,800.00 (50.6%)                       ║
╠══════════════════════════════════════════════════════╣
║  FIXED EXPENSES                        [+ Expand]    ║
║  Total: $7,588.94                                    ║
║                                                      ║
║  [Expanded View:]                                    ║
║  • Mortgage:              $4,581.34                  ║
║  • Essential Services:    $1,370.09                  ║
║    - Wireless:              $371.62                  ║
║    - Insurance:             $698.47                  ║
║    - Utility:               $300.00                  ║
║  • Car Payment:             $600.00                  ║
║  • Additional Services:     $553.51    [+ Expand]    ║
║  • Aaria Day Care:          $484.00                  ║
╠══════════════════════════════════════════════════════╣
║  DAY-TO-DAY VARIABLE EXPENSES                        ║
║  Budget: $4,000.00                                   ║
║  Spent: $1,850.00 (46.3%)                            ║
║  Remaining: $2,150.00                                ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  [GREEN]║
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
║  NET (Income - Fixed - Spending)                     ║
║  Current: $5,212.06                                  ║
║  (Forecasted Income: $13,437.98)                     ║
╠══════════════════════════════════════════════════════╣
║  INTEREST TRACKING (Contextual)                      ║
║  Forecasted: $1,025.00                               ║
║  Paid MTD: $512.50 (50.0%)                           ║
╚══════════════════════════════════════════════════════╝
```

---

## Review & Acceptance Checklist
*GATE: Automated checks run during specification approval*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

### Integration with Existing System
- [x] Compatible with existing database and file storage modes
- [x] Works within single-page application constraint
- [x] Leverages existing transaction data structure
- [x] Maintains performance targets (<1s component render)
- [x] Mobile-responsive design considerations included

---

## Implementation Notes

**Configuration Management:**
1. YAML config file location: `./data/budget-config.yaml` or project root
2. Config validation on app startup with detailed error messages
3. Support for hot-reload (refresh dashboard to pick up config changes)
4. No UI for editing config - modify YAML directly with text editor

**Data Sources:**
- Initial budget parameters are available in existing CSV files:
  - `data/budget_summary.csv` - Main budget figures (income, expenses, forecasts)
  - `data/essential-services.csv` - Breakdown of essential services (wireless, insurance, utility)
  - `data/additional-services.csv` - Subscription services with detailed information
- These CSV files should be used as the reference source when creating the initial `budget-config.yaml`
- Actual values from CSVs:
  - Total Monthly Income: $13,437.98
  - Mortgage: $4,581.34
  - Essential Services: $1,370.09 (Wireless: $371.62, Insurance: $698.47, Utility: $300.00)
  - Car Payment: $600.00
  - Additional Services: $553.51 (11 subscription items)
  - Aaria Day Care: $484.00
  - Day to Day Budget: $4,000.00
  - Forecasted Interest: $1,025.00

**Calculation Strategy:**
1. Fixed expenses and subscriptions from YAML (constant values)
2. Actual income and spending from transaction queries (current month filter)
3. Interest identification via configurable patterns (categories + keywords)
4. Burn rate calculations consider days elapsed vs. total days in month

**Color Coding Logic:**
- Green: Budget usage ≤ Month progress (on track or ahead)
- Yellow: Budget usage 1-10% over month progress (caution)
- Red: Budget usage >10% over month progress (over budget)

**Responsive Design:**
- Desktop: Full width with expanded view by default
- Tablet: Collapsed sections, expandable on tap
- Mobile: Stacked metrics, collapsible breakdowns, minimal chrome

**Placement Strategy:**
- Review existing dashboard layout
- Likely placement: Top section above KPIs or dedicated card in main grid
- Consider collapsible/expandable widget to save space
- Must remain visible on initial page load (no scrolling required for summary)

---

## Execution Status
*Updated during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
