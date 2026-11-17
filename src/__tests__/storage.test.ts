import './setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { WebStorageAdapter } from '../services/storage/web-storage.adapter';
import { Task } from '../types';

describe('Storage Service & User Isolation', () => {
  let adapter: WebStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new WebStorageAdapter();
  });

  it('persists and isolates tasks by user ID', async () => {
    const taskUserA: Task = {
      id: 't_user_a',
      userId: 'user_A',
      title: 'Secret Task A',
      priority: 'high',
      status: 'not_started',
      bucket: 'today',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const taskUserB: Task = {
      id: 't_user_b',
      userId: 'user_B',
      title: 'Secret Task B',
      priority: 'low',
      status: 'not_started',
      bucket: 'inbox',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adapter.saveTask(taskUserA);
    await adapter.saveTask(taskUserB);

    const userATasks = await adapter.getTasks('user_A');
    const userBTasks = await adapter.getTasks('user_B');

    expect(userATasks.length).toBe(1);
    expect(userATasks[0].title).toBe('Secret Task A');

    expect(userBTasks.length).toBe(1);
    expect(userBTasks[0].title).toBe('Secret Task B');
  });

  it('clears user data on sign out without affecting other users', async () => {
    const taskA: Task = {
      id: 't_a',
      userId: 'user_A',
      title: 'Task A',
      priority: 'medium',
      status: 'not_started',
      bucket: 'inbox',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const taskB: Task = {
      id: 't_b',
      userId: 'user_B',
      title: 'Task B',
      priority: 'medium',
      status: 'not_started',
      bucket: 'inbox',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adapter.saveTask(taskA);
    await adapter.saveTask(taskB);

    // Sign out user A and purge cache
    await adapter.clearUserData('user_A');

    const remainingA = await adapter.getTasks('user_A');
    const remainingB = await adapter.getTasks('user_B');

    expect(remainingA.length).toBe(0);
    expect(remainingB.length).toBe(1);
  });

  it('handles soft-delete tombstones without resurrecting records', async () => {
    const task: Task = {
      id: 't_delete_test',
      userId: 'user_test',
      title: 'Task to be deleted',
      priority: 'medium',
      status: 'not_started',
      bucket: 'inbox',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adapter.saveTask(task);
    await adapter.deleteTask('t_delete_test', 'user_test', false);

    const activeTasks = await adapter.getTasks('user_test');
    expect(activeTasks.length).toBe(0);
  });

  it('persists data across reloads (adapter re-initialization)', async () => {
    const task: Task = {
      id: 't_reload_test',
      userId: 'user_persistent',
      title: 'Task before reload',
      priority: 'high',
      status: 'in_progress',
      bucket: 'today',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adapter.saveTask(task);

    // Simulate browser reload by instantiating a fresh adapter reading from localStorage
    const freshAdapter = new WebStorageAdapter();
    const loaded = await freshAdapter.getTasks('user_persistent');

    expect(loaded.length).toBe(1);
    expect(loaded[0].id).toBe('t_reload_test');
    expect(loaded[0].title).toBe('Task before reload');
  });
});
