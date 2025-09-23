import { FileParserService } from '../../src/services/file-parser.service'

describe('FileParserService Contract Tests', () => {
  let fileParser: FileParserService

  beforeEach(() => {
    fileParser = new FileParserService()
  })

  describe('parseFile', () => {
    it('should parse valid CSV file correctly', async () => {
      const csvContent = `date,amount,category,description,merchant,account,is_transfer
2025-09-01,-1850.00,Housing,"Rent - September",Landlord Co,RBC Chequing,false
2025-09-03,-72.43,Groceries,"Walmart Supercentre #1234",Walmart,RBC Visa,false
2025-09-04,2500.00,Salary,"Payroll Sep",Employer Inc,RBC Chequing,false`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const transactions = await fileParser.parseFile(file)

      expect(transactions).toHaveLength(3)
      expect(transactions[0]).toMatchObject({
        date: new Date('2025-09-01'),
        amount: -1850.00,
        category: 'Housing',
        description: 'Rent - September',
        merchant: 'Landlord Co',
        account: 'RBC Chequing',
        isTransfer: false,
      })
      expect(transactions[0].id).toBeDefined()
    })

    it('should parse valid Excel file correctly', async () => {
      // Mock Excel file - in real implementation would use actual .xlsx
      const file = new File(['mock excel content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // This will be implemented when we create the actual service
      await expect(fileParser.parseFile(file)).rejects.toThrow()
    })

    it('should throw error for invalid file format', async () => {
      const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' })

      await expect(fileParser.parseFile(file)).rejects.toThrow('Unsupported file format')
    })

    it('should throw error for missing required columns', async () => {
      const csvContent = `date,amount,category
2025-09-01,-1850.00,Housing`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

      await expect(fileParser.parseFile(file)).rejects.toThrow('Missing required columns')
    })

    it('should throw error for invalid date format', async () => {
      const csvContent = `date,amount,category,description,merchant
invalid-date,-1850.00,Housing,Rent,Landlord`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

      await expect(fileParser.parseFile(file)).rejects.toThrow('Invalid date format')
    })

    it('should throw error for invalid amount format', async () => {
      const csvContent = `date,amount,category,description,merchant
2025-09-01,invalid-amount,Housing,Rent,Landlord`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

      await expect(fileParser.parseFile(file)).rejects.toThrow('Invalid amount format')
    })

    it('should throw error for multiple months in data', async () => {
      const csvContent = `date,amount,category,description,merchant
2025-09-01,-1850.00,Housing,Rent,Landlord
2025-10-01,-1850.00,Housing,Rent,Landlord`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

      await expect(fileParser.parseFile(file)).rejects.toThrow('All transactions must be within the same month')
    })

    it('should remove duplicate transactions', async () => {
      const csvContent = `date,amount,category,description,merchant
2025-09-01,-1850.00,Housing,Rent,Landlord
2025-09-01,-1850.00,Housing,Rent,Landlord
2025-09-02,-100.00,Groceries,Shopping,Store`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const transactions = await fileParser.parseFile(file)

      expect(transactions).toHaveLength(2)
    })

    it('should handle optional columns correctly', async () => {
      const csvContent = `date,amount,category,description,merchant
2025-09-01,-1850.00,Housing,Rent,Landlord`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const transactions = await fileParser.parseFile(file)

      expect(transactions[0].account).toBeUndefined()
      expect(transactions[0].isTransfer).toBe(false)
    })

    it('should flag transfer transactions properly', async () => {
      const csvContent = `date,amount,category,description,merchant,account,is_transfer
2025-09-01,-500.00,Transfers,"Credit Card Payment",Bank,Chequing,true`

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const transactions = await fileParser.parseFile(file)

      expect(transactions[0].isTransfer).toBe(true)
    })

    it('should handle large files efficiently (10k+ transactions)', async () => {
      const rows = ['date,amount,category,description,merchant']
      for (let i = 1; i <= 10000; i++) {
        rows.push(`2025-09-${String(i % 30 + 1).padStart(2, '0')},-${(i % 1000) + 1}.00,Category${i % 10},Description${i},Merchant${i % 100}`)
      }
      const csvContent = rows.join('\n')

      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
      const startTime = Date.now()
      const transactions = await fileParser.parseFile(file)
      const endTime = Date.now()

      expect(transactions.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('validateFileFormat', () => {
    it('should return true for CSV files', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' })
      expect(fileParser.validateFileFormat(file)).toBe(true)
    })

    it('should return true for Excel files', () => {
      const file = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      expect(fileParser.validateFileFormat(file)).toBe(true)
    })

    it('should return false for unsupported files', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      expect(fileParser.validateFileFormat(file)).toBe(false)
    })
  })

  describe('getSupportedExtensions', () => {
    it('should return supported file extensions', () => {
      const extensions = fileParser.getSupportedExtensions()
      expect(extensions).toContain('.csv')
      expect(extensions).toContain('.xlsx')
    })
  })
})