import { jsPDF } from 'jspdf'
import { Transaction, KPI } from '../types/models'
import { ExportService as IExportService } from '../types/services'
import { formatDate, formatAmount, formatCurrency } from '../utils/formatters'

export class ExportService implements IExportService {
  async exportToCSV(transactions: Transaction[], filename?: string): Promise<void> {
    if (!this.validateExportData(transactions)) {
      throw new Error('No transactions to export')
    }

    const csvContent = this.generateCSVContent(transactions)
    const finalFilename = filename || this.generateFilename(transactions, 'csv')

    this.downloadFile(csvContent, finalFilename, 'text/csv')
  }

  async exportToPDF(
    transactions: Transaction[],
    kpi: KPI,
    filename?: string
  ): Promise<void> {
    if (!this.validateExportData(transactions)) {
      throw new Error('No transactions to export')
    }

    const pdf = this.generatePDF(transactions, kpi)
    const finalFilename = filename || this.generateFilename(transactions, 'pdf')

    // Convert PDF to blob and download
    const pdfBlob = pdf.output('blob')
    this.downloadBlob(pdfBlob, finalFilename)
  }

  generateFilename(transactions: Transaction[], format: 'csv' | 'pdf'): string {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    if (transactions.length === 0) {
      return format === 'csv'
        ? `transactions-${today}.csv`
        : `spending-report-${today}.pdf`
    }

    // Extract period from first transaction
    const firstTransaction = transactions[0]
    const year = firstTransaction.date.getFullYear()
    const month = String(firstTransaction.date.getMonth() + 1).padStart(2, '0')
    const period = `${year}-${month}`

    return format === 'csv'
      ? `transactions-${period}-${today}.csv`
      : `spending-report-${period}-${today}.pdf`
  }

  validateExportData(transactions: Transaction[]): boolean {
    if (transactions.length === 0) {
      return false
    }

    // Check for data integrity
    return transactions.every(transaction => {
      return (
        transaction.id &&
        transaction.date instanceof Date &&
        !isNaN(transaction.date.getTime()) &&
        typeof transaction.amount === 'number' &&
        !isNaN(transaction.amount) &&
        transaction.category &&
        transaction.description &&
        transaction.merchant
      )
    })
  }

  private generateCSVContent(transactions: Transaction[]): string {
    const headers = [
      'date',
      'amount',
      'category',
      'description',
      'merchant',
      'account',
      'is_transfer'
    ]

    const csvRows = [headers.join(',')]

    transactions.forEach(transaction => {
      const row = [
        formatDate(transaction.date),
        formatAmount(transaction.amount),
        this.escapeCSVField(transaction.category),
        this.escapeCSVField(transaction.description),
        this.escapeCSVField(transaction.merchant),
        this.escapeCSVField(transaction.account || ''),
        transaction.isTransfer.toString()
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

  private escapeCSVField(field: string): string {
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  private generatePDF(transactions: Transaction[], kpi: KPI): jsPDF {
    const pdf = new jsPDF('portrait', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 20
    let yPosition = margin

    // Header
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Spending Report', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Period: ${kpi.period}`, pageWidth / 2, yPosition, { align: 'center' })
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition + 5, { align: 'center' })
    yPosition += 20

    // KPI Summary Section
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Summary', margin, yPosition)
    yPosition += 10

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')

    const summaryItems = [
      `Total Income: ${formatCurrency(kpi.totalIncome)}`,
      `Total Spending: ${formatCurrency(Math.abs(kpi.totalSpending))}`,
      `Net Amount: ${formatCurrency(kpi.netAmount)}`,
      `Transaction Count: ${kpi.transactionCount}`,
    ]

    summaryItems.forEach(item => {
      pdf.text(item, margin, yPosition)
      yPosition += 7
    })

    yPosition += 10

    // Transactions Table
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Transactions', margin, yPosition)
    yPosition += 10

    // Table headers
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    const colWidths = {
      date: 25,
      amount: 25,
      category: 30,
      merchant: 35,
      description: 55,
    }

    let xPosition = margin
    pdf.text('Date', xPosition, yPosition)
    xPosition += colWidths.date
    pdf.text('Amount', xPosition, yPosition)
    xPosition += colWidths.amount
    pdf.text('Category', xPosition, yPosition)
    xPosition += colWidths.category
    pdf.text('Merchant', xPosition, yPosition)
    xPosition += colWidths.merchant
    pdf.text('Description', xPosition, yPosition)

    yPosition += 5

    // Draw header line
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5

    // Table rows
    pdf.setFont('helvetica', 'normal')
    const maxRowsPerPage = 25
    let rowCount = 0

    transactions.forEach(transaction => {
      if (rowCount >= maxRowsPerPage) {
        pdf.addPage()
        yPosition = margin
        rowCount = 0

        // Redraw header on new page
        pdf.setFont('helvetica', 'bold')
        xPosition = margin
        pdf.text('Date', xPosition, yPosition)
        xPosition += colWidths.date
        pdf.text('Amount', xPosition, yPosition)
        xPosition += colWidths.category
        pdf.text('Category', xPosition, yPosition)
        xPosition += colWidths.merchant
        pdf.text('Merchant', xPosition, yPosition)
        xPosition += colWidths.description
        pdf.text('Description', xPosition, yPosition)
        yPosition += 5
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 5
        pdf.setFont('helvetica', 'normal')
      }

      xPosition = margin
      pdf.text(formatDate(transaction.date), xPosition, yPosition)
      xPosition += colWidths.date
      pdf.text(formatCurrency(transaction.amount), xPosition, yPosition)
      xPosition += colWidths.amount
      pdf.text(this.truncateText(transaction.category, 15), xPosition, yPosition)
      xPosition += colWidths.category
      pdf.text(this.truncateText(transaction.merchant, 20), xPosition, yPosition)
      xPosition += colWidths.merchant
      pdf.text(this.truncateText(transaction.description, 30), xPosition, yPosition)

      yPosition += 5
      rowCount++
    })

    // Footer
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
      pdf.text(
        'Generated with Spending Tracker',
        pageWidth - margin,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      )
    }

    return pdf
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    this.downloadBlob(blob, filename)
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    setTimeout(() => window.URL.revokeObjectURL(url), 100)
  }
}