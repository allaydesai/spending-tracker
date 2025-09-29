import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction-service';
import { DATABASE_CONFIG } from '@/lib/db/config';

export async function GET(request: NextRequest) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const transactionService = new TransactionService();

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Date filtering
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Category filtering
    const category = searchParams.get('category');

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || DATABASE_CONFIG.DEFAULT_PAGE_SIZE.toString(), 10);

    // Sorting
    const sortBy = searchParams.get('sortBy') as 'date' | 'amount' | 'category' || 'date';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { message: 'Page number must be 1 or greater' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > DATABASE_CONFIG.MAX_PAGE_SIZE) {
      return NextResponse.json(
        { message: `Limit must be between 1 and ${DATABASE_CONFIG.MAX_PAGE_SIZE}` },
        { status: 400 }
      );
    }

    // Validate sort parameters
    const validSortFields = ['date', 'amount', 'category'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { message: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}` },
        { status: 400 }
      );
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { message: `Invalid sortOrder. Must be one of: ${validSortOrders.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Build query options
    const queryOptions = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: category || undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    };

    // Get transactions
    const result = await transactionService.getTransactions(queryOptions);

    // Transform the response to match expected format (data -> transactions)
    const response = {
      transactions: result.data,
      pagination: result.pagination
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Transactions list API error:', error);

    // Handle specific error types
    if (error.message.includes('Invalid date format')) {
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
      { message: 'An error occurred while fetching transactions. Please try again.' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}