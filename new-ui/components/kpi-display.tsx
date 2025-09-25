"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react"

interface KPI {
  totalSpending: number
  totalIncome: number
  netAmount: number
  transactionCount: number
  period: string
}

interface KPIDisplayProps {
  kpi: KPI | null
}

export function KPIDisplay({ kpi }: KPIDisplayProps) {
  if (!kpi) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-5 w-5 bg-muted rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-24 mb-2"></div>
              <div className="h-3 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Math.abs(amount))
  }

  const getNetAmountColor = (amount: number) => {
    if (amount > 0) return "text-success"
    if (amount < 0) return "text-destructive"
    return "text-muted-foreground"
  }

  const getNetAmountIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="w-5 h-5 text-success" />
    if (amount < 0) return <TrendingDown className="w-5 h-5 text-destructive" />
    return <DollarSign className="w-5 h-5 text-muted-foreground" />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Income */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{formatCurrency(kpi.totalIncome)}</div>
          <p className="text-xs text-muted-foreground mt-1">{kpi.period}</p>
        </CardContent>
      </Card>

      {/* Total Spending */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
            <TrendingDown className="w-5 h-5 text-destructive" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{formatCurrency(kpi.totalSpending)}</div>
          <p className="text-xs text-muted-foreground mt-1">{kpi.period}</p>
        </CardContent>
      </Card>

      {/* Net Amount */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Amount</CardTitle>
            {getNetAmountIcon(kpi.netAmount)}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getNetAmountColor(kpi.netAmount)}`}>
            {kpi.netAmount >= 0 ? "+" : "-"}
            {formatCurrency(kpi.netAmount)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {kpi.netAmount >= 0 ? "Surplus" : "Deficit"} for {kpi.period}
          </p>
        </CardContent>
      </Card>

      {/* Transaction Count */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
            <Receipt className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{kpi.transactionCount.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Total transactions</p>
        </CardContent>
      </Card>
    </div>
  )
}
