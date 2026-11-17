import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Server,
  Cpu,
  Clock,
  ShieldAlert,
  Bug,
  RefreshCcw,
  Check,
} from 'lucide-react';
import { adminService } from '../../../services/admin/admin.service';
import { HealthError } from '../../../types';

export const AdminHealthView: React.FC = () => {
  const [healthData, setHealthData] = useState<{
    status: 'healthy' | 'degraded' | 'critical';
    counts: Record<string, number>;
    recentErrors: HealthError[];
    uptimeSeconds: number;
    memoryUsageMB: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getHealth();
      setHealthData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch operational health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleResolveError = async (id: string) => {
    try {
      setResolvingId(id);
      await adminService.resolveHealthError(id);
      await loadHealth();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve error');
    } finally {
      setResolvingId(null);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Operational Reliability
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            Application Health & Error Monitoring
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            Real-time error tracking across authentication, Firestore sync, database queries, and notifications.
          </p>
        </div>

        <button
          onClick={loadHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition disabled:opacity-40 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Health Status
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs text-[#C73E2E] bg-[#C73E2E]/10 rounded-lg">{error}</div>
      )}

      {/* Health Overview Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              healthData?.status === 'healthy'
                ? 'bg-[#375336]/10 text-[#375336] dark:text-[#7EB384]'
                : healthData?.status === 'degraded'
                ? 'bg-[#C99700]/10 text-[#C99700]'
                : 'bg-[#C73E2E]/10 text-[#C73E2E] dark:text-[#E06C5E]'
            }`}
          >
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold capitalize text-[#20231F] dark:text-[#F2F1ED]">
                Platform Status: {healthData?.status || 'Assessing...'}
              </h3>
              <span
                className={`w-2 h-2 rounded-full ${
                  healthData?.status === 'healthy'
                    ? 'bg-[#375336] dark:bg-[#7EB384]'
                    : healthData?.status === 'degraded'
                    ? 'bg-[#C99700]'
                    : 'bg-[#C73E2E]'
                }`}
              />
            </div>
            <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
              Production runtime healthy. Endpoints responding within normal latency thresholds.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#6B6F67] dark:text-[#9C9F97] pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E7E0] dark:border-[#2C302A]">
          <div>
            <span className="block text-[10px] uppercase">Uptime</span>
            <span className="font-medium text-[#20231F] dark:text-[#F2F1ED]">
              {healthData ? formatUptime(healthData.uptimeSeconds) : '—'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase">Memory</span>
            <span className="font-medium text-[#20231F] dark:text-[#F2F1ED]">
              {healthData?.memoryUsageMB || 0} MB RSS
            </span>
          </div>
        </div>
      </div>

      {/* Error Breakdown Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] block">
            Auth Failures
          </span>
          <div className="text-lg font-bold text-[#20231F] dark:text-[#F2F1ED]">
            {healthData?.counts.auth_failure || 0}
          </div>
          <span className="text-[10px] text-[#6B6F67]">Invalid credentials</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] block">
            Sync Failures
          </span>
          <div className="text-lg font-bold text-[#20231F] dark:text-[#F2F1ED]">
            {healthData?.counts.sync_failure || 0}
          </div>
          <span className="text-[10px] text-[#6B6F67]">Replication retries</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] block">
            Database Errors
          </span>
          <div className="text-lg font-bold text-[#20231F] dark:text-[#F2F1ED]">
            {healthData?.counts.db_error || 0}
          </div>
          <span className="text-[10px] text-[#6B6F67]">Firestore rules/queries</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] block">
            Notification Errors
          </span>
          <div className="text-lg font-bold text-[#20231F] dark:text-[#F2F1ED]">
            {healthData?.counts.notification_failure || 0}
          </div>
          <span className="text-[10px] text-[#6B6F67]">Scheduling alerts</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] block">
            General App Errors
          </span>
          <div className="text-lg font-bold text-[#20231F] dark:text-[#F2F1ED]">
            {healthData?.counts.app_error || 0}
          </div>
          <span className="text-[10px] text-[#6B6F67]">Client exceptions</span>
        </div>
      </div>

      {/* Operational Error Log Table */}
      <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Recent Operational Errors & Exceptions
          </h3>
          <span className="text-[11px] font-mono text-[#6B6F67] dark:text-[#9C9F97]">
            {healthData?.recentErrors.length || 0} Events Logged
          </span>
        </div>

        {loading && !healthData ? (
          <div className="py-12 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            Analyzing operational health logs...
          </div>
        ) : healthData?.recentErrors.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#375336] dark:text-[#7EB384] flex flex-col items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5" />
            <span>Zero operational errors recorded. All subsystems operating cleanly.</span>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E7E0]/60 dark:divide-[#2C302A]/60 text-xs">
            {healthData?.recentErrors.map((err) => (
              <div
                key={err.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F6F2]/40 dark:hover:bg-[#242722]/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#C73E2E]/10 text-[#C73E2E] dark:text-[#E06C5E] uppercase">
                      {err.errorType}
                    </span>
                    <span className="font-mono text-[10px] text-[#6B6F67] dark:text-[#9C9F97]">
                      {err.platform} • User: {err.userId || 'anonymous'}
                    </span>
                  </div>
                  <p className="text-xs text-[#20231F] dark:text-[#F2F1ED] font-mono break-all">
                    {err.message}
                  </p>
                  <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] block">
                    {new Date(err.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                  {err.resolved ? (
                    <span className="text-[11px] text-[#375336] dark:text-[#7EB384] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Resolved
                    </span>
                  ) : (
                    <button
                      onClick={() => handleResolveError(err.id)}
                      disabled={resolvingId === err.id}
                      className="px-2.5 py-1 rounded text-xs text-[#303FCA] dark:text-[#5263FA] hover:bg-[#303FCA]/5 dark:hover:bg-[#5263FA]/10 border border-[#303FCA]/20 transition"
                    >
                      {resolvingId === err.id ? 'Resolving...' : 'Mark Resolved'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
