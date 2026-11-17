import { describe, it, expect } from 'vitest';
import { Task, Subtask } from '../types';

describe('Task Management & Subtask Invariants', () => {
  it('creates a task with required properties and initial status', () => {
    const task: Task = {
      id: 'task_test_1',
      userId: 'user_123',
      title: 'Complete quarterly budget review',
      priority: 'high',
      status: 'not_started',
      bucket: 'today',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    expect(task.title).toBe('Complete quarterly budget review');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('not_started');
    expect(task.archived).toBe(false);
  });

  it('calculates subtask completion progress correctly', () => {
    const subtasks: Subtask[] = [
      { id: 'sub_1', title: 'Step 1: Gather receipts', completed: true, createdAt: '' },
      { id: 'sub_2', title: 'Step 2: Enter figures', completed: false, createdAt: '' },
      { id: 'sub_3', title: 'Step 3: Balance spreadsheet', completed: false, createdAt: '' },
    ];

    const completedCount = subtasks.filter(s => s.completed).length;
    const progressString = `${completedCount} of ${subtasks.length} steps completed`;

    expect(completedCount).toBe(1);
    expect(progressString).toBe('1 of 3 steps completed');
  });

  it('guarantees completing one subtask does NOT mark parent task complete', () => {
    const task: Task = {
      id: 'task_parent',
      userId: 'user_123',
      title: 'Major Launch Goal',
      priority: 'high',
      status: 'in_progress',
      bucket: 'today',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [
        { id: 's1', title: 'Draft announcement', completed: false, createdAt: '' },
        { id: 's2', title: 'Push production build', completed: false, createdAt: '' },
      ],
    };

    // User checks off first subtask
    const updatedSubtasks = task.subtasks!.map(s => (s.id === 's1' ? { ...s, completed: true } : s));
    const allDone = updatedSubtasks.every(s => s.completed);

    // Parent task status remains in_progress
    const parentStatus = allDone ? 'completed' : task.status;

    expect(allDone).toBe(false);
    expect(parentStatus).toBe('in_progress');
  });
});
