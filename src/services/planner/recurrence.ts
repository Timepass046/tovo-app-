import { Task, TaskRecurrence } from '../../types';

/**
 * Calculates the next recurrence date for a given ISO date string and recurrence frequency.
 * Preserves local time-of-day across daylight saving boundaries.
 */
export function calculateNextRecurrenceDate(
  currentDateStr: string | Date,
  recurrence: TaskRecurrence
): string {
  if (recurrence === 'none') {
    return typeof currentDateStr === 'string' ? currentDateStr : currentDateStr.toISOString();
  }

  const date = new Date(currentDateStr);
  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  const next = new Date(date);

  switch (recurrence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;

    case 'weekdays': {
      // Monday = 1, Friday = 5, Saturday = 6, Sunday = 0
      const day = next.getDay();
      if (day === 5) {
        // Friday -> advance to Monday (+3 days)
        next.setDate(next.getDate() + 3);
      } else if (day === 6) {
        // Saturday -> advance to Monday (+2 days)
        next.setDate(next.getDate() + 2);
      } else {
        // Sunday through Thursday -> +1 day
        next.setDate(next.getDate() + 1);
      }
      break;
    }

    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;

    case 'monthly': {
      const currentDay = next.getDate();
      next.setMonth(next.getMonth() + 1);
      // Guard against month overflow (e.g. Jan 31 -> Mar 3)
      if (next.getDate() !== currentDay) {
        next.setDate(0); // set to last day of previous month
      }
      break;
    }
  }

  return next.toISOString();
}

/**
 * Generates the next scheduled instance of a completed recurring task.
 * Resets status to 'not_started', unchecks subtasks, and advances scheduled dates.
 */
export function advanceRecurringTask(completedTask: Task): Task | null {
  if (!completedTask.recurrence || completedTask.recurrence === 'none') {
    return null;
  }

  const now = new Date().toISOString();
  const nextDueDate = completedTask.dueDate
    ? calculateNextRecurrenceDate(completedTask.dueDate, completedTask.recurrence)
    : undefined;

  const nextReminderAt = completedTask.reminderAt
    ? calculateNextRecurrenceDate(completedTask.reminderAt, completedTask.recurrence)
    : undefined;

  const resetSubtasks = completedTask.subtasks?.map(sub => ({
    ...sub,
    completed: false,
  }));

  return {
    ...completedTask,
    id: 'task_' + Math.random().toString(36).substring(2, 10),
    status: 'not_started',
    dueDate: nextDueDate,
    reminderAt: nextReminderAt,
    subtasks: resetSubtasks,
    completedAt: undefined,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}
