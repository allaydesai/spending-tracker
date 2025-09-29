import { NextRequest, NextResponse } from 'next/server';
import { StatsService } from '@/lib/services/stats-service';

export async function GET(request: NextRequest) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const statsService = new StatsService();

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Date filtering
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Grouping parameter
    const groupBy = searchParams.get('groupBy') as 'day' | 'week' | 'month' | 'category' || 'month';

    // Validate date formats
    if (startDate && !isValidDateFormat(startDate)) {
      return NextResponse.json(
        { message: 'Invalid start date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (endDate && !isValidDateFormat(endDate)) {
      return NextResponse.json(
        { message: 'Invalid end date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { message: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Validate groupBy parameter
    const validGroupBy = ['day', 'week', 'month', 'category'];
    if (!validGroupBy.includes(groupBy)) {
      return NextResponse.json(
        { message: `Invalid groupBy parameter. Must be one of: ${validGroupBy.join(', ')}` },
        { status: 400 }
      );
    }

    // Get comprehensive statistics
    const stats = await statsService.getComprehensiveStats(
      startDate || undefined,
      endDate || undefined,
      groupBy === 'category' ? 'month' : groupBy // Category grouping uses month periods
    );

    // Format response according to API contract
    const response = {
      totals: {
        income: stats.totals.income,
        expenses: stats.totals.expenses,
        count: stats.totals.count
      },
      byPeriod: stats.byPeriod.map(period => ({
        period: period.period,
        income: period.income,
        expenses: period.expenses,
        count: period.count
      })),
      byCategory: stats.byCategory.map(category => ({
        category: category.category,
        amount: category.amount,
        count: category.count
      }))
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Statistics API error:', error);

    // Handle specific error types
    if (error.message.includes('Invalid date format')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid groupBy')) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('Database')) {
      return NextResponse.json(
        { message: 'Database error occurred. Please try again later.' },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { message: 'An error occurred while fetching statistics. Please try again.' },
      { status: 500 }
    );
  }
}

// Enhanced statistics endpoint with more detailed insights
export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const statsService = new StatsService();

    // Parse request body for advanced options
    const body = await request.json();
    const {
      startDate,
      endDate,
      groupBy = 'month',
      includeInsights = false,
      includeTrends = false,
      includePatterns = false
    } = body;

    // Validate parameters (same validation as GET)
    if (startDate && !isValidDateFormat(startDate)) {
      return NextResponse.json(
        { message: 'Invalid start date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (endDate && !isValidDateFormat(endDate)) {
      return NextResponse.json(
        { message: 'Invalid end date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { message: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    const validGroupBy = ['day', 'week', 'month'];
    if (!validGroupBy.includes(groupBy)) {
      return NextResponse.json(
        { message: `Invalid groupBy parameter. Must be one of: ${validGroupBy.join(', ')}` },
        { status: 400 }
      );
    }

    // Get comprehensive statistics
    const stats = await statsService.getComprehensiveStats(startDate, endDate, groupBy);

    // Build response based on requested features
    const response: any = {
      totals: {
        income: stats.totals.income,
        expenses: stats.totals.expenses,
        count: stats.totals.count
      },
      byPeriod: stats.byPeriod,
      byCategory: stats.byCategory
    };

    if (includeInsights) {
      response.insights = stats.insights;
    }

    if (includeTrends) {
      response.trends = stats.trends;
    }

    if (includePatterns) {
      // Get spending patterns if requested
      const patterns = await statsService.getSpendingPatterns(6);
      response.patterns = patterns;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Enhanced statistics API error:', error);

    return NextResponse.json(
      { message: 'An error occurred while fetching enhanced statistics. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to validate date format
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}