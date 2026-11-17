import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  KeyRound,
  FileText,
} from 'lucide-react';
import { adminService } from '../../../services/admin/admin.service';
import { AdminLog } from '../../../types';

export const AdminAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAuditLogs({
        action: actionFilter === 'all' ? undefined : actionFilter,
        limit: 50,
      });
      setLogs(res.logs);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve administrative audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'suspend_user':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#C73E2E]/10 text-[#C73E2E] dark:text-[#E06C5E]">
            <UserX className="w-3 h-3" /> SUSPEND USER
          </span>
        );
      case 'reactivate_user':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#375336]/10 text-[#375336] dark:text-[#7EB384]">
            <UserCheck className="w-3 h-3" /> REACTIVATE USER
          </span>
        );
      case 'promote_admin':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA]">
            <Shield className="w-3 h-3" /> PROMOTE ADMIN
          </span>
        );
      case 'revoke_admin':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#C99700]/10 text-[#C99700]">
            <ShieldAlert className="w-3 h-3" /> REVOKE ADMIN
          </span>
        );
      case 'delete_user':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#C73E2E]/10 text-[#C73E2E] dark:text-[#E06C5E]">
            <Trash2 className="w-3 h-3" /> DELETE USER
          </span>
        );
      case 'bootstrap_admin':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#375336]/10 text-[#375336] dark:text-[#7EB384]">
            <ShieldCheck className="w-3 h-3" /> BOOTSTRAP ADMIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F7F6F2] dark:bg-[#242722] text-[#6B6F67]">
            {action.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Compliance & Accountability
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            Admin Audit Trail
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            Immutable, append-only records of all sensitive administrative operations executed on the platform.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition disabled:opacity-40 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
        </button>
      </div>

      {/* Action Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Operations' },
          { id: 'suspend_user', label: 'Suspensions' },
          { id: 'reactivate_user', label: 'Reactivations' },
          { id: 'promote_admin', label: 'Promotions' },
          { id: 'revoke_admin', label: 'Revocations' },
          { id: 'delete_user', label: 'Deletions' },
          { id: 'bootstrap_admin', label: 'Bootstraps' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActionFilter(f.id)}
            className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition ${
              actionFilter === f.id
                ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] font-medium'
                : 'bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 text-xs text-[#C73E2E] bg-[#C73E2E]/10 rounded-lg">{error}</div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2]/50 dark:bg-[#242722]/50 text-[#6B6F67] dark:text-[#9C9F97] font-medium">
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Target User</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E7E0]/60 dark:divide-[#2C302A]/60">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                    Verifying immutable audit log records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                    No administrative actions recorded matching this filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F6F2]/40 dark:hover:bg-[#242722]/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED] block">
                        {log.adminEmail || log.adminUid}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED] block">
                        {log.targetEmail || log.targetUid}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#6B6F67] dark:text-[#9C9F97] max-w-xs truncate">
                      {log.reason || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#375336]/10 text-[#375336] dark:text-[#7EB384]">
                        {log.result || 'SUCCESS'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
