import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
  Shield,
  ShieldAlert,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Mail,
  Calendar,
  Clock,
  KeyRound,
  X,
  ListTodo,
  Sparkles,
  Bell,
  Activity,
} from 'lucide-react';
import { adminService } from '../../../services/admin/admin.service';
import { UserProfile, UserDetailMetrics } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export const AdminUsersView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // User Detail Modal
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<UserDetailMetrics | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Action Dialogs
  const [actionConfirm, setActionConfirm] = useState<{
    type: 'suspend' | 'reactivate' | 'promote' | 'revoke' | 'delete';
    targetUser: UserProfile;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getUsers({
        search,
        filter: activeFilter,
        page,
        limit: 15,
      });
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setTotalCount(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, activeFilter, page]);

  // Open detail modal
  const handleOpenDetail = async (uid: string) => {
    setSelectedUid(uid);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await adminService.getUserDetail(uid);
      setDetailMetrics(data);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load user details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedUid(null);
    setDetailMetrics(null);
    setDetailError(null);
  };

  // Execute confirmed administrative action
  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    const { type, targetUser } = actionConfirm;

    try {
      setActionLoading(true);
      setActionError(null);

      // Sensitive operations require re-authentication verification
      if (['revoke', 'delete', 'suspend'].includes(type)) {
        if (!reauthPassword) {
          setActionError('Please enter your administrator password to authorize this action.');
          setActionLoading(false);
          return;
        }
        await adminService.reauth(reauthPassword);
      }

      if (type === 'suspend') {
        await adminService.updateUserStatus(targetUser.uid, 'suspended', actionReason);
      } else if (type === 'reactivate') {
        await adminService.updateUserStatus(targetUser.uid, 'active', actionReason);
      } else if (type === 'promote') {
        await adminService.updateUserRole(targetUser.uid, 'admin');
      } else if (type === 'revoke') {
        await adminService.updateUserRole(targetUser.uid, 'user');
      } else if (type === 'delete') {
        await adminService.deleteUserAccount(targetUser.uid);
      }

      setActionConfirm(null);
      setActionReason('');
      setReauthPassword('');

      // Refresh list & detail
      await loadUsers();
      if (selectedUid === targetUser.uid) {
        if (type === 'delete') {
          handleCloseDetail();
        } else {
          handleOpenDetail(targetUser.uid);
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to execute administrative operation.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Identity & Authorization
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            User Management Directory
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            Search, filter, inspect metadata, and manage platform roles and standing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#6B6F67] dark:text-[#9C9F97]">
            {totalCount} Total Accounts
          </span>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#6B6F67] dark:text-[#9C9F97] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, or user ID..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'active', label: 'Active' },
            { id: 'suspended', label: 'Suspended' },
            { id: 'verified', label: 'Verified' },
            { id: 'unverified', label: 'Unverified' },
            { id: 'recent', label: 'Recent (7D)' },
            { id: 'admin', label: 'Admins' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFilter(f.id);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition ${
                activeFilter === f.id
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] font-medium'
                  : 'bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-[#C73E2E]/10 border border-[#C73E2E]/20 text-xs text-[#C73E2E] dark:text-[#E06C5E] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadUsers} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {/* User Directory Table */}
      <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2]/50 dark:bg-[#242722]/50 text-[#6B6F67] dark:text-[#9C9F97] font-medium">
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3">Provider</th>
                <th className="py-2.5 px-3">Registered</th>
                <th className="py-2.5 px-3">Last Active</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E7E0]/60 dark:divide-[#2C302A]/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                    Loading platform user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                    No users found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentAdmin = u.uid === currentAdmin?.uid;
                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-[#F7F6F2]/60 dark:hover:bg-[#242722]/60 transition"
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover border border-[#E8E7E0] dark:border-[#2C302A]"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-[#F7F6F2] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED] font-medium flex items-center justify-center text-xs">
                              {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-[#20231F] dark:text-[#F2F1ED] block">
                              {u.displayName}
                            </span>
                            <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] font-mono block">
                              {u.email || u.uid}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-[#303FCA]/10 dark:bg-[#5263FA]/20 text-[#303FCA] dark:text-[#5263FA]">
                            <Shield className="w-3 h-3" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-[#6B6F67] dark:text-[#9C9F97]">
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {u.accountStatus === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-[#C73E2E]/10 dark:bg-[#C73E2E]/20 text-[#C73E2E] dark:text-[#E06C5E]">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-[#375336]/10 dark:bg-[#375336]/20 text-[#375336] dark:text-[#7EB384]">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Verification */}
                      <td className="py-3 px-3">
                        {u.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#375336] dark:text-[#7EB384]">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#C99700]">Unverified</span>
                        )}
                      </td>

                      {/* Provider */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
                        {u.authProvider}
                      </td>

                      {/* Registered */}
                      <td className="py-3 px-3 text-[11px] text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-3 text-[11px] text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(u.uid)}
                            className="px-2 py-1 rounded text-xs text-[#303FCA] dark:text-[#5263FA] hover:bg-[#303FCA]/5 dark:hover:bg-[#5263FA]/10 transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-3 border-t border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-between text-xs text-[#6B6F67] dark:text-[#9C9F97]">
          <span>
            Page {page} of {totalPages} ({totalCount} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-[#E8E7E0] dark:border-[#2C302A] disabled:opacity-30 hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-[#E8E7E0] dark:border-[#2C302A] disabled:opacity-30 hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUid && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E8E7E0] dark:border-[#2C302A] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
                  Account Inspector
                </span>
                <h3 className="text-base font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                  {detailMetrics?.user.displayName || 'User Details'}
                </h3>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1.5 rounded-lg text-[#6B6F67] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                Retrieving isolated account metrics and telemetry...
              </div>
            ) : detailError ? (
              <div className="p-3 text-xs text-[#C73E2E]">{detailError}</div>
            ) : detailMetrics ? (
              <div className="space-y-5">
                {/* Profile Overview */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center font-bold text-sm">
                    {detailMetrics.user.displayName ? detailMetrics.user.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] truncate">
                        {detailMetrics.user.displayName}
                      </span>
                      {detailMetrics.user.role === 'admin' && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[#303FCA]/10 text-[#303FCA] rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] font-mono block truncate">
                      {detailMetrics.user.email}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        detailMetrics.user.accountStatus === 'active'
                          ? 'bg-[#375336]/10 text-[#375336] dark:text-[#7EB384]'
                          : 'bg-[#C73E2E]/10 text-[#C73E2E] dark:text-[#E06C5E]'
                      }`}
                    >
                      {detailMetrics.user.accountStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Aggregated Usage Counts (Strict privacy: zero personal notes/descriptions) */}
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-2.5">
                    Product Usage Metrics (Aggregated)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-center">
                      <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] block">Tasks Created</span>
                      <span className="text-base font-bold text-[#20231F] dark:text-[#F2F1ED]">
                        {detailMetrics.tasksCreatedCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-center">
                      <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] block">Tasks Completed</span>
                      <span className="text-base font-bold text-[#375336] dark:text-[#7EB384]">
                        {detailMetrics.tasksCompletedCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-center">
                      <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] block">Active Habits</span>
                      <span className="text-base font-bold text-[#C99700]">
                        {detailMetrics.activeHabitsCount}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-center">
                      <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] block">Reminders Set</span>
                      <span className="text-base font-bold text-[#303FCA] dark:text-[#5263FA]">
                        {detailMetrics.remindersScheduledCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Details Metadata */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
                    <span className="text-[#6B6F67] dark:text-[#9C9F97]">User Identifier (UID):</span>
                    <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED]">
                      {detailMetrics.user.uid}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
                    <span className="text-[#6B6F67] dark:text-[#9C9F97]">Registration Timestamp:</span>
                    <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED]">
                      {detailMetrics.user.createdAt || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
                    <span className="text-[#6B6F67] dark:text-[#9C9F97]">Last Active Session:</span>
                    <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED]">
                      {detailMetrics.user.lastLoginAt || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
                    <span className="text-[#6B6F67] dark:text-[#9C9F97]">Authentication Provider:</span>
                    <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED]">
                      {detailMetrics.user.authProvider}
                    </span>
                  </div>
                </div>

                {/* Recent Product Activity Stream for this user */}
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Recent Activity Stream
                  </h4>
                  {detailMetrics.recentActivity.length === 0 ? (
                    <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] italic py-2">
                      No activity events logged yet for this account.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {detailMetrics.recentActivity.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-2 rounded bg-[#F7F6F2] dark:bg-[#242722] text-xs"
                        >
                          <span className="font-mono text-[11px] font-medium text-[#20231F] dark:text-[#F2F1ED]">
                            {ev.eventType}
                          </span>
                          <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97]">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Administrative Actions */}
                <div className="pt-4 border-t border-[#E8E7E0] dark:border-[#2C302A] flex flex-wrap gap-2">
                  {detailMetrics.user.accountStatus === 'active' ? (
                    <button
                      onClick={() => setActionConfirm({ type: 'suspend', targetUser: detailMetrics.user })}
                      disabled={detailMetrics.user.uid === currentAdmin?.uid}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#C73E2E] bg-[#C73E2E]/10 hover:bg-[#C73E2E]/20 disabled:opacity-40 transition flex items-center gap-1.5"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      onClick={() => setActionConfirm({ type: 'reactivate', targetUser: detailMetrics.user })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#375336] dark:text-[#7EB384] bg-[#375336]/10 hover:bg-[#375336]/20 transition flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Reactivate Account
                    </button>
                  )}

                  {detailMetrics.user.role === 'admin' ? (
                    <button
                      onClick={() => setActionConfirm({ type: 'revoke', targetUser: detailMetrics.user })}
                      disabled={detailMetrics.user.uid === currentAdmin?.uid}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] bg-[#F7F6F2] dark:bg-[#242722] hover:opacity-80 disabled:opacity-40 transition flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Demote to User
                    </button>
                  ) : (
                    <button
                      onClick={() => setActionConfirm({ type: 'promote', targetUser: detailMetrics.user })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#303FCA] dark:text-[#5263FA] bg-[#303FCA]/10 dark:bg-[#5263FA]/20 hover:opacity-80 transition flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Promote to Admin
                    </button>
                  )}

                  <button
                    onClick={() => setActionConfirm({ type: 'delete', targetUser: detailMetrics.user })}
                    disabled={detailMetrics.user.uid === currentAdmin?.uid}
                    className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium text-[#C73E2E] hover:bg-[#C73E2E]/10 disabled:opacity-40 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Account
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Action Confirmation & Re-Authentication Dialog */}
      {actionConfirm && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-[#C73E2E] dark:text-[#E06C5E]">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-semibold capitalize">
                Confirm {actionConfirm.type} Action
              </h3>
            </div>

            <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
              You are about to <strong className="text-[#20231F] dark:text-[#F2F1ED]">{actionConfirm.type}</strong> account for{' '}
              <span className="font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                {actionConfirm.targetUser.email || actionConfirm.targetUser.uid}
              </span>.
              {actionConfirm.type === 'delete' && ' This will permanently cascade-delete all of the user’s cloud tasks, habits, and authentication credentials.'}
            </p>

            {/* Reason input */}
            <div>
              <label className="block text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] mb-1">
                Audit Log Reason
              </label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for this action (recorded in audit log)"
                className="w-full text-xs px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              />
            </div>

            {/* Reauth password for sensitive actions */}
            {['revoke', 'delete', 'suspend'].includes(actionConfirm.type) && (
              <div>
                <label className="block text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] mb-1">
                  Administrator Password Re-Authentication
                </label>
                <input
                  type="password"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  placeholder="Enter your administrator password"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
                />
              </div>
            )}

            {actionError && (
              <p className="text-xs text-[#C73E2E] dark:text-[#E06C5E]">{actionError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setActionConfirm(null);
                  setActionReason('');
                  setReauthPassword('');
                  setActionError(null);
                }}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#C73E2E] text-white hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5"
              >
                {actionLoading ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
