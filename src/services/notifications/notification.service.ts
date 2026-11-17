import { INotificationService, NotificationPermissionState, ScheduleReminderOptions } from './notification.interface';
import { CapacitorNotificationAdapter } from './capacitor-notification.adapter';
import { WebNotificationAdapter } from './web-notification.adapter';
import { Capacitor } from '@capacitor/core';
import { Task } from '../../types';

class NotificationServiceManager implements INotificationService {
  private adapter: INotificationService;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.adapter = new CapacitorNotificationAdapter();
    } else {
      this.adapter = new WebNotificationAdapter();
    }
  }

  public async checkPermissions(): Promise<NotificationPermissionState> {
    return this.adapter.checkPermissions();
  }

  public async requestPermissions(): Promise<NotificationPermissionState> {
    return this.adapter.requestPermissions();
  }

  public async scheduleReminder(options: ScheduleReminderOptions): Promise<void> {
    return this.adapter.scheduleReminder(options);
  }

  public async cancelReminder(taskOrHabitId: string): Promise<void> {
    return this.adapter.cancelReminder(taskOrHabitId);
  }

  public async getPendingReminders(): Promise<any[]> {
    return this.adapter.getPendingReminders();
  }

  public async reconcileScheduledReminders(tasks: Task[]): Promise<void> {
    return this.adapter.reconcileScheduledReminders(tasks);
  }

  public onNotificationTap(callback: (taskId: string) => void): () => void {
    return this.adapter.onNotificationTap(callback);
  }
}

export const notificationService = new NotificationServiceManager();
