import { IStorageAdapter } from './storage.interface';
import { Task, Habit, HabitLog, UserPreferences, SyncOperation } from '../../types';

export class WebStorageAdapter implements IStorageAdapter {
  private prefix = 'minddrop_';

  public async init(): Promise<void> {
    // Web storage is synchronously ready in browser
    return Promise.resolve();
  }

  private getKey(collection: string, userId?: string): string {
    return userId ? `${this.prefix}${userId}_${collection}` : `${this.prefix}${collection}`;
  }

  private read<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private write<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Web storage write failed:', e);
    }
  }

  // Tasks
  public async getTasks(userId: string): Promise<Task[]> {
    const key = this.getKey('tasks', userId);
    const tasks = this.read<Task[]>(key, []);
    return tasks.filter(t => !t._deleted);
  }

  public async saveTask(task: Task): Promise<void> {
    const key = this.getKey('tasks', task.userId);
    const tasks = this.read<Task[]>(key, []);
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = { ...task, version: (tasks[idx].version || 1) + 1 };
    } else {
      tasks.unshift({ ...task, version: 1 });
    }
    this.write(key, tasks);
  }

  public async deleteTask(taskId: string, userId: string, hard: boolean = false): Promise<void> {
    const key = this.getKey('tasks', userId);
    const tasks = this.read<Task[]>(key, []);
    if (hard) {
      this.write(key, tasks.filter(t => t.id !== taskId));
    } else {
      const updated = tasks.map(t => (t.id === taskId ? { ...t, _deleted: true, updatedAt: new Date().toISOString() } : t));
      this.write(key, updated);
    }
  }

  // Habits
  public async getHabits(userId: string): Promise<Habit[]> {
    const key = this.getKey('habits', userId);
    const habits = this.read<Habit[]>(key, []);
    return habits.filter(h => !h._deleted);
  }

  public async saveHabit(habit: Habit): Promise<void> {
    const key = this.getKey('habits', habit.userId);
    const habits = this.read<Habit[]>(key, []);
    const idx = habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) {
      habits[idx] = habit;
    } else {
      habits.unshift(habit);
    }
    this.write(key, habits);
  }

  public async deleteHabit(habitId: string, userId: string, hard: boolean = false): Promise<void> {
    const key = this.getKey('habits', userId);
    const habits = this.read<Habit[]>(key, []);
    if (hard) {
      this.write(key, habits.filter(h => h.id !== habitId));
    } else {
      const updated = habits.map(h => (h.id === habitId ? { ...h, _deleted: true, updatedAt: new Date().toISOString() } : h));
      this.write(key, updated);
    }
  }

  // Habit Logs
  public async getHabitLogs(userId: string): Promise<HabitLog[]> {
    const key = this.getKey('habitLogs', userId);
    return this.read<HabitLog[]>(key, []);
  }

  public async saveHabitLog(log: HabitLog): Promise<void> {
    const key = this.getKey('habitLogs', log.userId);
    const logs = this.read<HabitLog[]>(key, []);
    const idx = logs.findIndex(l => l.habitId === log.habitId && l.date === log.date);
    if (idx >= 0) {
      logs[idx] = log;
    } else {
      logs.push(log);
    }
    this.write(key, logs);
  }

  // Preferences
  public async getPreferences(userId: string): Promise<UserPreferences | null> {
    const key = this.getKey('preferences', userId);
    return this.read<UserPreferences | null>(key, null);
  }

  public async savePreferences(prefs: UserPreferences): Promise<void> {
    const key = this.getKey('preferences', prefs.userId);
    this.write(key, prefs);
  }

  // Sync Queue
  public async getSyncQueue(): Promise<SyncOperation[]> {
    const key = this.getKey('sync_queue');
    return this.read<SyncOperation[]>(key, []);
  }

  public async enqueueSync(op: SyncOperation): Promise<void> {
    const key = this.getKey('sync_queue');
    const queue = this.read<SyncOperation[]>(key, []);
    // Replace duplicate operation for same docId if pending
    const filtered = queue.filter(q => !(q.collection === op.collection && q.docId === op.docId && q.status === 'pending'));
    filtered.push(op);
    this.write(key, filtered);
  }

  public async dequeueSync(opId: string): Promise<void> {
    const key = this.getKey('sync_queue');
    const queue = this.read<SyncOperation[]>(key, []);
    this.write(key, queue.filter(q => q.id !== opId));
  }

  public async updateSyncOperation(op: SyncOperation): Promise<void> {
    const key = this.getKey('sync_queue');
    const queue = this.read<SyncOperation[]>(key, []);
    const idx = queue.findIndex(q => q.id === op.id);
    if (idx >= 0) {
      queue[idx] = op;
      this.write(key, queue);
    }
  }

  public async clearSyncQueue(): Promise<void> {
    const key = this.getKey('sync_queue');
    this.write(key, []);
  }

  // Security: Clean user cache on sign-out to prevent data leaks
  public async clearUserData(userId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const prefix = `${this.prefix}${userId}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }
}
