import React from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  Target,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

interface FocusSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusSessionModal: React.FC<FocusSessionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tasks,
    focusActive,
    focusPaused,
    focusSecondsLeft,
    focusTotalSeconds,
    focusLinkedTaskId,
    pauseFocusSession,
    resumeFocusSession,
    resetFocusSession,
    toggleTaskStatus,
    preferences,
    updatePreferences,
  } = useTasks();

  if (!isOpen) return null;

  const linkedTask = tasks.find(t => t.id === focusLinkedTaskId);

  // Minutes and seconds formatting
  const mins = Math.floor(focusSecondsLeft / 60);
  const secs = focusSecondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Progress percentage
  const progressPercent = focusTotalSeconds > 0
    ? ((focusTotalSeconds - focusSecondsLeft) / focusTotalSeconds) * 100
    : 0;

  // SVG circular stroke calculation
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const toggleSound = () => {
    updatePreferences({ soundEnabled: !preferences.soundEnabled });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#1C1F1B] rounded-2xl shadow-xl border border-[#E8E7E0] dark:border-[#2C302A] p-5 sm:p-6 flex flex-col items-center text-center animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-[#E8E7E0] dark:border-[#2C302A]">
          <button
            onClick={toggleSound}
            className="p-1.5 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded-md transition"
            title={preferences.soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
          >
            {preferences.soundEnabled ? (
              <Volume2 className="w-4 h-4 stroke-[1.75]" />
            ) : (
              <VolumeX className="w-4 h-4 stroke-[1.75]" />
            )}
          </button>

          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#6B6F67] dark:text-[#9C9F97]">
            Deep Focus
          </span>

          <button
            onClick={onClose}
            className="p-1.5 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded-md transition"
          >
            <X className="w-4 h-4 stroke-[1.75]" />
          </button>
        </div>

        {/* Linked Task Indicator */}
        {linkedTask && (
          <div className="my-2 px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center gap-2 max-w-[280px]">
            <Target className="w-3.5 h-3.5 text-[#303FCA] dark:text-[#5263FA] flex-shrink-0" />
            <span className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] truncate">
              {linkedTask.title}
            </span>
          </div>
        )}

        {/* Circular Countdown Progress */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center my-3 sm:my-4">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 220 220">
            {/* Background Circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="text-[#E8E7E0] dark:text-[#2C302A]"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="text-[#303FCA] dark:text-[#5263FA] transition-all duration-300 ease-linear"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] tabular-nums font-mono">
              {timeFormatted}
            </span>
            <span className="text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] mt-1">
              {focusPaused ? 'Paused' : focusActive ? 'In Flow' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Tactile Control Buttons */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={resetFocusSession}
            className="p-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] transition"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4 stroke-[1.75]" />
          </button>

          {focusActive && !focusPaused ? (
            <button
              onClick={pauseFocusSession}
              className="w-12 h-12 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition shadow-xs"
              title="Pause"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={resumeFocusSession}
              className="w-12 h-12 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition shadow-xs"
              title="Start / Resume"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          )}

          {/* Quick Complete Linked Task */}
          {linkedTask && (
            <button
              onClick={() => toggleTaskStatus(linkedTask.id)}
              className={`p-2.5 rounded-lg border transition ${
                linkedTask.status === 'completed'
                  ? 'bg-[#375336] text-white border-[#375336]'
                  : 'bg-[#F7F6F2] dark:bg-[#242722] text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] border-[#E8E7E0] dark:border-[#2C302A]'
              }`}
              title="Toggle task completion"
            >
              <Check className="w-4 h-4 stroke-[2]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
