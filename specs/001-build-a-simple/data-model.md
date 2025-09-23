# Data Model: CSV Transaction Dashboard

**Date**: 2025-09-22
**Feature**: CSV Transaction Dashboard
**Phase**: 1 - Data Model Design

## Core Entities

### Transaction
Represents a single financial transaction parsed from CSV/Excel file.

**Fields**:
- `id`: string (generated UUID for React keys)
- `date`: Date (parsed from YYYY-MM-DD format)
- `amount`: number (negative=spend, positive=income, decimal precision)
- `category`: string (transaction classification)
- `description`: string (raw transaction text from statement)
- `merchant`: string (normalized merchant name)
- `account`: string | undefined (optional source account identifier)
- `isTransfer`: boolean (optional flag to exclude from totals, defaults to false)

**Validation Rules**:
- `date`: Must be valid date in YYYY-MM-DD format, all transactions within same month
- `amount`: Must be valid number with decimal point separator, no thousands separators
- `category`: Required non-empty string
- `description`: Required non-empty string
- `merchant`: Required non-empty string
- `account`: Optional string
- `isTransfer`: Optional boolean, defaults to false

**TypeScript Definition**:
```typescript
interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  merchant: string;
  account?: string;
  isTransfer: boolean;
}
```

### KPI (Key Performance Indicators)
Calculated metrics derived from transaction data.

**Fields**:
- `totalSpending`: number (sum of negative amounts, excluding transfers)
- `totalIncome`: number (sum of positive amounts, excluding transfers)
- `netAmount`: number (totalIncome + totalSpending)
- `transactionCount`: number (total transactions processed)
- `period`: string (month/year of transactions, e.g., "September 2025")

**Calculation Rules**:
- Exclude transactions where `isTransfer === true`
- Spending = sum of amounts < 0
- Income = sum of amounts > 0
- Net = Income + Spending (spending is negative)

**TypeScript Definition**:
```typescript
interface KPI {
  totalSpending: number;
  totalIncome: number;
  netAmount: number;
  transactionCount: number;
  period: string;
}
```

### CategorySummary
Aggregated spending data by category for chart visualization.

**Fields**:
- `category`: string (category name)
- `totalAmount`: number (sum of amounts in this category)
- `transactionCount`: number (count of transactions)
- `percentage`: number (percentage of total spending/income)
- `isIncome`: boolean (true if positive amounts, false if negative)

**Calculation Rules**:
- Exclude transfers from calculations
- Separate income and expense categories
- Percentage based on total spending or total income respectively

**TypeScript Definition**:
```typescript
interface CategorySummary {
  category: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  isIncome: boolean;
}
```

### Filter
User-applied criteria for filtering transaction table.

**Fields**:
- `categories`: string[] (selected categories to include)
- `merchants`: string[] (selected merchants to include)
- `amountMin`: number | undefined (minimum amount filter)
- `amountMax`: number | undefined (maximum amount filter)
- `searchText`: string (text search in description/merchant)
- `dateRange`: { start: Date; end: Date } | undefined

**TypeScript Definition**:
```typescript
interface Filter {
  categories: string[];
  merchants: string[];
  amountMin?: number;
  amountMax?: number;
  searchText: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

### SortConfig
Table sorting configuration.

**Fields**:
- `field`: keyof Transaction (field to sort by)
- `direction`: 'asc' | 'desc' (sort direction)

**TypeScript Definition**:
```typescript
interface SortConfig {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}
```

## State Model

### AppState
Main application state managed by React Context.

**Fields**:
- `transactions`: Transaction[] (all loaded transactions)
- `filteredTransactions`: Transaction[] (transactions after applying filters)
- `kpi`: KPI | null (calculated metrics)
- `categoryData`: CategorySummary[] (chart data)
- `filter`: Filter (current filter settings)
- `sort`: SortConfig | null (current sort settings)
- `isLoading`: boolean (file processing state)
- `error`: string | null (error message)

**TypeScript Definition**:
```typescript
interface AppState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  kpi: KPI | null;
  categoryData: CategorySummary[];
  filter: Filter;
  sort: SortConfig | null;
  isLoading: boolean;
  error: string | null;
}
```

### AppActions
Actions to modify application state.

**TypeScript Definition**:
```typescript
type AppAction =
  | { type: 'LOAD_TRANSACTIONS_START' }
  | { type: 'LOAD_TRANSACTIONS_SUCCESS'; payload: Transaction[] }
  | { type: 'LOAD_TRANSACTIONS_ERROR'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<Filter> }
  | { type: 'CLEAR_FILTER' }
  | { type: 'SET_SORT'; payload: SortConfig }
  | { type: 'CLEAR_SORT' }
  | { type: 'FILTER_BY_CATEGORY'; payload: string }
  | { type: 'CLEAR_DATA' };
```

## Data Validation

### CSV Format Validation
**Required Headers**: `date`, `amount`, `category`, `description`, `merchant`
**Optional Headers**: `account`, `is_transfer`

**Validation Rules**:
1. File must have header row with required columns
2. All required fields must be non-empty
3. Date format must be YYYY-MM-DD
4. Amount must be valid number format
5. All transactions must be within same month
6. No duplicate transactions (same date, amount, merchant, description)

### Business Rules
1. **Single Month Validation**: All transaction dates must be within the same calendar month
2. **Transfer Exclusion**: Transactions with `isTransfer=true` are excluded from KPI calculations
3. **Duplicate Removal**: Exact duplicates based on (date, amount, merchant, description) are automatically removed
4. **Currency Consistency**: All amounts assumed to be in CAD format
5. **Reconciliation**: KPI totals must exactly match sum of filtered transaction amounts

## Data Transformation Pipeline

### File Upload → Transactions
1. **Parse CSV/Excel**: Extract raw data using Papa Parse or SheetJS
2. **Validate Headers**: Ensure required columns exist
3. **Transform Rows**: Convert each row to Transaction object
4. **Validate Data**: Apply business rules and data validation
5. **Remove Duplicates**: Filter exact duplicates
6. **Generate IDs**: Add UUID for each transaction

### Transactions → KPI
1. **Filter Transfers**: Exclude transactions where `isTransfer=true`
2. **Calculate Totals**: Sum positive (income) and negative (spending) amounts
3. **Generate Period**: Extract month/year from transaction dates
4. **Count Transactions**: Total number of valid transactions

### Transactions → CategorySummary
1. **Group by Category**: Aggregate transactions by category field
2. **Separate Income/Expense**: Split into positive and negative amounts
3. **Calculate Percentages**: Based on total spending/income
4. **Sort by Amount**: Order for chart display

### Filter Application
1. **Text Search**: Filter description and merchant fields (case-insensitive)
2. **Category Filter**: Include only selected categories
3. **Merchant Filter**: Include only selected merchants
4. **Amount Range**: Filter by min/max amount values
5. **Date Range**: Filter by date range (if specified)

## Error Handling

### File Processing Errors
- **Invalid file format**: "Please upload a valid CSV or Excel file"
- **Missing required columns**: "File must contain columns: date, amount, category, description, merchant"
- **Empty file**: "File contains no transaction data"
- **Invalid date format**: "Date must be in YYYY-MM-DD format"
- **Invalid amount format**: "Amount must be a valid number"
- **Multiple months**: "All transactions must be within the same month"

### Data Validation Errors
- **No transactions after validation**: "No valid transactions found in file"
- **All transactions are transfers**: "File contains only transfer transactions"
- **Memory limit exceeded**: "File too large - please limit to 10,000 transactions"

## Performance Considerations

### Memory Optimization
- Use efficient data structures for large transaction arrays
- Implement pagination/virtualization for table display
- Cache filtered results to avoid recalculation

### Rendering Optimization
- Memoize expensive calculations (KPI, category summaries)
- Use React.memo for pure components
- Implement debouncing for filter inputs

### Storage Optimization
- Compress data before localStorage storage
- Implement incremental updates for large datasets
- Clear old data automatically based on age