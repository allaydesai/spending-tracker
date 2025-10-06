/**
 * Budget Config API Route
 * GET /api/budget/config
 * Loads and validates budget configuration from YAML file
 * Reference: contracts/budget-config-api.yaml
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { loadBudgetConfig } from '@/lib/budget/config-loader';
import { ZodError } from 'zod';

// Cache for config data
let configCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bustCache = searchParams.get('bustCache') === 'true';

    // Check cache
    const now = Date.now();
    if (!bustCache && configCache && (now - configCache.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: configCache.data,
        cached: true,
        cacheAge: Math.floor((now - configCache.timestamp) / 1000),
      });
    }

    // Load config from file
    const configPath = path.join(process.cwd(), 'data', 'budget-config.yaml');
    const config = await loadBudgetConfig(configPath);

    // Update cache
    configCache = {
      data: config,
      timestamp: now,
    };

    return NextResponse.json({
      success: true,
      data: config,
      cached: false,
      cacheAge: 0,
    });

  } catch (error: any) {
    // Handle file not found
    if (error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'Budget config file not found',
        path: 'data/budget-config.yaml',
        hint: 'Create budget-config.yaml in the data directory',
      }, { status: 404 });
    }

    // Handle YAML parse errors
    if (error.message.includes('Failed to parse YAML')) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse YAML',
        details: error.message,
      }, { status: 500 });
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          path: err.path,
          message: err.message,
          received: err.code === 'invalid_type' ? (err as any).received : undefined,
        })),
      }, { status: 400 });
    }

    // Generic server error
    console.error('Budget config load error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 });
  }
}
