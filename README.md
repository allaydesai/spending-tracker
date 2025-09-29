# Spending Tracker with Persistent Storage

A powerful, full-stack web application for analyzing CSV transaction data with interactive dashboards, charts, and comprehensive filtering capabilities. Now featuring **persistent database storage** for permanent data management and advanced CSV import capabilities.

Built with Next.js, React, TypeScript, SQLite, and modern web technologies.

## 🌟 Key Features

### 💾 **Dual Storage Options**
- **🗄️ Database Storage**: Persistent SQLite database for permanent data storage
- **📁 File Storage**: Quick analysis with browser localStorage (legacy mode)
- **🔄 Seamless Switching**: Toggle between storage modes instantly

### 📊 **Advanced Import System**
- **📁 Professional CSV Import**: Dedicated import page with validation and progress tracking
- **🔍 Duplicate Detection**: Automatic detection and prevention of duplicate transactions
- **📈 Smart Validation**: Comprehensive error reporting and data quality checks
- **💪 Bulk Processing**: Handle large CSV files (up to 10MB, 10,000+ transactions)

### 📊 **Interactive Analytics**
- **📊 Real-time Dashboard**: Financial KPIs with income, spending, and net amount tracking
- **📈 Dynamic Charts**: Interactive category breakdowns with pie and bar chart views
- **🗓️ Spending Calendar**: Visual heatmap of daily spending patterns
- **🔍 Advanced Filtering**: Filter by category, merchant, amount range, date range, and text search

### 🛠️ **Professional Features**
- **📋 Smart Table**: Sortable, paginated transaction table with advanced search
- **💾 Export Options**: Export filtered data to CSV with comprehensive reporting
- **🔒 Data Security**: Local SQLite database with no external dependencies
- **📱 Mobile-Responsive**: Optimized for all devices with touch-friendly interactions
- **⚡ High Performance**: <2 second load times, handles 10k+ transactions efficiently

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed on your system
- A CSV file with transaction data

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

4. **Database Initialization**:
   The SQLite database automatically initializes on first run at `./data/spending.db`

## 💾 Storage Architecture

### Database Storage (Recommended)
- **Persistent Data**: SQLite database stores transactions permanently
- **Advanced Features**: Duplicate detection, data validation, bulk operations
- **Performance**: Optimized with indexes and query optimization
- **Reliability**: ACID compliance with automatic backup capabilities

### File Storage (Legacy)
- **Quick Analysis**: Browser localStorage for temporary analysis
- **No Setup**: Works immediately without database setup
- **Migration Path**: Easy migration to database storage when ready

### Data Source Selection
Use the data source selector in the dashboard header to switch between:
- **📁 File**: Browser localStorage (temporary)
- **🗄️ Database**: SQLite database (permanent)

## 📋 CSV File Format

Your CSV file must include these **required columns**:

| Column | Description | Format | Example |
|--------|-------------|--------|---------|
| `date` | Transaction date | YYYY-MM-DD, MM/DD/YYYY | 2025-09-15 |
| `amount` | Transaction amount | Decimal number | -89.50 or 2500.00 |
| `description` | Transaction details | Text | "Walmart Supercentre #1234" |

**Optional columns**:
- `category` - Transaction category (e.g., "Groceries", "Dining")
- `merchant` - Merchant name
- `account` - Account name

### Sample CSV Format:
```csv
date,amount,description,category
2025-01-01,-50.00,Grocery Store,Food
2025-01-02,-25.50,Coffee Shop,Dining
2025-01-03,2500.00,Salary,Income
```

## 🎯 New User Journeys

### 1. New User: Database-First Experience

**Goal**: Start with persistent storage and import transaction data

**Steps**:
1. **Open Application** → Visit http://localhost:3000/
2. **Database Auto-Setup** → SQLite database initializes automatically
3. **Import Data** → Click "Import CSV (Recommended)" button
4. **Upload CSV** → Drag-and-drop file or browse to select
5. **Configure Import** → Choose options:
   - Skip duplicate transactions (recommended)
   - Validate only (preview mode)
6. **Review Results** → See detailed import summary:
   - ✅ Imported transactions count
   - ⚠️ Duplicate transactions detected
   - ❌ Validation errors with row details
7. **Explore Dashboard** → View analytics with database storage indicator

**Expected Results**:
- ✅ Database connection established automatically
- ✅ CSV processed with duplicate detection
- ✅ Comprehensive import reporting
- ✅ Persistent data across browser sessions

---

### 2. Existing User: Migration from File Storage

**Goal**: Migrate existing file data to permanent database storage

**Steps**:
1. **Current State** → Dashboard shows existing file data (e.g., 84 transactions)
2. **Discover Database** → Notice data source selector with "Database" option
3. **Switch to Database** → Select "Database" from dropdown
4. **See Empty State** → Database has no data initially
5. **Export Existing Data** → Use "Export" button to download current data as CSV
6. **Import to Database** → Click "Import CSV" and upload the exported file
7. **Verify Migration** → Confirm all data appears in database mode
8. **Continue with Database** → Use database as primary storage going forward

**Migration Benefits**:
- 🛡️ Permanent storage (survives browser data clearing)
- 📊 Advanced duplicate detection
- 🔍 Better query performance for large datasets
- 📈 Enhanced analytics capabilities

---

### 3. Power User: Dual Storage Workflow

**Goal**: Use both storage modes for different purposes

**Steps**:
1. **Database for Production** → Keep main financial data in database
2. **File for Quick Analysis** → Upload one-off files for temporary analysis
3. **Compare Datasets** → Switch between sources to compare different periods
4. **Export and Share** → Generate reports from either storage source

**Use Cases**:
- Monthly statements in database, yearly analysis in file mode
- Personal data in database, business expenses via file upload
- Historical data in database, current month analysis in file mode

---

### 4. Professional CSV Import Workflow

**Goal**: Import large, complex CSV files with validation

**Steps**:
1. **Navigate to Import** → Click "Import CSV" from dashboard
2. **Review Format Guide** → Check CSV format requirements and examples
3. **Upload Large File** → Drop file up to 10MB (10,000+ transactions)
4. **Preview Data** → See file preview with headers and sample rows
5. **Configure Options**:
   - ✅ Skip duplicates (prevents duplicate imports)
   - ⚪ Validate only (test run without importing)
6. **Monitor Progress** → Real-time progress bar and status updates
7. **Review Detailed Results**:
   - **Import Summary**: Total rows, imported, duplicates, errors
   - **Imported Transactions**: Preview of successfully imported data
   - **Duplicates Found**: List of duplicate transactions with existing IDs
   - **Validation Errors**: Row-by-row error details with field-specific messages
8. **Export Results** → Download import session results as JSON
9. **Return to Dashboard** → View imported data immediately

**Advanced Features**:
- 🔍 Row-level error reporting with specific field validation
- 📊 Statistical summary of import session
- 💾 Export import results for record-keeping
- 🔄 One-click option to start new import

---

### 5. Data Analysis and Reporting

**Goal**: Comprehensive financial analysis with persistent data

**Steps**:
1. **Dashboard Overview** → View KPIs with storage status indicator
2. **Storage Status** → Monitor database connection and transaction count
3. **Interactive Filtering**:
   - 🗓️ Date range selection
   - 💰 Amount range filtering
   - 🏷️ Category and merchant filtering
   - 🔍 Text search across descriptions
4. **Visual Analytics**:
   - 📊 Category breakdown charts
   - 🗓️ Spending calendar heatmap
   - 📈 Trend analysis over time
5. **Data Export** → Export filtered results for external analysis
6. **Session Persistence** → All data and filters saved automatically

---

### 6. Error Handling and Troubleshooting

**Goal**: Handle common issues gracefully

**Common Scenarios**:

**Database Connection Issues**:
- **Indicator**: Red status dot in storage status card
- **Solution**: Database auto-reconnects on next page load
- **Fallback**: Switch to file storage for immediate analysis

**CSV Import Errors**:
- **Missing Columns**: Clear error message with required format
- **Invalid Dates**: Row-specific error reporting
- **Large Files**: Progress indicator prevents timeout confusion
- **Duplicates**: Transparent reporting with existing transaction IDs

**Performance Issues**:
- **Large Datasets**: Automatic pagination and virtualization
- **Memory Management**: Efficient data processing with cleanup
- **Browser Compatibility**: Graceful degradation for older browsers

## 🛠 Advanced Configuration

### Database Setup

**Automatic Initialization**:
```javascript
// Database auto-configures on first run
- Location: ./data/spending.db
- Schema: Auto-migrated to latest version
- Optimization: WAL mode for better performance
- Backup: Manual backup recommended for production
```

**Manual Database Management**:
```bash
# View database info
npm run db:status

# Manual migration (if needed)
npm run db:migrate

# Create backup
cp ./data/spending.db ./data/spending-backup.db
```

### Performance Tuning

**For Large Datasets (10k+ transactions)**:
- Database storage recommended over file storage
- Enable browser hardware acceleration
- Consider database cleanup for old data

**Memory Optimization**:
- Import large files in database mode
- Use filters to reduce displayed data
- Clear browser cache periodically

## 🔧 API Documentation

### Storage Status Endpoint
```
GET /api/storage/status
Response: {
  connected: boolean,
  transactionCount: number,
  databaseSize: number,
  version: string
}
```

### Transaction Import Endpoint
```
POST /api/transactions/import
Body: FormData with 'file' and 'options'
Response: {
  session: ImportSession,
  imported: Transaction[],
  duplicates: DuplicateInfo[],
  errors: ValidationError[]
}
```

### Transactions API
```
GET /api/transactions?page=1&limit=100&category=Food
Response: {
  transactions: Transaction[],
  pagination: PaginationInfo
}
```

## 🔒 Privacy & Security

- **Local Database**: SQLite database stored locally, no external connections
- **No Data Transmission**: All processing happens on your machine
- **Offline Capable**: Full functionality without internet connection
- **Data Ownership**: Complete control over your financial data
- **No Tracking**: Zero analytics or user behavior tracking

## 🚨 Troubleshooting

### Database Issues

**Database Connection Failed**:
1. Check file permissions in `./data/` directory
2. Restart application (`npm run dev`)
3. Check disk space availability
4. Fallback to file storage if needed

**Import Errors**:
1. Verify CSV format matches requirements
2. Check file size (<10MB limit)
3. Review error details in import results
4. Try validation-only mode first

**Performance Issues**:
1. Switch to database storage for large datasets
2. Use filters to reduce data display
3. Close unnecessary browser tabs
4. Clear browser cache and reload

### Migration Issues

**File to Database Migration**:
1. Export current file data to CSV
2. Switch to database mode
3. Import the exported CSV file
4. Verify data integrity
5. Continue using database storage

## 📞 Support

**For Technical Issues**:
1. Check browser console for error messages
2. Verify CSV format with provided examples
3. Test database connection via storage status
4. Try file storage as fallback option

**For Feature Requests**:
- Database storage enhancements
- Additional import formats
- Advanced analytics features
- Export format options

---

## 🏗 Technical Architecture

**Frontend**: Next.js 14+ with React 18+ and TypeScript
**Database**: SQLite with better-sqlite3 driver
**Import Processing**: Streaming CSV parser with validation
**Storage Layer**: Repository pattern with service abstraction
**API**: RESTful endpoints with comprehensive error handling
**UI Components**: Tailwind CSS with Radix UI and shadcn/ui

**Performance Targets**:
- Dashboard load: <2 seconds
- CSV import: <5 seconds for 10k transactions
- Database operations: <100ms average
- Memory usage: <512MB for large datasets

---

**Ready to manage your finances with persistent storage? Import your CSV data and start building your financial insights! 📊💰**