import { ActivityEventType, HealthErrorType } from '../../types';
import { auth } from '../../lib/firebase';
import { apiUrl } from '../../lib/api';
import { Capacitor } from '@capacitor/core';

class AnalyticsService {
  private appVersion = '1.0.0';

  private getPlatform(): string {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform();
    }
    return 'web';
  }

  /**
   * Log an activity event for product usage analytics.
   * Strips out any private user content (no titles, descriptions, notes, or secrets).
   */
  public async trackEvent(
    eventType: ActivityEventType,
    metadata: Record<string, string | number | boolean> = {}
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken().catch(() => null) : null;

      // Filter out any key that might carry private user notes or sensitive tokens
      const safeMetadata: Record<string, any> = {};
      for (const [key, val] of Object.entries(metadata)) {
        const k = key.toLowerCase();
        if (
          k.includes('password') ||
          k.includes('token') ||
          k.includes('secret') ||
          k.includes('title') ||
          k.includes('description') ||
          k.includes('note') ||
          k.includes('content')
        ) {
          continue;
        }
        safeMetadata[key] = val;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(apiUrl('/api/analytics/events'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventType,
          platform: this.getPlatform(),
          appVersion: this.appVersion,
          metadata: safeMetadata,
        }),
      }).catch(() => {
        // Quiet failure to never disrupt user experience
      });
    } catch {
      // Ignore background analytics errors
    }
  }

  /**
   * Operational Health & Error Logging
   */
  public async logHealthError(
    errorType: HealthErrorType,
    error: Error | string,
    extra?: Record<string, any>
  ): Promise<void> {
    try {
      const rawMessage = typeof error === 'string' ? error : error.message || 'Unknown error';
      // Sanitize tokens
      const cleanMessage = rawMessage.replace(/[a-zA-Z0-9_\-\.]{40,}/g, '[REDACTED_TOKEN]').substring(0, 500);

      const user = auth.currentUser;

      await fetch(apiUrl('/api/health/log-error'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorType,
          message: cleanMessage,
          platform: this.getPlatform(),
          userId: user?.uid || 'anonymous',
          extra,
        }),
      }).catch(() => {});
    } catch {
      // Ignore background health error recording
    }
  }

  // Convenience methods for task workflows
  public trackTaskCreated(taskId: string, priority?: string, bucket?: string) {
    this.trackEvent('TASK_CREATED', { taskId, priority: priority || 'medium', bucket: bucket || 'inbox' });
  }

  public trackTaskCompleted(taskId: string) {
    this.trackEvent('TASK_COMPLETED', { taskId });
  }

  public trackTaskUpdated(taskId: string, status?: string) {
    this.trackEvent('TASK_UPDATED', { taskId, status: status || 'updated' });
  }

  public trackTaskArchived(taskId: string) {
    this.trackEvent('TASK_ARCHIVED', { taskId });
  }

  public trackHabitCreated(habitId: string, frequency?: string) {
    this.trackEvent('HABIT_CREATED', { habitId, frequency: frequency || 'daily' });
  }

  public trackHabitCompleted(habitId: string) {
    this.trackEvent('HABIT_COMPLETED', { habitId });
  }

  public trackReminderCreated(taskId: string) {
    this.trackEvent('REMINDER_CREATED', { taskId });
  }

  public trackReminderCancelled(taskId: string) {
    this.trackEvent('REMINDER_CANCELLED', { taskId });
  }

  public trackSyncSuccess(count: number) {
    this.trackEvent('SYNC_SUCCESS', { syncedItemsCount: count });
  }

  public trackSyncFailure(errorMsg: string) {
    this.trackEvent('SYNC_FAILURE', {});
    this.logHealthError('sync_failure', errorMsg);
  }

  public trackAuthEvent(type: 'USER_LOGIN' | 'USER_LOGOUT' | 'USER_REGISTERED', provider?: string) {
    this.trackEvent(type, { provider: provider || 'password' });
  }
}

export const analyticsService = new AnalyticsService();
