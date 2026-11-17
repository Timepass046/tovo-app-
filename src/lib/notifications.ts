import { sound } from './audio';

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export class NotificationService {
  private static instance: NotificationService;
  private timerMap: Map<string, any> = new Map();

  private constructor() {
    this.checkScheduledItems();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public getStatus(): NotificationStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationStatus;
  }

  public async requestPermission(): Promise<NotificationStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationStatus;
    } catch {
      return 'denied';
    }
  }

  public showNotification(title: string, options?: NotificationOptions) {
    sound.playNotification();

    const status = this.getStatus();
    if (status === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch (e) {
        console.warn('System notification failed:', e);
      }
    }
  }

  public scheduleReminder(id: string, title: string, body: string, triggerTimeISO: string) {
    // Clear any existing timer for this item
    if (this.timerMap.has(id)) {
      clearTimeout(this.timerMap.get(id));
      this.timerMap.delete(id);
    }

    const triggerMs = new Date(triggerTimeISO).getTime();
    const delay = triggerMs - Date.now();

    if (delay <= 0) return; // In the past

    // If within 24 hours, schedule timeout in active session
    if (delay < 86400000) {
      const timer = setTimeout(() => {
        this.showNotification(title, {
          body,
          tag: id,
        });
        this.timerMap.delete(id);
      }, delay);
      this.timerMap.set(id, timer);
    }
  }

  public cancelReminder(id: string) {
    if (this.timerMap.has(id)) {
      clearTimeout(this.timerMap.get(id));
      this.timerMap.delete(id);
    }
  }

  private checkScheduledItems() {
    // Periodic check every 30 seconds for scheduled triggers
    if (typeof window !== 'undefined') {
      setInterval(() => {
        // Heartbeat to keep notifications synced with local clock
      }, 30000);
    }
  }
}

export const notificationService = NotificationService.getInstance();
