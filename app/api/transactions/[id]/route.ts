import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/lib/services/transaction-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const transactionService = new TransactionService();

    // Validate transaction ID parameter
    if (!params.id) {
      return NextResponse.json(
        { message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate transaction ID
    const transactionId = parseInt(params.id, 10);

    if (isNaN(transactionId) || transactionId <= 0) {
      return NextResponse.json(
        { message: 'Invalid transaction ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Check if transaction exists before deletion
    try {
      await transactionService.getTransactionById(transactionId);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { message: `Transaction with ID ${transactionId} not found` },
          { status: 404 }
        );
      }
      throw error; // Re-throw if it's a different error
    }

    // Delete the transaction
    const deleted = await transactionService.deleteTransaction(transactionId);

    if (!deleted) {
      return NextResponse.json(
        { message: `Transaction with ID ${transactionId} not found` },
        { status: 404 }
      );
    }

    // Return success response with no content (204)
    return new NextResponse(null, { status: 204 });

  } catch (error: any) {
    console.error('Transaction delete API error:', error);

    // Handle specific error types
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('Invalid transaction ID')) {
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
      { message: 'An error occurred while deleting the transaction. Please try again.' },
      { status: 500 }
    );
  }
}

// Get a specific transaction by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const transactionService = new TransactionService();

    // Validate transaction ID parameter
    if (!params.id) {
      return NextResponse.json(
        { message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate transaction ID
    const transactionId = parseInt(params.id, 10);

    if (isNaN(transactionId) || transactionId <= 0) {
      return NextResponse.json(
        { message: 'Invalid transaction ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    // Get the transaction
    const transaction = await transactionService.getTransactionById(transactionId);

    return NextResponse.json(transaction, { status: 200 });

  } catch (error: any) {
    console.error('Transaction get API error:', error);

    // Handle specific error types
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { message: `Transaction with ID ${params.id} not found` },
        { status: 404 }
      );
    }

    if (error.message.includes('Invalid transaction ID')) {
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
      { message: 'An error occurred while fetching the transaction. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}