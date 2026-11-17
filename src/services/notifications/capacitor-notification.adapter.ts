import { LocalNotifications } from '@capacitor/local-notifications';
import { INotificationService, NotificationPermissionState, ScheduleReminderOptions } from './notification.interface';
import { Task } from '../../types';

export class CapacitorNotificationAdapter implements INotificationService {
  private channelCreated = false;

  private async ensureChannel() {
    if (this.channelCreated) return;
    try {
      await LocalNotifications.createChannel({
        id: 'tovo_reminders',
        name: 'Tovo Task Reminders',
        description: 'Scheduled reminders for your tasks and habits',
        importance: 4, // High
        visibility: 1, // Public
        vibration: true,
      });
      this.channelCreated = true;
    } catch {
      // Channel creation not needed on iOS or non-Android
    }
  }

  // Generate stable 32-bit positive integer from string ID
  private hashId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647;
  }

  public async checkPermissions(): Promise<NotificationPermissionState> {
    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display === 'granted') return 'granted';
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  public async requestPermissions(): Promise<NotificationPermissionState> {
    try {
      const status = await LocalNotifications.requestPermissions();
      if (status.display === 'granted') {
        await this.ensureChannel();
        return 'granted';
      }
      if (status.display === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'unsupported';
    }
  }

  public async scheduleReminder(options: ScheduleReminderOptions): Promise<void> {
    await this.ensureChannel();
    const id = options.id || this.hashId(options.taskOrHabitId);

    try {
      // Cancel any pre-existing notification with this id
      await LocalNotifications.cancel({ notifications: [{ id }] });

      const triggerDate = new Date(options.triggerAt);
      if (triggerDate.getTime() <= Date.now()) return; // Don't schedule past events

      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: options.title,
            body: options.body,
            schedule: { at: triggerDate, allowWhileIdle: true },
            channelId: 'tovo_reminders',
            extra: {
              taskId: options.taskOrHabitId,
              ...(options.extra || {}),
            },
          },
        ],
      });
    } catch (e) {
      console.warn('Native local notification scheduling failed:', e);
    }
  }

  public async cancelReminder(taskOrHabitId: string): Promise<void> {
    const id = this.hashId(taskOrHabitId);
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (e) {
      console.warn('Cancel native notification failed:', e);
    }
  }

  public async getPendingReminders(): Promise<any[]> {
    try {
      const res = await LocalNotifications.getPending();
      return res.notifications;
    } catch {
      return [];
    }
  }

  public async reconcileScheduledReminders(tasks: Task[]): Promise<void> {
    try {
      const pending = await this.getPendingReminders();
      const pendingIds = new Set(pending.map(p => p.id));

      const now = Date.now();
      const validTasksWithReminders = tasks.filter(
        t => !t.archived && t.status !== 'completed' && t.reminderAt && new Date(t.reminderAt).getTime() > now
      );

      const targetIds = new Set(validTasksWithReminders.map(t => this.hashId(t.id)));

      // 1. Cancel notifications for tasks that no longer exist or are completed
      const toCancel = pending.filter(p => !targetIds.has(p.id));
      if (toCancel.length > 0) {
        await LocalNotifications.cancel({ notifications: toCancel.map(c => ({ id: c.id })) });
      }

      // 2. Schedule any missing or updated reminders
      for (const task of validTasksWithReminders) {
        const expectedId = this.hashId(task.id);
        if (!pendingIds.has(expectedId)) {
          await this.scheduleReminder({
            id: expectedId,
            taskOrHabitId: task.id,
            title: `Reminder: ${task.title}`,
            body: task.description || 'Time to complete your scheduled task in Tovo.',
            triggerAt: new Date(task.reminderAt!),
          });
        }
      }
    } catch (e) {
      console.warn('Reconcile notifications failed:', e);
    }
  }

  public onNotificationTap(callback: (taskId: string) => void): () => void {
    let handle: any = null;
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      const taskId = action.notification.extra?.taskId;
      if (taskId) {
        callback(taskId);
      }
    }).then(h => {
      handle = h;
    });

    return () => {
      if (handle) handle.remove();
    };
  }
}
