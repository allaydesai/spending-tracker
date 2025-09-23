import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from '../../src/pages/Dashboard'

// Mock file content for testing
const createMockCSVFile = (content: string, filename = 'test.csv') => {
  return new File([content], filename, { type: 'text/csv' })
}

const validCSVContent = `date,amount,category,description,merchant,account,is_transfer
2025-09-01,-1850.00,Housing,"Rent - September",Landlord Co,RBC Chequing,false
2025-09-03,-72.43,Groceries,"Walmart Supercentre #1234",Walmart,RBC Visa,false
2025-09-04,2500.00,Salary,"Payroll Sep",Employer Inc,RBC Chequing,false
2025-09-07,-500.00,Transfers,"Credit Card Payment",RBC Visa Payment,RBC Chequing,true`

describe('File Upload Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Mock window.URL for file processing
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: jest.fn(() => 'mock-url'),
        revokeObjectURL: jest.fn(),
      },
    })
  })

  describe('Initial Empty State', () => {
    it('should display empty state with upload prompt', () => {
      render(<Dashboard />)

      expect(screen.getByText(/upload.*csv/i)).toBeInTheDocument()
      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument()
      expect(screen.queryByTestId('kpi-display')).not.toBeInTheDocument()
      expect(screen.queryByTestId('transaction-table')).not.toBeInTheDocument()
    })

    it('should show file upload area with proper styling', () => {
      render(<Dashboard />)

      const uploadArea = screen.getByTestId('file-upload-area')
      expect(uploadArea).toBeInTheDocument()
      expect(uploadArea).toHaveClass('border-dashed') // Tailwind dashed border
    })
  })

  describe('File Upload Process', () => {
    it('should handle drag and drop file upload', async () => {
      render(<Dashboard />)

      const file = createMockCSVFile(validCSVContent)
      const uploadArea = screen.getByTestId('file-upload-area')

      // Simulate drag and drop
      fireEvent.dragOver(uploadArea)
      expect(uploadArea).toHaveClass('border-primary-500') // Hover state

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      })

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument()
      })

      // Should complete processing within 2 seconds
      await waitFor(
        () => {
          expect(screen.queryByText(/processing/i)).not.toBeInTheDocument()
          expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
        },
        { timeout: 2000 }
      )
    })

    it('should handle click to upload file', async () => {
      const user = userEvent.setup()
      render(<Dashboard />)

      const file = createMockCSVFile(validCSVContent)
      const uploadButton = screen.getByRole('button', { name: /upload csv/i })

      // Mock file input
      const fileInput = screen.getByTestId('file-input')
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      await user.click(uploadButton)
      fireEvent.change(fileInput)

      // Should show processing state
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument()
      })

      // Should complete and show dashboard
      await waitFor(() => {
        expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
      })
    })

    it('should validate file format before processing', async () => {
      render(<Dashboard />)

      const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' })
      const uploadArea = screen.getByTestId('file-upload-area')

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [invalidFile],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/unsupported file format/i)).toBeInTheDocument()
      })

      // Should not show dashboard components
      expect(screen.queryByTestId('kpi-display')).not.toBeInTheDocument()
    })

    it('should handle file processing errors gracefully', async () => {
      render(<Dashboard />)

      const invalidCSVContent = `date,amount,category
invalid-date,-1850.00,Housing`

      const file = createMockCSVFile(invalidCSVContent)
      const uploadArea = screen.getByTestId('file-upload-area')

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/missing required columns/i)).toBeInTheDocument()
      })

      // Should allow user to try again
      expect(screen.getByTestId('file-upload-area')).toBeInTheDocument()
    })
  })

  describe('Post-Upload Dashboard Display', () => {
    const uploadValidFile = async () => {
      const file = createMockCSVFile(validCSVContent)
      const uploadArea = screen.getByTestId('file-upload-area')

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      })

      await waitFor(() => {
        expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
      })
    }

    it('should display KPIs correctly after successful upload', async () => {
      render(<Dashboard />)
      await uploadValidFile()

      // Check KPI values (excluding transfers)
      expect(screen.getByText(/total spending.*1,922\.43/i)).toBeInTheDocument()
      expect(screen.getByText(/total income.*2,500\.00/i)).toBeInTheDocument()
      expect(screen.getByText(/net.*577\.57/i)).toBeInTheDocument()
    })

    it('should display transaction count correctly', async () => {
      render(<Dashboard />)
      await uploadValidFile()

      // Should show 3 transactions (excluding transfer)
      expect(screen.getByText(/3.*transactions/i)).toBeInTheDocument()
    })

    it('should display category chart with correct data', async () => {
      render(<Dashboard />)
      await uploadValidFile()

      const chart = screen.getByTestId('category-chart')
      expect(chart).toBeInTheDocument()

      // Should show expense categories (excluding transfers)
      expect(screen.getByText('Housing')).toBeInTheDocument()
      expect(screen.getByText('Groceries')).toBeInTheDocument()
      expect(screen.getByText('Salary')).toBeInTheDocument()
      expect(screen.queryByText('Transfers')).not.toBeInTheDocument()
    })

    it('should display transaction table with all transactions', async () => {
      render(<Dashboard />)
      await uploadValidFile()

      const table = screen.getByTestId('transaction-table')
      expect(table).toBeInTheDocument()

      // Should show all 4 transactions (including transfer)
      const rows = screen.getAllByTestId(/transaction-row-/)
      expect(rows).toHaveLength(4)

      // Check specific transaction data
      expect(screen.getByText('Landlord Co')).toBeInTheDocument()
      expect(screen.getByText('Walmart')).toBeInTheDocument()
      expect(screen.getByText('Employer Inc')).toBeInTheDocument()
      expect(screen.getByText('RBC Visa Payment')).toBeInTheDocument()
    })

    it('should meet load time performance target (<2 seconds)', async () => {
      const startTime = Date.now()
      render(<Dashboard />)

      await uploadValidFile()

      const endTime = Date.now()
      const loadTime = endTime - startTime

      expect(loadTime).toBeLessThan(2000) // Less than 2 seconds
    })
  })

  describe('Data Persistence', () => {
    it('should persist uploaded data to localStorage', async () => {
      render(<Dashboard />)

      const file = createMockCSVFile(validCSVContent)
      const uploadArea = screen.getByTestId('file-upload-area')

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      })

      await waitFor(() => {
        expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
      })

      // Check localStorage was updated
      const storedData = localStorage.getItem('spending-tracker-data')
      expect(storedData).toBeTruthy()

      const parsedData = JSON.parse(storedData!)
      expect(parsedData.transactions).toHaveLength(4)
    })

    it('should restore data from localStorage on page reload', async () => {
      // Pre-populate localStorage
      const mockData = {
        transactions: [
          {
            id: '1',
            date: '2025-09-01T00:00:00.000Z',
            amount: -1850.00,
            category: 'Housing',
            description: 'Rent - September',
            merchant: 'Landlord Co',
            account: 'RBC Chequing',
            isTransfer: false,
          },
        ],
        lastUpdated: new Date().toISOString(),
      }

      localStorage.setItem('spending-tracker-data', JSON.stringify(mockData))

      render(<Dashboard />)

      // Should automatically load data and skip empty state
      await waitFor(() => {
        expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
      })

      expect(screen.queryByText(/upload.*csv/i)).not.toBeInTheDocument()
    })

    it('should allow clearing data and returning to upload state', async () => {
      render(<Dashboard />)

      // Upload file first
      await uploadValidFile()

      // Find and click clear data button
      const clearButton = screen.getByRole('button', { name: /clear data/i })
      await userEvent.click(clearButton)

      // Should return to empty state
      expect(screen.getByText(/upload.*csv/i)).toBeInTheDocument()
      expect(screen.queryByTestId('kpi-display')).not.toBeInTheDocument()

      // localStorage should be cleared
      expect(localStorage.getItem('spending-tracker-data')).toBeNull()
    })
  })

  describe('Error Recovery', () => {
    it('should allow retry after upload error', async () => {
      render(<Dashboard />)

      // First upload invalid file
      const invalidFile = createMockCSVFile('invalid content')
      const uploadArea = screen.getByTestId('file-upload-area')

      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [invalidFile],
        },
      })

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Then upload valid file
      const validFile = createMockCSVFile(validCSVContent)
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [validFile],
        },
      })

      await waitFor(() => {
        expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
      })

      // Error message should be cleared
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })

    it('should handle large file processing within time limit', async () => {
      render(<Dashboard />)

      // Create large CSV content
      const headers = 'date,amount,category,description,merchant'
      const rows = [headers]
      for (let i = 1; i <= 1000; i++) {
        rows.push(`2025-09-${String(i % 30 + 1).padStart(2, '0')},-${i}.00,Category${i % 10},Description${i},Merchant${i % 100}`)
      }
      const largeCSVContent = rows.join('\n')

      const file = createMockCSVFile(largeCSVContent, 'large-test.csv')
      const uploadArea = screen.getByTestId('file-upload-area')

      const startTime = Date.now()
      fireEvent.drop(uploadArea, {
        dataTransfer: {
          files: [file],
        },
      })

      await waitFor(
        () => {
          expect(screen.getByTestId('kpi-display')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )

      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(5000) // Less than 5 seconds for large file
    })
  })
})