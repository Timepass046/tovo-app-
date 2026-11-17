import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Tag,
  ListTodo,
  Check,
  Plus,
  Trash2,
  Bell,
  Repeat,
  Sparkles,
  Archive,
  Layers,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, TaskBucket, TaskRecurrence } from '../../types';
import { useTasks } from '../../context/TaskContext';
import { aiService } from '../../services/ai/ai.service';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

const TaskDetailModalInner: React.FC<{ task: Task; onClose: () => void }> = ({ task, onClose }) => {
  const {
    updateTask,
    deleteTask,
    archiveTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTasks();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [bucket, setBucket] = useState<TaskBucket>(task.bucket);
  const [category, setCategory] = useState(task.category || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(task.estimatedMinutes);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [reminderAt, setReminderAt] = useState(task.reminderAt || '');
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(task.recurrence || 'none');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // AI Breakdown states
  const [isAiBreakingDown, setIsAiBreakingDown] = useState(false);
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<string[]>([]);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  const subtasks = task.subtasks || [];

  const handleSave = async () => {
    await updateTask(task.id, {
      title,
      description,
      priority,
      status,
      bucket,
      category,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      reminderAt: reminderAt || undefined,
      recurrence,
    });
    onClose();
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await addSubtask(task.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  // AI Subtask Breakdown using isolated aiService
  const handleAiBreakdown = async () => {
    setIsAiBreakingDown(true);
    try {
      const steps = await aiService.breakdownTask(title, description);
      if (steps.length > 0) {
        setSuggestedSubtasks(steps);
        setShowAiSuggestions(true);
      }
    } catch (e) {
      console.warn('AI breakdown failed:', e);
    } finally {
      setIsAiBreakingDown(false);
    }
  };

  const handleApplySuggestedSubtask = async (text: string) => {
    await addSubtask(task.id, text);
    setSuggestedSubtasks(prev => prev.filter(s => s !== text));
  };

  const handleApplyAllSuggestions = async () => {
    for (const text of suggestedSubtasks) {
      await addSubtask(task.id, text);
    }
    setSuggestedSubtasks([]);
    setShowAiSuggestions(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[92dvh] bg-white dark:bg-[#1C1F1B] rounded-t-2xl sm:rounded-2xl shadow-xl border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col overflow-hidden animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Task Detail
            </span>
            <span className="text-[#6B6F67] dark:text-[#9C9F97]">·</span>
            <span className="text-[#6B6F67] dark:text-[#9C9F97] capitalize">{bucket}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                archiveTask(task.id);
                onClose();
              }}
              className="p-1.5 text-[#6B6F67] hover:text-[#C47D14] dark:hover:text-[#DE9B35] rounded-md transition"
              title="Archive Task"
            >
              <Archive className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this task permanently?')) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              className="p-1.5 text-[#6B6F67] hover:text-[#C73E2E] dark:hover:text-[#E06C5E] rounded-md transition"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded-md transition ml-1"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full text-base sm:text-lg font-semibold text-[#20231F] dark:text-[#F2F1ED] bg-transparent border-b border-[#E8E7E0] dark:border-[#2C302A] pb-2 focus:border-[#303FCA] dark:focus:border-[#5263FA] outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
              Notes & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add links, context, or thoughts..."
              className="w-full text-xs text-[#20231F] dark:text-[#F2F1ED] bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-3 border border-[#E8E7E0] dark:border-[#2C302A] focus:border-[#303FCA] dark:focus:border-[#5263FA] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Segmented Priority Selector */}
          <div>
            <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#F7F6F2] dark:bg-[#242722] rounded-lg border border-[#E8E7E0] dark:border-[#2C302A]">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                const isSelected = priority === p;
                const dotColor =
                  p === 'high' ? 'bg-[#C73E2E]' : p === 'medium' ? 'bg-[#C47D14]' : 'bg-[#6B6F67]';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-[#1C1F1B] text-[#20231F] dark:text-[#F2F1ED] shadow-xs'
                        : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span className="capitalize">{p}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Bucket & Status */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
                Bucket
              </label>
              <select
                value={bucket}
                onChange={(e) => setBucket(e.target.value as TaskBucket)}
                className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              >
                <option value="inbox">Inbox</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="someday">Someday</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              >
                <option value="not_started">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Dates & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 stroke-[1.5]" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Bell className="w-3 h-3 stroke-[1.5]" /> Reminder
              </label>
              <input
                type="datetime-local"
                value={reminderAt ? reminderAt.substring(0, 16) : ''}
                onChange={(e) => setReminderAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full text-xs bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Repeat className="w-3 h-3 stroke-[1.5]" /> Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
                className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays (M-F)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="pt-3 border-t border-[#E8E7E0] dark:border-[#2C302A]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 stroke-[1.5]" />
                Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
              </label>

              {/* AI Decompose Button */}
              <button
                type="button"
                onClick={handleAiBreakdown}
                disabled={isAiBreakingDown}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 stroke-[1.75]" />
                {isAiBreakingDown ? 'Analyzing...' : 'Decompose with AI'}
              </button>
            </div>

            {/* AI Suggested Subtasks */}
            {showAiSuggestions && suggestedSubtasks.length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#303FCA] dark:text-[#5263FA]" />
                    Suggested Steps
                  </span>
                  <button
                    onClick={handleApplyAllSuggestions}
                    className="text-[11px] font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline"
                  >
                    Add All
                  </button>
                </div>
                <div className="space-y-1.5">
                  {suggestedSubtasks.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white dark:bg-[#1C1F1B] px-2.5 py-1.5 rounded-md border border-[#E8E7E0] dark:border-[#2C302A] text-xs text-[#20231F] dark:text-[#F2F1ED]"
                    >
                      <span className="truncate pr-2">{step}</span>
                      <button
                        onClick={() => handleApplySuggestedSubtask(step)}
                        className="text-xs font-medium text-[#303FCA] dark:text-[#5263FA] hover:opacity-80 p-0.5"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Subtasks */}
            <div className="space-y-1.5 mb-2.5">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0 text-xs"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition-all flex-shrink-0 ${
                        sub.completed
                          ? 'border-[#375336] bg-[#375336] text-white'
                          : 'border-[#6B6F67]/50 bg-transparent'
                      }`}
                    >
                      {sub.completed && <Check className="w-2.5 h-2.5 stroke-[2.5]" />}
                    </div>
                    <span
                      className={`truncate ${
                        sub.completed
                          ? 'line-through text-[#6B6F67] dark:text-[#9C9F97]'
                          : 'text-[#20231F] dark:text-[#F2F1ED]'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSubtask(task.id, sub.id)}
                    className="p-1 text-[#6B6F67] hover:text-[#C73E2E] dark:hover:text-[#E06C5E] rounded transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Subtask Input */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask step..."
                className="flex-1 text-xs px-2.5 py-1.5 bg-[#F7F6F2] dark:bg-[#242722] rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-1.5 bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-40 transition"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-5 pt-3.5 pb-[calc(0.875rem+var(--tovo-safe-bottom))] sm:py-3.5 bg-[#F7F6F2] dark:bg-[#242722] border-t border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#E8E7E0] dark:hover:bg-[#2C302A] rounded-lg transition whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-medium text-[#F7F6F2] dark:text-[#151714] bg-[#20231F] dark:bg-[#F2F1ED] hover:opacity-90 active:scale-[0.98] rounded-lg transition shadow-xs flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="w-3.5 h-3.5 stroke-[2]" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
  if (!task) return null;
  return <TaskDetailModalInner key={task.id} task={task} onClose={onClose} />;
};
