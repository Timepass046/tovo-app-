import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ListTodo,
  Calendar,
  Plus,
  Loader2,
  Check,
  CheckSquare,
  Square,
  Clock,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { TaskBucket, TaskPriority } from '../../types';
import { aiService } from '../../services/ai/ai.service';
import { BrandMark } from '../common/BrandLogo';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'braindump' | 'breakdown' | 'plan';
}

interface ExtractedTask {
  selected: boolean;
  title: string;
  description?: string;
  priority: TaskPriority;
  bucket: TaskBucket;
  category?: string;
  estimatedMinutes?: number;
  subtasks?: string[];
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'braindump',
}) => {
  const { tasks, createTask, addSubtask } = useTasks();

  const [mode, setMode] = useState<'braindump' | 'breakdown' | 'plan'>(initialMode);

  // Brain Dump States
  const [brainDumpText, setBrainDumpText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [brainDumpDone, setBrainDumpDone] = useState(false);

  // Daily Plan States
  const [planSummary, setPlanSummary] = useState('');
  const [planSlots, setPlanSlots] = useState<{ taskId: string; order: number; timeSlot: string; recommendation: string }[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  if (!isOpen) return null;

  // 1. Run Brain Dump using aiService
  const handleRunBrainDump = async () => {
    if (!brainDumpText.trim()) return;
    setIsAnalyzing(true);
    try {
      const proposed = await aiService.brainDump(brainDumpText);
      setExtractedTasks(
        proposed.map(t => ({
          selected: true,
          title: t.title,
          description: t.description || '',
          priority: t.priority,
          bucket: t.bucket,
          category: t.category || 'General',
          estimatedMinutes: t.estimatedMinutes || 25,
          subtasks: t.subtasks || [],
        }))
      );
    } catch (e) {
      console.warn('AI Brain dump failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirm and Create selected tasks
  const handleConfirmTasks = async () => {
    const selected = extractedTasks.filter(t => t.selected);
    for (const item of selected) {
      const created = await createTask({
        title: item.title,
        description: item.description,
        priority: item.priority,
        bucket: item.bucket,
        category: item.category,
        estimatedMinutes: item.estimatedMinutes,
      });

      if (item.subtasks && item.subtasks.length > 0) {
        for (const sub of item.subtasks) {
          await addSubtask(created.id, sub);
        }
      }
    }
    setBrainDumpDone(true);
    setTimeout(() => {
      onClose();
      setBrainDumpDone(false);
      setExtractedTasks([]);
      setBrainDumpText('');
    }, 700);
  };

  // 2. Run Daily Optimizer
  const handleRunDailyPlan = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => !t.archived && t.status !== 'completed' && (t.bucket === 'today' || (t.dueDate && t.dueDate.split('T')[0] === todayStr)));

    if (todayTasks.length === 0) {
      alert('No pending tasks scheduled for today to optimize. Add or schedule tasks first.');
      return;
    }

    setIsPlanning(true);
    try {
      const result = await aiService.optimizeDailyPlan(todayTasks);
      setPlanSummary(result.summary);
      setPlanSlots(result.plan);
    } catch (e) {
      console.warn('Plan optimizer failed:', e);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl max-h-[90dvh] bg-white dark:bg-[#1C1F1B] rounded-t-2xl sm:rounded-2xl shadow-xl border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col overflow-hidden animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] text-[#303FCA] dark:text-[#5263FA] flex items-center justify-center shrink-0">
              <BrandMark size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED] truncate">
                Intelligent Architect
              </h2>
              <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] truncate">
                Assisted task decomposition and daily scheduling
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Selector */}
        <div className="px-4 sm:px-5 pt-3 pb-2 flex gap-2 border-b border-[#E8E7E0] dark:border-[#2C302A] text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setMode('braindump')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
              mode === 'braindump'
                ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
            }`}
          >
            Brain Dump to Actions
          </button>
          <button
            onClick={() => setMode('plan')}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap shrink-0 ${
              mode === 'plan'
                ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
            }`}
          >
            Schedule Optimizer
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 pb-[calc(1.25rem+var(--tovo-safe-bottom))] sm:pb-5 overflow-y-auto space-y-4 flex-1">
          {mode === 'braindump' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1.5">
                  Raw stream of thoughts or meeting notes
                </label>
                <textarea
                  rows={4}
                  value={brainDumpText}
                  onChange={(e) => setBrainDumpText(e.target.value)}
                  placeholder="e.g. Need to renew car registration by next Tuesday, draft slides for client review tomorrow, buy ground coffee, and book dentist..."
                  className="w-full text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] bg-[#F7F6F2] dark:bg-[#242722] rounded-xl p-3 border border-[#E8E7E0] dark:border-[#2C302A] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRunBrainDump}
                  disabled={isAnalyzing || !brainDumpText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] disabled:opacity-40 text-xs font-medium transition shadow-xs"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing structure...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 stroke-[1.75]" />
                      Extract Distinct Tasks
                    </>
                  )}
                </button>
              </div>

              {/* Extracted Tasks Preview */}
              {extractedTasks.length > 0 && (
                <div className="pt-3 border-t border-[#E8E7E0] dark:border-[#2C302A] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED]">
                      Review Proposals ({extractedTasks.filter(t => t.selected).length}/{extractedTasks.length} selected)
                    </span>
                    <button
                      onClick={() =>
                        setExtractedTasks(prev =>
                          prev.map(t => ({ ...t, selected: !prev.every(x => x.selected) }))
                        )
                      }
                      className="text-[11px] font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline"
                    >
                      Toggle All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {extractedTasks.map((task, idx) => (
                      <div
                        key={idx}
                        onClick={() =>
                          setExtractedTasks(prev =>
                            prev.map((t, i) => (i === idx ? { ...t, selected: !t.selected } : t))
                          )
                        }
                        className={`p-3 rounded-lg border transition cursor-pointer flex items-start gap-3 ${
                          task.selected
                            ? 'bg-white dark:bg-[#1C1F1B] border-[#303FCA]/40 dark:border-[#5263FA]/40 shadow-xs'
                            : 'bg-[#F7F6F2] dark:bg-[#242722] border-[#E8E7E0] dark:border-[#2C302A] opacity-50'
                        }`}
                      >
                        <div className="mt-0.5">
                          {task.selected ? (
                            <CheckSquare className="w-4 h-4 text-[#303FCA] dark:text-[#5263FA]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#6B6F67]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED]">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#6B6F67] dark:text-[#9C9F97]">
                            <span className="uppercase font-medium text-[#20231F] dark:text-[#F2F1ED]">
                              {task.priority} priority
                            </span>
                            <span>·</span>
                            <span className="capitalize">{task.bucket}</span>
                            <span>·</span>
                            <span>{task.category}</span>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{task.subtasks.length} subtasks</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleConfirmTasks}
                      disabled={extractedTasks.filter(t => t.selected).length === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#375336] text-white hover:bg-[#2F472E] text-xs font-medium shadow-xs transition disabled:opacity-40"
                    >
                      {brainDumpDone ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2]" />
                          Created!
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[2]" />
                          Create {extractedTasks.filter(t => t.selected).length} Tasks
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Daily Plan Optimizer */
            <div className="space-y-4">
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
                Evaluates today's pending tasks, priorities, and estimated times to suggest a sequential flow matching focus energy curves.
              </p>

              <button
                onClick={handleRunDailyPlan}
                disabled={isPlanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium transition shadow-xs disabled:opacity-40"
              >
                {isPlanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Calculating Schedule...
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
                    Generate Schedule Recommendation
                  </>
                )}
              </button>

              {planSummary && (
                <div className="p-3.5 rounded-lg bg-[#F0F4EE] dark:bg-[#1D241C] border border-[#D8E2D4] dark:border-[#2A3528] text-xs text-[#20231F] dark:text-[#F2F1ED] leading-relaxed">
                  <span className="font-semibold text-[#375336] dark:text-[#DCE7DB]">Strategy: </span>
                  {planSummary}
                </div>
              )}

              {planSlots.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
                    Recommended Agenda
                  </h4>
                  {planSlots.map((slot, i) => {
                    const task = tasks.find(t => t.id === slot.taskId);
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex items-start gap-3"
                      >
                        <span className="w-5 h-5 rounded-md bg-[#F7F6F2] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED] font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {slot.order}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h5 className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] truncate min-w-0">
                              {task ? task.title : 'Task'}
                            </h5>
                            <span className="text-[11px] font-mono text-[#303FCA] dark:text-[#5263FA] whitespace-nowrap shrink-0">
                              {slot.timeSlot}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                            {slot.recommendation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
