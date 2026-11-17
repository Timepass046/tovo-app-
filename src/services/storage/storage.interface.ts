import { Task, Habit, HabitLog, UserPreferences, SyncOperation } from '../../types';

export interface IStorageAdapter {
  init(): Promise<void>;
  
  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  deleteTask(taskId: string, userId: string, hard?: boolean): Promise<void>;
  
  // Habits
  getHabits(userId: string): Promise<Habit[]>;
  saveHabit(habit: Habit): Promise<void>;
  deleteHabit(habitId: string, userId: string, hard?: boolean): Promise<void>;
  
  // Habit Logs
  getHabitLogs(userId: string): Promise<HabitLog[]>;
  saveHabitLog(log: HabitLog): Promise<void>;
  
  // Preferences
  getPreferences(userId: string): Promise<UserPreferences | null>;
  savePreferences(prefs: UserPreferences): Promise<void>;
  
  // Sync Queue (durable offline storage)
  getSyncQueue(): Promise<SyncOperation[]>;
  enqueueSync(op: SyncOperation): Promise<void>;
  dequeueSync(opId: string): Promise<void>;
  updateSyncOperation(op: SyncOperation): Promise<void>;
  clearSyncQueue(): Promise<void>;
  
  // Security & multi-user hygiene
  clearUserData(userId: string): Promise<void>;
}
