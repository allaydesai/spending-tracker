import { Transaction, KPI, CategorySummary } from '../types/models'
import { Filter, SortConfig } from '../types/state'
import { DataProcessorService as IDataProcessorService } from '../types/services'
import { formatPeriod } from '../utils/formatters'
import { ValidationError, removeDuplicateTransactions } from '../utils/validation'

export class DataProcessorService implements IDataProcessorService {
  calculateKPIs(transactions: Transaction[]): KPI {
    // Filter out transfer transactions for KPI calculations
    const nonTransferTransactions = transactions.filter(t => !t.isTransfer)

    if (nonTransferTransactions.length === 0) {
      return {
        totalSpending: 0,
        totalIncome: 0,
        netAmount: 0,
        transactionCount: 0,
        period: transactions.length > 0 ? formatPeriod(transactions[0].date) : '',
      }
    }

    const totalSpending = nonTransferTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalIncome = nonTransferTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const netAmount = totalIncome + totalSpending // spending is negative

    const period = formatPeriod(transactions[0].date)

    return {
      totalSpending,
      totalIncome,
      netAmount,
      transactionCount: nonTransferTransactions.length,
      period,
    }
  }

  generateCategorySummary(transactions: Transaction[]): CategorySummary[] {
    // Filter out transfer transactions
    const nonTransferTransactions = transactions.filter(t => !t.isTransfer)

    if (nonTransferTransactions.length === 0) {
      return []
    }

    // Group by category and income/expense type
    const categoryMap = new Map<string, { income: Transaction[]; expense: Transaction[] }>()

    nonTransferTransactions.forEach(transaction => {
      const category = transaction.category
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { income: [], expense: [] })
      }

      const categoryData = categoryMap.get(category)!
      if (transaction.amount >= 0) {
        categoryData.income.push(transaction)
      } else {
        categoryData.expense.push(transaction)
      }
    })

    const summaries: CategorySummary[] = []

    // Calculate totals for percentage calculations
    const totalIncome = nonTransferTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = Math.abs(
      nonTransferTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    )

    // Process each category
    categoryMap.forEach((data, category) => {
      // Process income transactions
      if (data.income.length > 0) {
        const totalAmount = data.income.reduce((sum, t) => sum + t.amount, 0)
        const percentage = totalIncome > 0 ? (totalAmount / totalIncome) * 100 : 0

        summaries.push({
          category,
          totalAmount,
          transactionCount: data.income.length,
          percentage,
          isIncome: true,
        })
      }

      // Process expense transactions
      if (data.expense.length > 0) {
        const totalAmount = data.expense.reduce((sum, t) => sum + t.amount, 0)
        const absoluteAmount = Math.abs(totalAmount)
        const percentage = totalExpenses > 0 ? (absoluteAmount / totalExpenses) * 100 : 0

        summaries.push({
          category,
          totalAmount,
          transactionCount: data.expense.length,
          percentage,
          isIncome: false,
        })
      }
    })

    // Sort by total amount (descending)
    return summaries.sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
  }

  applyFilters(transactions: Transaction[], filter: Filter): Transaction[] {
    return transactions.filter(transaction => {
      // Category filter
      if (filter.categories.length > 0 && !filter.categories.includes(transaction.category)) {
        return false
      }

      // Merchant filter
      if (filter.merchants.length > 0 && !filter.merchants.includes(transaction.merchant)) {
        return false
      }

      // Text search (case-insensitive, searches description and merchant)
      if (filter.searchText.trim() !== '') {
        const searchLower = filter.searchText.toLowerCase()
        const descriptionMatch = transaction.description.toLowerCase().includes(searchLower)
        const merchantMatch = transaction.merchant.toLowerCase().includes(searchLower)
        if (!descriptionMatch && !merchantMatch) {
          return false
        }
      }

      // Amount range filter
      if (filter.amountMin !== undefined && transaction.amount < filter.amountMin) {
        return false
      }
      if (filter.amountMax !== undefined && transaction.amount > filter.amountMax) {
        return false
      }

      // Date range filter
      if (filter.dateRange) {
        const transactionDate = new Date(transaction.date)
        transactionDate.setHours(0, 0, 0, 0)

        const startDate = new Date(filter.dateRange.start)
        startDate.setHours(0, 0, 0, 0)

        const endDate = new Date(filter.dateRange.end)
        endDate.setHours(23, 59, 59, 999)

        if (transactionDate < startDate || transactionDate > endDate) {
          return false
        }
      }

      return true
    })
  }

  sortTransactions(transactions: Transaction[], sortConfig: SortConfig): Transaction[] {
    const sortedTransactions = [...transactions]

    sortedTransactions.sort((a, b) => {
      const aValue = a[sortConfig.field]
      const bValue = b[sortConfig.field]

      let comparison = 0

      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        comparison = aValue === bValue ? 0 : aValue ? 1 : -1
      } else {
        // Handle mixed types or undefined values
        const aStr = String(aValue || '')
        const bStr = String(bValue || '')
        comparison = aStr.localeCompare(bStr)
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    return sortedTransactions
  }

  removeDuplicates(transactions: Transaction[]): Transaction[] {
    return removeDuplicateTransactions(transactions)
  }

  validateSingleMonth(transactions: Transaction[]): boolean {
    if (transactions.length === 0) return true

    const firstMonth = transactions[0].date.getMonth()
    const firstYear = transactions[0].date.getFullYear()

    const hasMultipleMonths = transactions.some(transaction => {
      return (
        transaction.date.getMonth() !== firstMonth ||
        transaction.date.getFullYear() !== firstYear
      )
    })

    if (hasMultipleMonths) {
      throw new ValidationError('All transactions must be within the same month')
    }

    return true
  }

  // Additional utility methods for data processing

  getUniqueCategories(transactions: Transaction[]): string[] {
    const categories = new Set(transactions.map(t => t.category))
    return Array.from(categories).sort()
  }

  getUniqueMerchants(transactions: Transaction[]): string[] {
    const merchants = new Set(transactions.map(t => t.merchant))
    return Array.from(merchants).sort()
  }

  getDateRange(transactions: Transaction[]): { start: Date; end: Date } | null {
    if (transactions.length === 0) return null

    const dates = transactions.map(t => t.date.getTime()).sort((a, b) => a - b)
    return {
      start: new Date(dates[0]),
      end: new Date(dates[dates.length - 1]),
    }
  }

  getTransactionsByCategory(transactions: Transaction[], category: string): Transaction[] {
    return transactions.filter(t => t.category === category)
  }

  getTransactionsByMerchant(transactions: Transaction[], merchant: string): Transaction[] {
    return transactions.filter(t => t.merchant === merchant)
  }

  getTransactionsByDateRange(
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): Transaction[] {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }

  calculateCategoryTrends(transactions: Transaction[]): Record<string, number> {
    const trends: Record<string, number> = {}
    const nonTransferTransactions = transactions.filter(t => !t.isTransfer)

    // Group by category and calculate totals
    nonTransferTransactions.forEach(transaction => {
      const category = transaction.category
      if (!trends[category]) {
        trends[category] = 0
      }
      trends[category] += Math.abs(transaction.amount)
    })

    return trends
  }

  getTopSpendingCategories(transactions: Transaction[], limit = 5): CategorySummary[] {
    const summary = this.generateCategorySummary(transactions)
    return summary
      .filter(s => !s.isIncome)
      .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
      .slice(0, limit)
  }

  getTopIncomeCategories(transactions: Transaction[], limit = 5): CategorySummary[] {
    const summary = this.generateCategorySummary(transactions)
    return summary
      .filter(s => s.isIncome)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit)
  }
}