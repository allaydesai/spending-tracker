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
          // Clean special characters and trim
          return values[index]
            .replace(/"/g, "")
            .replace(/[^\x20-\x7E]/g, "") // Remove non-ASCII characters
            .trim()
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
    const typeStr = getColumnValue(["type", "transaction type"]) // For new format with Type column

    if (!dateStr || (!amountStr && !debitStr && !creditStr) || !description) {
      console.warn(`Row ${rowIndex + 1}: Missing required fields (date, amount/debit/credit, description)`)
      return null
    }

    // Parse date
    let date: Date
    try {
      // Clean date string first
      const cleanDateStr = dateStr.replace(/[^\x20-\x7E]/g, "").trim()

      // Try different date formats
      // Format: YYYY-MM-DD (ISO format - new CSV format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)) {
        const parts = cleanDateStr.split("-")
        date = new Date(Number.parseInt(parts[0]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[2]))
      }
      // Format: DD-MMM-YY (e.g., "14-Sep-25")
      else if (/^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test(cleanDateStr)) {
        const parts = cleanDateStr.split("-")
        const day = Number.parseInt(parts[0])
        const monthStr = parts[1]
        const year = 2000 + Number.parseInt(parts[2]) // Assuming 20XX for YY format

        const monthMap: { [key: string]: number } = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        }
        const month = monthMap[monthStr.toLowerCase()]

        if (month !== undefined) {
          date = new Date(year, month, day)
        } else {
          throw new Error("Invalid month abbreviation")
        }
      }
      // Format: DD MMM YY (e.g., "12 Sep 25")
      else if (/^\d{1,2}\s+[A-Za-z]{3}\s+\d{2}$/.test(cleanDateStr)) {
        const parts = cleanDateStr.split(/\s+/)
        const day = Number.parseInt(parts[0])
        const monthStr = parts[1]
        const year = 2000 + Number.parseInt(parts[2])

        const monthMap: { [key: string]: number } = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        }
        const month = monthMap[monthStr.toLowerCase()]

        if (month !== undefined) {
          date = new Date(year, month, day)
        } else {
          throw new Error("Invalid month abbreviation")
        }
      }
      // Format: MM/DD/YYYY
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleanDateStr)) {
        const parts = cleanDateStr.split("/")
        date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[0]) - 1, Number.parseInt(parts[1]))
      }
      // Try standard Date parsing as fallback
      else {
        const parsedDate = new Date(cleanDateStr)
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid date format")
        }
        date = parsedDate
      }

      // Validate the parsed date
      if (isNaN(date.getTime())) {
        throw new Error("Invalid parsed date")
      }
    } catch (error) {
      console.warn(`Row ${rowIndex + 1}: Invalid date format: ${dateStr}`)
      return null
    }

    // Parse amount
    let amount: number
    try {
      if (amountStr) {
        // Single amount column (new format)
        const cleanAmount = amountStr.replace(/[$,\s]/g, "")
        amount = Number.parseFloat(cleanAmount)
        if (isNaN(amount)) {
          throw new Error("Invalid amount")
        }

        // Keep the original CSV sign convention:
        // - Negative amounts are expenses (debits)
        // - Positive amounts are income (credits)
        if (typeStr && typeStr.toLowerCase() === "credit") {
          // Credits are income, keep as positive
          amount = Math.abs(amount)
        } else if (typeStr && typeStr.toLowerCase() === "debit") {
          // Debits are expenses, keep as negative
          amount = -Math.abs(amount)
        } else {
          // If no type column, use the sign from the amount column as-is
          // Negative in CSV = expense (keep negative)
          // Positive in CSV = income (keep positive)
          // Don't flip the sign
        }
      } else {
        // Separate debit/credit columns (old format)
        let parsedAmount = 0

        if (debitStr && debitStr.trim() !== "") {
          // Debit amounts are expenses (keep as negative)
          const cleanDebit = debitStr.replace(/[$,\s]/g, "")
          const debitValue = Number.parseFloat(cleanDebit)
          if (!isNaN(debitValue) && debitValue > 0) {
            parsedAmount = -debitValue // Negative for expenses
          }
        }

        if (creditStr && creditStr.trim() !== "") {
          // Credit amounts are income (keep as positive)
          const cleanCredit = creditStr.replace(/[$,\s]/g, "")
          const creditValue = Number.parseFloat(cleanCredit)
          if (!isNaN(creditValue) && creditValue > 0) {
            parsedAmount = creditValue // Positive for income
          }
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
    const category = getColumnValue(["category"]) || "Uncategorized"
    const merchant = getColumnValue(["merchant", "payee", "vendor", "store"]) || "Unknown"
    const account = getColumnValue(["account", "account name", "account number"]) || undefined
    const location = getColumnValue(["location", "city"]) || ""
    const notes = getColumnValue(["notes", "memo", "comments"]) || ""

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
      transactions.filter((t) => t.amount < 0 && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0)
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

    // Group by category AND transaction type (income vs expense)
    transactions.forEach((transaction) => {
      if (transaction.isTransfer) return // Exclude transfers

      const category = transaction.category
      const isIncome = transaction.amount > 0 // Positive amounts are income

      // Create separate entries for income vs expense categories
      // This ensures income and expense transactions are grouped separately even with same category name
      const categoryKey = isIncome ? `${category}` : category

      const existing = categoryMap.get(categoryKey) || { amount: 0, count: 0, isIncome }

      categoryMap.set(categoryKey, {
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
