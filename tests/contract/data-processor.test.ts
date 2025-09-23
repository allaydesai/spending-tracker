import { DataProcessorService } from '../../src/services/data-processor.service'
import { Transaction, Filter, SortConfig } from '../../src/types/models'

describe('DataProcessorService Contract Tests', () => {
  let dataProcessor: DataProcessorService
  let mockTransactions: Transaction[]

  beforeEach(() => {
    dataProcessor = new DataProcessorService()
    mockTransactions = [
      {
        id: '1',
        date: new Date('2025-09-01'),
        amount: -1850.00,
        category: 'Housing',
        description: 'Rent - September',
        merchant: 'Landlord Co',
        account: 'RBC Chequing',
        isTransfer: false,
      },
      {
        id: '2',
        date: new Date('2025-09-03'),
        amount: -72.43,
        category: 'Groceries',
        description: 'Walmart Supercentre',
        merchant: 'Walmart',
        account: 'RBC Visa',
        isTransfer: false,
      },
      {
        id: '3',
        date: new Date('2025-09-04'),
        amount: 2500.00,
        category: 'Salary',
        description: 'Payroll Sep',
        merchant: 'Employer Inc',
        account: 'RBC Chequing',
        isTransfer: false,
      },
      {
        id: '4',
        date: new Date('2025-09-07'),
        amount: -500.00,
        category: 'Transfers',
        description: 'Credit Card Payment',
        merchant: 'RBC Visa Payment',
        account: 'RBC Chequing',
        isTransfer: true,
      },
    ]
  })

  describe('calculateKPIs', () => {
    it('should exclude transfer transactions from calculations', () => {
      const kpi = dataProcessor.calculateKPIs(mockTransactions)

      expect(kpi.totalSpending).toBe(-1922.43) // -1850 + -72.43 (excluding transfer)
      expect(kpi.totalIncome).toBe(2500.00)
      expect(kpi.netAmount).toBe(577.57) // 2500 - 1922.43
      expect(kpi.transactionCount).toBe(3) // Excluding transfer
    })

    it('should calculate totals that reconcile with transaction sums', () => {
      const kpi = dataProcessor.calculateKPIs(mockTransactions)

      const nonTransferTransactions = mockTransactions.filter(t => !t.isTransfer)
      const expectedSpending = nonTransferTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
      const expectedIncome = nonTransferTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)

      expect(kpi.totalSpending).toBe(expectedSpending)
      expect(kpi.totalIncome).toBe(expectedIncome)
      expect(kpi.netAmount).toBe(expectedIncome + expectedSpending)
    })

    it('should generate correct period string', () => {
      const kpi = dataProcessor.calculateKPIs(mockTransactions)
      expect(kpi.period).toBe('September 2025')
    })

    it('should handle empty transaction list', () => {
      const kpi = dataProcessor.calculateKPIs([])

      expect(kpi.totalSpending).toBe(0)
      expect(kpi.totalIncome).toBe(0)
      expect(kpi.netAmount).toBe(0)
      expect(kpi.transactionCount).toBe(0)
    })
  })

  describe('generateCategorySummary', () => {
    it('should separate income and expense categories correctly', () => {
      const summary = dataProcessor.generateCategorySummary(mockTransactions)

      const incomeSummary = summary.filter(s => s.isIncome)
      const expenseSummary = summary.filter(s => !s.isIncome)

      expect(incomeSummary).toHaveLength(1)
      expect(incomeSummary[0].category).toBe('Salary')
      expect(expenseSummary).toHaveLength(2) // Housing and Groceries (excluding transfers)
    })

    it('should calculate percentages that sum to 100% within tolerance', () => {
      const summary = dataProcessor.generateCategorySummary(mockTransactions)

      const incomePercentages = summary.filter(s => s.isIncome).reduce((sum, s) => sum + s.percentage, 0)
      const expensePercentages = summary.filter(s => !s.isIncome).reduce((sum, s) => sum + s.percentage, 0)

      expect(Math.abs(incomePercentages - 100)).toBeLessThan(0.01)
      expect(Math.abs(expensePercentages - 100)).toBeLessThan(0.01)
    })

    it('should exclude transfer transactions from summaries', () => {
      const summary = dataProcessor.generateCategorySummary(mockTransactions)

      const transferCategory = summary.find(s => s.category === 'Transfers')
      expect(transferCategory).toBeUndefined()
    })

    it('should calculate transaction counts correctly', () => {
      const summary = dataProcessor.generateCategorySummary(mockTransactions)

      const totalTransactions = summary.reduce((sum, s) => sum + s.transactionCount, 0)
      const nonTransferCount = mockTransactions.filter(t => !t.isTransfer).length

      expect(totalTransactions).toBe(nonTransferCount)
    })
  })

  describe('applyFilters', () => {
    it('should filter by categories independently', () => {
      const filter: Filter = {
        categories: ['Housing'],
        merchants: [],
        searchText: '',
      }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].category).toBe('Housing')
    })

    it('should filter by merchants independently', () => {
      const filter: Filter = {
        categories: [],
        merchants: ['Walmart'],
        searchText: '',
      }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].merchant).toBe('Walmart')
    })

    it('should perform case-insensitive text search', () => {
      const filter: Filter = {
        categories: [],
        merchants: [],
        searchText: 'WALMART',
      }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].merchant).toBe('Walmart')
    })

    it('should filter by amount range with negative values', () => {
      const filter: Filter = {
        categories: [],
        merchants: [],
        searchText: '',
        amountMin: -100,
        amountMax: 0,
      }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].amount).toBe(-72.43)
    })

    it('should combine multiple filters correctly (AND logic)', () => {
      const filter: Filter = {
        categories: ['Groceries'],
        merchants: ['Walmart'],
        searchText: 'walmart',
      }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      expect(filtered).toHaveLength(1)
      expect(filtered[0].category).toBe('Groceries')
      expect(filtered[0].merchant).toBe('Walmart')
    })

    it('should filter by date range', () => {
      const filter: Filter = {
        categories: [],
        merchants: [],
        searchText: '',
        dateRange: {
          start: new Date('2025-09-01'),
          end: new Date('2025-09-03'),
        },
      }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      expect(filtered).toHaveLength(2) // Sept 1 and Sept 3 transactions
    })
  })

  describe('sortTransactions', () => {
    it('should sort by date ascending', () => {
      const sortConfig: SortConfig = { field: 'date', direction: 'asc' }
      const sorted = dataProcessor.sortTransactions(mockTransactions, sortConfig)

      expect(sorted[0].date.getTime()).toBeLessThanOrEqual(sorted[1].date.getTime())
    })

    it('should sort by date descending', () => {
      const sortConfig: SortConfig = { field: 'date', direction: 'desc' }
      const sorted = dataProcessor.sortTransactions(mockTransactions, sortConfig)

      expect(sorted[0].date.getTime()).toBeGreaterThanOrEqual(sorted[1].date.getTime())
    })

    it('should sort by amount handling negative values correctly', () => {
      const sortConfig: SortConfig = { field: 'amount', direction: 'asc' }
      const sorted = dataProcessor.sortTransactions(mockTransactions, sortConfig)

      expect(sorted[0].amount).toBeLessThanOrEqual(sorted[1].amount)
    })

    it('should sort text columns alphabetically', () => {
      const sortConfig: SortConfig = { field: 'category', direction: 'asc' }
      const sorted = dataProcessor.sortTransactions(mockTransactions, sortConfig)

      expect(sorted[0].category.localeCompare(sorted[1].category)).toBeLessThanOrEqual(0)
    })

    it('should maintain sort when filters are applied', () => {
      const filter: Filter = {
        categories: ['Housing', 'Groceries'],
        merchants: [],
        searchText: '',
      }
      const sortConfig: SortConfig = { field: 'amount', direction: 'asc' }

      const filtered = dataProcessor.applyFilters(mockTransactions, filter)
      const sorted = dataProcessor.sortTransactions(filtered, sortConfig)

      expect(sorted[0].amount).toBeLessThanOrEqual(sorted[1].amount)
    })
  })

  describe('removeDuplicates', () => {
    it('should remove exact duplicates correctly', () => {
      const duplicateTransactions = [
        ...mockTransactions,
        {
          id: '5',
          date: new Date('2025-09-01'),
          amount: -1850.00,
          category: 'Housing',
          description: 'Rent - September',
          merchant: 'Landlord Co',
          account: 'RBC Chequing',
          isTransfer: false,
        },
      ]

      const unique = dataProcessor.removeDuplicates(duplicateTransactions)
      expect(unique).toHaveLength(mockTransactions.length)
    })

    it('should identify duplicates by date + amount + merchant + description', () => {
      const almostDuplicate = {
        id: '5',
        date: new Date('2025-09-01'),
        amount: -1850.00,
        category: 'Different Category', // Different category but same core fields
        description: 'Rent - September',
        merchant: 'Landlord Co',
        account: 'Different Account', // Different account but same core fields
        isTransfer: false,
      }

      const duplicateTransactions = [...mockTransactions, almostDuplicate]
      const unique = dataProcessor.removeDuplicates(duplicateTransactions)

      expect(unique).toHaveLength(mockTransactions.length) // Should remove the duplicate
    })
  })

  describe('validateSingleMonth', () => {
    it('should return true for transactions within same month', () => {
      const result = dataProcessor.validateSingleMonth(mockTransactions)
      expect(result).toBe(true)
    })

    it('should throw error for transactions spanning multiple months', () => {
      const multiMonthTransactions = [
        ...mockTransactions,
        {
          id: '5',
          date: new Date('2025-10-01'),
          amount: -100.00,
          category: 'Test',
          description: 'Test',
          merchant: 'Test',
          isTransfer: false,
        },
      ]

      expect(() => {
        dataProcessor.validateSingleMonth(multiMonthTransactions)
      }).toThrow('All transactions must be within the same month')
    })
  })

  describe('performance with large datasets', () => {
    it('should handle 10k+ transactions efficiently', () => {
      const largeDataset: Transaction[] = []
      for (let i = 0; i < 10000; i++) {
        largeDataset.push({
          id: `${i}`,
          date: new Date(`2025-09-${String((i % 30) + 1).padStart(2, '0')}`),
          amount: -((i % 1000) + 1),
          category: `Category${i % 10}`,
          description: `Description${i}`,
          merchant: `Merchant${i % 100}`,
          isTransfer: false,
        })
      }

      const startTime = Date.now()
      const kpi = dataProcessor.calculateKPIs(largeDataset)
      const summary = dataProcessor.generateCategorySummary(largeDataset)
      const endTime = Date.now()

      expect(kpi).toBeDefined()
      expect(summary.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })
  })
})