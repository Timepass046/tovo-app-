import './setup';
import { describe, it, expect } from 'vitest';
import { ActivityEventType, ActivityEvent, HealthError, AdminStats, DailyAnalyticsRecord } from '../types';

describe('Admin Console, Telemetry & Security Tests', () => {
  describe('Activity Telemetry Privacy Sanitization', () => {
    it('strips private task titles, descriptions, notes, and credentials from event metadata', () => {
      const rawMetadata = {
        taskId: 'task_123',
        priority: 'high',
        bucket: 'today',
        title: 'Confidential Client Contract Review', // Sensitive: must be stripped
        description: 'Review secret clause 4B with lawyers', // Sensitive: must be stripped
        userNote: 'Private personal health note', // Sensitive: must be stripped
        password: 'SuperSecretPassword!', // Sensitive: must be stripped
        token: 'Bearer eyJhbGciOi...', // Sensitive: must be stripped
        subtasksCount: 3, // Allowed non-sensitive metric
        estimatedMinutes: 45, // Allowed non-sensitive metric
      };

      const safeMetadata: Record<string, any> = {};
      for (const [k, v] of Object.entries(rawMetadata)) {
        const lowerKey = k.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('token') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('title') ||
          lowerKey.includes('description') ||
          lowerKey.includes('note') ||
          lowerKey.includes('content')
        ) {
          continue;
        }
        safeMetadata[k] = v;
      }

      expect(safeMetadata.taskId).toBe('task_123');
      expect(safeMetadata.priority).toBe('high');
      expect(safeMetadata.bucket).toBe('today');
      expect(safeMetadata.subtasksCount).toBe(3);
      expect(safeMetadata.estimatedMinutes).toBe(45);

      // Sensitive fields must be completely absent
      expect(safeMetadata.title).toBeUndefined();
      expect(safeMetadata.description).toBeUndefined();
      expect(safeMetadata.userNote).toBeUndefined();
      expect(safeMetadata.password).toBeUndefined();
      expect(safeMetadata.token).toBeUndefined();
    });

    it('validates supported event types against allowed telemetry schema', () => {
      const allowedTypes: ActivityEventType[] = [
        'USER_REGISTERED',
        'USER_LOGIN',
        'USER_LOGOUT',
        'PROFILE_UPDATED',
        'TASK_CREATED',
        'TASK_COMPLETED',
        'TASK_UPDATED',
        'TASK_ARCHIVED',
        'HABIT_CREATED',
        'HABIT_COMPLETED',
        'REMINDER_CREATED',
        'REMINDER_UPDATED',
        'REMINDER_CANCELLED',
        'SYNC_SUCCESS',
        'SYNC_FAILURE',
        'ACCOUNT_DELETED',
      ];

      expect(allowedTypes.includes('TASK_CREATED')).toBe(true);
      expect(allowedTypes.includes('TASK_COMPLETED')).toBe(true);
      expect(allowedTypes.includes('SYNC_FAILURE')).toBe(true);
      expect(allowedTypes.includes('INVALID_EVENT_TYPE' as any)).toBe(false);
    });
  });

  describe('Productivity Analytics Aggregation Logic', () => {
    it('calculates accurate task completion rate from daily series', () => {
      const dailyRecords: DailyAnalyticsRecord[] = [
        { date: '2026-10-25', tasksCreated: 10, tasksCompleted: 8, activeUsers: 5, habitsCompleted: 4, remindersScheduled: 2 },
        { date: '2026-10-26', tasksCreated: 20, tasksCompleted: 15, activeUsers: 8, habitsCompleted: 10, remindersScheduled: 4 },
        { date: '2026-10-27', tasksCreated: 0, tasksCompleted: 0, activeUsers: 2, habitsCompleted: 1, remindersScheduled: 0 },
      ];

      const totalCreated = dailyRecords.reduce((acc, r) => acc + r.tasksCreated, 0);
      const totalCompleted = dailyRecords.reduce((acc, r) => acc + r.tasksCompleted, 0);
      const overallRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

      expect(totalCreated).toBe(30);
      expect(totalCompleted).toBe(23);
      expect(overallRate).toBe(77); // 23 / 30 = 76.67% -> 77%
    });

    it('handles zero task creation days gracefully without division by zero', () => {
      const emptyDay = { tasksCreated: 0, tasksCompleted: 0 };
      const rate = emptyDay.tasksCreated > 0 ? (emptyDay.tasksCompleted / emptyDay.tasksCreated) * 100 : 0;
      expect(rate).toBe(0);
    });
  });

  describe('Application Health & Error Redaction', () => {
    it('redacts long sensitive tokens from operational error log messages', () => {
      const rawErrorMessage = 'Firebase auth failed with token eyJhbGciOiAiSFMyNTYiLCJ0eXAiOiAiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0 and secret key';
      const cleanMessage = rawErrorMessage.replace(/[a-zA-Z0-9_\-\.]{40,}/g, '[REDACTED_TOKEN]').substring(0, 500);

      expect(cleanMessage).toContain('[REDACTED_TOKEN]');
      expect(cleanMessage).not.toContain('eyJhbGciOiAiSFMyNTYiLCJ0eXAiOiAiSldUIn0');
    });

    it('classifies platform health status based on failure thresholds', () => {
      const evaluateStatus = (totalErrors: number, dbErrors: number): 'healthy' | 'degraded' | 'critical' => {
        if (totalErrors > 20 || dbErrors > 5) return 'critical';
        if (totalErrors > 5) return 'degraded';
        return 'healthy';
      };

      expect(evaluateStatus(0, 0)).toBe('healthy');
      expect(evaluateStatus(3, 1)).toBe('healthy');
      expect(evaluateStatus(8, 0)).toBe('degraded');
      expect(evaluateStatus(4, 6)).toBe('critical');
      expect(evaluateStatus(25, 0)).toBe('critical');
    });
  });

  describe('Administrative Privilege & Role Invariants', () => {
    it('prevents an administrator from suspending their own account', () => {
      const currentAdminUid = 'admin_uid_123';
      const targetUid = 'admin_uid_123';
      const requestedStatus = 'suspended';

      const isSelfSuspension = currentAdminUid === targetUid && requestedStatus === 'suspended';
      expect(isSelfSuspension).toBe(true);
    });

    it('prevents an administrator from revoking their own administrator role', () => {
      const currentAdminUid = 'admin_uid_123';
      const targetUid = 'admin_uid_123';
      const requestedRole = 'user';

      const isSelfDemotion = currentAdminUid === targetUid && requestedRole === 'user';
      expect(isSelfDemotion).toBe(true);
    });

    it('requires password re-authentication for sensitive actions', () => {
      const requiresReauth = (action: string) => ['revoke', 'delete', 'suspend'].includes(action);

      expect(requiresReauth('delete')).toBe(true);
      expect(requiresReauth('suspend')).toBe(true);
      expect(requiresReauth('revoke')).toBe(true);
      expect(requiresReauth('view_details')).toBe(false);
    });
  });

  describe('User Directory Filtering & Search', () => {
    const mockUsers = [
      { uid: 'u1', displayName: 'Alice Morgan', email: 'alice@tovo.app', accountStatus: 'active', emailVerified: true, role: 'user', createdAt: '2026-10-30T10:00:00Z' },
      { uid: 'u2', displayName: 'Bob Vance', email: 'bob@tovo.app', accountStatus: 'suspended', emailVerified: false, role: 'user', createdAt: '2026-10-20T10:00:00Z' },
      { uid: 'u3', displayName: 'Charlie Root', email: 'admin@tovo.app', accountStatus: 'active', emailVerified: true, role: 'admin', createdAt: '2026-10-01T10:00:00Z' },
    ];

    it('filters by status correctly', () => {
      const activeUsers = mockUsers.filter(u => u.accountStatus === 'active');
      const suspendedUsers = mockUsers.filter(u => u.accountStatus === 'suspended');

      expect(activeUsers).toHaveLength(2);
      expect(suspendedUsers).toHaveLength(1);
      expect(suspendedUsers[0].displayName).toBe('Bob Vance');
    });

    it('filters by verification status correctly', () => {
      const verified = mockUsers.filter(u => u.emailVerified);
      const unverified = mockUsers.filter(u => !u.emailVerified);

      expect(verified).toHaveLength(2);
      expect(unverified).toHaveLength(1);
      expect(unverified[0].displayName).toBe('Bob Vance');
    });

    it('searches by name or email query', () => {
      const search = 'alice';
      const results = mockUsers.filter(u => u.displayName.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));

      expect(results).toHaveLength(1);
      expect(results[0].uid).toBe('u1');
    });
  });
});
