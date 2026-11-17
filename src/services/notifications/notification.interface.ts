import { Task } from '../../types';

export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface ScheduleReminderOptions {
  id: number;
  taskOrHabitId: string;
  title: string;
  body: string;
  triggerAt: Date;
  extra?: Record<string, any>;
}

export interface INotificationService {
  checkPermissions(): Promise<NotificationPermissionState>;
  requestPermissions(): Promise<NotificationPermissionState>;
  scheduleReminder(options: ScheduleReminderOptions): Promise<void>;
  cancelReminder(taskOrHabitId: string): Promise<void>;
  getPendingReminders(): Promise<any[]>;
  reconcileScheduledReminders(tasks: Task[]): Promise<void>;
  onNotificationTap(callback: (taskId: string) => void): () => void;
}
