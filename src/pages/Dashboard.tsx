import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FileUpload } from '../components/FileUpload'
import { KPIDisplay } from '../components/KPIDisplay'
import { CategoryChart } from '../components/CategoryChart'
import { TransactionTable } from '../components/TransactionTable'

export const Dashboard = () => {
  const {
    state,
    uploadFile,
    clearFilter,
    setSort,
    filterByCategory,
    clearData,
    exportToCSV,
    exportToPDF,
  } = useApp()

  const [exportLoading, setExportLoading] = useState<'csv' | 'pdf' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const hasData = state.transactions.length > 0

  const handleFileUpload = async (file: File) => {
    await uploadFile(file)
  }

  const handleCategoryClick = (category: string) => {
    if (category === state.filter.categories[0]) {
      // If clicking the same category, clear the filter
      filterByCategory('')
    } else {
      // Filter by the clicked category
      filterByCategory(category)
    }
  }

  const handleExportCSV = async () => {
    setExportLoading('csv')
    setExportError(null)
    try {
      await exportToCSV()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExportLoading(null)
    }
  }

  const handleExportPDF = async () => {
    setExportLoading('pdf')
    setExportError(null)
    try {
      await exportToPDF()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExportLoading(null)
    }
  }

  const selectedCategory = state.filter.categories.length > 0 ? state.filter.categories[0] : null

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Spending Tracker
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload your CSV or Excel file to analyze your spending patterns and track your financial health.
            </p>
          </div>

          {/* File Upload */}
          <div className="max-w-4xl mx-auto">
            <FileUpload
              onFileSelect={handleFileUpload}
              isLoading={state.isLoading}
              error={state.error}
            />
          </div>

          {/* Features Preview */}
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              What you&apos;ll get
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial KPIs</h3>
                <p className="text-gray-600">Track income, spending, and net savings with clear metrics.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Charts</h3>
                <p className="text-gray-600">Visualize spending by category with interactive pie and bar charts.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Filtering</h3>
                <p className="text-gray-600">Filter and sort transactions with advanced search capabilities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {state.filteredTransactions.length} of {state.transactions.length} transactions shown
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filter Status */}
            {(state.filter.categories.length > 0 ||
              state.filter.merchants.length > 0 ||
              state.filter.searchText ||
              state.filter.amountMin !== undefined ||
              state.filter.amountMax !== undefined) && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Filters active:</span>
                {state.filter.categories.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Category: {state.filter.categories.join(', ')}
                  </span>
                )}
                <button
                  onClick={clearFilter}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Export Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                disabled={exportLoading === 'csv' || state.filteredTransactions.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading === 'csv' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Export CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportLoading === 'pdf' || state.filteredTransactions.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportLoading === 'pdf' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Export PDF
              </button>
            </div>

            {/* Clear Data Button */}
            <button
              onClick={clearData}
              className="text-sm text-danger-600 hover:text-danger-800 font-medium"
            >
              Clear Data
            </button>
          </div>
        </div>

        {/* Export Error */}
        {exportError && (
          <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-danger-800">Export Error</h3>
                <p className="text-sm text-danger-700 mt-1">{exportError}</p>
              </div>
              <button
                onClick={() => setExportError(null)}
                className="ml-auto text-danger-600 hover:text-danger-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* KPIs */}
          {state.kpi && (
            <KPIDisplay kpi={state.kpi} isLoading={state.isLoading} />
          )}

          {/* Charts and Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Chart */}
            <CategoryChart
              data={state.categoryData}
              onCategoryClick={handleCategoryClick}
              selectedCategory={selectedCategory}
              isLoading={state.isLoading}
            />

            {/* Transaction Table */}
            <div className="lg:col-span-2">
              <TransactionTable
                transactions={state.filteredTransactions}
                onSort={setSort}
                currentSort={state.sort}
                isLoading={state.isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}