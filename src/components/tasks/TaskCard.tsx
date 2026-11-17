import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Play,
  MoreHorizontal,
  Trash2,
  Archive,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskBucket } from '../../types';
import { useTasks } from '../../context/TaskContext';

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  onStartFocus?: (taskId: string, minutes?: number) => void;
}

const PRIORITY_META: Record<TaskPriority, { label: string; dotClass: string }> = {
  high: { label: 'High', dotClass: 'bg-[#C73E2E] dark:bg-[#E05445]' },
  medium: { label: 'Med', dotClass: 'bg-[#C47D14] dark:bg-[#DE932A]' },
  low: { label: 'Low', dotClass: 'bg-[#92968E] dark:bg-[#6E726A]' },
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  completed: 'Done',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onStartFocus,
}) => {
  const {
    toggleTaskStatus,
    updateTask,
    deleteTask,
    archiveTask,
    moveTaskBucket,
    toggleSubtask,
  } = useTasks();

  const [expandedSubtasks, setExpandedSubtasks] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isCompleted = task.status === 'completed';
  const subtasks = task.subtasks || [];
  const completedSubtasksCount = subtasks.filter(s => s.completed).length;

  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || isCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate.split('T')[0] < today;
  }, [task.dueDate, isCompleted]);

  const formattedDueDate = React.useMemo(() => {
    if (!task.dueDate) return null;
    try {
      const d = new Date(task.dueDate);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return 'Today';
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  }, [task.dueDate]);

  // Cycle status: not_started -> in_progress -> completed
  const handleCycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const order: TaskStatus[] = ['not_started', 'in_progress', 'completed'];
    const currentIdx = order.indexOf(task.status);
    const nextStatus = order[(currentIdx + 1) % order.length];
    updateTask(task.id, { status: nextStatus });
  };

  return (
    <div
      onClick={() => onSelect(task)}
      className={`group relative bg-[#FFFFFF] dark:bg-[#1C1F1B] rounded-xl border transition-all duration-150 p-3.5 cursor-pointer select-none ${
        isCompleted
          ? 'border-[#E8E7E0] dark:border-[#2C302A] opacity-60 bg-[#FDFCFA] dark:bg-[#171916]'
          : 'border-[#E8E7E0] dark:border-[#2C302A] hover:border-[#D5D3CA] dark:hover:border-[#3E433B] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Minimal Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskStatus(task.id);
          }}
          className="mt-0.5 text-[#92968E] dark:text-[#6E726A] hover:text-[#303FCA] dark:hover:text-[#5263FA] transition-colors focus:outline-none flex-shrink-0"
          aria-label={isCompleted ? 'Mark not completed' : 'Mark completed'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-[#2E7D32] dark:text-[#43A047] fill-[#EDF7EE] dark:fill-[#162618]" />
          ) : (
            <Circle className="w-4.5 h-4.5 hover:stroke-[2]" />
          )}
        </button>

        {/* Core Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-[14px] font-medium tracking-tight text-[#20231F] dark:text-[#F2F1ED] line-clamp-2 min-w-0 flex-1 ${
                isCompleted ? 'line-through text-[#92968E] dark:text-[#6E726A]' : ''
              }`}
            >
              {task.title}
            </h3>

            {/* Status indicator button */}
            <button
              onClick={handleCycleStatus}
              className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors shrink-0 whitespace-nowrap ${
                task.status === 'in_progress'
                  ? 'bg-[#EEF0FD] dark:bg-[#1D234A] text-[#303FCA] dark:text-[#5263FA]'
                  : task.status === 'blocked'
                  ? 'bg-[#FDF1EF] dark:bg-[#2E1917] text-[#C73E2E] dark:text-[#E05445]'
                  : isCompleted
                  ? 'text-[#6B6F67] dark:text-[#9C9F97]'
                  : 'text-[#92968E] dark:text-[#6E726A] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
              }`}
              title="Click to advance status"
            >
              {STATUS_LABELS[task.status]}
            </button>
          </div>

          {/* Optional Short Description */}
          {task.description && !isCompleted && (
            <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}

          {/* Clean Unboxed Metadata Row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
            {/* Priority Dot & Label */}
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[task.priority].dotClass}`} />
              <span className="capitalize">{PRIORITY_META[task.priority].label}</span>
            </span>

            {/* Category */}
            {task.category && (
              <>
                <span className="text-[#D5D3CA] dark:text-[#3E433B]" aria-hidden="true">·</span>
                <span>{task.category}</span>
              </>
            )}

            {/* Due Date */}
            {formattedDueDate && (
              <>
                <span className="text-[#D5D3CA] dark:text-[#3E433B]" aria-hidden="true">·</span>
                <span className={isOverdue ? 'text-[#C73E2E] dark:text-[#E05445] font-semibold' : ''}>
                  {formattedDueDate}
                </span>
              </>
            )}

            {/* Estimated Duration */}
            {task.estimatedMinutes && (
              <>
                <span className="text-[#D5D3CA] dark:text-[#3E433B]" aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{task.estimatedMinutes}m</span>
              </>
            )}

            {/* Subtask count */}
            {subtasks.length > 0 && (
              <>
                <span className="text-[#D5D3CA] dark:text-[#3E433B]" aria-hidden="true">·</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedSubtasks(!expandedSubtasks);
                  }}
                  className="inline-flex items-center gap-1 hover:text-[#20231F] dark:hover:text-[#F2F1ED] font-mono tabular-nums"
                >
                  <span>{completedSubtasksCount}/{subtasks.length} steps</span>
                  {expandedSubtasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </>
            )}
          </div>

          {/* Micro Progress Line for Subtasks */}
          {subtasks.length > 0 && !isCompleted && (
            <div className="w-full h-1 bg-[#EFEFE9] dark:bg-[#2A2E28] rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-[#303FCA] dark:bg-[#5263FA] transition-all duration-300"
                style={{ width: `${(completedSubtasksCount / subtasks.length) * 100}%` }}
              />
            </div>
          )}

          {/* Expandable Subtasks Checklist */}
          {expandedSubtasks && subtasks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#E8E7E0] dark:border-[#2C302A] space-y-1.5" onClick={(e) => e.stopPropagation()}>
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => toggleSubtask(task.id, sub.id)}
                  className="flex items-center gap-2 py-0.5 text-xs text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] cursor-pointer"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                      sub.completed
                        ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
                        : 'border-[#D5D3CA] dark:border-[#3E433B]'
                    }`}
                  >
                    {sub.completed && <CheckCircle2 className="w-3 h-3 fill-current" />}
                  </div>
                  <span className={sub.completed ? 'line-through text-[#92968E] dark:text-[#6E726A]' : ''}>
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hover / Context Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 opacity-85 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onStartFocus && !isCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartFocus(task.id, task.estimatedMinutes);
              }}
              className="p-1.5 text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#303FCA] dark:hover:text-[#5263FA] hover:bg-[#EEF0FD] dark:hover:bg-[#1D234A] rounded-md transition"
              title="Start focus timer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-[#92968E] dark:text-[#6E726A] hover:text-[#20231F] dark:hover:text-[#F2F1ED] hover:bg-[#EFEFE9] dark:hover:bg-[#242722] rounded-md transition"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl bg-[#FFFFFF] dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] shadow-xl p-1.5 z-30 text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bucket moves */}
                <div className="px-2 py-1 text-[10px] uppercase font-semibold text-[#92968E] dark:text-[#6E726A]">
                  Move to
                </div>
                {task.bucket !== 'today' && (
                  <button
                    onClick={() => {
                      moveTaskBucket(task.id, 'today');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#EFEFE9] dark:hover:bg-[#242722] rounded text-[#20231F] dark:text-[#F2F1ED]"
                  >
                    <span>Today</span>
                    <ArrowRight className="w-3 h-3 text-[#92968E]" />
                  </button>
                )}
                {task.bucket !== 'inbox' && (
                  <button
                    onClick={() => {
                      moveTaskBucket(task.id, 'inbox');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#EFEFE9] dark:hover:bg-[#242722] rounded text-[#20231F] dark:text-[#F2F1ED]"
                  >
                    <span>Inbox</span>
                    <ArrowRight className="w-3 h-3 text-[#92968E]" />
                  </button>
                )}
                {task.bucket !== 'someday' && (
                  <button
                    onClick={() => {
                      moveTaskBucket(task.id, 'someday');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-[#EFEFE9] dark:hover:bg-[#242722] rounded text-[#20231F] dark:text-[#F2F1ED]"
                  >
                    <span>Someday</span>
                    <ArrowRight className="w-3 h-3 text-[#92968E]" />
                  </button>
                )}

                <div className="h-px bg-[#E8E7E0] dark:border-[#2C302A] my-1" />

                <button
                  onClick={() => {
                    archiveTask(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#EFEFE9] dark:hover:bg-[#242722] rounded text-[#6B6F67] dark:text-[#9C9F97]"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>

                <button
                  onClick={() => {
                    deleteTask(task.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-[#FDF1EF] dark:hover:bg-[#2E1917] rounded text-[#C73E2E] dark:text-[#E05445]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
