# Quickstart Guide: CSV Transaction Dashboard

**Date**: 2025-09-22
**Feature**: CSV Transaction Dashboard
**Purpose**: Integration test scenarios and user acceptance validation

## Prerequisites

### Development Environment
- Node.js 18+ installed
- Git repository cloned
- Package dependencies installed (`npm install`)
- Development server running (`npm run dev`)

### Test Data Requirements
Prepare test CSV files with the following characteristics:

**Valid Test File (happy-path.csv)**:
```csv
date,amount,category,description,merchant,account,is_transfer
2025-09-01,-1850.00,Housing,"Rent - September",Landlord Co,RBC Chequing,false
2025-09-03,-72.43,Groceries,"Walmart Supercentre #1234",Walmart,RBC Visa,false
2025-09-04,2500.00,Salary,"Payroll Sep",Employer Inc,RBC Chequing,false
2025-09-07,-500.00,Transfers,"Credit Card Payment",RBC Visa Payment,RBC Chequing,true
2025-09-15,-45.99,Dining,"Coffee Shop",Local Cafe,RBC Visa,false
2025-09-20,-120.00,Utilities,"Electricity Bill",Hydro One,RBC Chequing,false
```

**Edge Case Test Files**:
- `empty.csv`: Empty file with headers only
- `invalid-format.csv`: Missing required columns
- `multi-month.csv`: Transactions spanning multiple months
- `large-dataset.csv`: 1000+ transactions for performance testing

## User Acceptance Scenarios

### Scenario 1: Basic File Upload and Dashboard Display
**Goal**: Verify core functionality works end-to-end

**Steps**:
1. Open the application in browser (http://localhost:3000)
2. Verify empty state is displayed with upload prompt
3. Click "Upload CSV" or drag-and-drop `happy-path.csv`
4. Wait for processing (should complete within 2 seconds)
5. Verify dashboard displays:
   - KPIs: Total Spending: $2,688.42, Total Income: $2,500.00, Net: -$188.42
   - Transaction count: 5 (excluding transfers)
   - Category chart with 5 categories
   - Transaction table with 6 rows

**Expected Results**:
- ✅ Upload completes without errors
- ✅ KPIs calculate correctly (excluding transfer)
- ✅ Chart displays all categories with correct amounts
- ✅ Table shows all transactions with proper formatting
- ✅ Load time is under 2 seconds

### Scenario 2: Chart Interaction and Table Filtering
**Goal**: Verify chart-to-table linking functionality

**Steps**:
1. Complete Scenario 1 setup
2. Click on "Groceries" segment in the category chart
3. Verify transaction table filters to show only Groceries transactions
4. Check that filter indicator shows "Category: Groceries"
5. Click "Clear Filters" to reset view
6. Click on "Housing" segment and verify filtering works

**Expected Results**:
- ✅ Clicking chart filters table immediately
- ✅ Filtered table shows only matching transactions
- ✅ Filter indicator is clearly visible
- ✅ Clear filters resets to full dataset
- ✅ Multiple chart segments work correctly

### Scenario 3: Advanced Filtering and Search
**Goal**: Verify all filtering capabilities work together

**Steps**:
1. Complete Scenario 1 setup
2. Use text search: Enter "walmart" in search box
3. Verify table filters to Walmart transactions
4. Add amount filter: Set minimum amount to -100
5. Verify combined filters work (Walmart transactions under $100)
6. Clear search text, keep amount filter
7. Select multiple categories from category filter
8. Verify all filters combine properly

**Expected Results**:
- ✅ Text search is case-insensitive and real-time
- ✅ Amount filters work with negative values
- ✅ Multiple filters combine correctly (AND logic)
- ✅ Filter indicators show all active filters
- ✅ Clearing individual filters works correctly

### Scenario 4: Table Sorting
**Goal**: Verify table sorting functionality

**Steps**:
1. Complete Scenario 1 setup
2. Click "Date" column header to sort by date ascending
3. Verify transactions are sorted chronologically
4. Click "Date" header again to sort descending
5. Click "Amount" header to sort by amount
6. Verify negative amounts sort correctly
7. Test sorting on text columns (Category, Merchant)

**Expected Results**:
- ✅ Sort indicator appears in column header
- ✅ Date sorting works chronologically
- ✅ Amount sorting handles negative values correctly
- ✅ Text sorting is alphabetical
- ✅ Sort persists when filters are applied

### Scenario 5: Data Export
**Goal**: Verify CSV and PDF export functionality

**Steps**:
1. Complete Scenario 1 setup
2. Apply some filters (e.g., category = "Groceries")
3. Click "Export CSV" button
4. Verify CSV file downloads with filtered data
5. Open CSV in spreadsheet software and verify format
6. Click "Export PDF" button
7. Verify PDF downloads and contains summary + transaction table

**Expected Results**:
- ✅ CSV export includes only filtered transactions
- ✅ CSV format matches original upload format
- ✅ PDF includes KPI summary section
- ✅ PDF transaction table is well-formatted
- ✅ Filenames include date and period information

## Error Handling Scenarios

### Scenario 6: Invalid File Upload
**Goal**: Verify graceful error handling

**Steps**:
1. Upload `invalid-format.csv` (missing required columns)
2. Verify clear error message appears
3. Upload `multi-month.csv` (spans multiple months)
4. Verify specific validation error
5. Upload empty file
6. Verify appropriate empty file message
7. Upload non-CSV file (e.g., .txt)
8. Verify file format error

**Expected Results**:
- ✅ Error messages are clear and actionable
- ✅ User can try uploading different file
- ✅ No crashes or undefined states
- ✅ Error messages specify exact problem

### Scenario 7: Large File Performance
**Goal**: Verify performance with large datasets

**Steps**:
1. Upload `large-dataset.csv` (1000+ transactions)
2. Measure upload and processing time
3. Test chart rendering performance
4. Test table scrolling and filtering performance
5. Monitor browser memory usage
6. Test export functionality with large dataset

**Expected Results**:
- ✅ Processing completes within 5 seconds
- ✅ Chart renders smoothly with many categories
- ✅ Table scrolling is responsive
- ✅ Memory usage stays under 512MB
- ✅ Export works without browser hang

## Mobile Device Testing

### Scenario 8: Mobile Responsiveness
**Goal**: Verify mobile-first design works correctly

**Steps**:
1. Open application on mobile device or browser mobile mode
2. Complete file upload process
3. Verify dashboard layout adapts to small screen
4. Test chart interactions with touch
5. Test table scrolling and filtering on mobile
6. Verify touch targets are at least 44px
7. Test export functionality on mobile

**Expected Results**:
- ✅ Layout is readable and functional on mobile
- ✅ Touch interactions work smoothly
- ✅ Text is legible without zooming
- ✅ Buttons and targets are touch-friendly
- ✅ Export works on mobile browsers

## Performance Validation

### Key Metrics to Measure
- **Initial Load Time**: < 2 seconds to interactive
- **File Processing Time**: < 5 seconds for 1000 transactions
- **Chart Rendering**: < 500ms for initial render
- **Filter Response Time**: < 100ms for real-time filtering
- **Memory Usage**: < 512MB total browser memory
- **Bundle Size**: < 2MB compressed

### Monitoring Commands
```bash
# Build and analyze bundle size
npm run build
npm run analyze

# Run performance tests
npm run test:performance

# Check accessibility
npm run test:a11y

# Memory profiling (manual testing in Chrome DevTools)
```

## Acceptance Criteria Checklist

### Functional Requirements
- [ ] FR-001: CSV/Excel file upload works
- [ ] FR-002: Browser-only processing (no server calls)
- [ ] FR-003: KPIs display correctly (spend, income, net)
- [ ] FR-004: Category chart visualization works
- [ ] FR-005: Transaction table is sortable and filterable
- [ ] FR-006: Category filtering works
- [ ] FR-007: Merchant filtering works
- [ ] FR-008: Amount range filtering works
- [ ] FR-009: Text search works
- [ ] FR-010: Column sorting works
- [ ] FR-011: Chart-to-table linking works
- [ ] FR-012: Load time under 2 seconds
- [ ] FR-013: Required column format handled
- [ ] FR-014: Works offline after initial load
- [ ] FR-015: No authentication required
- [ ] FR-016: No external banking APIs
- [ ] FR-017: No budget tracking
- [ ] FR-018: No ML categorization
- [ ] FR-019: CAD currency handling
- [ ] FR-020: localStorage persistence
- [ ] FR-021: Optional columns handled
- [ ] FR-022: Single month validation
- [ ] FR-023: Decimal format validation
- [ ] FR-024: Duplicate removal
- [ ] FR-025: KPI reconciliation
- [ ] FR-026: CSV export
- [ ] FR-027: PDF export (optional)

### Non-Functional Requirements
- [ ] Performance: < 2s load, < 5s import
- [ ] Memory: < 512MB usage
- [ ] Bundle: < 2MB size
- [ ] Mobile: Responsive design works
- [ ] Accessibility: WCAG 2.1 AA compliance
- [ ] Browser: Works in Chrome, Firefox, Safari
- [ ] Error Handling: Graceful failures with clear messages

## Troubleshooting Guide

### Common Issues
1. **Upload fails**: Check file format and required columns
2. **Slow performance**: Check file size and browser memory
3. **Chart not displaying**: Verify data has categories
4. **Filters not working**: Check for JavaScript errors
5. **Export fails**: Verify browser allows downloads

### Debug Information
- Browser console for JavaScript errors
- Network tab for failed requests (should be none)
- Application tab for localStorage data
- Performance tab for slow operations

---

**Sign-off**: This quickstart guide validates the complete user journey and ensures all acceptance criteria are met before considering the feature complete.