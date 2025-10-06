/**
 * Budget Metrics API Route
 * GET /api/budget/metrics
 * Calculates budget metrics from config and transaction data
 * Reference: contracts/budget-metrics-api.yaml
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { loadBudgetConfig } from '@/lib/budget/config-loader';
import { calculateBudgetMetrics } from '@/lib/budget/metrics-calculator';
import { calculateProgressIndicators } from '@/lib/budget/progress-tracker';
import { deriveExpenseBreakdown } from '@/lib/budget/expense-breakdown';
import { filterCurrentMonth } from '@/lib/budget/transaction-filter';
import { TransactionService } from '@/lib/services/transaction-service';
import { parseISO, format } from 'date-fns';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');
    const referenceDateParam = searchParams.get('referenceDate');

    // Validate month parameter if provided
    let targetMonth: Date;
    if (monthParam) {
      if (!/^\d{4}-\d{2}$/.test(monthParam)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid month format',
          details: 'Month must be in YYYY-MM format (e.g., 2025-10)',
          received: monthParam,
        }, { status: 400 });
      }
      targetMonth = parseISO(`${monthParam}-01`);
    } else {
      targetMonth = new Date();
    }

    // Determine reference date based on month selection
    let referenceDate: Date;
    if (referenceDateParam) {
      // Use provided reference date
      referenceDate = parseISO(referenceDateParam);
    } else {
      // Auto-calculate based on selected month vs current month
      const today = new Date();
      const targetMonthStr = format(targetMonth, 'yyyy-MM');
      const currentMonthStr = format(today, 'yyyy-MM');

      if (targetMonthStr < currentMonthStr) {
        // Past month - use last day of that month
        const year = targetMonth.getFullYear();
        const month = targetMonth.getMonth();
        referenceDate = new Date(year, month + 1, 0); // Last day of target month
      } else if (targetMonthStr === currentMonthStr) {
        // Current month - use today
        referenceDate = today;
      } else {
        // Future month - use first day
        referenceDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      }
    }

    // Load budget configuration
    const configPath = path.join(process.cwd(), 'data', 'budget-config.yaml');
    const config = await loadBudgetConfig(configPath);

    // Load transactions (use max allowed limit of 1000)
    const transactionService = new TransactionService();
    const result = await transactionService.getTransactions({ limit: 1000 });
    const allTransactions = result.data;

    // Filter to current month
    const currentMonthTransactions = filterCurrentMonth(allTransactions, targetMonth);

    // Determine if viewing current month (for Net calculation)
    const today = new Date();
    const targetMonthStr = format(targetMonth, 'yyyy-MM');
    const currentMonthStr = format(today, 'yyyy-MM');
    const isCurrentMonth = targetMonthStr === currentMonthStr;

    // Calculate metrics
    const metrics = calculateBudgetMetrics(config, currentMonthTransactions, isCurrentMonth);

    // Calculate progress indicators
    const progress = calculateProgressIndicators(metrics, referenceDate);

    // Derive expense breakdown
    const breakdown = deriveExpenseBreakdown(config);

    const calculationTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        progress,
        breakdown,
      },
      month: format(targetMonth, 'yyyy-MM'),
      referenceDate: format(referenceDate, 'yyyy-MM-dd'),
      calculationTime,
    });

  } catch (error: any) {
    // Handle config missing
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load budget configuration',
        details: 'Budget config file not found',
        hint: 'Create data/budget-config.yaml first',
      }, { status: 500 });
    }

    // Generic server error
    console.error('Budget metrics calculation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}
