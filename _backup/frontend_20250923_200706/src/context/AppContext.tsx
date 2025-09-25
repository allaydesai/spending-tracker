import { createContext, useContext, useReducer, useCallback, ReactNode, useEffect } from 'react'
import { AppState, AppAction, initialState, initialFilter } from '../types/state'
import { Transaction } from '../types/models'
import { Filter, SortConfig } from '../types/state'
import { FileParserService } from '../services/file-parser.service'
import { DataProcessorService } from '../services/data-processor.service'
import { ExportService } from '../services/export.service'

interface AppContextType {
  state: AppState
  uploadFile: (file: File) => Promise<void>
  setFilter: (filter: Partial<Filter>) => void
  clearFilter: () => void
  setSort: (sort: SortConfig) => void
  clearSort: () => void
  filterByCategory: (category: string) => void
  clearData: () => void
  exportToCSV: (filename?: string) => Promise<void>
  exportToPDF: (filename?: string) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Reducer function
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOAD_TRANSACTIONS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }

    case 'LOAD_TRANSACTIONS_SUCCESS': {
      const transactions = action.payload
      const dataProcessor = new DataProcessorService()

      // Calculate KPIs and category data
      const kpi = dataProcessor.calculateKPIs(transactions)
      const categoryData = dataProcessor.generateCategorySummary(transactions)

      // Apply current filters and sort
      let filteredTransactions = dataProcessor.applyFilters(transactions, state.filter)
      if (state.sort) {
        filteredTransactions = dataProcessor.sortTransactions(filteredTransactions, state.sort)
      }

      return {
        ...state,
        transactions,
        filteredTransactions,
        kpi,
        categoryData,
        isLoading: false,
        error: null,
      }
    }

    case 'LOAD_TRANSACTIONS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }

    case 'SET_FILTER': {
      const newFilter = { ...state.filter, ...action.payload }
      const dataProcessor = new DataProcessorService()

      let filteredTransactions = dataProcessor.applyFilters(state.transactions, newFilter)
      if (state.sort) {
        filteredTransactions = dataProcessor.sortTransactions(filteredTransactions, state.sort)
      }

      return {
        ...state,
        filter: newFilter,
        filteredTransactions,
      }
    }

    case 'CLEAR_FILTER': {
      const dataProcessor = new DataProcessorService()

      let filteredTransactions = state.transactions
      if (state.sort) {
        filteredTransactions = dataProcessor.sortTransactions(filteredTransactions, state.sort)
      }

      return {
        ...state,
        filter: initialFilter,
        filteredTransactions,
      }
    }

    case 'SET_SORT': {
      const newSort = action.payload
      const dataProcessor = new DataProcessorService()

      const sortedTransactions = dataProcessor.sortTransactions(state.filteredTransactions, newSort)

      return {
        ...state,
        sort: newSort,
        filteredTransactions: sortedTransactions,
      }
    }

    case 'CLEAR_SORT': {
      const dataProcessor = new DataProcessorService()
      const filteredTransactions = dataProcessor.applyFilters(state.transactions, state.filter)

      return {
        ...state,
        sort: null,
        filteredTransactions,
      }
    }

    case 'FILTER_BY_CATEGORY': {
      const category = action.payload
      const newFilter = category
        ? { ...state.filter, categories: [category] }
        : { ...state.filter, categories: [] }

      const dataProcessor = new DataProcessorService()
      let filteredTransactions = dataProcessor.applyFilters(state.transactions, newFilter)
      if (state.sort) {
        filteredTransactions = dataProcessor.sortTransactions(filteredTransactions, state.sort)
      }

      return {
        ...state,
        filter: newFilter,
        filteredTransactions,
      }
    }

    case 'CLEAR_DATA':
      return {
        ...initialState,
      }

    default:
      return state
  }
}

interface AppProviderProps {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Services
  const fileParser = new FileParserService()
  const exportService = new ExportService()

  // Load data from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('spending-tracker-data')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          // Convert date strings back to Date objects
          const transactions: Transaction[] = parsed.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }))
          dispatch({ type: 'LOAD_TRANSACTIONS_SUCCESS', payload: transactions })
        }
      } catch (error) {
        console.error('Failed to load stored data:', error)
        localStorage.removeItem('spending-tracker-data')
      }
    }

    // Load stored filters
    const storedFilters = localStorage.getItem('spending-tracker-filters')
    if (storedFilters) {
      try {
        const parsed = JSON.parse(storedFilters)
        dispatch({ type: 'SET_FILTER', payload: parsed })
      } catch (error) {
        console.error('Failed to load stored filters:', error)
        localStorage.removeItem('spending-tracker-filters')
      }
    }
  }, [])

  // Save data to localStorage when transactions change
  useEffect(() => {
    if (state.transactions.length > 0) {
      const dataToStore = {
        transactions: state.transactions,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem('spending-tracker-data', JSON.stringify(dataToStore))
    }
  }, [state.transactions])

  // Save filters to localStorage when they change
  useEffect(() => {
    if (JSON.stringify(state.filter) !== JSON.stringify(initialFilter)) {
      localStorage.setItem('spending-tracker-filters', JSON.stringify(state.filter))
    }
  }, [state.filter])

  const uploadFile = useCallback(async (file: File) => {
    dispatch({ type: 'LOAD_TRANSACTIONS_START' })

    try {
      const transactions = await fileParser.parseFile(file)
      dispatch({ type: 'LOAD_TRANSACTIONS_SUCCESS', payload: transactions })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      dispatch({ type: 'LOAD_TRANSACTIONS_ERROR', payload: errorMessage })
    }
  }, [fileParser])

  const setFilter = useCallback((filter: Partial<Filter>) => {
    dispatch({ type: 'SET_FILTER', payload: filter })
  }, [])

  const clearFilter = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTER' })
    localStorage.removeItem('spending-tracker-filters')
  }, [])

  const setSort = useCallback((sort: SortConfig) => {
    dispatch({ type: 'SET_SORT', payload: sort })
  }, [])

  const clearSort = useCallback(() => {
    dispatch({ type: 'CLEAR_SORT' })
  }, [])

  const filterByCategory = useCallback((category: string) => {
    dispatch({ type: 'FILTER_BY_CATEGORY', payload: category })
  }, [])

  const clearData = useCallback(() => {
    dispatch({ type: 'CLEAR_DATA' })
    localStorage.removeItem('spending-tracker-data')
    localStorage.removeItem('spending-tracker-filters')
  }, [])

  const exportToCSV = useCallback(async (filename?: string) => {
    if (state.filteredTransactions.length === 0) {
      throw new Error('No transactions to export')
    }
    await exportService.exportToCSV(state.filteredTransactions, filename)
  }, [state.filteredTransactions, exportService])

  const exportToPDF = useCallback(async (filename?: string) => {
    if (state.filteredTransactions.length === 0 || !state.kpi) {
      throw new Error('No data to export')
    }
    await exportService.exportToPDF(state.filteredTransactions, state.kpi, filename)
  }, [state.filteredTransactions, state.kpi, exportService])

  const contextValue: AppContextType = {
    state,
    uploadFile,
    setFilter,
    clearFilter,
    setSort,
    clearSort,
    filterByCategory,
    clearData,
    exportToCSV,
    exportToPDF,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}