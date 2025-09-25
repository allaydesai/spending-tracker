import { KPI } from '../types/models'
import { formatCurrency, formatCompactCurrency } from '../utils/formatters'

interface KPIDisplayProps {
  kpi: KPI
  isLoading?: boolean
}

interface KPICardProps {
  title: string
  value: string
  subtext?: string
  trend?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  isCompact?: boolean
}

const KPICard = ({ title, value, subtext, trend = 'neutral', icon, isCompact = false }: KPICardProps) => {
  const trendColors = {
    positive: 'text-success-600',
    negative: 'text-danger-600',
    neutral: 'text-gray-600',
  }

  const bgColors = {
    positive: 'bg-success-50',
    negative: 'bg-danger-50',
    neutral: 'bg-gray-50',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className={`text-2xl font-bold mt-2 ${trendColors[trend]} ${isCompact ? 'lg:text-xl' : ''}`}>
            {value}
          </p>
          {subtext && (
            <p className="text-sm text-gray-400 mt-1">
              {subtext}
            </p>
          )}
        </div>
        <div className={`flex-shrink-0 p-3 rounded-full ${bgColors[trend]}`}>
          <div className={`w-6 h-6 ${trendColors[trend]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

export const KPIDisplay = ({ kpi, isLoading = false }: KPIDisplayProps) => {
  if (isLoading) {
    return (
      <div data-testid="kpi-display-loading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Determine trend for net amount
  const netTrend = kpi.netAmount > 0 ? 'positive' : kpi.netAmount < 0 ? 'negative' : 'neutral'

  // Icons for each KPI
  const incomeIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  )

  const spendingIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
    </svg>
  )

  const netIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )

  const transactionIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )

  return (
    <div data-testid="kpi-display" className="space-y-6">
      {/* Period Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Financial Summary</h2>
        <p className="text-lg text-gray-600 mt-1">{kpi.period}</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Income"
          value={formatCurrency(kpi.totalIncome)}
          subtext={`${formatCompactCurrency(kpi.totalIncome)} this period`}
          trend="positive"
          icon={incomeIcon}
        />

        <KPICard
          title="Total Spending"
          value={formatCurrency(Math.abs(kpi.totalSpending))}
          subtext={`${formatCompactCurrency(Math.abs(kpi.totalSpending))} this period`}
          trend="negative"
          icon={spendingIcon}
        />

        <KPICard
          title="Net Amount"
          value={formatCurrency(kpi.netAmount)}
          subtext={kpi.netAmount >= 0 ? "Money saved" : "Overspent"}
          trend={netTrend}
          icon={netIcon}
        />

        <KPICard
          title="Transactions"
          value={kpi.transactionCount.toString()}
          subtext={`${kpi.transactionCount} transactions processed`}
          trend="neutral"
          icon={transactionIcon}
        />
      </div>

      {/* Additional Insights */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="font-medium text-gray-700">Savings Rate</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">
              {kpi.totalIncome > 0
                ? `${Math.round((kpi.netAmount / kpi.totalIncome) * 100)}%`
                : '0%'
              }
            </p>
          </div>

          <div className="text-center">
            <p className="font-medium text-gray-700">Avg. Transaction</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">
              {kpi.transactionCount > 0
                ? formatCurrency(Math.abs(kpi.totalSpending) / kpi.transactionCount)
                : formatCurrency(0)
              }
            </p>
          </div>

          <div className="text-center">
            <p className="font-medium text-gray-700">Income vs Spending</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">
              {kpi.totalIncome > 0 && kpi.totalSpending < 0
                ? `${Math.round((Math.abs(kpi.totalSpending) / kpi.totalIncome) * 100)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}