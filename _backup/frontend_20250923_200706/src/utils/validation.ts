import { Transaction } from '../types/models'
import { parseFlexibleDate, parseCSVAmount } from './formatters'

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public row?: number) {
    super(message)
    this.name = 'ValidationError'
  }
}

export const validateDate = (dateString: string): Date => {
  try {
    return parseFlexibleDate(dateString)
  } catch (error) {
    throw new ValidationError(`Invalid date format: ${dateString}. Supported formats: YYYY-MM-DD, DD-MMM-YY, D-MMM-YY`, 'date')
  }
}

export const validateAmount = (amountString: string): number => {
  try {
    return parseCSVAmount(amountString)
  } catch (error) {
    throw new ValidationError('Amount must be a valid number', 'amount')
  }
}

export const validateRequiredString = (value: string, fieldName: string): string => {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
  return value.trim()
}

export const validateBoolean = (value: string): boolean => {
  const normalized = value.toLowerCase().trim()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === '') {
    return false
  }
  throw new ValidationError('Boolean value must be true/false, 1/0, yes/no, or empty', 'isTransfer')
}

export const validateSingleMonth = (transactions: Transaction[]): void => {
  // Temporarily disabled to allow multi-month data
  // TODO: Make this optional based on user preference
  return

  // if (transactions.length === 0) return

  // const months = new Set(
  //   transactions.map(t => `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`)
  // )

  // if (months.size > 1) {
  //   throw new ValidationError('All transactions must be within the same month')
  // }
}

export const validateTransactionData = (transaction: Partial<Transaction>): void => {
  if (!transaction.date) {
    throw new ValidationError('Date is required', 'date')
  }

  if (transaction.amount === undefined || transaction.amount === null) {
    throw new ValidationError('Amount is required', 'amount')
  }

  if (!transaction.category) {
    throw new ValidationError('Category is required', 'category')
  }

  if (!transaction.description) {
    throw new ValidationError('Description is required', 'description')
  }

  if (!transaction.merchant) {
    throw new ValidationError('Merchant is required', 'merchant')
  }
}

export const validateCSVHeaders = (headers: string[]): void => {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())

  // Check for date column
  if (!normalizedHeaders.includes('date')) {
    throw new ValidationError(`Missing required column: date`)
  }

  // Check for amount column OR both debit and credit columns
  const hasAmount = normalizedHeaders.includes('amount')
  const hasDebit = normalizedHeaders.includes('debit')
  const hasCredit = normalizedHeaders.includes('credit')

  if (!hasAmount && !(hasDebit || hasCredit)) {
    throw new ValidationError(`Missing required column: amount (or debit/credit columns)`)
  }

  // Check for category column
  if (!normalizedHeaders.includes('category')) {
    throw new ValidationError(`Missing required column: category`)
  }

  // Description is required (can be used as merchant if merchant is missing)
  if (!normalizedHeaders.includes('description')) {
    throw new ValidationError(`Missing required column: description`)
  }
}

export const validateFileFormat = (file: File): boolean => {
  const supportedTypes = [
    'text/csv',
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]

  const supportedExtensions = ['.csv', '.xlsx', '.xls']
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

  return supportedTypes.includes(file.type) || supportedExtensions.includes(fileExtension)
}

export const validateFileSize = (file: File, maxSizeMB: number = 10): void => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new ValidationError(`File size must be less than ${maxSizeMB}MB`)
  }
}

export const removeDuplicateTransactions = (transactions: Transaction[]): Transaction[] => {
  const seen = new Set<string>()
  return transactions.filter(transaction => {
    // Create unique key from core identifying fields
    const key = [
      transaction.date.toISOString().split('T')[0],
      transaction.amount.toString(),
      transaction.merchant,
      transaction.description,
    ].join('|')

    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}