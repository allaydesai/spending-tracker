import { Transaction, KPI, CategorySummary } from './models'

export interface Filter {
  categories: string[]
  merchants: string[]
  amountMin?: number
  amountMax?: number
  searchText: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface SortConfig {
  field: keyof Transaction
  direction: 'asc' | 'desc'
}

export interface AppState {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  kpi: KPI | null
  categoryData: CategorySummary[]
  filter: Filter
  sort: SortConfig | null
  isLoading: boolean
  error: string | null
}

export type AppAction =
  | { type: 'LOAD_TRANSACTIONS_START' }
  | { type: 'LOAD_TRANSACTIONS_SUCCESS'; payload: Transaction[] }
  | { type: 'LOAD_TRANSACTIONS_ERROR'; payload: string }
  | { type: 'SET_FILTER'; payload: Partial<Filter> }
  | { type: 'CLEAR_FILTER' }
  | { type: 'SET_SORT'; payload: SortConfig }
  | { type: 'CLEAR_SORT' }
  | { type: 'FILTER_BY_CATEGORY'; payload: string }
  | { type: 'CLEAR_DATA' }

export const initialFilter: Filter = {
  categories: [],
  merchants: [],
  searchText: '',
}

export const initialState: AppState = {
  transactions: [],
  filteredTransactions: [],
  kpi: null,
  categoryData: [],
  filter: initialFilter,
  sort: null,
  isLoading: false,
  error: null,
}