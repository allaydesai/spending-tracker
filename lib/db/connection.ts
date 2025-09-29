import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'spending.db');

    try {
      db = new Database(dbPath);

      // Enable WAL mode for better concurrent performance
      db.pragma('journal_mode = WAL');

      // Enable foreign key constraints
      db.pragma('foreign_keys = ON');

      // Set synchronous mode to NORMAL for better performance
      db.pragma('synchronous = NORMAL');

      console.log(`Database connected at: ${dbPath}`);
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Graceful shutdown
process.on('exit', closeDatabase);
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});