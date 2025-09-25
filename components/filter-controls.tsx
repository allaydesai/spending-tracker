"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Search, X, CalendarIcon, DollarSign } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface FilterType {
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

interface FilterControlsProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
  availableCategories?: string[]
  availableMerchants?: string[]
}

export function FilterControls({
  filter,
  onFilterChange,
  availableCategories = [],
  availableMerchants = [],
}: FilterControlsProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filter.dateRange
      ? {
          from: filter.dateRange.start,
          to: filter.dateRange.end,
        }
      : undefined,
  )

  const updateFilter = (updates: Partial<FilterType>) => {
    onFilterChange({ ...filter, ...updates })
  }

  const clearAllFilters = () => {
    setDateRange(undefined)
    onFilterChange({
      categories: [],
      merchants: [],
      searchText: "",
      amountMin: undefined,
      amountMax: undefined,
      dateRange: undefined,
    })
  }

  const removeCategory = (category: string) => {
    updateFilter({
      categories: filter.categories.filter((c) => c !== category),
    })
  }

  const removeMerchant = (merchant: string) => {
    updateFilter({
      merchants: filter.merchants.filter((m) => m !== merchant),
    })
  }

  const addCategory = (category: string) => {
    if (!filter.categories.includes(category)) {
      updateFilter({
        categories: [...filter.categories, category],
      })
    }
  }

  const addMerchant = (merchant: string) => {
    if (!filter.merchants.includes(merchant)) {
      updateFilter({
        merchants: [...filter.merchants, merchant],
      })
    }
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from && range?.to) {
      updateFilter({
        dateRange: {
          start: range.from,
          end: range.to,
        },
      })
    } else {
      updateFilter({
        dateRange: undefined,
      })
    }
  }

  const hasActiveFilters =
    filter.searchText ||
    filter.categories.length > 0 ||
    filter.merchants.length > 0 ||
    filter.amountMin !== undefined ||
    filter.amountMax !== undefined ||
    filter.dateRange

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filter.searchText}
                onChange={(e) => updateFilter({ searchText: e.target.value })}
                className="pl-10 bg-background/50"
                data-testid="search-input"
              />
              {filter.searchText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter({ searchText: "" })}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  data-testid="clear-search-filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Clear All Filters */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearAllFilters} className="gap-2 bg-transparent">
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <Select onValueChange={addCategory}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories
                    .filter((cat) => !filter.categories.includes(cat))
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Merchant Filter */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Merchant</label>
              <Select onValueChange={addMerchant} data-testid="merchant-filter">
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select merchant" />
                </SelectTrigger>
                <SelectContent>
                  {availableMerchants
                    .filter((merchant) => !filter.merchants.includes(merchant))
                    .map((merchant) => (
                      <SelectItem key={merchant} value={merchant}>
                        {merchant}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Amount Range</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filter.amountMin || ""}
                    onChange={(e) =>
                      updateFilter({
                        amountMin: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="pl-8 bg-background/50"
                    aria-label="Minimum amount"
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filter.amountMax || ""}
                    onChange={(e) =>
                      updateFilter({
                        amountMax: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="pl-8 bg-background/50"
                    aria-label="Maximum amount"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-background/50">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="w-4 h-4" />
                Active filters:
              </div>

              {/* Search Filter Chip */}
              {filter.searchText && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{filter.searchText}"
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter({ searchText: "" })}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}

              {/* Category Filter Chips */}
              {filter.categories.map((category) => (
                <Badge key={category} variant="secondary" className="gap-1">
                  Category: {category}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(category)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}

              {/* Merchant Filter Chips */}
              {filter.merchants.map((merchant) => (
                <Badge key={merchant} variant="secondary" className="gap-1">
                  Merchant: {merchant}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMerchant(merchant)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              ))}

              {/* Amount Range Filter Chip */}
              {(filter.amountMin !== undefined || filter.amountMax !== undefined) && (
                <Badge variant="secondary" className="gap-1">
                  Amount: {filter.amountMin ? `$${filter.amountMin}` : "Any"} -{" "}
                  {filter.amountMax ? `$${filter.amountMax}` : "Any"}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFilter({ amountMin: undefined, amountMax: undefined })}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}

              {/* Date Range Filter Chip */}
              {filter.dateRange && (
                <Badge variant="secondary" className="gap-1">
                  Date: {format(filter.dateRange.start, "MMM dd")} - {format(filter.dateRange.end, "MMM dd")}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined)
                      updateFilter({ dateRange: undefined })
                    }}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
