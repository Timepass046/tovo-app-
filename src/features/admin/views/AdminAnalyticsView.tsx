import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  RefreshCw,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Bell,
  Activity,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { adminService } from '../../../services/admin/admin.service';
import { DailyAnalyticsRecord } from '../../../types';

export const AdminAnalyticsView: React.FC = () => {
  const [range, setRange] = useState<'7d' | '14d' | '30d' | 'all'>('7d');
  const [series, setSeries] = useState<(DailyAnalyticsRecord & { completionRate: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAnalytics(range);
      setSeries(res.series || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  // Aggregate stats across the active range
  const totalCreated = series.reduce((acc, s) => acc + s.tasksCreated, 0);
  const totalCompleted = series.reduce((acc, s) => acc + s.tasksCompleted, 0);
  const totalHabits = series.reduce((acc, s) => acc + s.habitsCompleted, 0);
  const totalReminders = series.reduce((acc, s) => acc + s.remindersScheduled, 0);
  const avgCompletionRate = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 0;

  // Max value for bar chart height normalization
  const maxTasks = Math.max(1, ...series.map((s) => Math.max(s.tasksCreated, s.tasksCompleted)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Productivity & Engagement
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            Productivity Analytics
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            Aggregated trends across task creation, completion velocity, habit execution, and reminder adoption.
          </p>
        </div>

        {/* Range picker */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(
            [
              { id: '7d', label: '7 Days' },
              { id: '14d', label: '14 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id)}
              className={`px-2.5 py-1 rounded-md text-xs transition ${
                range === item.id
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] font-medium'
                  : 'bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-[#C73E2E] bg-[#C73E2E]/10 rounded-lg">{error}</div>
      )}

      {/* Range Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Tasks Created ({range})
          </span>
          <div className="text-xl font-bold text-[#20231F] dark:text-[#F2F1ED]">
            {loading ? '—' : totalCreated}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
            {Math.round(totalCreated / Math.max(1, series.length))} daily avg
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Tasks Completed
          </span>
          <div className="text-xl font-bold text-[#375336] dark:text-[#7EB384]">
            {loading ? '—' : totalCompleted}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
            {avgCompletionRate}% completion rate
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Habits Checked
          </span>
          <div className="text-xl font-bold text-[#C99700]">
            {loading ? '—' : totalHabits}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
            Daily routines executed
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Reminders Triggered
          </span>
          <div className="text-xl font-bold text-[#303FCA] dark:text-[#5263FA]">
            {loading ? '—' : totalReminders}
          </div>
          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
            Scheduled alert executions
          </p>
        </div>
      </div>

      {/* Main Chart: Task Creation vs Completion Velocity */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Task Creation vs Completion Velocity
            </h3>
            <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
              Daily comparison between inbound captured tasks and completed actions.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#20231F] dark:text-[#F2F1ED]">
              <div className="w-2.5 h-2.5 rounded-xs bg-[#303FCA] dark:bg-[#5263FA]" />
              Created
            </span>
            <span className="flex items-center gap-1.5 text-[#20231F] dark:text-[#F2F1ED]">
              <div className="w-2.5 h-2.5 rounded-xs bg-[#375336] dark:bg-[#7EB384]" />
              Completed
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#6B6F67]">
              Loading analytics time series...
            </div>
          ) : series.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#6B6F67]">
              No timeline data recorded yet.
            </div>
          ) : (
            <div className="h-52 flex items-end gap-2 sm:gap-4 border-b border-[#E8E7E0] dark:border-[#2C302A] px-2">
              {series.map((item) => {
                const createdHeight = (item.tasksCreated / maxTasks) * 100;
                const completedHeight = (item.tasksCompleted / maxTasks) * 100;
                const dateLabel = item.date.slice(5); // MM-DD

                return (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="flex items-end gap-1 w-full justify-center h-40">
                      {/* Created bar */}
                      <div
                        style={{ height: `${Math.max(4, createdHeight)}%` }}
                        className="w-1/2 max-w-[14px] bg-[#303FCA]/80 dark:bg-[#5263FA]/80 rounded-t-xs hover:opacity-100 transition relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#151714] text-white text-[9px] font-mono pointer-events-none transition whitespace-nowrap z-10">
                          +{item.tasksCreated}
                        </div>
                      </div>

                      {/* Completed bar */}
                      <div
                        style={{ height: `${Math.max(4, completedHeight)}%` }}
                        className="w-1/2 max-w-[14px] bg-[#375336]/80 dark:bg-[#7EB384]/80 rounded-t-xs hover:opacity-100 transition relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#151714] text-white text-[9px] font-mono pointer-events-none transition whitespace-nowrap z-10">
                          ✓{item.tasksCompleted}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-[#6B6F67] dark:text-[#9C9F97] truncate">
                      {dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Completion Rate & Habit Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completion Rate Trend */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Task Completion Efficiency
            </h3>
            <span className="font-mono text-xs font-medium text-[#375336] dark:text-[#7EB384]">
              {avgCompletionRate}% Average
            </span>
          </div>

          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            Percentage of captured tasks that reach completed status within the active period.
          </p>

          <div className="space-y-2 pt-2">
            {series.slice(-5).map((s) => (
              <div key={s.date} className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">{s.date}</span>
                <div className="flex-1 max-w-[140px] mx-3 h-2 bg-[#F7F6F2] dark:bg-[#242722] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${s.completionRate}%` }}
                    className="h-full bg-[#375336] dark:bg-[#7EB384] rounded-full"
                  />
                </div>
                <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED] w-10 text-right">
                  {s.completionRate}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Habit Adoption Trends */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Habit & Routine Consistency
            </h3>
            <Sparkles className="w-4 h-4 text-[#C99700]" />
          </div>

          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            Consistent habit execution indicates deep personal productivity retention.
          </p>

          <div className="space-y-2 pt-2">
            {series.slice(-5).map((s) => (
              <div key={s.date} className="flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">{s.date}</span>
                <div className="flex-1 max-w-[140px] mx-3 h-2 bg-[#F7F6F2] dark:bg-[#242722] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, s.habitsCompleted * 20)}%` }}
                    className="h-full bg-[#C99700] rounded-full"
                  />
                </div>
                <span className="font-mono text-[11px] text-[#20231F] dark:text-[#F2F1ED] w-10 text-right">
                  {s.habitsCompleted} logs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
