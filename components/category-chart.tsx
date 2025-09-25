"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { PieChartIcon, BarChart3 } from "lucide-react"

interface CategorySummary {
  category: string
  totalAmount: number
  transactionCount: number
  percentage: number
  isIncome: boolean
}

interface CategoryChartProps {
  data: CategorySummary[]
  onCategoryFilter?: (category: string) => void
  selectedCategory?: string
}

type ChartType = "pie" | "bar"
type ViewType = "expenses" | "income" | "all"

export function CategoryChart({ data, onCategoryFilter, selectedCategory }: CategoryChartProps) {
  const [chartType, setChartType] = useState<ChartType>("pie")
  const [viewType, setViewType] = useState<ViewType>("expenses")

  // Filter data based on view type
  const filteredData = data.filter((item) => {
    if (viewType === "expenses") return !item.isIncome
    if (viewType === "income") return item.isIncome
    return true
  })

  // Extended color palette with reliable colors
  const colorPalette = [
    '#ff6b6b', // Red
    '#4ecdc4', // Teal
    '#45b7d1', // Blue
    '#96ceb4', // Light green
    '#feca57', // Yellow
    '#ff9ff3', // Pink
    '#54a0ff', // Bright blue
    '#5f27cd', // Purple
    '#00d2d3', // Cyan
    '#ff9f43', // Orange
    '#10ac84', // Green
    '#ee5a24', // Red-orange
    '#0984e3', // Dark blue
    '#6c5ce7', // Light purple
    '#a29bfe', // Lavender
  ]

  // Prepare data for charts with colors
  const chartData = filteredData.map((item, index) => ({
    ...item,
    name: item.category,
    value: Math.abs(item.totalAmount),
    color: colorPalette[index % colorPalette.length],
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            Amount: <span className="font-medium text-foreground">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Transactions: <span className="font-medium text-foreground">{data.transactionCount}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  const handleCategoryClick = (category: string) => {
    if (onCategoryFilter) {
      onCategoryFilter(category === selectedCategory ? "" : category)
    }
  }

  if (!data.length) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <PieChartIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Category Breakdown</CardTitle>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={chartType === "pie" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("pie")}
                className="h-8 px-3"
              >
                <PieChartIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === "bar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("bar")}
                className="h-8 px-3"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* View Type Toggle */}
        <div className="flex bg-muted rounded-lg p-1 w-fit">
          <Button
            variant={viewType === "expenses" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("expenses")}
            className="h-8 px-4 text-xs"
          >
            Expenses
          </Button>
          <Button
            variant={viewType === "income" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("income")}
            className="h-8 px-4 text-xs"
          >
            Income
          </Button>
          <Button
            variant={viewType === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewType("all")}
            className="h-8 px-4 text-xs"
          >
            All
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data) => handleCategoryClick(data.category)}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={selectedCategory === entry.category ? "hsl(var(--primary))" : "transparent"}
                      strokeWidth={selectedCategory === entry.category ? 3 : 0}
                      opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend onClick={(data) => handleCategoryClick(data.value)} wrapperStyle={{ cursor: "pointer" }} />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => handleCategoryClick(data.category)}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={selectedCategory === entry.category ? "hsl(var(--primary))" : "transparent"}
                      strokeWidth={selectedCategory === entry.category ? 2 : 0}
                      opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Legend for Mobile */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.slice(0, 6).map((item, index) => (
            <div
              key={item.category}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedCategory === item.category ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
              }`}
              onClick={() => handleCategoryClick(item.category)}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.category}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
