import * as XLSX from "xlsx"

export interface Transaction {
  id: string
  date: Date
  amount: number
  category: string
  description: string
  merchant: string
  account?: string
  isTransfer: boolean
}

export interface KPI {
  totalSpending: number
  totalIncome: number
  netAmount: number
  transactionCount: number
  period: string
}

export interface CategorySummary {
  category: string
  totalAmount: number
  transactionCount: number
  percentage: number
  isIncome: boolean
}

export interface Filter {
  categories: string[]
  merchants: string[]
  amountMin?: number
  amountMax?: number
  searchText: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export class DataProcessorService {
  static async processFile(file: File): Promise<Transaction[]> {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()

    if (fileExtension === "csv") {
      return this.processCSV(file)
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      return this.processExcel(file)
    } else {
      throw new Error("Unsupported file format. Please upload a CSV or Excel file.")
    }
  }

  private static async processCSV(file: File): Promise<Transaction[]> {
    const text = await file.text()
    const lines = text.split("\n").filter((line) => line.trim())

    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one data row.")
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
    const transactions: Transaction[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length < headers.length) continue

      const transaction = this.mapRowToTransaction(headers, values, i)
      if (transaction) {
        transactions.push(transaction)
      }
    }

    return transactions
  }

  private static async processExcel(file: File): Promise<Transaction[]> {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (jsonData.length < 2) {
      throw new Error("Excel file must contain at least a header row and one data row.")
    }

    const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase())
    const transactions: Transaction[] = []

    for (let i = 1; i < jsonData.length; i++) {
      const values = jsonData[i].map((v: any) => String(v || "").trim())
      const transaction = this.mapRowToTransaction(headers, values, i)
      if (transaction) {
        transactions.push(transaction)
      }
    }

    return transactions
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  private static mapRowToTransaction(headers: string[], values: string[], rowIndex: number): Transaction | null {
    const getColumnValue = (possibleNames: string[]): string => {
      for (const name of possibleNames) {
        const index = headers.findIndex((h) => h.includes(name))
        if (index !== -1 && values[index]) {
          return values[index].replace(/"/g, "").trim()
        }
      }
      return ""
    }

    // Required fields
    const dateStr = getColumnValue(["date", "transaction date", "posted date"])
    const description = getColumnValue(["description", "memo", "transaction description", "details"])

    // Handle both single amount column and separate debit/credit columns
    const amountStr = getColumnValue(["amount", "transaction amount"])
    const debitStr = getColumnValue(["debit"])
    const creditStr = getColumnValue(["credit"])

    if (!dateStr || (!amountStr && !debitStr && !creditStr) || !description) {
      console.warn(`Row ${rowIndex + 1}: Missing required fields (date, amount/debit/credit, description)`)
      return null
    }

    // Parse date
    let date: Date
    try {
      // Handle various date formats
      const parsedDate = new Date(dateStr)
      if (isNaN(parsedDate.getTime())) {
        // Try MM/DD/YYYY format
        const parts = dateStr.split("/")
        if (parts.length === 3) {
          date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[0]) - 1, Number.parseInt(parts[1]))
        } else {
          throw new Error("Invalid date format")
        }
      } else {
        date = parsedDate
      }
    } catch (error) {
      console.warn(`Row ${rowIndex + 1}: Invalid date format: ${dateStr}`)
      return null
    }

    // Parse amount
    let amount: number
    try {
      if (amountStr) {
        // Single amount column
        const cleanAmount = amountStr.replace(/[$,\s]/g, "")
        amount = Number.parseFloat(cleanAmount)
        if (isNaN(amount)) {
          throw new Error("Invalid amount")
        }
      } else {
        // Separate debit/credit columns
        let parsedAmount = 0

        if (debitStr && debitStr.trim() !== "") {
          // Debit amounts should be negative (expenses)
          const cleanDebit = debitStr.replace(/[$,\s]/g, "")
          parsedAmount = -Math.abs(Number.parseFloat(cleanDebit))
        }

        if (creditStr && creditStr.trim() !== "") {
          // Credit amounts should be positive (income)
          const cleanCredit = creditStr.replace(/[$,\s]/g, "")
          parsedAmount = Math.abs(Number.parseFloat(cleanCredit))
        }

        if (isNaN(parsedAmount) || parsedAmount === 0) {
          throw new Error("Invalid debit/credit amount")
        }

        amount = parsedAmount
      }
    } catch (error) {
      console.warn(`Row ${rowIndex + 1}: Invalid amount format: ${amountStr || debitStr || creditStr}`)
      return null
    }

    // Optional fields
    const category = getColumnValue(["category", "type", "transaction type"]) || "Uncategorized"
    const merchant = getColumnValue(["merchant", "payee", "vendor", "store"]) || "Unknown"
    const account = getColumnValue(["account", "account name", "account number"]) || undefined

    // Detect transfers
    const isTransfer =
      description.toLowerCase().includes("transfer") ||
      category.toLowerCase().includes("transfer") ||
      merchant.toLowerCase().includes("transfer")

    return {
      id: `${rowIndex}-${Date.now()}`,
      date,
      amount,
      category,
      description,
      merchant,
      account,
      isTransfer,
    }
  }

  static calculateKPI(transactions: Transaction[]): KPI {
    const income = transactions.filter((t) => t.amount > 0 && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0)

    const spending = Math.abs(
      transactions.filter((t) => t.amount < 0 && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0),
    )

    const netAmount = income - spending

    // Determine period from transaction dates
    const dates = transactions.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime())
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]

    let period = "No data"
    if (startDate && endDate) {
      const startMonth = startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      const endMonth = endDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      period = startMonth === endMonth ? startMonth : `${startMonth} - ${endMonth}`
    }

    return {
      totalSpending: spending,
      totalIncome: income,
      netAmount,
      transactionCount: transactions.length,
      period,
    }
  }

  static calculateCategoryData(transactions: Transaction[]): CategorySummary[] {
    const categoryMap = new Map<string, { amount: number; count: number; isIncome: boolean }>()

    // Group by category
    transactions.forEach((transaction) => {
      if (transaction.isTransfer) return // Exclude transfers

      const category = transaction.category
      const isIncome = transaction.amount > 0
      const existing = categoryMap.get(category) || { amount: 0, count: 0, isIncome }

      categoryMap.set(category, {
        amount: existing.amount + Math.abs(transaction.amount),
        count: existing.count + 1,
        isIncome,
      })
    })

    // Calculate totals for percentage calculation
    const totalAmount = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0)

    // Convert to CategorySummary array
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        totalAmount: data.amount,
        transactionCount: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        isIncome: data.isIncome,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by amount descending
  }

  static applyFilters(transactions: Transaction[], filter: Filter): Transaction[] {
    return transactions.filter((transaction) => {
      // Search text filter
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase()
        const matchesSearch =
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.merchant.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower) ||
          (transaction.account && transaction.account.toLowerCase().includes(searchLower))

        if (!matchesSearch) return false
      }

      // Category filter
      if (filter.categories.length > 0 && !filter.categories.includes(transaction.category)) {
        return false
      }

      // Merchant filter
      if (filter.merchants.length > 0 && !filter.merchants.includes(transaction.merchant)) {
        return false
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
        const startDate = new Date(filter.dateRange.start)
        const endDate = new Date(filter.dateRange.end)

        if (transactionDate < startDate || transactionDate > endDate) {
          return false
        }
      }

      return true
    })
  }

  static getUniqueCategories(transactions: Transaction[]): string[] {
    const categories = new Set(transactions.map((t) => t.category))
    return Array.from(categories).sort()
  }

  static getUniqueMerchants(transactions: Transaction[]): string[] {
    const merchants = new Set(transactions.map((t) => t.merchant))
    return Array.from(merchants).sort()
  }

  static exportToCSV(transactions: Transaction[]): string {
    const headers = ["Date", "Amount", "Category", "Merchant", "Description", "Account", "Type"]
    const rows = transactions.map((t) => [
      t.date.toLocaleDateString(),
      t.amount.toString(),
      t.category,
      t.merchant,
      t.description,
      t.account || "",
      t.isTransfer ? "Transfer" : "Transaction",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    return csvContent
  }
}
