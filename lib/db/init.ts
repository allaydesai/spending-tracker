import { getDatabase } from './connection';
import { applyDatabaseOptimizations } from './config';
import { migrator } from './migrator';

let isInitialized = false;

/**
 * Initialize the database on application startup
 */
export async function initializeDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    console.log('Initializing database...');

    // Ensure database connection is established
    const db = getDatabase();
    console.log('Database connection established');

    // Apply database optimizations
    applyDatabaseOptimizations();
    console.log('Database optimizations applied');

    // Run pending migrations
    await migrator.runMigrations();
    console.log('Database migrations completed');

    // Verify database state
    const currentVersion = migrator.getCurrentVersion();
    console.log(`Database schema version: ${currentVersion}`);

    isInitialized = true;
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database initialization status
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized;
}

/**
 * Force re-initialization (for testing purposes)
 */
export function resetInitializationState(): void {
  isInitialized = false;
}

/**
 * Verify database health
 */
export async function verifyDatabaseHealth(): Promise<{
  connected: boolean;
  version: number;
  tablesExist: boolean;
  error?: string;
}> {
  try {
    const db = getDatabase();

    // Test basic connectivity
    const testQuery = db.prepare('SELECT 1 as test');
    testQuery.get();

    // Check schema version
    const version = migrator.getCurrentVersion();

    // Verify required tables exist
    const tablesQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM sqlite_master
      WHERE type = 'table'
      AND name IN ('transactions', 'import_sessions', 'migrations')
    `);
    const tablesResult = tablesQuery.get() as { count: number };
    const tablesExist = tablesResult.count === 3;

    return {
      connected: true,
      version,
      tablesExist,
    };
  } catch (error: any) {
    return {
      connected: false,
      version: 0,
      tablesExist: false,
      error: error.message,
    };
  }
}

/**
 * Get database file size in bytes
 */
export function getDatabaseSize(): number {
  try {
    const db = getDatabase();
    const result = db.prepare('PRAGMA page_size').get() as { page_size?: number };
    const pageSize = result.page_size || 4096;

    const pageCountResult = db.prepare('PRAGMA page_count').get() as { page_count?: number };
    const pageCount = pageCountResult.page_count || 0;

    return pageSize * pageCount;
  } catch (error) {
    console.error('Failed to get database size:', error);
    return 0;
  }
}

/**
 * Create a backup of the database
 */
export async function createBackup(backupPath: string): Promise<void> {
  try {
    const db = getDatabase();
    const backup = db.backup(backupPath);

    return new Promise((resolve, reject) => {
      backup.step(-1);

      if (backup.completed) {
        backup.close();
        console.log(`Database backup created at: ${backupPath}`);
        resolve();
      } else {
        backup.close();
        reject(new Error('Backup failed to complete'));
      }
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    throw error;
  }
}

/**
 * Restore database from backup
 */
export async function restoreFromBackup(backupPath: string): Promise<void> {
  try {
    const db = getDatabase();
    const restore = db.backup(backupPath, 'main', 'temp');

    return new Promise((resolve, reject) => {
      restore.step(-1);

      if (restore.completed) {
        restore.close();
        console.log(`Database restored from: ${backupPath}`);
        resolve();
      } else {
        restore.close();
        reject(new Error('Restore failed to complete'));
      }
    });
  } catch (error) {
    console.error('Failed to restore from backup:', error);
    throw error;
  }
}

/**
 * Vacuum the database to reclaim space
 */
export async function vacuumDatabase(): Promise<void> {
  try {
    const db = getDatabase();
    console.log('Starting database vacuum...');

    const startTime = Date.now();
    db.exec('VACUUM');
    const endTime = Date.now();

    console.log(`Database vacuum completed in ${endTime - startTime}ms`);
  } catch (error) {
    console.error('Failed to vacuum database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): {
  size: number;
  tableCount: number;
  indexCount: number;
  viewCount: number;
} {
  try {
    const db = getDatabase();

    const size = getDatabaseSize();

    const tableCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM sqlite_master
      WHERE type = 'table'
    `).get() as { count: number };

    const indexCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM sqlite_master
      WHERE type = 'index'
    `).get() as { count: number };

    const viewCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM sqlite_master
      WHERE type = 'view'
    `).get() as { count: number };

    return {
      size,
      tableCount: tableCountResult.count,
      indexCount: indexCountResult.count,
      viewCount: viewCountResult.count,
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return {
      size: 0,
      tableCount: 0,
      indexCount: 0,
      viewCount: 0,
    };
  }
}