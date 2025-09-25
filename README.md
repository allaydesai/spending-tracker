# CSV Transaction Dashboard

A powerful, local-first web application for analyzing CSV transaction data with interactive dashboards, charts, and comprehensive filtering capabilities. Built with Next.js, React, TypeScript, and modern web technologies.

## 🌟 Features

- **📁 File Upload**: Drag-and-drop CSV/Excel file upload with real-time validation
- **📊 Interactive Dashboard**: Financial KPIs with income, spending, and net amount tracking
- **📈 Dynamic Charts**: Interactive category breakdowns with pie and bar chart views
- **🔍 Advanced Filtering**: Filter by category, merchant, amount range, and text search
- **📋 Smart Table**: Sortable, paginated transaction table with virtualization
- **💾 Export Options**: Export filtered data to CSV or comprehensive PDF reports
- **🔒 Privacy-First**: All data processing happens locally in your browser
- **📱 Mobile-Responsive**: Optimized for all devices with touch-friendly interactions
- **⚡ High Performance**: <2 second load times, handles 10k+ transactions efficiently

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed on your system
- A CSV or Excel file with transaction data

### Installation & Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd spending-tracker
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Application**:
   Open http://localhost:3000/ in your browser

4. **Upload Sample Data** (optional):
   Use the provided test files: `test-proper-format.csv` or `test-single-day.csv`

## 💾 Data Persistence

The application automatically saves your data and preferences locally:

- **Transaction Data**: Uploaded data persists between browser sessions
- **Filter Preferences**: Your selected filters are remembered
- **No Manual Saving**: Everything saves automatically as you work
- **Data Storage**: Uses browser localStorage (no external servers)
- **Clear Data**: Use the "Clear Data" button to remove saved information

When you reload the page, your previously uploaded transactions and applied filters will be restored automatically.

## 📋 CSV File Format

Your CSV file must include these **required columns**:

| Column | Description | Format | Example |
|--------|-------------|--------|---------|
| `date` | Transaction date | YYYY-MM-DD | 2025-09-15 |
| `amount` | Transaction amount | Decimal number | -89.50 or 2500.00 |
| `category` | Expense/income category | Text | Groceries, Salary, Housing |
| `description` | Transaction details | Text | "Walmart Supercentre #1234" |
| `merchant` | Merchant/payee name | Text | Walmart, Employer Inc |

**Optional columns**:
- `account` - Account name (e.g., "RBC Chequing")
- `is_transfer` - Mark transfers (true/false, excludes from KPIs)

### Sample CSV Format:
```csv
date,amount,category,description,merchant,account,is_transfer
2025-09-01,-1850.00,Housing,"Rent - September",Landlord Co,RBC Chequing,false
2025-09-03,-72.43,Groceries,"Walmart Supercentre",Walmart,RBC Visa,false
2025-09-04,2500.00,Salary,"Payroll Sep",Employer Inc,RBC Chequing,false
```

## 🎯 User Journeys

### 1. First-Time User: Upload and Analyze Transactions

**Goal**: Upload transaction data and explore financial insights

**Steps**:
1. **Open Application** → Visit http://localhost:3000/
2. **Upload File** → Drag-and-drop your CSV file or click "Upload CSV"
3. **View Dashboard** → Automatically displays:
   - **KPIs**: Total income, spending, net amount, transaction count
   - **Category Chart**: Visual breakdown of spending by category
   - **Transaction Table**: Complete list of all transactions
4. **Explore Data** → Scroll through transactions, view chart details

**Expected Results**:
- ✅ File uploads and processes within 2-5 seconds
- ✅ KPIs show accurate financial summary
- ✅ Chart displays spending categories visually
- ✅ All transactions appear in sortable table

---

### 2. Category Analysis: Understand Spending Patterns

**Goal**: Analyze spending by specific categories

**Steps**:
1. **View Category Chart** → Examine pie/bar chart on dashboard
2. **Filter by Category** → Click any category segment in chart
3. **Review Filtered Data** → Table shows only transactions from selected category
4. **Switch Chart Views** → Toggle between pie and bar chart views
5. **Compare Categories** → Use "Income/Expenses/All" toggle to compare

**Pro Tips**:
- Click same category again to clear filter
- Use "Clear Filters" button to reset view
- Bar chart better for comparing many categories

---

### 3. Transaction Search and Filtering

**Goal**: Find specific transactions or filter by criteria

**Steps**:
1. **Text Search**:
   - Use search box to find transactions by description or merchant
   - Search is real-time and case-insensitive

2. **Amount Filtering**:
   - Set minimum/maximum amount ranges
   - Works with negative values for expenses

3. **Advanced Filtering**:
   - Select multiple categories from dropdown
   - Choose specific merchants
   - Combine multiple filter types

4. **Clear Filters** → Use "Clear Filters" button to reset

**Use Cases**:
- Find all Walmart transactions: Search "walmart"
- Show expenses over $100: Set minimum amount to -100
- View only dining expenses: Filter by "Dining" category

---

### 4. Data Export and Reporting

**Goal**: Export filtered data for external analysis or record-keeping

**Steps**:
1. **Apply Filters** (optional) → Filter data to desired subset
2. **Choose Export Format**:
   - **CSV Export**: Raw data for spreadsheet analysis
   - **PDF Export**: Professional report with KPIs and transaction table

3. **Download File** → File automatically downloads with timestamp

**Export Features**:
- **CSV**: Preserves original format, includes only filtered transactions
- **PDF**: Multi-page report with:
  - Executive summary with KPIs
  - Complete transaction table
  - Generated date and period information

---

### 5. Performance Testing with Large Datasets

**Goal**: Test application with large transaction files

**Steps**:
1. **Prepare Large File** → Create CSV with 1000+ transactions
2. **Upload File** → Monitor processing time (should be <5 seconds)
3. **Test Interactions**:
   - Chart rendering speed
   - Table scrolling performance
   - Filter response time
4. **Memory Monitoring** → Check browser memory usage stays <512MB

---

### 6. Mobile Usage

**Goal**: Use application effectively on mobile devices

**Steps**:
1. **Access on Mobile** → Open application in mobile browser
2. **Upload File** → Use mobile file picker or cloud storage
3. **Navigate Dashboard**:
   - Swipe through KPI cards
   - Tap chart segments to filter
   - Scroll transaction table
4. **Use Touch Controls** → All buttons sized for touch (44px+)

**Mobile-Specific Features**:
- Responsive layout adapts to screen size
- Touch-optimized interactions
- Readable text without zooming
- Mobile-friendly file upload

## 🛠 Advanced Usage

### Performance Optimization
- **Large Files**: Application handles 10k+ transactions efficiently
- **Memory Management**: Uses virtualization for large datasets
- **Caching**: Filters and data persist between sessions

### Data Validation
- **File Format**: Validates CSV/Excel format before processing
- **Required Fields**: Ensures all required columns are present
- **Date Validation**: Confirms all transactions are within same month
- **Duplicate Detection**: Automatically removes duplicate transactions

### Error Handling
- **Invalid Files**: Clear error messages for format issues
- **Missing Data**: Helpful guidance for required fields
- **Processing Errors**: User-friendly error reporting

## 📱 Browser Compatibility

**Supported Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Requirements**:
- JavaScript enabled
- Local storage available
- File API support

## 🔒 Privacy & Security

- **Local Processing**: All data stays in your browser
- **No Server**: No data transmitted to external services
- **Data Persistence**: Data saved locally using browser localStorage
- **Filter Memory**: Your filters and preferences are remembered between sessions
- **Offline Capable**: Works without internet after initial load
- **No Tracking**: No analytics or user tracking

## 🚨 Troubleshooting

### Common Issues

**File Upload Fails**:
- Check file format (CSV or .xlsx only)
- Verify required columns are present
- Ensure file size is under 10MB

**Slow Performance**:
- Check file size (optimize for <10k transactions)
- Close other browser tabs
- Clear browser cache

**Charts Not Displaying**:
- Verify transactions have category data
- Check browser console for JavaScript errors
- Refresh page and re-upload file

**Export Not Working**:
- Check browser allows downloads
- Verify filtered data exists
- Try different export format

### Getting Help

1. Check browser console for error messages
2. Verify CSV format matches requirements
3. Test with provided sample file
4. Clear browser cache and try again

## 🏗 Technical Details

**Built With**:
- Next.js 14+ with React 18+ and TypeScript
- Tailwind CSS for styling
- Radix UI components for accessibility
- Recharts for visualizations
- SheetJS (XLSX) for CSV/Excel processing
- Lucide React for icons
- React Hook Form for form management

**Performance Targets**:
- Dashboard load: <2 seconds
- File import: <5 seconds
- Memory usage: <512MB
- Bundle size: <2MB

## 📞 Support

For technical issues or feature requests, please check the browser console for error details and ensure your CSV file matches the required format.

---

**Ready to analyze your spending? Upload your CSV file and start exploring your financial data! 📊💰**