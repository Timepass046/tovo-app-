import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { notificationService, NotificationStatus } from '../../lib/notifications';
import { Task } from '../../types';
import { TaskCard } from '../tasks/TaskCard';

interface PlannerViewProps {
  onSelectTask: (task: Task) => void;
  onOpenQuickCapture: (date?: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  onSelectTask,
  onOpenQuickCapture,
}) => {
  const { tasks, updateTask } = useTasks();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('default');

  useEffect(() => {
    setNotificationStatus(notificationService.getStatus());
  }, []);

  const handleRequestNotifications = async () => {
    const status = await notificationService.requestPermission();
    setNotificationStatus(status);
  };

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const navigateDays = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const jumpToToday = () => {
    setSelectedDate(new Date());
  };

  // Generate week days (Monday through Sunday)
  const weekDays = React.useMemo(() => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  // Tasks for selected day
  const dayTasks = tasks.filter(t => {
    if (t.archived) return false;
    const isDue = t.dueDate && t.dueDate.split('T')[0] === selectedDateStr;
    const isToday = selectedDateStr === todayStr && t.bucket === 'today';
    return isDue || isToday;
  });

  // Active reminders
  const activeReminders = tasks.filter(t => {
    if (t.archived || t.status === 'completed' || !t.reminderAt) return false;
    return true;
  });

  // Snooze handlers
  const handleSnooze = async (taskId: string, minutes: number) => {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    await updateTask(taskId, { reminderAt: snoozeTime });
    notificationService.scheduleReminder(
      taskId,
      'Snoozed Reminder',
      'Task reminder snoozed',
      snoozeTime
    );
  };

  const handleDismissReminder = async (taskId: string) => {
    await updateTask(taskId, { reminderAt: undefined });
    notificationService.cancelReminder(taskId);
  };

  // Month title for the current view
  const monthYearLabel = React.useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  return (
    <div className="space-y-5 sm:space-y-6 pb-4 animate-in fade-in duration-200">
      {/* 1. Header with Month/Year & Day/Week Switcher */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-3xl font-semibold tracking-tight leading-tight text-[#20231F] dark:text-[#F2F1ED]">
            Planner
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
            {monthYearLabel}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#EFEFE9] dark:bg-[#242722] rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] shrink-0">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'day'
                ? 'bg-[#FFFFFF] dark:bg-[#1C1F1B] text-[#20231F] dark:text-[#F2F1ED] shadow-sm'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              viewMode === 'week'
                ? 'bg-[#FFFFFF] dark:bg-[#1C1F1B] text-[#20231F] dark:text-[#F2F1ED] shadow-sm'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* 2. Week Horizontal Calendar Strip */}
      <div className="bg-[#FFFFFF] dark:bg-[#1C1F1B] rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3 px-0.5">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDays(-7)}
              className="p-1.5 rounded text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] hover:bg-[#EFEFE9] dark:hover:bg-[#242722] transition"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={jumpToToday}
              className="text-xs font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline px-1.5 whitespace-nowrap"
            >
              Today
            </button>
            <button
              onClick={() => navigateDays(7)}
              className="p-1.5 rounded text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] hover:bg-[#EFEFE9] dark:hover:bg-[#242722] transition"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-xs text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* 7 Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => {
            const dateISO = d.toISOString().split('T')[0];
            const isSelected = dateISO === selectedDateStr;
            const isToday = dateISO === todayStr;
            const dayTasksCount = tasks.filter(t => !t.archived && t.dueDate && t.dueDate.split('T')[0] === dateISO).length;

            return (
              <button
                key={dateISO}
                onClick={() => setSelectedDate(d)}
                className={`py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center gap-0.5 ${
                  isSelected
                    ? 'bg-[#20231F] text-[#F7F6F2] dark:bg-[#F2F1ED] dark:text-[#151714] font-semibold'
                    : isToday
                    ? 'bg-[#EEF0FD] dark:bg-[#1D234A] text-[#303FCA] dark:text-[#5263FA]'
                    : 'hover:bg-[#EFEFE9] dark:hover:bg-[#242722] text-[#6B6F67] dark:text-[#9C9F97]'
                }`}
              >
                <span className="text-[10px] uppercase tracking-tight">
                  {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
                <span className="text-xs font-mono tabular-nums">
                  {d.getDate()}
                </span>
                {dayTasksCount > 0 && (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      isSelected
                        ? 'bg-[#F7F6F2] dark:bg-[#151714]'
                        : 'bg-[#303FCA] dark:bg-[#5263FA]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Notification permission prompt banner (if default/denied) */}
      {notificationStatus !== 'granted' && (
        <div className="p-3 rounded-lg bg-[#FCF5EB] dark:bg-[#2B2113] border border-[#F3DFC1] dark:border-[#4E3516] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 text-[#C47D14] dark:text-[#DE932A]">
            <Bell className="w-4 h-4 shrink-0" />
            <span className="leading-snug">Enable device notifications to receive scheduled task reminders.</span>
          </div>
          <button
            onClick={handleRequestNotifications}
            className="font-medium text-[#C47D14] dark:text-[#DE932A] hover:underline shrink-0 whitespace-nowrap"
          >
            Enable
          </button>
        </div>
      )}

      {/* 4. Active Reminders Strip (if any) */}
      {activeReminders.length > 0 && (
        <section aria-labelledby="section-reminders">
          <div className="flex items-center justify-between mb-2">
            <h2
              id="section-reminders"
              className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#9C9F97]"
            >
              Active Reminders
            </h2>
            <span className="text-[11px] font-mono tabular-nums text-[#92968E] dark:text-[#6E726A]">
              {activeReminders.length} scheduled
            </span>
          </div>

          <div className="space-y-2">
            {activeReminders.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#20231F] dark:text-[#F2F1ED] truncate">
                    {r.title}
                  </p>
                  <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1 mt-0.5 font-mono">
                    <Clock className="w-3 h-3 text-[#303FCA] dark:text-[#5263FA] shrink-0" />
                    {new Date(r.reminderAt!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSnooze(r.id, 10)}
                    className="px-2 py-1 rounded text-[11px] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#EFEFE9] dark:hover:bg-[#242722] transition whitespace-nowrap"
                  >
                    +10m
                  </button>
                  <button
                    onClick={() => handleDismissReminder(r.id)}
                    className="px-2 py-1 rounded text-[11px] text-[#C73E2E] dark:text-[#E05445] hover:bg-[#FDF1EF] dark:hover:bg-[#2E1917] transition whitespace-nowrap"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Agenda / Tasks View */}
      {viewMode === 'day' ? (
        <section aria-labelledby="section-agenda">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <h2
              id="section-agenda"
              className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#9C9F97]"
            >
              Agenda · {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h2>

            <button
              onClick={() => onOpenQuickCapture(selectedDateStr)}
              className="text-[11px] font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3 h-3" />
              Schedule Task
            </button>
          </div>

          {dayTasks.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-[#FFFFFF] dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] p-6 flex flex-col items-center">
              <CalendarIcon className="w-8 h-8 text-[#92968E] dark:text-[#6E726A] opacity-40 mb-2" />
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">
                No tasks scheduled for this day.
              </p>
              <button
                onClick={() => onOpenQuickCapture(selectedDateStr)}
                className="mt-2 text-xs font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline"
              >
                + Add task for this date
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {dayTasks.map((task) => (
                <TaskCard key={task.id} task={task} onSelect={onSelectTask} />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Week View: 7 Days breakdown */
        <section aria-labelledby="section-week-breakdown" className="space-y-4">
          <h2
            id="section-week-breakdown"
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#9C9F97]"
          >
            Weekly Schedule
          </h2>

          <div className="space-y-3">
            {weekDays.map((d) => {
              const dateISO = d.toISOString().split('T')[0];
              const isToday = dateISO === todayStr;
              const scheduled = tasks.filter(t => !t.archived && t.dueDate && t.dueDate.split('T')[0] === dateISO);

              return (
                <div
                  key={dateISO}
                  className={`rounded-xl border p-3 transition-colors ${
                    isToday
                      ? 'bg-[#FFFFFF] dark:bg-[#1C1F1B] border-[#303FCA]/30 dark:border-[#5263FA]/30'
                      : 'bg-[#FFFFFF] dark:bg-[#1C1F1B] border-[#E8E7E0] dark:border-[#2C302A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] flex items-center gap-1.5">
                      <span>{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      {isToday && (
                        <span className="text-[10px] font-semibold text-[#303FCA] dark:text-[#5263FA]">
                          (Today)
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-[#92968E] dark:text-[#6E726A] font-mono tabular-nums">
                      {scheduled.length} tasks
                    </span>
                  </div>

                  {scheduled.length === 0 ? (
                    <p className="text-[11px] text-[#92968E] dark:text-[#6E726A]">No tasks</p>
                  ) : (
                    <div className="space-y-1.5">
                      {scheduled.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#151714] hover:bg-[#EFEFE9] dark:hover:bg-[#242722] cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className={`truncate text-[#20231F] dark:text-[#F2F1ED] ${t.status === 'completed' ? 'line-through text-[#92968E]' : ''}`}>
                            {t.title}
                          </span>
                          <span className="text-[10px] text-[#6B6F67] dark:text-[#9C9F97] ml-2 shrink-0 capitalize">
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
