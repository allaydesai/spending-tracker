import { getDatabase } from './connection';

export const DATABASE_CONFIG = {
  // File paths
  DATABASE_PATH: 'data/spending.db',
  MIGRATIONS_PATH: 'lib/db/migrations',

  // Performance settings
  BATCH_SIZE: 1000, // For bulk inserts
  CACHE_SIZE: 2000, // SQLite cache pages

  // File size limits
  MAX_CSV_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TRANSACTION_COUNT: 100000, // Maximum transactions

  // Query limits
  DEFAULT_PAGE_SIZE: 100,
  MAX_PAGE_SIZE: 1000,
} as const;

export function applyDatabaseOptimizations(): void {
  const db = getDatabase();

  try {
    // Memory and performance optimizations
    db.pragma(`cache_size = ${DATABASE_CONFIG.CACHE_SIZE}`);
    db.pragma('temp_store = memory');
    db.pragma('mmap_size = 268435456'); // 256MB memory mapping

    // Query optimizer settings
    db.pragma('optimize');
    db.pragma('analysis_limit = 1000');

    // Checkpoint WAL regularly
    db.pragma('wal_autocheckpoint = 1000');

    console.log('Database optimizations applied successfully');
  } catch (error) {
    console.error('Failed to apply database optimizations:', error);
    throw error;
  }
}

export function getDatabaseInfo() {
  const db = getDatabase();

  try {
    const info = {
      version: db.pragma('user_version', { simple: true }),
      pageSize: db.pragma('page_size', { simple: true }),
      cacheSize: db.pragma('cache_size', { simple: true }),
      journalMode: db.pragma('journal_mode', { simple: true }),
      synchronous: db.pragma('synchronous', { simple: true }),
      foreignKeys: db.pragma('foreign_keys', { simple: true }),
    };

    return info;
  } catch (error) {
    console.error('Failed to get database info:', error);
    throw error;
  }
}

export function getTableStats() {
  const db = getDatabase();

  try {
    const tables = db.prepare(`
      SELECT name, sql
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    `).all();

    const stats = tables.map((table: any) => {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
      return {
        name: table.name,
        rowCount: count.count,
        sql: table.sql,
      };
    });

    return stats;
  } catch (error) {
    console.error('Failed to get table stats:', error);
    return [];
  }
}

export function vacuumDatabase(): void {
  const db = getDatabase();

  try {
    console.log('Starting database vacuum...');
    db.exec('VACUUM');
    console.log('Database vacuum completed');
  } catch (error) {
    console.error('Failed to vacuum database:', error);
    throw error;
  }
}