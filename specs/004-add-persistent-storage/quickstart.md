# Quick Start Guide: Persistent Storage

## Prerequisites

1. Ensure the application is running:
```bash
npm run dev
```

2. Navigate to http://localhost:3000

## Feature Testing Workflow

### 1. Initial Database Setup
On first run, the database will be automatically created:
- Location: `./data/spending.db`
- Schema migrations applied automatically
- No manual setup required

### 2. Import Your First CSV

1. **Prepare a CSV file** with the following format:
```csv
Date,Amount,Description,Category
2025-01-01,-50.00,Grocery Store,Food
2025-01-02,-25.50,Coffee Shop,Dining
2025-01-03,-100.00,Gas Station,Transport
```

2. **Navigate to Import Page**
   - Click "Import CSV" button on the dashboard
   - Or navigate to `/import`

3. **Upload the CSV**
   - Click "Choose File" or drag and drop
   - File must be under 10MB
   - Wait for validation message

4. **Review Import Results**
   - See count of imported transactions
   - Review any duplicates detected
   - Check for any errors in parsing

### 3. Verify Data Persistence

1. **Check Dashboard**
   - Return to main dashboard
   - Verify transactions appear in visualizations
   - Check that totals are updated

2. **Refresh the Page**
   - Press F5 or refresh browser
   - Confirm data remains visible
   - No need to re-upload CSV

3. **Restart Application** (optional)
   - Stop the dev server (Ctrl+C)
   - Start again with `npm run dev`
   - Data should persist

### 4. Test Duplicate Prevention

1. **Re-upload Same CSV**
   - Upload the same CSV file again
   - System should detect all as duplicates
   - No data should be duplicated

2. **Upload Partial Overlap**
   - Create CSV with some new and some existing transactions
   - Only new transactions should be imported
   - Duplicates listed in results

### 5. Test Data Filtering

1. **Date Range Filter**
   - Use date pickers on dashboard
   - Select specific date range
   - Verify only relevant transactions shown

2. **Category Filter**
   - Select category from dropdown
   - Confirm filtered results

## Test Data

### Sample CSV Files

**basic-transactions.csv** (Valid data):
```csv
Date,Amount,Description,Category
2025-01-01,-45.99,Walmart,Shopping
2025-01-02,-12.50,Starbucks,Dining
2025-01-03,-75.00,Shell Gas,Transport
2025-01-04,2500.00,Salary,Income
2025-01-05,-200.00,Electric Bill,Utilities
```

**duplicate-test.csv** (Contains duplicates):
```csv
Date,Amount,Description,Category
2025-01-01,-45.99,Walmart,Shopping
2025-01-01,-45.99,Walmart,Shopping
2025-01-02,-12.50,Starbucks,Dining
```

**invalid-format.csv** (Will trigger errors):
```csv
Date,Description
2025-01-01,Missing Amount Column
Not-a-date,-50.00,Invalid Date
```

## Validation Checklist

### Core Functionality
- [ ] Database created on first run
- [ ] CSV upload accepts valid files
- [ ] Transactions stored successfully
- [ ] Data persists across page refreshes
- [ ] Data persists across server restarts

### Duplicate Detection
- [ ] Exact duplicates prevented
- [ ] Duplicate count shown in import results
- [ ] Existing data not overwritten

### Error Handling
- [ ] Invalid CSV format shows clear error
- [ ] Files over 10MB rejected with message
- [ ] Malformed data rows reported individually
- [ ] Import can continue despite some errors

### Dashboard Integration
- [ ] Imported data visible in charts
- [ ] Date range filtering works
- [ ] Category filtering works
- [ ] Statistics update correctly

### Performance
- [ ] Dashboard loads in <2 seconds
- [ ] CSV import completes in <5 seconds for typical files
- [ ] No memory errors with 10MB files
- [ ] Smooth scrolling with thousands of transactions

## Common Issues & Solutions

### Issue: "Database locked" error
**Solution**: Close any database viewers and retry

### Issue: Import seems stuck
**Solution**: Check file size (<10MB) and format

### Issue: Duplicates not detected
**Solution**: Verify exact match on date+amount+description

### Issue: Dashboard not updating
**Solution**: Hard refresh (Ctrl+Shift+R) to clear cache

## Advanced Testing

### Large Dataset Test
1. Generate CSV with 10,000 transactions
2. Import and measure time
3. Verify dashboard performance
4. Check memory usage stays under 512MB

### Concurrent Import Test
1. Open two browser tabs
2. Import different CSVs simultaneously
3. Verify both complete successfully
4. Check no data corruption

### Migration Test
1. Create backup of current database
2. Modify schema in migrations
3. Restart application
4. Verify migration applied correctly
5. Check existing data intact