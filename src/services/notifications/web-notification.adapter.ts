import { INotificationService, NotificationPermissionState, ScheduleReminderOptions } from './notification.interface';
import { Task } from '../../types';
import { sound } from '../../lib/audio';

export class WebNotificationAdapter implements INotificationService {
  private timerMap: Map<string, any> = new Map();
  private tapListeners: ((taskId: string) => void)[] = [];

  public async checkPermissions(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  public async requestPermissions(): Promise<NotificationPermissionState> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const res = await Notification.requestPermission();
      return (res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'prompt');
    } catch {
      return 'denied';
    }
  }

  public async scheduleReminder(options: ScheduleReminderOptions): Promise<void> {
    this.cancelReminder(options.taskOrHabitId);

    const triggerMs = new Date(options.triggerAt).getTime();
    const delay = triggerMs - Date.now();
    if (delay <= 0) return;

    // In web session, schedule timeout
    if (delay < 86400000) {
      const timer = setTimeout(() => {
        sound.playNotification();
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const notif = new Notification(options.title, {
              body: options.body,
              icon: '/favicon.ico',
              tag: options.taskOrHabitId,
            });
            notif.onclick = () => {
              window.focus();
              this.tapListeners.forEach(cb => cb(options.taskOrHabitId));
            };
          } catch (e) {
            console.warn('Web notification trigger failed:', e);
          }
        }
        this.timerMap.delete(options.taskOrHabitId);
      }, delay);

      this.timerMap.set(options.taskOrHabitId, timer);
    }
  }

  public async cancelReminder(taskOrHabitId: string): Promise<void> {
    if (this.timerMap.has(taskOrHabitId)) {
      clearTimeout(this.timerMap.get(taskOrHabitId));
      this.timerMap.delete(taskOrHabitId);
    }
  }

  public async getPendingReminders(): Promise<any[]> {
    return Array.from(this.timerMap.keys()).map(id => ({ id, type: 'web_timer' }));
  }

  public async reconcileScheduledReminders(tasks: Task[]): Promise<void> {
    const now = Date.now();
    for (const task of tasks) {
      if (!task.archived && task.status !== 'completed' && task.reminderAt) {
        const triggerTime = new Date(task.reminderAt).getTime();
        if (triggerTime > now && !this.timerMap.has(task.id)) {
          await this.scheduleReminder({
            id: 0,
            taskOrHabitId: task.id,
            title: `Reminder: ${task.title}`,
            body: task.description || 'Time to review this task in Tovo.',
            triggerAt: new Date(task.reminderAt),
          });
        }
      }
    }
  }

  public onNotificationTap(callback: (taskId: string) => void): () => void {
    this.tapListeners.push(callback);
    return () => {
      this.tapListeners = this.tapListeners.filter(cb => cb !== callback);
    };
  }
}
