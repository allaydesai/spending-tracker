"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react"

interface Transaction {
  id: string
  date: Date
  amount: number
  category: string
  description: string
  merchant: string
  account?: string
  isTransfer: boolean
}

interface SortConfig {
  field: keyof Transaction
  direction: "asc" | "desc"
}

interface TransactionTableProps {
  transactions: Transaction[]
  isLoading?: boolean
}

export function TransactionTable({ transactions, isLoading = false }: TransactionTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!sortConfig) return 0

    const { field, direction } = sortConfig
    let aValue = a[field]
    let bValue = b[field]

    // Handle date sorting
    if (field === "date") {
      aValue = new Date(aValue as Date).getTime()
      bValue = new Date(bValue as Date).getTime()
    }

    // Handle string sorting
    if (typeof aValue === "string" && typeof bValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1
    if (aValue > bValue) return direction === "asc" ? 1 : -1
    return 0
  })

  // Paginate transactions
  const totalPages = Math.ceil(sortedTransactions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + pageSize)

  const handleSort = (field: keyof Transaction) => {
    setSortConfig((current) => {
      if (current?.field === field) {
        return current.direction === "asc" ? { field, direction: "desc" } : null
      }
      return { field, direction: "asc" }
    })
    setCurrentPage(1)
  }

  const getSortIcon = (field: keyof Transaction) => {
    if (sortConfig?.field !== field) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-primary" />
    ) : (
      <ChevronDown className="w-4 h-4 text-primary" />
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date))
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-40"></div>
                <div className="h-4 bg-muted rounded w-28"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Transactions ({sortedTransactions.length})</CardTitle>

          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm border-b border-border">
              <tr>
                <th className="text-left p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("date")}
                    className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                  >
                    Date {getSortIcon("date")}
                  </Button>
                </th>
                <th className="text-right p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("amount")}
                    className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                  >
                    Amount {getSortIcon("amount")}
                  </Button>
                </th>
                <th className="text-left p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("category")}
                    className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                  >
                    Category {getSortIcon("category")}
                  </Button>
                </th>
                <th className="text-left p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("merchant")}
                    className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                  >
                    Merchant {getSortIcon("merchant")}
                  </Button>
                </th>
                <th className="text-left p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("description")}
                    className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                  >
                    Description {getSortIcon("description")}
                  </Button>
                </th>
                <th className="text-left p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("account")}
                    className="h-auto p-0 font-semibold text-foreground hover:text-primary"
                  >
                    Account {getSortIcon("account")}
                  </Button>
                </th>
                <th className="text-left p-4">
                  <span className="font-semibold text-foreground">Type</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((transaction, index) => (
                <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm">{formatDate(transaction.date)}</td>
                  <td className="p-4 text-sm text-right font-mono">
                    <span className={transaction.amount >= 0 ? "text-success" : "text-destructive"}>
                      {transaction.amount >= 0 ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      {transaction.category}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm font-medium">{transaction.merchant}</td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{transaction.description}</td>
                  <td className="p-4 text-sm text-muted-foreground">{transaction.account || "—"}</td>
                  <td className="p-4 text-sm">
                    {transaction.isTransfer && (
                      <Badge variant="outline" className="text-xs">
                        Transfer
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedTransactions.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>No transactions found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedTransactions.length)} of{" "}
              {sortedTransactions.length} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0 bg-transparent"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-transparent"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
