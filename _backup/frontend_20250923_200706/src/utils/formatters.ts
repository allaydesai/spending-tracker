export const formatCurrency = (amount: number, currency = 'CAD'): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatAmount = (amount: number): string => {
  // Format without currency symbol for CSV export
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0] // YYYY-MM-DD format
}

export const formatDateDisplay = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export const formatPeriod = (date: Date): string => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`
}

export const formatTransactionAmount = (amount: number): {
  value: string
  isPositive: boolean
  className: string
} => {
  const isPositive = amount >= 0
  return {
    value: formatCurrency(Math.abs(amount)),
    isPositive,
    className: isPositive ? 'text-success-600' : 'text-danger-600',
  }
}

export const formatCompactCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 1000000) {
    return `${sign}$${(absAmount / 1000000).toFixed(1)}M`
  }
  if (absAmount >= 1000) {
    return `${sign}$${(absAmount / 1000).toFixed(1)}K`
  }
  return `${sign}$${absAmount.toFixed(0)}`
}

export const parseCSVAmount = (amountString: string): number => {
  if (!amountString || amountString.trim() === '') {
    return 0
  }

  // Remove currency symbols, commas, and whitespace
  const cleaned = amountString
    .replace(/[$,\s]/g, '')
    .replace(/[()]/g, '') // Remove parentheses
    .trim()

  // Handle parentheses notation for negative numbers (accounting format)
  const isNegative = amountString.includes('(') && amountString.includes(')')

  const amount = parseFloat(cleaned)
  if (isNaN(amount)) {
    return 0
  }

  return isNegative ? -Math.abs(amount) : amount
}

export const parseDebitCreditAmount = (debitString: string, creditString: string): number => {
  const debitAmount = parseCSVAmount(debitString || '')
  const creditAmount = parseCSVAmount(creditString || '')

  // Debit amounts should be negative, credit amounts should be positive
  const finalDebit = debitAmount > 0 ? -debitAmount : debitAmount
  const finalCredit = creditAmount > 0 ? creditAmount : creditAmount

  // Return the non-zero amount, or sum if both exist
  if (debitAmount !== 0 && creditAmount !== 0) {
    return finalDebit + finalCredit
  } else if (debitAmount !== 0) {
    return finalDebit
  } else {
    return finalCredit
  }
}

export const parseFlexibleDate = (dateString: string): Date => {
  if (!dateString || dateString.trim() === '') {
    throw new Error('Date string is empty')
  }

  // Remove non-printable characters and normalize
  const cleaned = dateString.replace(/[^\x20-\x7E]/g, '').trim()

  // Try YYYY-MM-DD format first (ISO format)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/
  if (isoRegex.test(cleaned)) {
    const date = new Date(cleaned)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Handle DD-MMM-YY and D-MMM-YY formats (e.g., "14-Sep-25", "2-Sep-25")
  const shortDateRegex = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/
  const shortMatch = cleaned.match(shortDateRegex)
  if (shortMatch) {
    const [, day, monthStr, year] = shortMatch
    const fullYear = 2000 + parseInt(year) // Convert YY to 20YY
    const monthMap: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    }
    const month = monthMap[monthStr.toLowerCase()]
    if (month !== undefined) {
      const date = new Date(fullYear, month, parseInt(day))
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  }

  // Handle space-separated formats with potential Unicode chars (e.g., "12 Sep 25", "18 Sep 25")
  const spaceRegex = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/
  const spaceMatch = cleaned.match(spaceRegex)
  if (spaceMatch) {
    const [, day, monthStr, year] = spaceMatch
    const fullYear = 2000 + parseInt(year)
    const monthMap: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    }
    const month = monthMap[monthStr.toLowerCase()]
    if (month !== undefined) {
      const date = new Date(fullYear, month, parseInt(day))
      if (!isNaN(date.getTime())) {
        return date
      }
    }
  }

  // If all else fails, try native Date parsing
  const fallbackDate = new Date(cleaned)
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate
  }

  throw new Error(`Unable to parse date: ${dateString}`)
}

export const formatFilesize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'

  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }

  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength - 3)}...`
}

export const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export const normalizeCSVHeaders = (headers: string[]): string[] => {
  const headerMap: Record<string, string> = {
    'date': 'date',
    'transaction date': 'date',
    'posted date': 'date',
    'amount': 'amount',
    'debit': 'debit',
    'credit': 'credit',
    'transaction amount': 'amount',
    'category': 'category',
    'description': 'description',
    'transaction description': 'description',
    'memo': 'description',
    'merchant': 'merchant',
    'merchant name': 'merchant',
    'payee': 'merchant',
    'account': 'account',
    'account name': 'account',
    'is_transfer': 'is_transfer',
    'transfer': 'is_transfer',
    'is transfer': 'is_transfer',
  }

  return headers.map(header => {
    // Remove non-printable characters and normalize
    const cleaned = header.replace(/[^\x20-\x7E]/g, '').toLowerCase().trim()
    return headerMap[cleaned] || header
  })
}