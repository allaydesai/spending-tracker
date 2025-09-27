# Data Model: Spending Heatmap Calendar

## Core Entities

### DailySpending
Represents aggregated spending data for a single day.

```typescript
interface DailySpending {
  date: string; // ISO date string (YYYY-MM-DD)
  amount: number; // Total spending amount for the day
  transactionCount: number; // Number of transactions for the day
  categories: Record<string, number>; // Category breakdown
}
```

**Validation Rules:**
- `date` MUST be valid ISO date string
- `amount` MUST be >= 0
- `transactionCount` MUST be >= 0
- `categories` amounts MUST sum to total `amount`

### CalendarPeriod
Defines the time range for calendar display.

```typescript
interface CalendarPeriod {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  viewType: 'month' | 'year' | 'all';
}
```

**Validation Rules:**
- `startDate` MUST be before or equal to `endDate`
- Date range MUST not exceed 5 years for performance
- `viewType` MUST match actual date range

### HeatmapConfig
Configuration for heatmap visualization.

```typescript
interface HeatmapConfig {
  colorScale: {
    min: string; // CSS color for minimum spending
    mid: string; // CSS color for medium spending
    max: string; // CSS color for maximum spending
    empty: string; // CSS color for days with no spending
  };
  thresholds: {
    low: number; // Amount threshold for low spending
    high: number; // Amount threshold for high spending
  };
}
```

**Validation Rules:**
- All color values MUST be valid CSS colors
- `thresholds.low` MUST be <= `thresholds.high`
- Thresholds MUST be >= 0

### CalendarCell
Represents a single day cell in the calendar.

```typescript
interface CalendarCell {
  date: string; // ISO date string
  spending: DailySpending | null;
  intensity: number; // 0-1 scale for color intensity
  isCurrentMonth: boolean; // For month view styling
  isToday: boolean; // Highlight today's cell
}
```

**State Transitions:**
- Empty → HasSpending (when transactions added)
- HasSpending → Empty (when all transactions removed)
- HasSpending → HasSpending (when spending amount changes)

## Data Relationships

### Transaction → DailySpending
- Multiple transactions aggregate to single DailySpending
- Transactions grouped by date (ignoring time)
- Category totals calculated from transaction categories

### DailySpending → CalendarCell
- DailySpending provides spending data for CalendarCell
- Intensity calculated based on spending amount and thresholds
- Null spending creates empty cell state

### CalendarPeriod → CalendarCell[]
- Period defines which dates to display as cells
- Missing dates in period create empty cells
- Period boundaries determine calendar grid size

## Derived Data

### SpendingThresholds
Calculated dynamically from available spending data.

```typescript
interface SpendingThresholds {
  min: number; // Minimum spending amount in dataset
  max: number; // Maximum spending amount in dataset
  median: number; // Median spending for mid-range color
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}
```

### CalendarMetrics
Summary statistics for the calendar period.

```typescript
interface CalendarMetrics {
  totalSpending: number;
  averageDailySpending: number;
  daysWithSpending: number;
  totalDays: number;
  highestSpendingDay: DailySpending | null;
  spendingDistribution: SpendingThresholds;
}
```

## Validation Schema (Zod)

```typescript
const DailySpendingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0),
  transactionCount: z.number().int().min(0),
  categories: z.record(z.string(), z.number().min(0))
});

const CalendarPeriodSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  viewType: z.enum(['month', 'year', 'all'])
}).refine((data) => data.startDate <= data.endDate, {
  message: "Start date must be before or equal to end date"
});

const HeatmapConfigSchema = z.object({
  colorScale: z.object({
    min: z.string(),
    mid: z.string(),
    max: z.string(),
    empty: z.string()
  }),
  thresholds: z.object({
    low: z.number().min(0),
    high: z.number().min(0)
  }).refine((data) => data.low <= data.high, {
    message: "Low threshold must be <= high threshold"
  })
});
```