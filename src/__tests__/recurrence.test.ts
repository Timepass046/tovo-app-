import { describe, it, expect } from 'vitest';
import { calculateNextRecurrenceDate, advanceRecurringTask } from '../services/planner/recurrence';
import { Task } from '../types';

describe('Recurrence Calculations & Next Cycle Generation', () => {
  it('advances daily tasks by 1 day', () => {
    const base = '2026-10-21T09:00:00.000Z';
    const next = calculateNextRecurrenceDate(base, 'daily');
    const nextDate = new Date(next);

    expect(nextDate.getUTCDate()).toBe(22);
    expect(nextDate.getUTCHours()).toBe(9);
  });

  it('skips weekends for weekdays recurrence (Friday advances to Monday)', () => {
    // 2026-10-23 is Friday
    const friday = new Date('2026-10-23T10:00:00.000Z');
    const next = calculateNextRecurrenceDate(friday, 'weekdays');
    const nextDate = new Date(next);

    // Should be Monday 2026-10-26 (day = 1)
    expect(nextDate.getDay()).toBe(1);
    expect(nextDate.getUTCDate()).toBe(26);
  });

  it('advances weekly tasks by 7 days', () => {
    const base = '2026-10-21T14:00:00.000Z';
    const next = calculateNextRecurrenceDate(base, 'weekly');
    const nextDate = new Date(next);

    expect(nextDate.getUTCDate()).toBe(28);
  });

  it('advances monthly tasks by 1 month and handles month end boundaries', () => {
    const base = '2026-01-31T12:00:00.000Z';
    const next = calculateNextRecurrenceDate(base, 'monthly');
    const nextDate = new Date(next);

    // February does not have 31 days; should clamp to last day of Feb (28th in 2026)
    expect(nextDate.getMonth()).toBe(1); // 1 = Feb
    expect(nextDate.getDate()).toBe(28);
  });

  it('creates clean next cycle resetting subtasks and status', () => {
    const completedTask: Task = {
      id: 'task_cycle_1',
      userId: 'user_123',
      title: 'Weekly Team Retrospective',
      priority: 'high',
      status: 'completed',
      bucket: 'today',
      dueDate: '2026-10-21T15:00:00.000Z',
      reminderAt: '2026-10-21T14:45:00.000Z',
      recurrence: 'weekly',
      archived: false,
      completedAt: '2026-10-21T16:00:00.000Z',
      createdAt: '2026-10-14T00:00:00.000Z',
      updatedAt: '2026-10-21T16:00:00.000Z',
      subtasks: [
        { id: 's1', title: 'Collect feedback notes', completed: true, createdAt: '' },
        { id: 's2', title: 'Assign action items', completed: true, createdAt: '' },
      ],
    };

    const nextCycle = advanceRecurringTask(completedTask);

    expect(nextCycle).not.toBeNull();
    expect(nextCycle!.id).not.toBe(completedTask.id);
    expect(nextCycle!.status).toBe('not_started');
    expect(nextCycle!.completedAt).toBeUndefined();
    expect(new Date(nextCycle!.dueDate!).getUTCDate()).toBe(28);
    expect(new Date(nextCycle!.reminderAt!).getUTCDate()).toBe(28);

    // Subtasks reset to uncompleted
    expect(nextCycle!.subtasks?.every(s => s.completed === false)).toBe(true);
  });
});
