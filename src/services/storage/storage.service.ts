import { IStorageAdapter } from './storage.interface';
import { WebStorageAdapter } from './web-storage.adapter';
import { SQLiteStorageAdapter } from './sqlite-storage.adapter';
import { Capacitor } from '@capacitor/core';
import { Task, Habit, HabitLog, UserPreferences, SyncOperation } from '../../types';

class StorageService implements IStorageAdapter {
  private adapter: IStorageAdapter;
  private initialized = false;

  constructor() {
    // Select adapter based on runtime platform
    if (Capacitor.isNativePlatform()) {
      this.adapter = new SQLiteStorageAdapter();
    } else {
      this.adapter = new WebStorageAdapter();
    }
  }

  public async init(): Promise<void> {
    if (!this.initialized) {
      await this.adapter.init();
      this.initialized = true;
    }
  }

  public async getTasks(userId: string): Promise<Task[]> {
    await this.init();
    return this.adapter.getTasks(userId);
  }

  public async saveTask(task: Task): Promise<void> {
    await this.init();
    return this.adapter.saveTask(task);
  }

  public async deleteTask(taskId: string, userId: string, hard?: boolean): Promise<void> {
    await this.init();
    return this.adapter.deleteTask(taskId, userId, hard);
  }

  public async getHabits(userId: string): Promise<Habit[]> {
    await this.init();
    return this.adapter.getHabits(userId);
  }

  public async saveHabit(habit: Habit): Promise<void> {
    await this.init();
    return this.adapter.saveHabit(habit);
  }

  public async deleteHabit(habitId: string, userId: string, hard?: boolean): Promise<void> {
    await this.init();
    return this.adapter.deleteHabit(habitId, userId, hard);
  }

  public async getHabitLogs(userId: string): Promise<HabitLog[]> {
    await this.init();
    return this.adapter.getHabitLogs(userId);
  }

  public async saveHabitLog(log: HabitLog): Promise<void> {
    await this.init();
    return this.adapter.saveHabitLog(log);
  }

  public async getPreferences(userId: string): Promise<UserPreferences | null> {
    await this.init();
    return this.adapter.getPreferences(userId);
  }

  public async savePreferences(prefs: UserPreferences): Promise<void> {
    await this.init();
    return this.adapter.savePreferences(prefs);
  }

  public async getSyncQueue(): Promise<SyncOperation[]> {
    await this.init();
    return this.adapter.getSyncQueue();
  }

  public async enqueueSync(op: SyncOperation): Promise<void> {
    await this.init();
    return this.adapter.enqueueSync(op);
  }

  public async dequeueSync(opId: string): Promise<void> {
    await this.init();
    return this.adapter.dequeueSync(opId);
  }

  public async updateSyncOperation(op: SyncOperation): Promise<void> {
    await this.init();
    return this.adapter.updateSyncOperation(op);
  }

  public async clearSyncQueue(): Promise<void> {
    await this.init();
    return this.adapter.clearSyncQueue();
  }

  public async clearUserData(userId: string): Promise<void> {
    await this.init();
    return this.adapter.clearUserData(userId);
  }
}

export const storageService = new StorageService();
