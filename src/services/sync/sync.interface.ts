import { SyncOperation } from '../../types';

export type SyncState = 'offline' | 'syncing' | 'synchronized' | 'error';

export interface ISyncEngine {
  getState(): SyncState;
  getPendingCount(): number;
  enqueueOperation(op: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void>;
  flushQueue(): Promise<void>;
  subscribeState(listener: (state: SyncState, pendingCount: number) => void): () => void;
}
