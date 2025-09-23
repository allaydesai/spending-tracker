import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Transaction } from '../types/models'
import { FileParserService as IFileParserService } from '../types/services'
import {
  validateDate,
  validateAmount,
  validateRequiredString,
  validateBoolean,
  validateCSVHeaders,
  validateFileFormat,
  validateFileSize,
  validateSingleMonth,
  removeDuplicateTransactions,
  ValidationError,
} from '../utils/validation'
import { generateTransactionId, normalizeCSVHeaders, parseDebitCreditAmount } from '../utils/formatters'

export class FileParserService implements IFileParserService {
  private readonly supportedExtensions = ['.csv', '.xlsx']

  async parseFile(file: File): Promise<Transaction[]> {
    if (!this.validateFileFormat(file)) {
      throw new Error('Unsupported file format. Please upload a CSV or Excel file.')
    }

    validateFileSize(file)

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (fileExtension === '.csv') {
      return this.parseCSVFile(file)
    } else if (fileExtension === '.xlsx') {
      return this.parseExcelFile(file)
    } else {
      throw new Error('Unsupported file format')
    }
  }

  validateFileFormat(file: File): boolean {
    return validateFileFormat(file)
  }

  getSupportedExtensions(): string[] {
    return [...this.supportedExtensions]
  }

  private async parseCSVFile(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Normalize headers to standard format
          const normalized = normalizeCSVHeaders([header])[0]
          return normalized
        },
        complete: (results) => {
          try {
            const transactions = this.processCSVData(results.data as any[])
            resolve(transactions)
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`))
        },
      })
    })
  }

  private async parseExcelFile(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })

          // Use first sheet or sheet named "Transactions"
          const sheetName = workbook.SheetNames.includes('Transactions')
            ? 'Transactions'
            : workbook.SheetNames[0]

          if (!sheetName) {
            throw new Error('No sheets found in Excel file')
          }

          const worksheet = workbook.Sheets[sheetName]
          const csvData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][]

          if (csvData.length === 0) {
            throw new Error('Excel sheet is empty')
          }

          // Convert to Papa Parse format
          const headers = normalizeCSVHeaders(csvData[0])
          const rows = csvData.slice(1).map(row => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index] || ''
            })
            return obj
          })

          const transactions = this.processCSVData(rows)
          resolve(transactions)
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  private processCSVData(data: any[]): Transaction[] {
    if (data.length === 0) {
      throw new Error('File contains no data')
    }

    // Validate headers
    const headers = Object.keys(data[0])
    validateCSVHeaders(headers)

    const transactions: Transaction[] = []
    const errors: string[] = []

    data.forEach((row, index) => {
      try {
        const transaction = this.parseRow(row, index + 2) // +2 for header row and 0-based index
        if (transaction) {
          transactions.push(transaction)
        }
      } catch (error) {
        const errorMessage = error instanceof ValidationError
          ? `Row ${index + 2}: ${error.message}`
          : `Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMessage)
      }
    })

    if (errors.length > 0) {
      const errorType = errors.length === data.length ? 'All rows have errors' : 'Some rows have errors'
      throw new Error(`${errorType}:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''}`)
    }

    if (transactions.length === 0) {
      throw new Error('No valid transactions found in file')
    }

    // Remove duplicates
    const uniqueTransactions = removeDuplicateTransactions(transactions)

    // Validate single month requirement
    validateSingleMonth(uniqueTransactions)

    return uniqueTransactions
  }

  private parseRow(row: any, rowNumber: number): Transaction | null {
    try {
      // Skip empty rows
      if (!row.date && !row.amount && !row.debit && !row.credit && !row.category && !row.description) {
        return null
      }

      // Calculate amount from either amount column or debit/credit columns
      let amount: number
      if (row.amount && row.amount.toString().trim()) {
        amount = validateAmount(row.amount.toString().trim())
      } else {
        amount = parseDebitCreditAmount(
          row.debit?.toString().trim() || '',
          row.credit?.toString().trim() || ''
        )
      }

      // Use description as merchant if merchant is not provided
      const description = validateRequiredString(row.description?.toString() || '', 'description')
      const merchant = row.merchant?.toString().trim() || description

      const transaction: Transaction = {
        id: generateTransactionId(),
        date: validateDate(row.date?.toString().trim() || ''),
        amount: amount,
        category: validateRequiredString(row.category?.toString() || '', 'category'),
        description: description,
        merchant: merchant,
        account: row.account?.toString().trim() || undefined,
        isTransfer: row.is_transfer ? validateBoolean(row.is_transfer.toString()) : false,
      }

      return transaction
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(`${error.message}`, error.field, rowNumber)
      }
      throw error
    }
  }
}