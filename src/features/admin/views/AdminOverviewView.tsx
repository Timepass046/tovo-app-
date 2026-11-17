import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Bell,
  RefreshCw,
  AlertCircle,
  Activity,
  Calendar,
  Clock,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { adminService } from '../../../services/admin/admin.service';
import { AdminStats } from '../../../types';

interface AdminOverviewViewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getStats();
      setStats(data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Platform Intelligence
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            Operational Overview
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            Verified aggregate metrics from production database collections and analytics streams.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-[#6B6F67] dark:text-[#9C9F97] hidden sm:inline">
              Synced at {lastRefreshed}
            </span>
          )}
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#C73E2E]/10 border border-[#C73E2E]/20 text-xs text-[#C73E2E] dark:text-[#E06C5E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadStats} className="underline font-medium hover:opacity-80">
            Retry
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Registered Users */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Total Users
            </span>
            <Users className="w-4 h-4 text-[#303FCA] dark:text-[#5263FA]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
            {loading ? <span className="opacity-40 font-normal text-lg">Loading...</span> : stats?.totalUsers || 0}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] flex items-center justify-between">
            <span>+{stats?.newUsersToday || 0} registered today</span>
            <span className="font-mono">{stats?.newUsersThisWeek || 0} this wk</span>
          </p>
        </div>

        {/* Active Users (Last 7 Days) */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Active Users (7D)
            </span>
            <Activity className="w-4 h-4 text-[#375336] dark:text-[#7EB384]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
            {loading ? <span className="opacity-40 font-normal text-lg">Loading...</span> : stats?.activeUsers7Days || 0}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] flex items-center justify-between">
            <span>{stats?.activeUsersToday || 0} active today</span>
            <span className="font-mono">{stats?.activeUsers30Days || 0} (30D)</span>
          </p>
        </div>

        {/* Tasks Created & Completed */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Tasks Created
            </span>
            <ListTodo className="w-4 h-4 text-[#303FCA] dark:text-[#5263FA]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
            {loading ? <span className="opacity-40 font-normal text-lg">Loading...</span> : stats?.totalTasksCreated || 0}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] flex items-center justify-between">
            <span>{stats?.totalTasksCompleted || 0} completed</span>
            <span className="font-mono">
              {stats?.totalTasksCreated
                ? `${Math.round(((stats.totalTasksCompleted || 0) / stats.totalTasksCreated) * 100)}% done`
                : '0% done'}
            </span>
          </p>
        </div>

        {/* Active Habits & Reminders */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Habits & Reminders
            </span>
            <Sparkles className="w-4 h-4 text-[#C99700]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
            {loading ? <span className="opacity-40 font-normal text-lg">Loading...</span> : stats?.totalActiveHabits || 0}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] flex items-center justify-between">
            <span>Active Habits</span>
            <span className="font-mono">{stats?.totalRemindersScheduled || 0} reminders</span>
          </p>
        </div>
      </div>

      {/* Secondary Metrics & Account Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Account Verification & Standing */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              User Account Integrity
            </h3>
            <Shield className="w-4 h-4 text-[#303FCA] dark:text-[#5263FA]" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
              <span className="text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#375336] dark:text-[#7EB384]" />
                Verified Email Accounts
              </span>
              <span className="font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                {stats?.verifiedUsers || 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
              <span className="text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#C99700]" />
                Unverified Email Accounts
              </span>
              <span className="font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                {stats ? Math.max(0, stats.totalUsers - (stats.verifiedUsers || 0)) : 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
              <span className="text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-[#C73E2E] dark:text-[#E06C5E]" />
                Suspended Accounts
              </span>
              <span className="font-mono font-medium text-[#C73E2E] dark:text-[#E06C5E]">
                {stats?.suspendedUsers || 0}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('users')}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] transition"
          >
            <span>Open User Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Engagement Summary */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Engagement Pulse
            </h3>
            <Clock className="w-4 h-4 text-[#303FCA] dark:text-[#5263FA]" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
              <span className="text-[#6B6F67] dark:text-[#9C9F97]">Active Today Ratio</span>
              <span className="font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                {stats?.totalUsers
                  ? `${Math.round(((stats.activeUsersToday || 0) / stats.totalUsers) * 100)}%`
                  : '0%'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
              <span className="text-[#6B6F67] dark:text-[#9C9F97]">Weekly Active Ratio</span>
              <span className="font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                {stats?.totalUsers
                  ? `${Math.round(((stats.activeUsers7Days || 0) / stats.totalUsers) * 100)}%`
                  : '0%'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1.5 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
              <span className="text-[#6B6F67] dark:text-[#9C9F97]">Monthly Active Ratio</span>
              <span className="font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                {stats?.totalUsers
                  ? `${Math.round(((stats.activeUsers30Days || 0) / stats.totalUsers) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] transition"
          >
            <span>View Detailed Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Security & Isolation Callout */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Privacy Invariant
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#375336]/10 text-[#375336] dark:text-[#7EB384]">
              ENFORCED
            </span>
          </div>

          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
            Tovo strictly isolates personal productivity documents. Administrators can view aggregated counts and account standing, but can never read user task descriptions, personal notes, or habit reflections.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('privacy')}
              className="text-xs font-medium text-[#303FCA] dark:text-[#5263FA] underline hover:opacity-85"
            >
              Review Data Retention & Telemetry Policy →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
