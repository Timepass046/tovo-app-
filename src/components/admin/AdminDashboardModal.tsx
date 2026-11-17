import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Mail,
  User as UserIcon,
  Activity,
  UserX,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../lib/api';
import { UserProfile, AdminStats, AdminLog } from '../../types';

export const AdminDashboardModal: React.FC = () => {
  const { user, isAdmin, showAdminModal, setShowAdminModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionNotice, setActionNotice] = useState<string>('');

  const loadAdminData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch users, stats, and logs in parallel
      const [usersRes, statsRes, logsRes] = await Promise.all([
        fetch(apiUrl('/api/admin/users'), { headers }),
        fetch(apiUrl('/api/admin/stats'), { headers }),
        fetch(apiUrl('/api/admin/logs'), { headers }),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (logsRes.ok) {
        const l = await logsRes.json();
        setLogs(l.logs || []);
      }
    } catch (e) {
      console.warn('Failed to load admin dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showAdminModal && isAdmin) {
      loadAdminData();
    }
  }, [showAdminModal, isAdmin]);

  if (!showAdminModal || !isAdmin) return null;

  const handleToggleStatus = async (targetUser: UserProfile) => {
    const nextStatus = targetUser.accountStatus === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'suspended' ? 'suspend' : 'reactivate';

    if (!confirm(`Are you sure you want to ${actionLabel} account "${targetUser.email}"?`)) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl(`/api/admin/users/${targetUser.uid}/status`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          email: targetUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setActionNotice(`User account ${targetUser.email} has been ${nextStatus}.`);
      setTimeout(() => setActionNotice(''), 4000);
      await loadAdminData();
      if (selectedUser?.uid === targetUser.uid) {
        setSelectedUser({ ...selectedUser, accountStatus: nextStatus });
      }
    } catch (e: any) {
      alert(e?.message || 'Error updating account status');
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const actionLabel = nextRole === 'admin' ? 'promote to Administrator' : 'demote to Standard User';

    if (!confirm(`Are you sure you want to ${actionLabel} for "${targetUser.email}"?`)) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      const res = await fetch(apiUrl(`/api/admin/users/${targetUser.uid}/role`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: nextRole,
          email: targetUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      setActionNotice(`User role updated to ${nextRole}.`);
      setTimeout(() => setActionNotice(''), 4000);
      await loadAdminData();
      if (selectedUser?.uid === targetUser.uid) {
        setSelectedUser({ ...selectedUser, role: nextRole });
      }
    } catch (e: any) {
      alert(e?.message || 'Error updating user role');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={() => setShowAdminModal(false)}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#1C1F1B] rounded-2xl shadow-2xl border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#20231F] dark:text-[#F2F1ED] tracking-tight">
                  Admin Console
                </h2>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] font-medium">
                  Verified Admin
                </span>
              </div>
              <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
                User management, security governance, and audit records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminData}
              disabled={isLoading}
              className="p-1.5 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded transition"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowAdminModal(false)}
              className="p-1.5 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-[#EDF7EE] dark:bg-[#162618] border border-[#C5E8C8] text-xs text-[#2E7D32] dark:text-[#43A047] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-[#E8E7E0] dark:border-[#2C302A] text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 font-medium transition border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#303FCA] dark:border-[#5263FA] text-[#303FCA] dark:text-[#5263FA]'
                : 'border-transparent text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F]'
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 font-medium transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-[#303FCA] dark:border-[#5263FA] text-[#303FCA] dark:text-[#5263FA]'
                : 'border-transparent text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F]'
            }`}
          >
            <span>User Directory</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[#E8E7E0] dark:bg-[#2C302A]">
              {users.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 font-medium transition border-b-2 ${
              activeTab === 'logs'
                ? 'border-[#303FCA] dark:border-[#5263FA] text-[#303FCA] dark:text-[#5263FA]'
                : 'border-transparent text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F]'
            }`}
          >
            Audit Trail ({logs.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
                    Total Users
                  </span>
                  <div className="text-2xl font-semibold text-[#20231F] dark:text-[#F2F1ED] font-mono mt-1">
                    {stats?.totalUsers ?? users.length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#2E7D32] dark:text-[#43A047]">
                    Active Users
                  </span>
                  <div className="text-2xl font-semibold text-[#20231F] dark:text-[#F2F1ED] font-mono mt-1">
                    {stats?.activeUsers ?? users.filter((u) => u.accountStatus === 'active').length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#C47D14]">
                    Verified Email
                  </span>
                  <div className="text-2xl font-semibold text-[#20231F] dark:text-[#F2F1ED] font-mono mt-1">
                    {stats?.verifiedUsers ?? users.filter((u) => u.emailVerified).length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#303FCA] dark:text-[#5263FA]">
                    Recent (7d)
                  </span>
                  <div className="text-2xl font-semibold text-[#20231F] dark:text-[#F2F1ED] font-mono mt-1">
                    {stats?.recentRegistrations ?? 0}
                  </div>
                </div>
              </div>

              {/* Privacy Invariant Notice */}
              <div className="p-4 rounded-xl bg-[#F0F4EE] dark:bg-[#1D241C] border border-[#D8E2D4] dark:border-[#2A3528] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#375336] dark:text-[#DCE7DB] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-[#20231F] dark:text-[#F2F1ED]">
                  <h4 className="font-semibold text-[#375336] dark:text-[#DCE7DB]">
                    Privacy Isolation Policy
                  </h4>
                  <p className="text-[#4F684E] dark:text-[#A7BAA4] mt-0.5">
                    Tovo enforces zero-trust data separation. Personal task descriptions, subtasks, habits, and reminders remain private to each individual user and cannot be scraped or viewed by administrators.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full text-xs bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2 pl-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-2.5" />
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
                  <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mr-1">Status:</span>
                  {(['all', 'active', 'suspended'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-md capitalize text-xs font-medium transition ${
                        statusFilter === s
                          ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714]'
                          : 'bg-[#F7F6F2] dark:bg-[#242722] text-[#6B6F67] dark:text-[#9C9F97]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table / Card List */}
              <div className="border border-[#E8E7E0] dark:border-[#2C302A] rounded-xl overflow-hidden divide-y divide-[#E8E7E0] dark:divide-[#2C302A]">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                    No users found matching query.
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F6F2]/50 dark:hover:bg-[#242722]/50 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] text-[#303FCA] dark:text-[#5263FA] flex items-center justify-center font-medium text-xs shrink-0">
                          {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] truncate">
                              {u.displayName}
                            </span>
                            {u.role === 'admin' && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] font-medium">
                                Admin
                              </span>
                            )}
                            {u.accountStatus === 'suspended' && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#C73E2E]/10 text-[#C73E2E] font-medium">
                                Suspended
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                            <span className="truncate">{u.email}</span>
                            <span>·</span>
                            <span className="capitalize">{u.authProvider}</span>
                            <span>·</span>
                            <span>{u.emailVerified ? 'Verified' : 'Unverified'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Administrative Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                            u.accountStatus === 'suspended'
                              ? 'bg-[#2E7D32] text-white hover:opacity-90'
                              : 'bg-[#FDF1EF] dark:bg-[#2E1917] text-[#C73E2E] dark:text-[#E05445] hover:bg-[#F5C2BC]/40'
                          }`}
                        >
                          {u.accountStatus === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>

                        <button
                          onClick={() => handleToggleRole(u)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#EBE9E2]"
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 3. LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] uppercase tracking-wider">
                Immutable Governance Log
              </h3>

              <div className="border border-[#E8E7E0] dark:border-[#2C302A] rounded-xl overflow-hidden divide-y divide-[#E8E7E0] dark:divide-[#2C302A]">
                {logs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                    No administrative events logged yet.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-[#303FCA] dark:text-[#5263FA]">
                            [{log.action}]
                          </span>
                          <span className="text-[#20231F] dark:text-[#F2F1ED]">
                            Target: {log.targetEmail || log.targetUid}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                            {log.reason}
                          </p>
                        )}
                        <p className="text-[10px] text-[#92968E] dark:text-[#6E726A] mt-0.5">
                          Initiated by: {log.adminEmail}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
