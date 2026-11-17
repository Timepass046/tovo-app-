import { IStorageAdapter } from './storage.interface';
import { Task, Habit, HabitLog, UserPreferences, SyncOperation } from '../../types';
import { WebStorageAdapter } from './web-storage.adapter';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export class SQLiteStorageAdapter implements IStorageAdapter {
  private fallbackAdapter: WebStorageAdapter;
  private sqliteConnection: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isNative = false;
  private dbName = 'minddrop_sqlite_db';

  constructor() {
    this.fallbackAdapter = new WebStorageAdapter();
  }

  public async init(): Promise<void> {
    this.isNative = Capacitor.isNativePlatform();

    if (this.isNative) {
      try {
        this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
        const ret = await this.sqliteConnection.checkConnectionsConsistency();
        const isConn = (await this.sqliteConnection.isConnection(this.dbName, false)).result;

        if (ret.result && isConn) {
          this.db = await this.sqliteConnection.retrieveConnection(this.dbName, false);
        } else {
          this.db = await this.sqliteConnection.createConnection(
            this.dbName,
            false,
            'no-encryption',
            1,
            false
          );
        }

        await this.db.open();
        await this.createTables();
        return;
      } catch (err) {
        console.warn('Native SQLite initialization failed, falling back to WebStorage:', err);
        this.isNative = false;
      }
    }

    return this.fallbackAdapter.init();
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const schemaQuery = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        bucket TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        subtasks TEXT,
        estimated_minutes INTEGER,
        start_date TEXT,
        due_date TEXT,
        reminder_at TEXT,
        recurrence TEXT,
        archived INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        version INTEGER DEFAULT 1,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        frequency TEXT NOT NULL,
        target_days TEXT,
        streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS preferences (
        user_id TEXT PRIMARY KEY,
        theme TEXT NOT NULL,
        notifications_enabled INTEGER DEFAULT 1,
        sound_enabled INTEGER DEFAULT 1,
        focus_duration INTEGER DEFAULT 25,
        break_duration INTEGER DEFAULT 5,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        collection_name TEXT NOT NULL,
        doc_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        timestamp INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0,
        status TEXT NOT NULL,
        error TEXT
      );
    `;

    await this.db.execute(schemaQuery);
  }

  // Tasks
  public async getTasks(userId: string): Promise<Task[]> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.getTasks(userId);
    }

    const res = await this.db.query(
      'SELECT * FROM tasks WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [userId]
    );

    return (res.values || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      priority: row.priority,
      status: row.status,
      bucket: row.bucket,
      category: row.category || undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      subtasks: row.subtasks ? JSON.parse(row.subtasks) : [],
      estimatedMinutes: row.estimated_minutes || undefined,
      startDate: row.start_date || undefined,
      dueDate: row.due_date || undefined,
      reminderAt: row.reminder_at || undefined,
      recurrence: row.recurrence || undefined,
      archived: Boolean(row.archived),
      completedAt: row.completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version || 1,
    }));
  }

  public async saveTask(task: Task): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.saveTask(task);
    }

    const query = `
      INSERT OR REPLACE INTO tasks (
        id, user_id, title, description, priority, status, bucket,
        category, tags, subtasks, estimated_minutes, start_date, due_date,
        reminder_at, recurrence, archived, completed_at, created_at, updated_at, version, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      task.id,
      task.userId,
      task.title,
      task.description || null,
      task.priority,
      task.status,
      task.bucket,
      task.category || null,
      task.tags ? JSON.stringify(task.tags) : '[]',
      task.subtasks ? JSON.stringify(task.subtasks) : '[]',
      task.estimatedMinutes || null,
      task.startDate || null,
      task.dueDate || null,
      task.reminderAt || null,
      task.recurrence || null,
      task.archived ? 1 : 0,
      task.completedAt || null,
      task.createdAt,
      task.updatedAt,
      (task.version || 1),
      task._deleted ? 1 : 0,
    ]);
  }

  public async deleteTask(taskId: string, userId: string, hard: boolean = false): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.deleteTask(taskId, userId, hard);
    }

    if (hard) {
      await this.db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    } else {
      await this.db.run(
        'UPDATE tasks SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?',
        [new Date().toISOString(), taskId, userId]
      );
    }
  }

  // Habits
  public async getHabits(userId: string): Promise<Habit[]> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.getHabits(userId);
    }

    const res = await this.db.query(
      'SELECT * FROM habits WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [userId]
    );

    return (res.values || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || '',
      icon: row.icon || 'Sparkles',
      color: row.color || 'blue',
      frequency: row.frequency,
      targetDays: row.target_days ? JSON.parse(row.target_days) : [0, 1, 2, 3, 4, 5, 6],
      streak: row.streak || 0,
      bestStreak: row.best_streak || 0,
      archived: Boolean(row.archived),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  public async saveHabit(habit: Habit): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.saveHabit(habit);
    }

    const query = `
      INSERT OR REPLACE INTO habits (
        id, user_id, title, description, icon, color, frequency,
        target_days, streak, best_streak, archived, created_at, updated_at, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      habit.id,
      habit.userId,
      habit.title,
      habit.description || null,
      habit.icon || null,
      habit.color || null,
      habit.frequency,
      habit.targetDays ? JSON.stringify(habit.targetDays) : '[]',
      habit.streak,
      habit.bestStreak,
      habit.archived ? 1 : 0,
      habit.createdAt,
      habit.updatedAt,
      habit._deleted ? 1 : 0,
    ]);
  }

  public async deleteHabit(habitId: string, userId: string, hard: boolean = false): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.deleteHabit(habitId, userId, hard);
    }

    if (hard) {
      await this.db.run('DELETE FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
    } else {
      await this.db.run(
        'UPDATE habits SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?',
        [new Date().toISOString(), habitId, userId]
      );
    }
  }

  // Habit Logs
  public async getHabitLogs(userId: string): Promise<HabitLog[]> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.getHabitLogs(userId);
    }

    const res = await this.db.query('SELECT * FROM habit_logs WHERE user_id = ?', [userId]);
    return (res.values || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      habitId: row.habit_id,
      date: row.date,
      completed: Boolean(row.completed),
      completedAt: row.completed_at || undefined,
    }));
  }

  public async saveHabitLog(log: HabitLog): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.saveHabitLog(log);
    }

    const query = `
      INSERT OR REPLACE INTO habit_logs (
        id, user_id, habit_id, date, completed, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      log.id,
      log.userId,
      log.habitId,
      log.date,
      log.completed ? 1 : 0,
      log.completedAt || null,
    ]);
  }

  // Preferences
  public async getPreferences(userId: string): Promise<UserPreferences | null> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.getPreferences(userId);
    }

    const res = await this.db.query('SELECT * FROM preferences WHERE user_id = ?', [userId]);
    if (!res.values || res.values.length === 0) return null;

    const row = res.values[0];
    return {
      userId: row.user_id,
      theme: row.theme,
      notificationsEnabled: Boolean(row.notifications_enabled),
      soundEnabled: Boolean(row.sound_enabled),
      focusSessionDuration: row.focus_duration,
      breakDuration: row.break_duration,
      updatedAt: row.updated_at || undefined,
    };
  }

  public async savePreferences(prefs: UserPreferences): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.savePreferences(prefs);
    }

    const query = `
      INSERT OR REPLACE INTO preferences (
        user_id, theme, notifications_enabled, sound_enabled, focus_duration, break_duration, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      prefs.userId,
      prefs.theme,
      prefs.notificationsEnabled ? 1 : 0,
      prefs.soundEnabled ? 1 : 0,
      prefs.focusSessionDuration,
      prefs.breakDuration,
      prefs.updatedAt || new Date().toISOString(),
    ]);
  }

  // Sync Queue
  public async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.getSyncQueue();
    }

    const res = await this.db.query('SELECT * FROM sync_queue ORDER BY timestamp ASC');
    return (res.values || []).map((row: any) => ({
      id: row.id,
      collection: row.collection_name,
      docId: row.doc_id,
      action: row.action,
      data: row.payload ? JSON.parse(row.payload) : undefined,
      timestamp: row.timestamp,
      retryCount: row.retry_count,
      status: row.status,
      error: row.error || undefined,
    }));
  }

  public async enqueueSync(op: SyncOperation): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.enqueueSync(op);
    }

    // Delete existing pending operation for same docId to maintain idempotency
    await this.db.run(
      'DELETE FROM sync_queue WHERE collection_name = ? AND doc_id = ? AND status = "pending"',
      [op.collection, op.docId]
    );

    const query = `
      INSERT INTO sync_queue (
        id, collection_name, doc_id, action, payload, timestamp, retry_count, status, error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(query, [
      op.id,
      op.collection,
      op.docId,
      op.action,
      op.data ? JSON.stringify(op.data) : null,
      op.timestamp,
      op.retryCount,
      op.status,
      op.error || null,
    ]);
  }

  public async dequeueSync(opId: string): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.dequeueSync(opId);
    }
    await this.db.run('DELETE FROM sync_queue WHERE id = ?', [opId]);
  }

  public async updateSyncOperation(op: SyncOperation): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.updateSyncOperation(op);
    }

    await this.db.run(
      'UPDATE sync_queue SET retry_count = ?, status = ?, error = ? WHERE id = ?',
      [op.retryCount, op.status, op.error || null, op.id]
    );
  }

  public async clearSyncQueue(): Promise<void> {
    if (!this.isNative || !this.db) {
      return this.fallbackAdapter.clearSyncQueue();
    }
    await this.db.run('DELETE FROM sync_queue');
  }

  public async clearUserData(userId: string): Promise<void> {
    if (this.isNative && this.db) {
      await this.db.run('DELETE FROM tasks WHERE user_id = ?', [userId]);
      await this.db.run('DELETE FROM habits WHERE user_id = ?', [userId]);
      await this.db.run('DELETE FROM habit_logs WHERE user_id = ?', [userId]);
      await this.db.run('DELETE FROM preferences WHERE user_id = ?', [userId]);
    }
    await this.fallbackAdapter.clearUserData(userId);
  }
}
