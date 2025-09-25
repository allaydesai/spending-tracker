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

export interface ParseResult {
  transactions: Transaction[]
  errors: ParseError[]
  warnings: string[]
}

export interface ParseError {
  row: number
  field: string
  value: any
  message: string
}

export interface ValidationRules {
  date: {
    format: 'YYYY-MM-DD'
    singleMonth: true
  }
  amount: {
    type: 'number'
    separator: '.'
    noThousandsSeparator: true
  }
  category: {
    required: true
    minLength: 1
  }
  description: {
    required: true
    minLength: 1
  }
  merchant: {
    required: true
    minLength: 1
  }
  account: {
    optional: true
  }
  isTransfer: {
    type: 'boolean'
    default: false
  }
}