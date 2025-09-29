"use client"

import { useState, useEffect } from "react"
import { startOfDay, endOfDay } from "date-fns"
import Link from "next/link"
import { FileUpload } from "@/components/file-upload"
import { KPIDisplay } from "@/components/kpi-display"
import { CategoryChart } from "@/components/category-chart"
import { TransactionTable } from "@/components/transaction-table"
import { FilterControls } from "@/components/filter-controls"
import { SpendingCalendar } from "@/components/calendar/spending-calendar"
import { CalendarErrorBoundary } from "@/components/calendar/calendar-error-boundary"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Trash2, AlertCircle, Upload, Database, FileText } from "lucide-react"
import { DataProcessorService } from "@/lib/data-processor"
import { dataService, type DataSource } from "@/lib/services/data-service"
import type { Transaction, KPI, CategorySummary, Filter } from "@/lib/data-processor"
import type { DailySpending } from "@/lib/types/daily-spending"

export default function SpendingTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([])
  const [filter, setFilter] = useState<Filter>({
    categories: [],
    merchants: [],
    searchText: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  // Load saved data source preference, default to database for new users
  const [dataSource, setDataSource] = useState<DataSource>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spending-tracker-data-source')
      return (saved as DataSource) || 'database'
    }
    return 'database'
  })
  const [storageStatus, setStorageStatus] = useState<any>(null)

  const hasData = transactions.length > 0

  // Load data and initialize data source
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Set data source and load transactions
        dataService.setDataSource(dataSource)

        // Get storage status
        const status = await dataService.getStorageStatus()
        setStorageStatus(status)

        // Load transactions
        const result = await dataService.getTransactions({ limit: 1000 })

        if (result.transactions.length > 0) {
          // Convert API format to internal format
          const transactionsWithDates = result.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }))

          setTransactions(transactionsWithDates)

          // Recalculate derived data
          const kpiData = DataProcessorService.calculateKPI(transactionsWithDates)
          const categoryData = DataProcessorService.calculateCategoryData(transactionsWithDates)
          setKpi(kpiData)
          setCategoryData(categoryData)
        }

        // Load saved filters
        const savedFilter = localStorage.getItem("spending-tracker-filters")
        if (savedFilter) {
          try {
            const parsed = JSON.parse(savedFilter)
            if (parsed.dateRange) {
              parsed.dateRange = {
                start: new Date(parsed.dateRange.start),
                end: new Date(parsed.dateRange.end),
              }
            }
            setFilter(parsed)
          } catch (error) {
            console.error("Failed to load saved filter:", error)
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        setError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [dataSource])

  // Apply filters whenever filter or transactions change
  useEffect(() => {
    const filtered = DataProcessorService.applyFilters(transactions, filter)
    setFilteredTransactions(filtered)

    // Save filter to localStorage (align with existing backend key)
    localStorage.setItem("spending-tracker-filters", JSON.stringify(filter))
  }, [transactions, filter])

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const processedTransactions = await DataProcessorService.processFile(file)

      if (processedTransactions.length === 0) {
        throw new Error("No valid transactions found in the file.")
      }

      setTransactions(processedTransactions)

      // Calculate KPI and category data
      const kpiData = DataProcessorService.calculateKPI(processedTransactions)
      const categoryData = DataProcessorService.calculateCategoryData(processedTransactions)

      setKpi(kpiData)
      setCategoryData(categoryData)

      // Save to localStorage (align with existing backend shape)
      localStorage.setItem(
        "spending-tracker-data",
        JSON.stringify({ transactions: processedTransactions, lastUpdated: new Date().toISOString() })
      )

      // Reset filters
      setFilter({
        categories: [],
        merchants: [],
        searchText: "",
      })
    } catch (error) {
      console.error("File processing error:", error)
      setError(error instanceof Error ? error.message : "Failed to process file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = () => {
    setTransactions([])
    setFilteredTransactions([])
    setKpi(null)
    setCategoryData([])
    setFilter({
      categories: [],
      merchants: [],
      searchText: "",
    })
    setSelectedCategory("")
    setSelectedDate(null)

    // Clear localStorage
    localStorage.removeItem("spending-tracker-data")
    localStorage.removeItem("spending-tracker-filters")
  }

  const handleExport = () => {
    try {
      const csvContent = DataProcessorService.exportToCSV(filteredTransactions)
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `spending-tracker-export-${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("Export error:", error)
      setError("Failed to export data")
    }
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    if (category) {
      setFilter((prev) => ({
        ...prev,
        categories: [category],
      }))
    } else {
      setFilter((prev) => ({
        ...prev,
        categories: [],
      }))
    }
  }

  const handleCalendarDayClick = (date: string, spending: DailySpending | null) => {
    setSelectedDate(date)
    if (spending) {
      // Use local midday to avoid UTC parsing shifting the date, then include the full day range
      const localMidday = new Date(`${date}T12:00:00`)
      setFilter((prev) => ({
        ...prev,
        dateRange: {
          start: startOfDay(localMidday),
          end: endOfDay(localMidday),
        },
      }))
      // Don't clear category filter - filters should be independent
    }
  }

  const handleDataSourceChange = (newDataSource: DataSource) => {
    if (newDataSource !== dataSource) {
      setDataSource(newDataSource)
      // Save preference to localStorage
      localStorage.setItem('spending-tracker-data-source', newDataSource)
      // Don't reset state immediately - let useEffect handle data loading
    }
  }

  const availableCategories = DataProcessorService.getUniqueCategories(transactions)
  const availableMerchants = DataProcessorService.getUniqueMerchants(transactions)

  // Empty state component that shows dashboard UI with appropriate message
  const EmptyStateContent = () => (
    <>
      {/* Filter Controls - keep them visible for consistency */}
      <div className="mb-8">
        <FilterControls
          filter={filter}
          onFilterChange={setFilter}
          availableCategories={[]}
          availableMerchants={[]}
        />
      </div>

      {/* Empty State Message */}
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            {dataSource === 'database' ? (
              <Database className="w-8 h-8 text-muted-foreground" />
            ) : (
              <FileText className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {dataSource === 'database' ? 'No transactions in database' : 'No data uploaded'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {dataSource === 'database'
              ? 'Import your CSV file to start tracking your spending in the database.'
              : 'Upload your CSV or Excel file to analyze your spending patterns.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/import">
              <Button size="lg" className="gap-2">
                <Upload className="w-5 h-5" />
                Import CSV
              </Button>
            </Link>
            {dataSource === 'file' && (
              <>
                <span className="text-sm text-muted-foreground self-center">or</span>
                <div className="max-w-sm">
                  <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} error={error} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Spending Tracker</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {kpi?.transactionCount} transactions • {kpi?.period}
              </span>
              {storageStatus && (
                <Badge variant={storageStatus.connected ? "default" : "secondary"} className="text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  {dataSource === 'database' ? 'Database' : 'File Storage'}
                </Badge>
              )}
            </div>
          </div>

          {/* Data Source Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="data-source" className="text-sm font-medium">
                Data Source:
              </label>
              <Select value={dataSource} onValueChange={handleDataSourceChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      File
                    </div>
                  </SelectItem>
                  <SelectItem value="database">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Database
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/import">
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </Link>
            <Button variant="outline" onClick={handleExport} className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleClearData} className="gap-2 bg-transparent">
              <Trash2 className="w-4 h-4" />
              Clear Data
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Storage Status Card */}
        {dataSource === 'database' && storageStatus && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${storageStatus.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">
                      Database {storageStatus.connected ? 'Connected' : 'Disconnected'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {storageStatus.transactionCount.toLocaleString()} transactions •
                      {Math.round(storageStatus.databaseSize / 1024)} KB
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  v{storageStatus.version}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content - either dashboard with data or empty state */}
        {hasData ? (
          <>
            {/* Filter Controls */}
            <div className="mb-8">
              <FilterControls
                filter={filter}
                onFilterChange={setFilter}
                availableCategories={availableCategories}
                availableMerchants={availableMerchants}
              />
            </div>

            {/* KPI Cards */}
            <div className="mb-8">
              <KPIDisplay kpi={kpi} />
            </div>

            {/* Spending Calendar */}
            <div className="mb-8">
              <CalendarErrorBoundary>
                <div className="bg-card rounded-lg border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4">Spending Calendar</h2>
                  <SpendingCalendar
                    transactions={transactions}
                    onDayClick={handleCalendarDayClick}
                    loading={isLoading}
                    className="w-full"
                  />
                </div>
              </CalendarErrorBoundary>
            </div>

            {/* Chart and Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <CategoryChart
                  data={categoryData}
                  onCategoryFilter={handleCategoryFilter}
                  selectedCategory={selectedCategory}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionTable transactions={filteredTransactions} />
              </div>
            </div>
          </>
        ) : (
          <EmptyStateContent />
        )}
      </div>
    </div>
  )
}
