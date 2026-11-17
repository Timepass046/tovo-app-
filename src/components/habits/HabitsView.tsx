import React, { useState } from 'react';
import {
  Plus,
  Check,
  Sparkles,
  Droplet,
  BookOpen,
  Dumbbell,
  Heart,
  Smile,
  Coffee,
  X,
  Trash2,
  Calendar,
  Compass,
  Flame,
  Award,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useTasks, getTodayKey } from '../../context/TaskContext';
import { HabitFrequency } from '../../types';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Droplet,
  BookOpen,
  Dumbbell,
  Heart,
  Smile,
  Coffee,
  Sparkles,
  Compass,
};

// Milestones for habit consistency and mastery
interface HabitMilestone {
  target: number;
  label: string;
}

const MILESTONES: HabitMilestone[] = [
  { target: 7, label: '7-Day Starter' },
  { target: 14, label: '14-Day Consistency' },
  { target: 21, label: '21-Day Ritual' },
  { target: 30, label: '30-Day Momentum' },
  { target: 50, label: '50-Day Pillar' },
  { target: 100, label: '100-Day Master' },
  { target: 365, label: 'Yearly Legend' },
];

function getNextMilestone(total: number): {
  currentTarget: number;
  prevTarget: number;
  label: string;
  progressPercent: number;
} {
  const current = MILESTONES.find(m => m.target > total);
  if (!current) {
    const nextHundreds = (Math.floor(total / 100) + 1) * 100;
    const prevHundreds = nextHundreds - 100;
    const progressPercent = Math.min(100, Math.round(((total - prevHundreds) / 100) * 100));
    return {
      currentTarget: nextHundreds,
      prevTarget: prevHundreds,
      label: `${nextHundreds}-Day Milestone`,
      progressPercent,
    };
  }

  const idx = MILESTONES.indexOf(current);
  const prevTarget = idx === 0 ? 0 : MILESTONES[idx - 1].target;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((total - prevTarget) / (current.target - prevTarget)) * 100))
  );

  return {
    currentTarget: current.target,
    prevTarget,
    label: current.label,
    progressPercent,
  };
}

// Past 7 days calculation helper for habit dot history
function getPast7Days(): { dateStr: string; label: string; isToday: boolean }[] {
  const days: { dateStr: string; label: string; isToday: boolean }[] = [];
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      label: dayLabels[d.getDay()],
      isToday: i === 0,
    });
  }
  return days;
}

export const HabitsView: React.FC = () => {
  const {
    habits,
    habitLogs,
    createHabit,
    deleteHabit,
    toggleHabitToday,
    isHabitCompletedToday,
  } = useTasks();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('Droplet');
  const [newFrequency, setNewFrequency] = useState<HabitFrequency>('daily');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const todayKey = getTodayKey();
  const completedTodayCount = habits.filter(h => isHabitCompletedToday(h.id)).length;
  const past7Days = getPast7Days();

  // Aggregate workspace metrics
  const totalAllTimeCompletions = habitLogs.filter(l => l.completed).length;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak), 0) : 0;

  const filteredHabits = habits.filter(habit => {
    const isDone = isHabitCompletedToday(habit.id);
    if (filter === 'pending') return !isDone;
    if (filter === 'completed') return isDone;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createHabit({
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      icon: newIcon,
      color: 'sage',
      frequency: newFrequency,
    });

    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-4">
      {/* Editorial Header */}
      <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-end justify-between gap-3 border-b border-[#E8E7E0] dark:border-[#2C302A] pb-4 sm:pb-5">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Routines & Flow
          </span>
          <h1 className="text-[22px] sm:text-3xl font-semibold tracking-tight leading-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
            Daily Habits
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1 leading-relaxed">
            Track current streaks and total completion milestones with calm consistency.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 active:scale-[0.98] transition shadow-xs whitespace-nowrap shrink-0 self-start min-[380px]:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2] shrink-0" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-2.5 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col justify-between min-w-0">
          <span className="text-[9.5px] sm:text-[10px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] leading-tight">
            Today
          </span>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 flex-wrap">
            <span className="text-lg sm:text-xl font-semibold text-[#20231F] dark:text-[#F2F1ED] tabular-nums font-mono">
              {completedTodayCount}
            </span>
            <span className="text-[11px] sm:text-xs text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">/ {habits.length}</span>
          </div>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col justify-between min-w-0">
          <span className="text-[9.5px] sm:text-[10px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] leading-tight">
            Best Streak
          </span>
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C47D14] dark:text-[#DE932A] fill-current shrink-0" />
            <span className="text-lg sm:text-xl font-semibold text-[#20231F] dark:text-[#F2F1ED] tabular-nums font-mono">
              {longestStreak}
            </span>
            <span className="text-[11px] sm:text-xs text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">days</span>
          </div>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col justify-between min-w-0">
          <span className="text-[9.5px] sm:text-[10px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] leading-tight">
            History
          </span>
          <div className="mt-1.5 sm:mt-2 flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#303FCA] dark:text-[#5263FA] shrink-0" />
            <span className="text-lg sm:text-xl font-semibold text-[#20231F] dark:text-[#F2F1ED] tabular-nums font-mono">
              {totalAllTimeCompletions}
            </span>
            <span className="text-[11px] sm:text-xs text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap">drops</span>
          </div>
        </div>
      </div>

      {/* Gentle Non-Judgmental Reinforcement Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#F0F4EE] dark:bg-[#1D241C] border border-[#D8E2D4] dark:border-[#2A3528] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#375336]/10 dark:bg-[#DCE7DB]/15 text-[#375336] dark:text-[#DCE7DB] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Every drop counts. Missed yesterday?
            </h4>
            <p className="text-[11px] text-[#4F684E] dark:text-[#A7BAA4] mt-0.5">
              No broken chains, no guilt. Today is an immediate fresh opportunity.
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0 hidden sm:block">
          <span className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED] tabular-nums font-mono">
            {completedTodayCount} of {habits.length}
          </span>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[#375336] dark:text-[#DCE7DB]">
            Done Today
          </p>
        </div>
      </div>

      {/* Segmented Filter */}
      {habits.length > 0 && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="inline-flex max-w-full overflow-x-auto scrollbar-none p-1 bg-white dark:bg-[#1C1F1B] rounded-lg border border-[#E8E7E0] dark:border-[#2C302A]">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap shrink-0 ${
                filter === 'all'
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] shadow-xs'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
              }`}
            >
              All ({habits.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap shrink-0 ${
                filter === 'pending'
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] shadow-xs'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
              }`}
            >
              Pending ({habits.length - completedTodayCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap shrink-0 ${
                filter === 'completed'
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] shadow-xs'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
              }`}
            >
              Done Today ({completedTodayCount})
            </button>
          </div>

          <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] hidden sm:inline whitespace-nowrap">
            Tap check-in to log today's drop
          </span>
        </div>
      )}

      {/* Habits List */}
      {habits.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] p-8 flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] text-[#6B6F67] dark:text-[#9C9F97] flex items-center justify-center mb-3">
            <Compass className="w-5 h-5 stroke-[1.75]" />
          </div>
          <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
            No habits yet
          </h3>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] max-w-sm mt-1 mb-4 leading-relaxed">
            Build calm routines like morning journaling, 20 minutes of reading, or a short walk away from screens.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 transition"
          >
            Create Your First Habit
          </button>
        </div>
      ) : filteredHabits.length === 0 ? (
        <div className="py-12 text-center rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] p-6">
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            {filter === 'pending'
              ? 'All habits completed for today! Great momentum.'
              : 'No habits completed yet today. Check one in below!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHabits.map((habit) => {
            const isDone = isHabitCompletedToday(habit.id);
            const IconComponent = ICON_MAP[habit.icon || 'Droplet'] || Droplet;

            // Total completions logged all-time for this habit
            const totalCompletions = habitLogs.filter(
              l => l.habitId === habit.id && l.completed
            ).length;

            // Milestone progress calculation
            const milestone = getNextMilestone(totalCompletions);

            return (
              <div
                key={habit.id}
                className={`group p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border transition-all ${
                  isDone
                    ? 'border-[#375336]/30 dark:border-[#375336]/40 shadow-xs'
                    : 'border-[#E8E7E0] dark:border-[#2C302A] hover:border-[#D0CFCE] dark:hover:border-[#3A3F37]'
                }`}
              >
                {/* 1. Header Row: Icon, Title, Streak Badges & Check-in Action */}
                <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] text-[#375336] dark:text-[#DCE7DB] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <IconComponent className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[1.75]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED] break-words">
                          {habit.title}
                        </h3>

                        {/* Current Streak Number Badge */}
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium font-mono tabular-nums whitespace-nowrap shrink-0 ${
                            habit.streak > 0
                              ? 'bg-[#FCF5EB] dark:bg-[#2B2113] text-[#C47D14] dark:text-[#DE932A] border border-[#F3E2CA] dark:border-[#3D2E1A]'
                              : 'bg-[#F7F6F2] dark:bg-[#242722] text-[#6B6F67] dark:text-[#9C9F97] border border-[#E8E7E0] dark:border-[#2C302A]'
                          }`}
                          title={`Current streak: ${habit.streak} days`}
                        >
                          <Flame
                            className={`w-3.5 h-3.5 ${
                              habit.streak > 0 ? 'fill-current' : 'opacity-60'
                            }`}
                          />
                          <span className="font-semibold">{habit.streak}</span>
                          <span className="text-[10px] font-sans uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
                            {habit.streak === 1 ? 'day' : 'days'}
                          </span>
                        </div>

                        {/* Best Streak Badge */}
                        {habit.bestStreak > 0 && (
                          <div
                            className="inline-flex items-center gap-1 text-[11px] text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap shrink-0"
                            title={`Personal best: ${habit.bestStreak} days`}
                          >
                            <Award className="w-3.5 h-3.5 text-[#6B6F67] dark:text-[#9C9F97]" />
                            <span className="font-mono text-[10px]">
                              Best: {habit.bestStreak}d
                            </span>
                          </div>
                        )}
                      </div>

                      {habit.description && (
                        <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] line-clamp-2 mt-1">
                          {habit.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Top Right Actions */}
                  <div className="flex items-center justify-end gap-1.5 flex-shrink-0 self-end min-[380px]:self-auto">
                    <button
                      onClick={() => toggleHabitToday(habit.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] whitespace-nowrap ${
                        isDone
                          ? 'bg-[#375336] text-white hover:bg-[#2F472E]'
                          : 'bg-[#F7F6F2] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] border border-[#E8E7E0] dark:border-[#2C302A]'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 stroke-[2] shrink-0 ${
                          isDone ? 'text-white' : 'text-[#6B6F67] dark:text-[#9C9F97]'
                        }`}
                      />
                      <span>{isDone ? 'Completed' : 'Check In'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete habit "${habit.title}"?`)) {
                          deleteHabit(habit.id);
                        }
                      }}
                      className="p-2 text-[#6B6F67] hover:text-[#C73E2E] dark:hover:text-[#E06C5E] rounded-md transition opacity-75 group-hover:opacity-100"
                      title="Delete habit"
                      aria-label={`Delete ${habit.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                </div>

                {/* 2. Visual Progress Indicator for Total Completion History */}
                <div className="mt-4 pt-3.5 border-t border-[#E8E7E0]/70 dark:border-[#2C302A]/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#303FCA] dark:text-[#5263FA]" />
                        Total History:
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] tabular-nums">
                        {totalCompletions}{' '}
                        <span className="font-sans font-normal text-[#6B6F67] dark:text-[#9C9F97]">
                          {totalCompletions === 1 ? 'total check-in' : 'total check-ins'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
                      <span className="flex items-center gap-1 font-medium text-[#20231F] dark:text-[#F2F1ED]">
                        <Target className="w-3 h-3 text-[#303FCA] dark:text-[#5263FA]" />
                        {milestone.label}
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums text-[#303FCA] dark:text-[#5263FA] font-medium">
                        {milestone.progressPercent}% ({totalCompletions}/{milestone.currentTarget})
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="relative w-full h-2 rounded-full bg-[#EFEFE9] dark:bg-[#242722] overflow-hidden border border-[#E8E7E0] dark:border-[#2C302A]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#303FCA] to-[#5263FA] transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(milestone.progressPercent, totalCompletions > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>

                  {/* Footnote milestone marks and 7-day dot strip row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-2 text-[10px] text-[#92968E] dark:text-[#6E726A]">
                    <div className="flex items-center gap-1 font-mono">
                      <span>Level: {milestone.prevTarget}d</span>
                      <span>→</span>
                      <span className="font-medium text-[#20231F] dark:text-[#F2F1ED]">
                        Next Goal: {milestone.currentTarget} total check-ins
                      </span>
                    </div>

                    {/* 7-day mini dot history strip */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto" title="Last 7 days check-in history">
                      <span className="text-[10px] uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mr-1">
                        7-Day:
                      </span>
                      {past7Days.map((day) => {
                        const dayDone =
                          habitLogs.some(
                            l => l.habitId === habit.id && l.date === day.dateStr && l.completed
                          ) ||
                          (day.isToday && isDone);

                        return (
                          <div
                            key={day.dateStr}
                            className="flex flex-col items-center gap-0.5"
                          >
                            <span className="text-[9px] text-[#6B6F67]/70 dark:text-[#9C9F97]/70 font-mono">
                              {day.label}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                dayDone
                                  ? 'bg-[#375336] dark:bg-[#DCE7DB] text-white dark:text-[#151714]'
                                  : day.isToday
                                  ? 'border border-dashed border-[#303FCA] dark:border-[#5263FA]'
                                  : 'border border-[#E8E7E0] dark:border-[#2C302A] bg-transparent'
                              }`}
                            >
                              {dayDone && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Habit Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#1C1F1B] rounded-t-2xl sm:rounded-2xl shadow-xl border border-[#E8E7E0] dark:border-[#2C302A] p-4 sm:p-5 pb-[calc(1.25rem+var(--tovo-safe-bottom))] sm:pb-5 flex flex-col gap-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E7E0] dark:border-[#2C302A]">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B6F67] dark:text-[#9C9F97]">
                  New Routine
                </span>
                <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                  Create Daily Habit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
                Habit Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Read 20 pages, Morning hydration..."
                required
                autoFocus
                className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
                Intention / Why It Matters (Optional)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Clear head before starting deep work"
                className="w-full text-xs bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
                Symbol
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {Object.keys(ICON_MAP).map((iconKey) => {
                  const Comp = ICON_MAP[iconKey];
                  const isSelected = newIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setNewIcon(iconKey)}
                      className={`p-2 rounded-lg border transition ${
                        isSelected
                          ? 'border-[#303FCA] dark:border-[#5263FA] bg-[#303FCA]/5 dark:bg-[#5263FA]/10 text-[#303FCA] dark:text-[#5263FA]'
                          : 'border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
                      }`}
                    >
                      <Comp className="w-4 h-4 stroke-[1.75]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
                Frequency
              </label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as HabitFrequency)}
                className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              >
                <option value="daily">Every Day</option>
                <option value="weekdays">Weekdays (Monday – Friday)</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E7E0] dark:border-[#2C302A]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 disabled:opacity-40 transition shadow-xs"
              >
                Create Habit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
