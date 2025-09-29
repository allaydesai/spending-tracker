import { getDatabase } from './connection';
import fs from 'fs';
import path from 'path';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

export class DatabaseMigrator {
  private db = getDatabase();
  private migrationsPath = path.join(process.cwd(), 'lib', 'db', 'migrations');

  constructor() {
    this.initializeMigrationsTable();
  }

  private initializeMigrationsTable(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (error) {
      console.error('Failed to initialize migrations table:', error);
      throw error;
    }
  }

  private getMigrationFiles(): Migration[] {
    try {
      if (!fs.existsSync(this.migrationsPath)) {
        console.log('Migrations directory does not exist, creating it...');
        fs.mkdirSync(this.migrationsPath, { recursive: true });
        return [];
      }

      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      return files.map(file => {
        const match = file.match(/^(\d+)_(.+)\.sql$/);
        if (!match) {
          throw new Error(`Invalid migration filename: ${file}`);
        }

        const version = parseInt(match[1], 10);
        const name = match[2];
        const sql = fs.readFileSync(path.join(this.migrationsPath, file), 'utf-8');

        return { version, name, sql };
      });
    } catch (error) {
      console.error('Failed to read migration files:', error);
      throw error;
    }
  }

  private getAppliedMigrations(): number[] {
    try {
      const stmt = this.db.prepare('SELECT version FROM migrations ORDER BY version');
      const results = stmt.all() as { version: number }[];
      return results.map(row => row.version);
    } catch (error) {
      console.error('Failed to get applied migrations:', error);
      throw error;
    }
  }

  private applyMigration(migration: Migration): void {
    const transaction = this.db.transaction(() => {
      try {
        // Execute the migration SQL
        this.db.exec(migration.sql);

        // Record the migration as applied
        const stmt = this.db.prepare(`
          INSERT INTO migrations (version, name)
          VALUES (?, ?)
        `);
        stmt.run(migration.version, migration.name);

        console.log(`Applied migration ${migration.version}: ${migration.name}`);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.version}: ${migration.name}`, error);
        throw error;
      }
    });

    transaction();
  }

  public async runMigrations(): Promise<void> {
    try {
      const migrationFiles = this.getMigrationFiles();
      const appliedMigrations = this.getAppliedMigrations();

      const pendingMigrations = migrationFiles.filter(
        migration => !appliedMigrations.includes(migration.version)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        this.applyMigration(migration);
      }

      console.log('All migrations applied successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  public getCurrentVersion(): number {
    try {
      const stmt = this.db.prepare('SELECT MAX(version) as version FROM migrations');
      const result = stmt.get() as { version: number | null };
      return result.version || 0;
    } catch (error) {
      console.error('Failed to get current version:', error);
      return 0;
    }
  }

  public getMigrationHistory(): Array<{ version: number; name: string; appliedAt: string }> {
    try {
      const stmt = this.db.prepare(`
        SELECT version, name, applied_at as appliedAt
        FROM migrations
        ORDER BY version DESC
      `);
      return stmt.all() as Array<{ version: number; name: string; appliedAt: string }>;
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }

  public rollbackToVersion(targetVersion: number): void {
    try {
      const currentVersion = this.getCurrentVersion();

      if (targetVersion >= currentVersion) {
        console.log('Target version is not lower than current version');
        return;
      }

      console.warn(`Rolling back from version ${currentVersion} to ${targetVersion}`);
      console.warn('Note: This is a destructive operation. Rollback logic must be implemented manually.');

      // For now, we'll just remove the migration records
      // In a real implementation, you'd need rollback SQL scripts
      const stmt = this.db.prepare('DELETE FROM migrations WHERE version > ?');
      stmt.run(targetVersion);

      console.log(`Rollback completed. Current version: ${this.getCurrentVersion()}`);
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}

export const migrator = new DatabaseMigrator();