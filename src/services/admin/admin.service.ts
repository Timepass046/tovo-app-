import { auth } from '../../lib/firebase';
import { apiUrl } from '../../lib/api';
import {
  AdminStats,
  UserProfile,
  ActivityEvent,
  HealthError,
  DailyAnalyticsRecord,
  AdminLog,
  UserDetailMetrics,
} from '../../types';

class AdminService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }
    const token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Check if current user is an authorized admin
   */
  public async verifyAdmin(): Promise<{ isAdmin: boolean; email: string; uid: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(apiUrl('/api/admin/verify'), { headers });
      if (!res.ok) return { isAdmin: false, email: '', uid: '' };
      return await res.json();
    } catch {
      return { isAdmin: false, email: '', uid: '' };
    }
  }

  /**
   * Re-authenticate admin for sensitive operations
   */
  public async reauth(password: string): Promise<boolean> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl('/api/admin/reauth'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Re-authentication failed');
    }
    return true;
  }

  /**
   * Get Overview Statistics
   */
  public async getStats(): Promise<AdminStats> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl('/api/admin/stats'), { headers });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return await res.json();
  }

  /**
   * Get User Directory with search and filtering
   */
  public async getUsers(params: {
    search?: string;
    filter?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ users: UserProfile[]; total: number; page: number; totalPages: number }> {
    const headers = await this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.filter) q.append('filter', params.filter);
    if (params.page) q.append('page', String(params.page));
    if (params.limit) q.append('limit', String(params.limit));

    const res = await fetch(apiUrl(`/api/admin/users?${q.toString()}`), { headers });
    if (!res.ok) throw new Error('Failed to fetch user directory');
    return await res.json();
  }

  /**
   * Get User Detail Metrics (Aggregated only, zero private content)
   */
  public async getUserDetail(uid: string): Promise<UserDetailMetrics> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl(`/api/admin/users/${uid}`), { headers });
    if (!res.ok) throw new Error('Failed to fetch user details');
    return await res.json();
  }

  /**
   * Suspend or Reactivate Account
   */
  public async updateUserStatus(uid: string, status: 'active' | 'suspended', reason?: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl(`/api/admin/users/${uid}/status`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update user status');
    }
  }

  /**
   * Update User Role
   */
  public async updateUserRole(uid: string, role: 'user' | 'admin'): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl(`/api/admin/users/${uid}/role`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update user role');
    }
  }

  /**
   * Get Product Activity Logs
   */
  public async getActivity(params: {
    eventType?: string;
    userId?: string;
    limit?: number;
  } = {}): Promise<{ events: ActivityEvent[]; total: number }> {
    const headers = await this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params.eventType) q.append('eventType', params.eventType);
    if (params.userId) q.append('userId', params.userId);
    if (params.limit) q.append('limit', String(params.limit));

    const res = await fetch(apiUrl(`/api/admin/activity?${q.toString()}`), { headers });
    if (!res.ok) throw new Error('Failed to fetch activity stream');
    return await res.json();
  }

  /**
   * Get Time-Series Productivity Analytics
   */
  public async getAnalytics(range: '7d' | '14d' | '30d' | 'all' = '7d'): Promise<{
    series: (DailyAnalyticsRecord & { completionRate: number })[];
    range: string;
  }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl(`/api/admin/analytics?range=${range}`), { headers });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return await res.json();
  }

  /**
   * Get Operational Health Status
   */
  public async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    counts: Record<string, number>;
    recentErrors: HealthError[];
    uptimeSeconds: number;
    memoryUsageMB: number;
  }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl('/api/admin/health'), { headers });
    if (!res.ok) throw new Error('Failed to fetch system health');
    return await res.json();
  }

  /**
   * Mark Health Error as Resolved
   */
  public async resolveHealthError(errorId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl(`/api/admin/health/resolve/${errorId}`), {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to resolve error');
  }

  /**
   * Get Admin Audit Logs
   */
  public async getAuditLogs(params: { action?: string; limit?: number } = {}): Promise<{ logs: AdminLog[] }> {
    const headers = await this.getAuthHeaders();
    const q = new URLSearchParams();
    if (params.action) q.append('action', params.action);
    if (params.limit) q.append('limit', String(params.limit));

    const res = await fetch(apiUrl(`/api/admin/logs?${q.toString()}`), { headers });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return await res.json();
  }

  /**
   * Cascade Delete User Account
   */
  public async deleteUserAccount(uid: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(apiUrl(`/api/user/account?uid=${uid}`), {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete user account');
    }
  }
}

export const adminService = new AdminService();
