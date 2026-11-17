import React, { useState, useEffect } from 'react';
import {
  Activity,
  Filter,
  RefreshCw,
  Search,
  ListTodo,
  Sparkles,
  Bell,
  LogIn,
  LogOut,
  UserPlus,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { adminService } from '../../../services/admin/admin.service';
import { ActivityEvent } from '../../../types';

export const AdminActivityView: React.FC = () => {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getActivity({
        eventType: categoryFilter === 'all' ? undefined : categoryFilter,
        userId: userFilter.trim() || undefined,
        limit: 50,
      });
      setEvents(res.events);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [categoryFilter, userFilter]);

  const getEventIcon = (type: string) => {
    if (type.startsWith('TASK')) return <ListTodo className="w-3.5 h-3.5 text-[#303FCA] dark:text-[#5263FA]" />;
    if (type.startsWith('HABIT')) return <Sparkles className="w-3.5 h-3.5 text-[#C99700]" />;
    if (type.startsWith('REMINDER')) return <Bell className="w-3.5 h-3.5 text-[#303FCA]" />;
    if (type === 'USER_REGISTERED') return <UserPlus className="w-3.5 h-3.5 text-[#375336]" />;
    if (type === 'USER_LOGIN') return <LogIn className="w-3.5 h-3.5 text-[#375336]" />;
    if (type === 'USER_LOGOUT') return <LogOut className="w-3.5 h-3.5 text-[#6B6F67]" />;
    if (type === 'SYNC_SUCCESS') return <RefreshCcw className="w-3.5 h-3.5 text-[#375336]" />;
    if (type === 'SYNC_FAILURE') return <AlertTriangle className="w-3.5 h-3.5 text-[#C73E2E]" />;
    return <Activity className="w-3.5 h-3.5 text-[#6B6F67]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Event Stream & Auditing
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            User Activity Tracker
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            Real-time telemetry stream of product interactions. Content is strictly anonymized without personal notes or task text.
          </p>
        </div>

        <button
          onClick={loadEvents}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition disabled:opacity-40 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter and User Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'TASK_CREATED', label: 'Tasks Created' },
            { id: 'TASK_COMPLETED', label: 'Tasks Completed' },
            { id: 'HABIT_COMPLETED', label: 'Habit Done' },
            { id: 'REMINDER_CREATED', label: 'Reminders' },
            { id: 'USER_LOGIN', label: 'Logins' },
            { id: 'SYNC_FAILURE', label: 'Sync Failures' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition ${
                categoryFilter === f.id
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] font-medium'
                  : 'bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-[#6B6F67] dark:text-[#9C9F97] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Filter by User ID..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-[#C73E2E] bg-[#C73E2E]/10 rounded-lg">{error}</div>
      )}

      {/* Events Feed List */}
      <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-xl overflow-hidden shadow-xs divide-y divide-[#E8E7E0]/60 dark:divide-[#2C302A]/60">
        {loading && events.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            Loading real activity telemetry...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            No activity events recorded matching this filter.
          </div>
        ) : (
          events.map((ev) => {
            const isExpanded = expandedId === ev.id;
            return (
              <div key={ev.id} className="p-3.5 hover:bg-[#F7F6F2]/40 dark:hover:bg-[#242722]/40 transition">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  className="flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center flex-shrink-0">
                      {getEventIcon(ev.eventType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-[#20231F] dark:text-[#F2F1ED]">
                          {ev.eventType}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B6F67] dark:text-[#9C9F97]">
                          User: {ev.userId.substring(0, 10)}...
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
                        {ev.platform} • App v{ev.appVersion}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[#6B6F67]" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[#6B6F67]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#E8E7E0]/60 dark:border-[#2C302A]/60 text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[#6B6F67] dark:text-[#9C9F97]">Full Event ID: </span>
                        <span className="font-mono text-[#20231F] dark:text-[#F2F1ED]">{ev.id}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6F67] dark:text-[#9C9F97]">Full User ID: </span>
                        <span className="font-mono text-[#20231F] dark:text-[#F2F1ED]">{ev.userId}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] block mb-1">
                        Sanitized Event Metadata:
                      </span>
                      <pre className="p-2.5 rounded bg-[#F7F6F2] dark:bg-[#242722] font-mono text-[10px] text-[#20231F] dark:text-[#F2F1ED] overflow-x-auto">
                        {JSON.stringify(ev.metadata || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
