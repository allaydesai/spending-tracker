"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "@/components/file-upload"
import { KPIDisplay } from "@/components/kpi-display"
import { CategoryChart } from "@/components/category-chart"
import { TransactionTable } from "@/components/transaction-table"
import { FilterControls } from "@/components/filter-controls"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Trash2, AlertCircle } from "lucide-react"
import { DataProcessorService } from "@/lib/data-processor"
import type { Transaction, KPI, CategorySummary, Filter } from "@/lib/data-processor"

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

  const hasData = transactions.length > 0

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("spending-tracker-data")
    const savedFilter = localStorage.getItem("spending-tracker-filters")

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Support both { transactions: [] } shape and legacy [] shape
        const rawTransactions = Array.isArray(parsed) ? parsed : parsed.transactions
        if (rawTransactions && Array.isArray(rawTransactions)) {
          const transactionsWithDates = rawTransactions.map((t: any) => ({
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
      } catch (error) {
        console.error("Failed to load saved data:", error)
      }
    }

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
  }, [])

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

  const availableCategories = DataProcessorService.getUniqueCategories(transactions)
  const availableMerchants = DataProcessorService.getUniqueMerchants(transactions)

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-balance">Spending Tracker</h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Upload your CSV or Excel file to analyze your spending patterns and track your financial health.
              </p>
            </div>

            {/* Upload Section */}
            <div className="mb-12">
              <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} error={error} />
            </div>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary rounded"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Analysis</h3>
                <p className="text-muted-foreground text-sm">
                  Get immediate insights into your spending patterns, income, and net worth.
                </p>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-success rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Category Breakdown</h3>
                <p className="text-muted-foreground text-sm">
                  Visualize your spending by category with interactive charts and detailed breakdowns.
                </p>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-warning rounded-sm"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Filtering</h3>
                <p className="text-muted-foreground text-sm">
                  Find specific transactions quickly with powerful search and filtering tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Spending Tracker</h1>
            <p className="text-muted-foreground">
              {kpi?.transactionCount} transactions • {kpi?.period}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
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
      </div>
    </div>
  )
}
