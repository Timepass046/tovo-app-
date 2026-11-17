import { SyncItem, Task, Habit, HabitLog, UserPreferences } from '../types';

const STORAGE_KEYS = {
  TASKS: 'minddrop_tasks_cache',
  HABITS: 'minddrop_habits_cache',
  HABIT_LOGS: 'minddrop_habit_logs_cache',
  PREFERENCES: 'minddrop_preferences_cache',
  SYNC_QUEUE: 'minddrop_sync_queue',
};

class LocalDataStore {
  // Safe read from localStorage
  private getItem<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  // Safe write to localStorage
  private setItem<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  // Tasks Cache
  public getTasks(userId?: string): Task[] {
    const tasks = this.getItem<Task[]>(STORAGE_KEYS.TASKS, []);
    return userId ? tasks.filter(t => t.userId === userId) : tasks;
  }

  public saveTasks(tasks: Task[]): void {
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  public upsertTask(task: Task): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    this.saveTasks(tasks);
  }

  public removeTask(taskId: string): void {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    this.saveTasks(tasks);
  }

  // Habits Cache
  public getHabits(userId?: string): Habit[] {
    const habits = this.getItem<Habit[]>(STORAGE_KEYS.HABITS, []);
    return userId ? habits.filter(h => h.userId === userId) : habits;
  }

  public saveHabits(habits: Habit[]): void {
    this.setItem(STORAGE_KEYS.HABITS, habits);
  }

  public upsertHabit(habit: Habit): void {
    const habits = this.getHabits();
    const idx = habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) {
      habits[idx] = habit;
    } else {
      habits.unshift(habit);
    }
    this.saveHabits(habits);
  }

  public removeHabit(habitId: string): void {
    const habits = this.getHabits().filter(h => h.id !== habitId);
    this.saveHabits(habits);
  }

  // Habit Logs Cache
  public getHabitLogs(userId?: string): HabitLog[] {
    const logs = this.getItem<HabitLog[]>(STORAGE_KEYS.HABIT_LOGS, []);
    return userId ? logs.filter(l => l.userId === userId) : logs;
  }

  public saveHabitLogs(logs: HabitLog[]): void {
    this.setItem(STORAGE_KEYS.HABIT_LOGS, logs);
  }

  public upsertHabitLog(log: HabitLog): void {
    const logs = this.getHabitLogs();
    const idx = logs.findIndex(l => l.habitId === log.habitId && l.date === log.date);
    if (idx >= 0) {
      logs[idx] = log;
    } else {
      logs.push(log);
    }
    this.saveHabitLogs(logs);
  }

  // Preferences Cache
  public getPreferences(userId: string): UserPreferences | null {
    const all = this.getItem<Record<string, UserPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    return all[userId] || null;
  }

  public savePreferences(prefs: UserPreferences): void {
    const all = this.getItem<Record<string, UserPreferences>>(STORAGE_KEYS.PREFERENCES, {});
    all[prefs.userId] = prefs;
    this.setItem(STORAGE_KEYS.PREFERENCES, all);
  }

  // Sync Queue
  public getSyncQueue(): SyncItem[] {
    return this.getItem<SyncItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  public enqueueSync(item: SyncItem): void {
    const queue = this.getSyncQueue();
    // Consolidate duplicates if existing in queue
    const filtered = queue.filter(q => !(q.collection === item.collection && q.docId === item.docId));
    filtered.push(item);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, filtered);
  }

  public dequeueSync(id: string): void {
    const queue = this.getSyncQueue().filter(q => q.id !== id);
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
  }

  public clearSyncQueue(): void {
    this.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
  }
}

export const localStore = new LocalDataStore();
