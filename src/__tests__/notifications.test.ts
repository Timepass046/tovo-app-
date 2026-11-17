import './setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebNotificationAdapter } from '../services/notifications/web-notification.adapter';
import { Task } from '../types';

describe('Notification Reconciliation Engine', () => {
  let adapter: WebNotificationAdapter;

  beforeEach(() => {
    adapter = new WebNotificationAdapter();
  });

  it('reconciles and schedules pending reminders for active tasks with future dates', async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // +1 hour

    const activeTask: Task = {
      id: 'task_future_reminder',
      userId: 'user_1',
      title: 'Doctor appointment reminder',
      priority: 'high',
      status: 'not_started',
      bucket: 'today',
      reminderAt: futureDate,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const completedTask: Task = {
      id: 'task_completed_reminder',
      userId: 'user_1',
      title: 'Already finished task',
      priority: 'low',
      status: 'completed',
      bucket: 'today',
      reminderAt: futureDate,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adapter.reconcileScheduledReminders([activeTask, completedTask]);

    const pending = await adapter.getPendingReminders();
    expect(pending.some(p => p.id === 'task_future_reminder')).toBe(true);
    expect(pending.some(p => p.id === 'task_completed_reminder')).toBe(false);
  });

  it('cancels scheduled notifications when reminder is removed or task completed', async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();

    await adapter.scheduleReminder({
      id: 1,
      taskOrHabitId: 'task_to_cancel',
      title: 'Cancel me',
      body: 'Body',
      triggerAt: new Date(futureDate),
    });

    let pending = await adapter.getPendingReminders();
    expect(pending.some(p => p.id === 'task_to_cancel')).toBe(true);

    await adapter.cancelReminder('task_to_cancel');
    pending = await adapter.getPendingReminders();
    expect(pending.some(p => p.id === 'task_to_cancel')).toBe(false);
  });
});
