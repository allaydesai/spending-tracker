import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from '../../src/pages/Dashboard'

// Mock CSV data for testing filtering functionality
const testCSVContent = `date,amount,category,description,merchant,account,is_transfer
2025-09-01,-1850.00,Housing,"Rent - September",Landlord Co,RBC Chequing,false
2025-09-03,-72.43,Groceries,"Walmart Supercentre #1234",Walmart,RBC Visa,false
2025-09-04,2500.00,Salary,"Payroll Sep",Employer Inc,RBC Chequing,false
2025-09-05,-45.99,Dining,"Coffee Shop",Local Cafe,RBC Visa,false
2025-09-07,-500.00,Transfers,"Credit Card Payment",RBC Visa Payment,RBC Chequing,true
2025-09-08,-120.00,Utilities,"Electricity Bill",Hydro One,RBC Chequing,false
2025-09-10,-89.50,Groceries,"Metro Grocery Store",Metro,RBC Visa,false
2025-09-15,-25.00,Transportation,"Bus Pass",Transit Authority,RBC Chequing,false`

const createMockCSVFile = (content: string) => {
  return new File([content], 'test.csv', { type: 'text/csv' })
}

describe('Dashboard Filtering Integration Tests', () => {
  const setupDashboardWithData = async () => {
    render(<Dashboard />)

    const file = createMockCSVFile(testCSVContent)
    const uploadArea = screen.getByTestId('file-upload-area')

    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('transaction-table')).toBeInTheDocument()
    })
  }

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: jest.fn(() => 'mock-url'),
        revokeObjectURL: jest.fn(),
      },
    })
  })

  describe('Chart to Table Filtering', () => {
    it('should filter table when clicking on chart category segment', async () => {
      await setupDashboardWithData()

      // Initially should show all non-transfer transactions
      const allRows = screen.getAllByTestId(/transaction-row-/)
      expect(allRows).toHaveLength(7) // 8 total minus 1 transfer

      // Click on Groceries segment in chart
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await userEvent.click(groceriesSegment)

      // Table should filter to show only Groceries transactions
      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(2) // 2 Groceries transactions
      })

      // Verify filter indicator is shown
      expect(screen.getByText(/category.*groceries/i)).toBeInTheDocument()

      // Verify only Groceries transactions are shown
      expect(screen.getByText('Walmart')).toBeInTheDocument()
      expect(screen.getByText('Metro')).toBeInTheDocument()
      expect(screen.queryByText('Landlord Co')).not.toBeInTheDocument()
    })

    it('should filter table when clicking on chart income segment', async () => {
      await setupDashboardWithData()

      // Click on Salary segment in chart
      const salarySegment = screen.getByTestId('chart-segment-Salary')
      await userEvent.click(salarySegment)

      // Table should filter to show only Salary transactions
      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(1) // 1 Salary transaction
      })

      expect(screen.getByText('Employer Inc')).toBeInTheDocument()
    })

    it('should clear filter when clicking clear filters button', async () => {
      await setupDashboardWithData()

      // Apply filter first
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await userEvent.click(groceriesSegment)

      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(2)
      })

      // Click clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await userEvent.click(clearButton)

      // Should show all transactions again
      await waitFor(() => {
        const allRows = screen.getAllByTestId(/transaction-row-/)
        expect(allRows).toHaveLength(7) // Back to all non-transfer transactions
      })

      // Filter indicator should be removed
      expect(screen.queryByText(/category.*groceries/i)).not.toBeInTheDocument()
    })

    it('should update chart highlighting when filter is applied', async () => {
      await setupDashboardWithData()

      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await userEvent.click(groceriesSegment)

      await waitFor(() => {
        // Chart segment should be highlighted/selected
        expect(groceriesSegment).toHaveClass('opacity-100')

        // Other segments should be dimmed
        const housingSegment = screen.getByTestId('chart-segment-Housing')
        expect(housingSegment).toHaveClass('opacity-50')
      })
    })
  })

  describe('Advanced Filter Controls', () => {
    it('should filter by text search in real-time', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      const searchInput = screen.getByPlaceholderText(/search transactions/i)

      // Type search term
      await user.type(searchInput, 'walmart')

      // Should filter to Walmart transactions immediately
      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(1)
      })

      expect(screen.getByText('Walmart')).toBeInTheDocument()
      expect(screen.queryByText('Metro')).not.toBeInTheDocument()
    })

    it('should perform case-insensitive text search', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      const searchInput = screen.getByPlaceholderText(/search transactions/i)

      // Type uppercase search term
      await user.type(searchInput, 'WALMART')

      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(1)
      })

      expect(screen.getByText('Walmart')).toBeInTheDocument()
    })

    it('should filter by merchant selection', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Open merchant filter dropdown
      const merchantFilter = screen.getByTestId('merchant-filter')
      await user.click(merchantFilter)

      // Select Walmart from dropdown
      const walmartOption = screen.getByRole('option', { name: /walmart/i })
      await user.click(walmartOption)

      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(1)
      })

      expect(screen.getByText('Walmart')).toBeInTheDocument()
      expect(screen.getByText(/merchant.*walmart/i)).toBeInTheDocument() // Filter indicator
    })

    it('should filter by amount range with negative values', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Set amount range: -100 to -50
      const minAmountInput = screen.getByLabelText(/minimum amount/i)
      const maxAmountInput = screen.getByLabelText(/maximum amount/i)

      await user.clear(minAmountInput)
      await user.type(minAmountInput, '-100')

      await user.clear(maxAmountInput)
      await user.type(maxAmountInput, '-50')

      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(2) // -72.43 (Walmart) and -89.50 (Metro)
      })

      expect(screen.getByText('-72.43')).toBeInTheDocument()
      expect(screen.getByText('-89.50')).toBeInTheDocument()
      expect(screen.queryByText('-1850.00')).not.toBeInTheDocument() // Should be filtered out
    })

    it('should combine multiple filters with AND logic', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Apply category filter
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await user.click(groceriesSegment)

      // Apply text search
      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await user.type(searchInput, 'walmart')

      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(1) // Only Walmart transaction in Groceries
      })

      expect(screen.getByText('Walmart')).toBeInTheDocument()
      expect(screen.queryByText('Metro')).not.toBeInTheDocument() // Metro is Groceries but doesn't match search
    })

    it('should show filter indicators for all active filters', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Apply multiple filters
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await user.click(groceriesSegment)

      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await user.type(searchInput, 'walmart')

      await waitFor(() => {
        // Should show both filter indicators
        expect(screen.getByText(/category.*groceries/i)).toBeInTheDocument()
        expect(screen.getByText(/search.*walmart/i)).toBeInTheDocument()
      })
    })

    it('should clear individual filters independently', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Apply multiple filters
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await user.click(groceriesSegment)

      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await user.type(searchInput, 'walmart')

      // Clear search filter only
      const clearSearchButton = screen.getByTestId('clear-search-filter')
      await user.click(clearSearchButton)

      await waitFor(() => {
        // Should show all Groceries transactions
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(2) // Both Groceries transactions
      })

      // Category filter should still be active
      expect(screen.getByText(/category.*groceries/i)).toBeInTheDocument()
      expect(screen.queryByText(/search.*walmart/i)).not.toBeInTheDocument()
    })
  })

  describe('Table Sorting with Filters', () => {
    it('should maintain sort when filters are applied', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Sort by amount ascending
      const amountHeader = screen.getByRole('columnheader', { name: /amount/i })
      await user.click(amountHeader)

      // Apply filter
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await user.click(groceriesSegment)

      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(2)

        // Should be sorted by amount: -89.50 then -72.43
        const amounts = screen.getAllByTestId(/transaction-amount-/)
        expect(amounts[0]).toHaveTextContent('-89.50')
        expect(amounts[1]).toHaveTextContent('-72.43')
      })
    })

    it('should sort filtered results correctly', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Apply filter first
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await user.click(groceriesSegment)

      // Then sort by merchant
      const merchantHeader = screen.getByRole('columnheader', { name: /merchant/i })
      await user.click(merchantHeader)

      await waitFor(() => {
        const merchants = screen.getAllByTestId(/transaction-merchant-/)
        // Should be alphabetically sorted: Metro, Walmart
        expect(merchants[0]).toHaveTextContent('Metro')
        expect(merchants[1]).toHaveTextContent('Walmart')
      })
    })
  })

  describe('Filter Performance', () => {
    it('should filter large datasets efficiently', async () => {
      // Create large dataset
      const headers = 'date,amount,category,description,merchant'
      const rows = [headers]
      for (let i = 1; i <= 1000; i++) {
        rows.push(`2025-09-${String(i % 30 + 1).padStart(2, '0')},-${i}.00,Category${i % 10},Description${i},Merchant${i % 100}`)
      }
      const largeCSVContent = rows.join('\n')

      render(<Dashboard />)
      const file = createMockCSVFile(largeCSVContent)
      const uploadArea = screen.getByTestId('file-upload-area')

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      })

      await waitFor(() => {
        expect(screen.getByTestId('transaction-table')).toBeInTheDocument()
      })

      // Apply filter and measure performance
      const startTime = Date.now()
      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await userEvent.type(searchInput, 'Merchant1')

      await waitFor(() => {
        expect(screen.getAllByTestId(/transaction-row-/)).toHaveLength(10) // Should find ~10 matches
      })

      const endTime = Date.now()
      const filterTime = endTime - startTime

      expect(filterTime).toBeLessThan(100) // Should filter within 100ms
    })

    it('should provide real-time filter response', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      const searchInput = screen.getByPlaceholderText(/search transactions/i)

      const startTime = Date.now()
      await user.type(searchInput, 'w')

      await waitFor(() => {
        // Should immediately show transactions containing 'w'
        expect(screen.getAllByTestId(/transaction-row-/)).toHaveLength(1) // Walmart
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(responseTime).toBeLessThan(50) // Real-time response < 50ms
    })
  })

  describe('Filter State Persistence', () => {
    it('should persist filter state in URL or localStorage', async () => {
      const user = userEvent.setup()
      await setupDashboardWithData()

      // Apply filters
      const groceriesSegment = screen.getByTestId('chart-segment-Groceries')
      await user.click(groceriesSegment)

      const searchInput = screen.getByPlaceholderText(/search transactions/i)
      await user.type(searchInput, 'walmart')

      await waitFor(() => {
        // Check if filter state is stored
        const storedData = localStorage.getItem('spending-tracker-filters')
        expect(storedData).toBeTruthy()

        const parsedFilters = JSON.parse(storedData!)
        expect(parsedFilters.categories).toContain('Groceries')
        expect(parsedFilters.searchText).toBe('walmart')
      })
    })

    it('should restore filter state on page reload', async () => {
      // Pre-populate filter state
      const filterState = {
        categories: ['Groceries'],
        searchText: 'walmart',
        merchants: [],
      }
      localStorage.setItem('spending-tracker-filters', JSON.stringify(filterState))

      await setupDashboardWithData()

      // Should automatically apply stored filters
      await waitFor(() => {
        const filteredRows = screen.getAllByTestId(/transaction-row-/)
        expect(filteredRows).toHaveLength(1)
      })

      expect(screen.getByText('Walmart')).toBeInTheDocument()
      expect(screen.getByDisplayValue('walmart')).toBeInTheDocument()
    })
  })
})