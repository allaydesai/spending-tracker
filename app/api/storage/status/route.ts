import { NextRequest, NextResponse } from 'next/server';
import { StatsService } from '@/lib/services/stats-service';
import { TransactionService } from '@/lib/services/transaction-service';
import { getDatabaseSize, getDatabaseStats, verifyDatabaseHealth } from '@/lib/db/init';
import { migrator } from '@/lib/db/migrator';

export async function GET(request: NextRequest) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const statsService = new StatsService();
    const transactionService = new TransactionService();

    // Verify database health
    const healthCheck = await verifyDatabaseHealth();

    if (!healthCheck.connected) {
      return NextResponse.json({
        connected: false,
        transactionCount: 0,
        databaseSize: 0,
        lastImport: null,
        version: '0',
        error: healthCheck.error
      }, { status: 500 });
    }

    // Get database statistics
    const dbStats = getDatabaseStats();
    const databaseSize = getDatabaseSize();

    // Get transaction count
    const transactionCount = await transactionService.getTransactionCount();

    // Get last import information
    const importStats = await statsService.getImportStats();
    const lastImport = importStats.lastImportDate;

    // Get database version
    const version = migrator.getCurrentVersion().toString();

    // Prepare response
    const response = {
      connected: true,
      transactionCount,
      databaseSize,
      lastImport,
      version,
      // Additional useful information
      statistics: {
        tableCount: dbStats.tableCount,
        indexCount: dbStats.indexCount,
        viewCount: dbStats.viewCount
      },
      imports: {
        totalImports: importStats.totalImports,
        successfulImports: importStats.successfulImports,
        failedImports: importStats.failedImports,
        successRate: importStats.successRate
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Storage status API error:', error);

    // Return error status with basic information
    const errorResponse = {
      connected: false,
      transactionCount: 0,
      databaseSize: 0,
      lastImport: null,
      version: '0',
      error: 'Unable to retrieve storage status'
    };

    // Try to get basic information even if there's an error
    try {
      const databaseSize = getDatabaseSize();
      const version = migrator.getCurrentVersion().toString();

      errorResponse.databaseSize = databaseSize;
      errorResponse.version = version;
    } catch (fallbackError) {
      console.error('Failed to get fallback storage info:', fallbackError);
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Extended status endpoint with detailed diagnostics
export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    const { initializeDatabase } = await import('@/lib/db/init');
    await initializeDatabase();

    const statsService = new StatsService();
    const transactionService = new TransactionService();

    // Parse request body for diagnostic options
    const body = await request.json();
    const {
      includeDiagnostics = false,
      includePerformanceMetrics = false,
      includeDetailedStats = false
    } = body;

    // Basic status information
    const healthCheck = await verifyDatabaseHealth();
    const dbStats = getDatabaseStats();
    const databaseSize = getDatabaseSize();
    const transactionCount = await transactionService.getTransactionCount();
    const importStats = await statsService.getImportStats();
    const version = migrator.getCurrentVersion().toString();

    const response: any = {
      connected: healthCheck.connected,
      transactionCount,
      databaseSize,
      lastImport: importStats.lastImportDate,
      version,
      tablesExist: healthCheck.tablesExist
    };

    // Add diagnostics if requested
    if (includeDiagnostics) {
      response.diagnostics = {
        schemaVersion: healthCheck.version,
        migrationHistory: migrator.getMigrationHistory().slice(0, 5), // Last 5 migrations
        tableStats: dbStats,
        healthStatus: healthCheck.connected && healthCheck.tablesExist ? 'healthy' : 'unhealthy'
      };
    }

    // Add performance metrics if requested
    if (includePerformanceMetrics) {
      const startTime = Date.now();

      // Run a simple query to test performance
      try {
        await transactionService.getTransactions({ limit: 1 });
        const queryTime = Date.now() - startTime;

        response.performance = {
          queryResponseTime: queryTime,
          databaseSizeFormatted: formatBytes(databaseSize),
          avgTransactionsPerImport: importStats.totalImports > 0
            ? Math.round(importStats.totalTransactionsImported / importStats.totalImports)
            : 0
        };
      } catch (perfError) {
        response.performance = {
          queryResponseTime: -1,
          error: 'Performance test failed'
        };
      }
    }

    // Add detailed statistics if requested
    if (includeDetailedStats) {
      try {
        const comprehensiveStats = await statsService.getComprehensiveStats();

        response.detailedStats = {
          totalIncome: comprehensiveStats.totals.income,
          totalExpenses: comprehensiveStats.totals.expenses,
          netAmount: comprehensiveStats.totals.netAmount,
          dateRange: comprehensiveStats.dateRange,
          categoryCount: comprehensiveStats.byCategory.length,
          topCategory: comprehensiveStats.byCategory[0]?.category || null
        };
      } catch (statsError) {
        response.detailedStats = {
          error: 'Unable to retrieve detailed statistics'
        };
      }
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Extended storage status API error:', error);

    return NextResponse.json({
      connected: false,
      error: 'Failed to retrieve extended storage status'
    }, { status: 500 });
  }
}

// Utility function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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