import { getDatabase } from '../connection';
import { ImportSession, ImportSessionInput, ImportSessionUpdate } from '@/lib/models/import-session';

export class ImportSessionRepository {
  private db = getDatabase();

  constructor() {
    // Ensure the database is connected
    this.db = getDatabase();
  }

  /**
   * Create a new import session
   */
  async create(input: ImportSessionInput): Promise<ImportSession> {
    const stmt = this.db.prepare(`
      INSERT INTO import_sessions (filename, total_rows)
      VALUES (?, ?)
    `);

    try {
      const result = stmt.run(input.filename, input.totalRows);
      return this.findById(result.lastInsertRowid as number);
    } catch (error: any) {
      throw new Error(`Failed to create import session: ${error.message}`);
    }
  }

  /**
   * Find import session by ID
   */
  async findById(id: number): Promise<ImportSession> {
    const stmt = this.db.prepare(`
      SELECT
        id,
        filename,
        started_at as startedAt,
        completed_at as completedAt,
        total_rows as totalRows,
        imported_count as importedCount,
        duplicate_count as duplicateCount,
        error_count as errorCount,
        status,
        error_message as errorMessage
      FROM import_sessions
      WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (!result) {
      throw new Error(`Import session with ID ${id} not found`);
    }

    return result;
  }

  /**
   * Update an import session
   */
  async update(id: number, updates: ImportSessionUpdate): Promise<ImportSession> {
    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.completedAt !== undefined) {
      updateFields.push('completed_at = ?');
      params.push(updates.completedAt);
    }

    if (updates.importedCount !== undefined) {
      updateFields.push('imported_count = ?');
      params.push(updates.importedCount);
    }

    if (updates.duplicateCount !== undefined) {
      updateFields.push('duplicate_count = ?');
      params.push(updates.duplicateCount);
    }

    if (updates.errorCount !== undefined) {
      updateFields.push('error_count = ?');
      params.push(updates.errorCount);
    }

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      params.push(updates.status);
    }

    if (updates.errorMessage !== undefined) {
      updateFields.push('error_message = ?');
      params.push(updates.errorMessage);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE import_sessions
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    try {
      const result = stmt.run(...params);
      if (result.changes === 0) {
        throw new Error(`Import session with ID ${id} not found`);
      }

      return this.findById(id);
    } catch (error: any) {
      throw new Error(`Failed to update import session: ${error.message}`);
    }
  }

  /**
   * Mark import session as completed
   */
  async markCompleted(
    id: number,
    counts: {
      importedCount: number;
      duplicateCount: number;
      errorCount: number;
    }
  ): Promise<ImportSession> {
    return this.update(id, {
      completedAt: new Date().toISOString(),
      status: 'completed',
      ...counts
    });
  }

  /**
   * Mark import session as failed
   */
  async markFailed(id: number, errorMessage: string): Promise<ImportSession> {
    return this.update(id, {
      completedAt: new Date().toISOString(),
      status: 'failed',
      errorMessage
    });
  }

  /**
   * Get all import sessions with optional filtering
   */
  async findMany(options: {
    status?: 'pending' | 'completed' | 'failed';
    limit?: number;
    offset?: number;
  } = {}): Promise<ImportSession[]> {
    const { status, limit = 50, offset = 0 } = options;

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const stmt = this.db.prepare(`
      SELECT
        id,
        filename,
        started_at as startedAt,
        completed_at as completedAt,
        total_rows as totalRows,
        imported_count as importedCount,
        duplicate_count as duplicateCount,
        error_count as errorCount,
        status,
        error_message as errorMessage
      FROM import_sessions
      ${whereClause}
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(...params, limit, offset) as ImportSession[];
  }

  /**
   * Get recent import sessions
   */
  async getRecent(limit: number = 10): Promise<ImportSession[]> {
    const stmt = this.db.prepare(`
      SELECT
        id,
        filename,
        started_at as startedAt,
        completed_at as completedAt,
        total_rows as totalRows,
        imported_count as importedCount,
        duplicate_count as duplicateCount,
        error_count as errorCount,
        status,
        error_message as errorMessage
      FROM import_sessions
      ORDER BY started_at DESC
      LIMIT ?
    `);

    return stmt.all(limit) as ImportSession[];
  }

  /**
   * Get the most recent successful import
   */
  async getLastSuccessfulImport(): Promise<ImportSession | null> {
    const stmt = this.db.prepare(`
      SELECT
        id,
        filename,
        started_at as startedAt,
        completed_at as completedAt,
        total_rows as totalRows,
        imported_count as importedCount,
        duplicate_count as duplicateCount,
        error_count as errorCount,
        status,
        error_message as errorMessage
      FROM import_sessions
      WHERE status = 'completed' AND imported_count > 0
      ORDER BY completed_at DESC
      LIMIT 1
    `);

    const result = stmt.get() as ImportSession | undefined;
    return result || null;
  }

  /**
   * Get import session statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    failedSessions: number;
    pendingSessions: number;
    totalImported: number;
    totalDuplicates: number;
    totalErrors: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalSessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedSessions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedSessions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingSessions,
        SUM(imported_count) as totalImported,
        SUM(duplicate_count) as totalDuplicates,
        SUM(error_count) as totalErrors
      FROM import_sessions
    `);

    return stmt.get() as any;
  }

  /**
   * Delete import session by ID
   */
  async deleteById(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM import_sessions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Delete old import sessions (older than specified days)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stmt = this.db.prepare(`
      DELETE FROM import_sessions
      WHERE started_at < ?
    `);

    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * Count import sessions with optional status filter
   */
  async count(status?: 'pending' | 'completed' | 'failed'): Promise<number> {
    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      params.push(status);
    }

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM import_sessions
      ${whereClause}
    `);

    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  /**
   * Check if there are any pending import sessions
   */
  async hasPendingSessions(): Promise<boolean> {
    const count = await this.count('pending');
    return count > 0;
  }

  /**
   * Get import sessions by filename
   */
  async findByFilename(filename: string): Promise<ImportSession[]> {
    const stmt = this.db.prepare(`
      SELECT
        id,
        filename,
        started_at as startedAt,
        completed_at as completedAt,
        total_rows as totalRows,
        imported_count as importedCount,
        duplicate_count as duplicateCount,
        error_count as errorCount,
        status,
        error_message as errorMessage
      FROM import_sessions
      WHERE filename = ?
      ORDER BY started_at DESC
    `);

    return stmt.all(filename) as ImportSession[];
  }

  /**
   * Get import session success rate
   */
  async getSuccessRate(): Promise<{
    totalSessions: number;
    successfulSessions: number;
    successRate: number;
  }> {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalSessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successfulSessions
      FROM import_sessions
      WHERE status IN ('completed', 'failed')
    `);

    const result = stmt.get() as { totalSessions: number; successfulSessions: number };
    const successRate = result.totalSessions > 0 ? (result.successfulSessions / result.totalSessions) * 100 : 0;

    return {
      totalSessions: result.totalSessions,
      successfulSessions: result.successfulSessions,
      successRate: Math.round(successRate * 100) / 100 // Round to 2 decimal places
    };
  }
}