import React, { useState } from 'react';
import {
  Plus,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Flame,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { TaskCard } from '../tasks/TaskCard';
import { Task } from '../../types';

interface HomeViewProps {
  onSelectTask: (task: Task) => void;
  onOpenQuickCapture: () => void;
  onOpenFocusModal: () => void;
  onOpenAiModal: () => void;
  onNavigateToInbox: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTask,
  onOpenQuickCapture,
  onOpenFocusModal,
  onOpenAiModal,
  onNavigateToInbox,
}) => {
  const { user, profile } = useAuth();
  const {
    tasks,
    habits,
    toggleHabitToday,
    isHabitCompletedToday,
    startFocusSession,
    searchQuery,
    quickCapture,
  } = useTasks();

  const [inlineQuickTitle, setInlineQuickTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.displayName || profile?.displayName || '';

  const formattedDate = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  // Filter tasks for today
  const todayTasks = tasks.filter(t => {
    if (t.archived) return false;
    const isTodayBucket = t.bucket === 'today';
    const isDueToday = t.dueDate && t.dueDate.split('T')[0] === todayStr;
    return isTodayBucket || isDueToday;
  });

  const completedToday = todayTasks.filter(t => t.status === 'completed');
  const remainingToday = todayTasks.filter(t => t.status !== 'completed');
  const completionPercentage = todayTasks.length > 0
    ? Math.round((completedToday.length / todayTasks.length) * 100)
    : 0;

  // Overdue tasks
  const overdueTasks = tasks.filter(t => {
    if (t.archived || t.status === 'completed' || !t.dueDate) return false;
    return t.dueDate.split('T')[0] < todayStr;
  });

  // Today's Top Priorities (high priority first, limit to 3)
  const priorityTasks = React.useMemo(() => {
    const active = todayTasks.filter(t => t.status !== 'completed');
    return active
      .sort((a, b) => {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      })
      .slice(0, 3);
  }, [todayTasks]);

  // Next scheduled task
  const upNextTask = React.useMemo(() => {
    const active = tasks.filter(t => !t.archived && t.status !== 'completed');
    return active.find(t => t.status === 'in_progress') || active[0] || null;
  }, [tasks]);

  // Filter by search query if active
  const filteredTodayTasks = searchQuery
    ? todayTasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : todayTasks;

  const handleInlineQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineQuickTitle.trim()) return;
    await quickCapture(inlineQuickTitle.trim(), 'today', 'medium');
    setInlineQuickTitle('');
  };

  const handleStartTaskFocus = (taskId: string, mins?: number) => {
    startFocusSession(taskId, mins || 25);
    onOpenFocusModal();
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-4 animate-in fade-in duration-200">
      {/* 1. Greeting & Date Header */}
      <div className="flex items-start justify-between gap-3 pt-0.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] sm:text-3xl font-semibold tracking-tight leading-tight text-[#20231F] dark:text-[#F4F3EE]">
            {greeting}{displayName ? `, ${displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6F67] dark:text-[#A4A69F] mt-1">
            {formattedDate}
          </p>
        </div>

        {/* Mini Progress Pill */}
        {todayTasks.length > 0 && (
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#1D201B] border border-[#E8E7E0] dark:border-[#30332D] rounded-xl shadow-xs shrink-0 whitespace-nowrap">
            <span className="text-xs font-mono font-medium text-[#20231F] dark:text-[#F4F3EE] tabular-nums">
              {completionPercentage}%
            </span>
            <div className="w-10 sm:w-12 h-1.5 bg-[#EFEFE9] dark:bg-[#2A2E28] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6467F5] transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Prominent Quick Capture Bar ("What's on your mind?") */}
      <form
        onSubmit={handleInlineQuickAdd}
        className="flex items-center gap-3 px-3.5 py-2.5 bg-[#FFFFFF] dark:bg-[#1D201B] rounded-2xl border border-[#E8E7E0] dark:border-[#30332D] shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus-within:border-[#6467F5] transition-colors"
      >
        <div className="w-7 h-7 rounded-xl bg-[#EEF0FD] dark:bg-[#1D214E] text-[#6467F5] flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4 stroke-[2.25]" />
        </div>
        <input
          type="text"
          value={inlineQuickTitle}
          onChange={(e) => setInlineQuickTitle(e.target.value)}
          placeholder="What's on your mind? (press Enter)"
          className="flex-1 min-w-0 text-xs sm:text-sm bg-transparent text-[#20231F] dark:text-[#F4F3EE] placeholder-[#92968E] dark:placeholder-[#6E726A] focus:outline-none"
        />
        {inlineQuickTitle && (
          <button
            type="submit"
            className="text-xs font-medium text-[#6467F5] px-2.5 py-1 rounded-lg hover:bg-[#EEF0FD] dark:hover:bg-[#1D214E] transition whitespace-nowrap shrink-0"
          >
            Add
          </button>
        )}
      </form>

      {/* 3. Overdue Notice (if any) */}
      {overdueTasks.length > 0 && (
        <div className="px-3.5 py-2.5 rounded-xl bg-[#FDF1EF] dark:bg-[#2E1917] border border-[#F6D0CC] dark:border-[#54231E] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0 text-[#C73E2E] dark:text-[#E05445]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium truncate">
              {overdueTasks.length} {overdueTasks.length === 1 ? 'task is past due' : 'tasks are past due'}
            </span>
          </div>
          <button
            onClick={() => onSelectTask(overdueTasks[0])}
            className="font-medium text-[#C73E2E] dark:text-[#E05445] hover:underline shrink-0 whitespace-nowrap"
          >
            Review
          </button>
        </div>
      )}

      {/* 4. Up Next / Focused Target */}
      {upNextTask && (
        <section aria-labelledby="section-up-next" className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2
              id="section-up-next"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#A4A69F]"
            >
              Up Next
            </h2>
            <button
              onClick={onOpenFocusModal}
              className="text-[11px] font-medium text-[#6467F5] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <Clock className="w-3 h-3" />
              Focus Timer
            </button>
          </div>

          <div
            onClick={() => onSelectTask(upNextTask)}
            className="p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1D201B] border border-[#E8E7E0] dark:border-[#30332D] hover:border-[#D5D3CA] dark:hover:border-[#3E433B] shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer flex items-center justify-between gap-3 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-[#6B6F67] dark:text-[#A4A69F]">
                <span className="font-medium text-[#6467F5]">
                  {upNextTask.status === 'in_progress' ? 'Active Session' : 'Recommended'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{upNextTask.estimatedMinutes || 25} min focus</span>
                {upNextTask.category && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{upNextTask.category}</span>
                  </>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-[#20231F] dark:text-[#F4F3EE] truncate mt-1">
                {upNextTask.title}
              </h3>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartTaskFocus(upNextTask.id, upNextTask.estimatedMinutes);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#6467F5] text-white hover:opacity-90 text-xs font-medium flex items-center gap-1.5 shrink-0 whitespace-nowrap transition"
              title="Start focused session"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. Today's Top Priorities */}
      {priorityTasks.length > 0 && (
        <section aria-labelledby="section-priorities" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2
              id="section-priorities"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#A4A69F]"
            >
              Today's Priorities
            </h2>
            <span className="text-[11px] text-[#92968E] dark:text-[#6E726A] font-mono tabular-nums">
              {priorityTasks.length} key tasks
            </span>
          </div>

          <div className="space-y-2">
            {priorityTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onStartFocus={handleStartTaskFocus}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. Daily Routines (Habits) */}
      {habits.length > 0 && (
        <section aria-labelledby="section-habits" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2
              id="section-habits"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#A4A69F]"
            >
              Daily Routines
            </h2>
            <span className="text-[11px] text-[#92968E] dark:text-[#6E726A] font-mono tabular-nums">
              {habits.filter(h => isHabitCompletedToday(h.id)).length}/{habits.length} done
            </span>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#1D201B] rounded-2xl border border-[#E8E7E0] dark:border-[#30332D] divide-y divide-[#E8E7E0] dark:divide-[#30332D] shadow-[0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
            {habits.map((habit) => {
              const done = isHabitCompletedToday(habit.id);
              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabitToday(habit.id)}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#FDFCFA] dark:hover:bg-[#242720] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        done
                          ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                          : 'border-[#D5D3CA] dark:border-[#3E433B]'
                      }`}
                    >
                      {done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-xs font-medium text-[#20231F] dark:text-[#F4F3EE] truncate ${
                        done ? 'line-through text-[#92968E] dark:text-[#6E726A]' : ''
                      }`}
                    >
                      {habit.title}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-[#6B6F67] dark:text-[#A4A69F] shrink-0">
                    {habit.streak}d streak
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. All Scheduled Tasks */}
      <section aria-labelledby="section-today-tasks" className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2
            id="section-today-tasks"
            className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6F67] dark:text-[#A4A69F]"
          >
            All Scheduled ({todayTasks.length})
          </h2>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenAiModal}
              className="text-[11px] font-medium text-[#6467F5] hover:underline flex items-center gap-1 whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3" />
              Plan Day
            </button>
            <span className="text-[#D5D3CA] dark:text-[#3E433B]" aria-hidden="true">·</span>
            <button
              onClick={onOpenQuickCapture}
              className="text-[11px] font-medium text-[#6B6F67] dark:text-[#A4A69F] hover:text-[#20231F] dark:hover:text-[#F4F3EE] whitespace-nowrap"
            >
              Quick Drop
            </button>
          </div>
        </div>

        {filteredTodayTasks.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1D201B] border border-[#E8E7E0] dark:border-[#30332D] text-center flex flex-col items-center space-y-2 shadow-xs">
            <p className="text-xs font-medium text-[#20231F] dark:text-[#F4F3EE]">
              Your day is clear.
            </p>
            <p className="text-xs text-[#6B6F67] dark:text-[#A4A69F]">
              Capture a thought or add your first task.
            </p>
            <button
              onClick={onNavigateToInbox}
              className="mt-1 text-xs font-medium text-[#6467F5] hover:underline flex items-center gap-1"
            >
              View Inbox <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTodayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onSelect={onSelectTask}
                onStartFocus={handleStartTaskFocus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
