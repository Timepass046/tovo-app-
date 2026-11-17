import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { storageService } from '../storage/storage.service';
import { ISyncEngine, SyncState } from './sync.interface';
import { SyncOperation } from '../../types';
import { Network } from '@capacitor/network';

class SyncEngine implements ISyncEngine {
  private state: SyncState = 'synchronized';
  private pendingCount = 0;
  private isFlushing = false;
  private listeners: ((state: SyncState, pendingCount: number) => void)[] = [];
  private currentUserId: string | null = null;

  constructor() {
    this.initNetworkListener();
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  private async initNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState('syncing');
        this.flushQueue();
      });
      window.addEventListener('offline', () => {
        this.updateState('offline');
      });

      // Also listen via Capacitor Network plugin
      try {
        Network.addListener('networkStatusChange', (status) => {
          if (status.connected) {
            this.flushQueue();
          } else {
            this.updateState('offline');
          }
        });
      } catch {
        // Not native
      }
    }

    // Initial queue check
    const queue = await storageService.getSyncQueue();
    this.pendingCount = queue.length;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.state = 'offline';
    } else {
      this.state = queue.length > 0 ? 'error' : 'synchronized';
    }
    this.notify();
  }

  private updateState(newState: SyncState) {
    this.state = newState;
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l(this.state, this.pendingCount));
  }

  public getState(): SyncState {
    return this.state;
  }

  public getPendingCount(): number {
    return this.pendingCount;
  }

  public async enqueueOperation(
    op: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>
  ): Promise<void> {
    const fullOp: SyncOperation = {
      ...op,
      id: 'op_' + Math.random().toString(36).substring(2, 10),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    await storageService.enqueueSync(fullOp);
    const queue = await storageService.getSyncQueue();
    this.pendingCount = queue.length;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState('offline');
    } else {
      this.flushQueue();
    }
  }

  public async flushQueue(): Promise<void> {
    if (this.isFlushing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState('offline');
      return;
    }

    this.isFlushing = true;
    this.updateState('syncing');

    try {
      const queue = await storageService.getSyncQueue();
      this.pendingCount = queue.length;

      for (const op of queue) {
        try {
          const docRef = doc(db, op.collection, op.docId);

          if (op.action === 'delete') {
            await deleteDoc(docRef);
          } else {
            // Idempotent set with merge to guarantee no duplicates
            await setDoc(docRef, op.data, { merge: true });
          }

          // Successfully synchronized
          await storageService.dequeueSync(op.id);
        } catch (err: any) {
          console.warn('Sync failed for operation', op.id, err);
          const updatedOp: SyncOperation = {
            ...op,
            retryCount: op.retryCount + 1,
            status: op.retryCount >= 4 ? 'failed' : 'pending',
            error: err?.message || 'Write failed',
          };
          await storageService.updateSyncOperation(updatedOp);
          this.updateState('error');
          break; // Stop iteration until network/auth state is verified
        }
      }

      const remaining = await storageService.getSyncQueue();
      this.pendingCount = remaining.length;
      if (remaining.length === 0) {
        this.updateState('synchronized');
      } else {
        this.updateState('error');
      }
    } finally {
      this.isFlushing = false;
    }
  }

  public subscribeState(listener: (state: SyncState, pendingCount: number) => void): () => void {
    this.listeners.push(listener);
    listener(this.state, this.pendingCount);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const syncService = new SyncEngine();
