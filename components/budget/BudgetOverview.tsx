/**
 * Budget Overview Component
 * Main component integrating all budget sub-components
 * Reference: plan.md, data-model.md, quickstart.md
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BudgetMetrics, ProgressIndicators, ExpenseBreakdown } from '@/lib/budget/types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface BudgetData {
  metrics: BudgetMetrics;
  progress: ProgressIndicators;
  breakdown: ExpenseBreakdown;
}

interface BudgetOverviewProps {
  filter?: {
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  onFilterChange?: (filter: any) => void;
}

export function BudgetOverview({ filter, onFilterChange }: BudgetOverviewProps = {}) {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate the month parameter as a stable string value
  const monthParam = useMemo(() => {
    const selectedMonth = filter?.dateRange?.start
      ? new Date(filter.dateRange.start.getFullYear(), filter.dateRange.start.getMonth(), 1)
      : new Date();
    return format(selectedMonth, 'yyyy-MM');
  }, [filter?.dateRange?.start]);

  useEffect(() => {
    async function fetchBudgetData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/budget/metrics?month=${monthParam}`);
        if (!response.ok) {
          throw new Error('Failed to load budget metrics');
        }
        const result = await response.json();
        if (result.success) {
          setBudgetData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBudgetData();
  }, [monthParam]);

  // Derive selected month from filter or default to current month
  const selectedMonth = filter?.dateRange?.start
    ? new Date(filter.dateRange.start.getFullYear(), filter.dateRange.start.getMonth(), 1)
    : new Date();

  const handlePreviousMonth = () => {
    const newMonth = subMonths(selectedMonth, 1);
    if (onFilterChange) {
      onFilterChange({
        ...(filter || {}),
        dateRange: {
          start: startOfMonth(newMonth),
          end: endOfMonth(newMonth),
        },
      });
    }
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(selectedMonth, 1);
    if (onFilterChange) {
      onFilterChange({
        ...(filter || {}),
        dateRange: {
          start: startOfMonth(newMonth),
          end: endOfMonth(newMonth),
        },
      });
    }
  };

  const isCurrentMonth = format(selectedMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading budget data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !budgetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            {error || 'Failed to load budget data'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { metrics, progress, breakdown } = budgetData;
  const statusColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Budget Overview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[120px] text-center">
              {format(selectedMonth, 'MMMM yyyy')}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Day {progress.daysElapsed} of {progress.totalDays} ({progress.monthProgressPercent.toFixed(1)}% through month)
        </div>
        <Progress value={progress.monthProgressPercent} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Income Section */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Income</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Forecasted</div>
              <div className="text-xl font-bold">${metrics.forecastedIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Actual MTD</div>
              <div className="text-xl font-bold">${metrics.actualIncomeMtd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="text-sm text-muted-foreground">
                ({((metrics.actualIncomeMtd / metrics.forecastedIncome) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Day-to-Day Variable Expenses */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Day-to-Day Variable Expenses</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Budget: ${metrics.dayToDayBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span>Spent: ${progress.budgetUsageAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({progress.budgetUsagePercent.toFixed(1)}%)</span>
            </div>
            <Progress
              value={Math.min(progress.budgetUsagePercent, 100)}
              className={`h-3 ${statusColors[progress.statusColor]}`}
            />
            <div className="flex justify-between text-sm">
              <span className={progress.isOverBudget ? 'text-red-500 font-semibold' : ''}>
                Remaining: ${metrics.budgetRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {progress.isOverBudget && ' ⚠ OVER BUDGET'}
              </span>
            </div>

            {/* Burn Rate */}
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <div className="text-sm font-medium mb-2">Daily Burn Rate:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Actual:</span> ${progress.actualBurnRate.toFixed(2)}/day
                </div>
                <div>
                  <span className="text-muted-foreground">Target:</span> ${progress.targetBurnRate.toFixed(2)}/day
                </div>
              </div>
              <div className={`text-sm mt-2 ${progress.burnRateVariance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {progress.burnRateVariance > 0 ? '⚠' : '✓'} {progress.burnRateVariance > 0 ? 'Over' : 'Under'} target by ${Math.abs(progress.burnRateVariance).toFixed(2)}/day
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Expense Breakdown */}
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="fixed">
            <AccordionTrigger>
              <div className="flex justify-between w-full pr-4">
                <span>Fixed Expenses</span>
                <span className="font-semibold">${breakdown.fixedExpenses.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4">
                {breakdown.fixedExpenses.items.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between py-1">
                      <span>{item.label}</span>
                      <span className="font-mono">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {item.children && (
                      <div className="pl-6 space-y-1 text-sm text-muted-foreground">
                        {item.children.map((child, childIdx) => (
                          <div key={childIdx} className="flex justify-between">
                            <span>- {child.label}</span>
                            <span className="font-mono">${child.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subscriptions">
            <AccordionTrigger>
              <div className="flex justify-between w-full pr-4">
                <span>Variable Subscriptions</span>
                <span className="font-semibold">${breakdown.variableSubscriptions.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pl-4">
                {breakdown.variableSubscriptions.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{item.label}</span>
                    <span className="font-mono">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Savings Section */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Savings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Forecasted</div>
              <div className="text-xl font-bold">${metrics.forecastedSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Actual MTD</div>
              <div className="text-xl font-bold">${metrics.actualSavingsMtd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className={`text-sm ${metrics.actualSavingsMtd > metrics.forecastedSavings ? 'text-green-600' : 'text-muted-foreground'}`}>
                ({metrics.actualSavingsMtd > metrics.forecastedSavings ? 'ahead' : 'behind'} by ${Math.abs(metrics.actualSavingsMtd - metrics.forecastedSavings).toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </div>
            </div>
          </div>
        </div>

        {/* Net Section */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h3 className="font-semibold text-lg mb-2">Net (Income - Fixed - Spending)</h3>
          <div className="text-2xl font-bold">
            ${metrics.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isCurrentMonth ? `Using forecasted income: $${metrics.forecastedIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `Using actual income: $${metrics.actualIncomeMtd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </div>
        </div>

        {/* Interest Tracking */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <h3 className="font-semibold mb-2">Interest Tracking (Contextual)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Forecasted</div>
              <div className="font-semibold">${metrics.forecastedInterest.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Paid MTD</div>
              <div className="font-semibold">${metrics.interestPaidMtd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground">
                ({((metrics.interestPaidMtd / metrics.forecastedInterest) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Note: Interest is tracked for visibility but already included in transactions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
