import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CategorySummary } from '../types/models'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { useState } from 'react'

interface CategoryChartProps {
  data: CategorySummary[]
  onCategoryClick?: (category: string) => void
  selectedCategory?: string | null
  isLoading?: boolean
}

interface ChartDataItem {
  category: string
  amount: number
  percentage: number
  count: number
  isIncome: boolean
  color: string
  [key: string]: any // Add index signature for Recharts compatibility
}

const EXPENSE_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
]

const INCOME_COLORS = [
  '#22c55e', // green-500
  '#16a34a', // green-600
  '#15803d', // green-700
  '#166534', // green-800
]

export const CategoryChart = ({
  data,
  onCategoryClick,
  selectedCategory,
  isLoading = false,
}: CategoryChartProps) => {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const [viewType, setViewType] = useState<'expenses' | 'income' | 'all'>('expenses')

  if (isLoading) {
    return (
      <div data-testid="category-chart-loading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">No category data available</p>
        </div>
      </div>
    )
  }

  // Filter data based on view type
  const filteredData = data.filter(item => {
    if (viewType === 'expenses') return !item.isIncome
    if (viewType === 'income') return item.isIncome
    return true
  })

  // Prepare chart data with colors
  const chartData: ChartDataItem[] = filteredData.map((item, index) => ({
    category: item.category,
    amount: Math.abs(item.totalAmount),
    percentage: item.percentage,
    count: item.transactionCount,
    isIncome: item.isIncome,
    color: item.isIncome
      ? INCOME_COLORS[index % INCOME_COLORS.length]
      : EXPENSE_COLORS[index % EXPENSE_COLORS.length],
  }))

  const handleSegmentClick = (data: ChartDataItem) => {
    if (onCategoryClick) {
      onCategoryClick(data.category)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataItem
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.category}</p>
          <p className="text-sm text-gray-600">
            Amount: {formatCurrency(data.amount)}
          </p>
          <p className="text-sm text-gray-600">
            Percentage: {formatPercentage(data.percentage)}
          </p>
          <p className="text-sm text-gray-600">
            Transactions: {data.count}
          </p>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="amount"
              onClick={handleSegmentClick}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={selectedCategory === entry.category ? '#1f2937' : 'none'}
                  strokeWidth={selectedCategory === entry.category ? 2 : 0}
                  opacity={selectedCategory && selectedCategory !== entry.category ? 0.5 : 1}
                  data-testid={`chart-segment-${entry.category}`}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry: any) => (
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => handleSegmentClick(entry.payload)}
                >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
            />
            <YAxis tickFormatter={(value) => formatCurrency(value)} />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="amount"
              onClick={(data: any) => handleSegmentClick(data.payload)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={selectedCategory === entry.category ? '#1f2937' : 'none'}
                  strokeWidth={selectedCategory === entry.category ? 2 : 0}
                  opacity={selectedCategory && selectedCategory !== entry.category ? 0.5 : 1}
                  data-testid={`chart-segment-${entry.category}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }

  return (
    <div data-testid="category-chart" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
          Category Breakdown
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* View Type Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            {(['expenses', 'income', 'all'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewType === type
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            {(['pie', 'bar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  chartType === type
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="relative">
          {renderChart()}

          {/* Selected Category Info */}
          {selectedCategory && (
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary-900">
                    Filtered by: {selectedCategory}
                  </p>
                  <p className="text-sm text-primary-700">
                    Click chart again or use filters to change selection
                  </p>
                </div>
                <button
                  onClick={() => onCategoryClick && onCategoryClick('')}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No {viewType === 'all' ? '' : viewType} data available for this period
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-lg font-bold text-gray-900">{chartData.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(chartData.reduce((sum, item) => sum + item.amount, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <p className="text-lg font-bold text-gray-900">
                {chartData.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg per Category</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(
                  chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}