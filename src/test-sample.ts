// Simple test to verify our services work
import { DataProcessorService } from './services/data-processor.service'
import { Transaction } from './types/models'

const sampleTransactions: Transaction[] = [
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
    date: new Date('2025-09-04'),
    amount: 2500.00,
    category: 'Salary',
    description: 'Payroll Sep',
    merchant: 'Employer Inc',
    account: 'RBC Chequing',
    isTransfer: false,
  },
]

const dataProcessor = new DataProcessorService()
const kpi = dataProcessor.calculateKPIs(sampleTransactions)

console.log('Sample KPI calculation:')
console.log(`Total Income: $${kpi.totalIncome.toFixed(2)}`)
console.log(`Total Spending: $${Math.abs(kpi.totalSpending).toFixed(2)}`)
console.log(`Net Amount: $${kpi.netAmount.toFixed(2)}`)
console.log(`Period: ${kpi.period}`)

const categoryData = dataProcessor.generateCategorySummary(sampleTransactions)
console.log('\nCategory Summary:')
categoryData.forEach(cat => {
  console.log(`${cat.category}: $${Math.abs(cat.totalAmount).toFixed(2)} (${cat.percentage.toFixed(1)}%)`)
})

export { sampleTransactions, dataProcessor }