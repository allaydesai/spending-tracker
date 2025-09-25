import { useState, useMemo } from 'react'
import { Transaction } from '../types/models'
import { SortConfig } from '../types/state'
import { formatDateDisplay, formatTransactionAmount, truncateText } from '../utils/formatters'

interface TransactionTableProps {
  transactions: Transaction[]
  onSort?: (sortConfig: SortConfig) => void
  currentSort?: SortConfig | null
  isLoading?: boolean
  maxHeight?: string
}

interface TableHeaderProps {
  label: string
  field: keyof Transaction
  sortable?: boolean
  currentSort?: SortConfig | null
  onSort?: (field: keyof Transaction) => void
  className?: string
}

const TableHeader = ({
  label,
  field,
  sortable = true,
  currentSort,
  onSort,
  className = '',
}: TableHeaderProps) => {
  const isSorted = currentSort?.field === field
  const isAsc = isSorted && currentSort?.direction === 'asc'
  const isDesc = isSorted && currentSort?.direction === 'desc'

  const handleClick = () => {
    if (sortable && onSort) {
      onSort(field)
    }
  }

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:bg-gray-100' : ''
      } ${className}`}
      onClick={handleClick}
      role={sortable ? 'columnheader' : undefined}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg
              className={`w-3 h-3 ${isAsc ? 'text-primary-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${isDesc ? 'text-primary-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </th>
  )
}

interface TransactionRowProps {
  transaction: Transaction
  index: number
}

const TransactionRow = ({ transaction, index }: TransactionRowProps) => {
  const amountFormatted = formatTransactionAmount(transaction.amount)

  return (
    <tr
      data-testid={`transaction-row-${transaction.id}`}
      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDateDisplay(transaction.date)}
      </td>
      <td
        data-testid={`transaction-amount-${transaction.id}`}
        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${amountFormatted.className}`}
      >
        {amountFormatted.isPositive ? '+' : '-'}{amountFormatted.value}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {transaction.category}
        </span>
      </td>
      <td
        data-testid={`transaction-merchant-${transaction.id}`}
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
      >
        {truncateText(transaction.merchant, 20)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
        <div className="truncate" title={transaction.description}>
          {truncateText(transaction.description, 40)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {transaction.account || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {transaction.isTransfer && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Transfer
          </span>
        )}
      </td>
    </tr>
  )
}

export const TransactionTable = ({
  transactions,
  onSort,
  currentSort,
  isLoading = false,
  maxHeight = '600px',
}: TransactionTableProps) => {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  const handleSort = (field: keyof Transaction) => {
    if (!onSort) return

    const newDirection =
      currentSort?.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc'

    onSort({ field, direction: newDirection })
  }

  // Pagination logic
  const paginatedTransactions = useMemo(() => {
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    return transactions.slice(startIndex, endIndex)
  }, [transactions, page, pageSize])

  const totalPages = Math.ceil(transactions.length / pageSize)

  if (isLoading) {
    return (
      <div data-testid="transaction-table-loading" className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions</h3>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-gray-500">No transactions found</p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="transaction-table" className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
          <p className="text-sm text-gray-500 mt-1">
            Showing {paginatedTransactions.length} of {transactions.length} transactions
          </p>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-gray-700">
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(0) // Reset to first page
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight }}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <TableHeader
                  label="Date"
                  field="date"
                  currentSort={currentSort}
                  onSort={handleSort}
                />
                <TableHeader
                  label="Amount"
                  field="amount"
                  currentSort={currentSort}
                  onSort={handleSort}
                />
                <TableHeader
                  label="Category"
                  field="category"
                  currentSort={currentSort}
                  onSort={handleSort}
                />
                <TableHeader
                  label="Merchant"
                  field="merchant"
                  currentSort={currentSort}
                  onSort={handleSort}
                />
                <TableHeader
                  label="Description"
                  field="description"
                  currentSort={currentSort}
                  onSort={handleSort}
                />
                <TableHeader
                  label="Account"
                  field="account"
                  currentSort={currentSort}
                  onSort={handleSort}
                />
                <TableHeader
                  label="Type"
                  field="isTransfer"
                  sortable={false}
                />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-700">
              Page {page + 1} of {totalPages}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}