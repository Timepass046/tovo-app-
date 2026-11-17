import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Plus,
  Sparkles,
  ArrowRight,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { Task, TaskBucket, TaskPriority } from '../../types';
import { TaskCard } from '../tasks/TaskCard';

interface InboxViewProps {
  onSelectTask: (task: Task) => void;
  onOpenAiBrainDump: () => void;
}

type FilterTab = 'inbox' | 'unprocessed' | 'someday' | 'archived';

export const InboxView: React.FC<InboxViewProps> = ({
  onSelectTask,
  onOpenAiBrainDump,
}) => {
  const {
    tasks,
    quickCapture,
    moveTaskBucket,
    archiveTask,
    restoreTask,
    deleteTask,
    updateTask,
    searchQuery,
  } = useTasks();

  const [inputNote, setInputNote] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('inbox');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);

  const toggleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported on this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputNote(prev => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.start();
      setIsListening(true);
    }
  };

  const handleQuickDrop = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputNote.trim()) return;
    await quickCapture(inputNote.trim(), 'inbox', 'medium');
    setInputNote('');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    // Search query filter
    if (searchQuery) {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Category filter
    if (selectedTag && t.category !== selectedTag && !t.tags?.includes(selectedTag)) {
      return false;
    }

    if (filterTab === 'archived') {
      return t.archived;
    }

    if (t.archived) return false;

    if (filterTab === 'inbox') {
      return t.bucket === 'inbox';
    }

    if (filterTab === 'unprocessed') {
      return (
        t.bucket === 'inbox' &&
        (!t.subtasks || t.subtasks.length === 0) &&
        !t.dueDate &&
        t.status !== 'completed'
      );
    }

    if (filterTab === 'someday') {
      return t.bucket === 'someday';
    }

    return true;
  });

  const activeInboxCount = tasks.filter(t => t.bucket === 'inbox' && !t.archived).length;

  return (
    <div className="space-y-5 sm:space-y-6 pb-4 animate-in fade-in duration-200">
      {/* 1. Header & AI Assist Link */}
      <div className="flex flex-col min-[340px]:flex-row min-[340px]:items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] sm:text-3xl font-semibold tracking-tight leading-tight text-[#20231F] dark:text-[#F2F1ED]">
            Your Inbox
          </h1>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1">
            {activeInboxCount} {activeInboxCount === 1 ? 'thought' : 'thoughts'} waiting to be organized.
          </p>
        </div>

        <button
          onClick={onOpenAiBrainDump}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF0FD] dark:bg-[#1D234A] text-[#303FCA] dark:text-[#5263FA] hover:opacity-90 text-xs font-medium whitespace-nowrap shrink-0 self-start min-[340px]:self-auto transition active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Brain Dump</span>
        </button>
      </div>

      {/* 2. Effortless Quick Capture Input Box */}
      <div className="bg-[#FFFFFF] dark:bg-[#1C1F1B] rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] focus-within:border-[#303FCA] dark:focus-within:border-[#5263FA] transition-colors">
        <textarea
          value={inputNote}
          onChange={(e) => setInputNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuickDrop();
            }
          }}
          placeholder="What's on your mind? Jot down an idea or task and press Enter..."
          rows={2}
          className="w-full text-xs text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] dark:placeholder-[#6E726A] bg-transparent resize-none focus:outline-none"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#E8E7E0] dark:border-[#2C302A] mt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                isListening
                  ? 'bg-[#FDF1EF] text-[#C73E2E] dark:bg-[#2E1917] dark:text-[#E05445]'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] hover:bg-[#EFEFE9] dark:hover:bg-[#242722]'
              }`}
              title="Voice dictation"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
            </button>
          </div>

          <button
            onClick={() => handleQuickDrop()}
            disabled={!inputNote.trim()}
            className="px-3 py-1 rounded-md bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:bg-[#303FCA] dark:hover:bg-[#5263FA] hover:text-white dark:hover:text-white text-xs font-medium transition disabled:opacity-30 disabled:pointer-events-none"
          >
            Capture
          </button>
        </div>
      </div>

      {/* 3. Segmented Filter Controls */}
      <div className="flex items-center justify-between gap-2 border-b border-[#E8E7E0] dark:border-[#2C302A] pb-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1 py-0.5">
          <button
            onClick={() => setFilterTab('inbox')}
            className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'inbox'
                ? 'bg-[#EFEFE9] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setFilterTab('unprocessed')}
            className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'unprocessed'
                ? 'bg-[#EFEFE9] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
            }`}
          >
            Unprocessed
          </button>
          <button
            onClick={() => setFilterTab('someday')}
            className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'someday'
                ? 'bg-[#EFEFE9] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
            }`}
          >
            Someday
          </button>
          <button
            onClick={() => setFilterTab('archived')}
            className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
              filterTab === 'archived'
                ? 'bg-[#EFEFE9] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
            }`}
          >
            Archive
          </button>
        </div>

        <span className="text-[11px] text-[#92968E] dark:text-[#6E726A] font-mono tabular-nums whitespace-nowrap shrink-0">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* 4. Thought & Task Rows */}
      {filteredTasks.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-[#FFFFFF] dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] p-6 flex flex-col items-center">
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            {filterTab === 'archived'
              ? 'No archived items.'
              : 'Your inbox is clear. All thoughts processed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <div key={task.id} className="relative group">
              <TaskCard task={task} onSelect={onSelectTask} />

              {/* Quick Triage Actions on Inbox Items (Today / Archive) */}
              {filterTab === 'inbox' && !task.archived && (
                <div className="absolute right-12 top-3 hidden sm:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTaskBucket(task.id, 'today');
                    }}
                    className="px-2 py-1 rounded bg-[#EFEFE9] dark:bg-[#242722] hover:bg-[#EEF0FD] dark:hover:bg-[#1D234A] text-[11px] font-medium text-[#20231F] dark:text-[#F2F1ED] hover:text-[#303FCA] dark:hover:text-[#5263FA] transition flex items-center gap-1"
                    title="Move to Today"
                  >
                    <span>To Today</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Restore Action on Archived Items */}
              {filterTab === 'archived' && (
                <div className="mt-1.5 flex justify-end px-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreTask(task.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#303FCA] dark:text-[#5263FA] bg-[#EEF0FD] dark:bg-[#1D234A] hover:opacity-90 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
