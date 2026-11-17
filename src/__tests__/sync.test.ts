import './setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { WebStorageAdapter } from '../services/storage/web-storage.adapter';
import { SyncOperation } from '../types';

describe('Sync Engine & Queue Idempotency', () => {
  let adapter: WebStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new WebStorageAdapter();
  });

  it('enqueues sync operations without duplicate pending items for same document', async () => {
    const op1: SyncOperation = {
      id: 'op_1',
      collection: 'tasks',
      docId: 'task_target',
      action: 'create',
      data: { title: 'First write' },
      timestamp: 1000,
      retryCount: 0,
      status: 'pending',
    };

    const op2: SyncOperation = {
      id: 'op_2',
      collection: 'tasks',
      docId: 'task_target',
      action: 'update',
      data: { title: 'Updated write' },
      timestamp: 2000,
      retryCount: 0,
      status: 'pending',
    };

    await adapter.enqueueSync(op1);
    await adapter.enqueueSync(op2);

    const queue = await adapter.getSyncQueue();
    // Replaces duplicate pending op for same document
    expect(queue.length).toBe(1);
    expect(queue[0].data.title).toBe('Updated write');
  });

  it('dequeues successfully processed operations', async () => {
    const op: SyncOperation = {
      id: 'op_success',
      collection: 'tasks',
      docId: 'task_abc',
      action: 'create',
      timestamp: 1000,
      retryCount: 0,
      status: 'pending',
    };

    await adapter.enqueueSync(op);
    let queue = await adapter.getSyncQueue();
    expect(queue.length).toBe(1);

    await adapter.dequeueSync('op_success');
    queue = await adapter.getSyncQueue();
    expect(queue.length).toBe(0);
  });
});
