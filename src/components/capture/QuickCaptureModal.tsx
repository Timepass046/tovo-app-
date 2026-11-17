import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Inbox,
  Sun,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { TaskBucket, TaskPriority } from '../../types';
import { useTasks } from '../../context/TaskContext';
import { BrandMark } from '../common/BrandLogo';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBucket?: TaskBucket;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  defaultBucket = 'inbox',
}) => {
  const { quickCapture } = useTasks();

  const [text, setText] = useState('');
  const [bucket, setBucket] = useState<TaskBucket>(defaultBucket);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      setBucket(defaultBucket);
      setText('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, defaultBucket]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setText(prev => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceDictation = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Voice recognition start error:', err);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    await quickCapture(text.trim(), bucket, priority);
    setText('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#1C1F1B] rounded-t-2xl sm:rounded-2xl shadow-xl border border-[#E8E7E0] dark:border-[#2C302A] p-4 sm:p-5 pb-[calc(1.25rem+var(--tovo-safe-bottom))] sm:pb-5 flex flex-col gap-4 animate-in fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E7E0] dark:border-[#2C302A]">
          <div className="flex items-center gap-2">
            <BrandMark size={18} className="text-[#303FCA] dark:text-[#5263FA]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Quick Capture
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a thought, task, or drop an idea... (Enter to save)"
            className="w-full text-sm font-medium text-[#20231F] dark:text-[#F2F1ED] bg-[#F7F6F2] dark:bg-[#242722] rounded-xl p-3.5 border border-[#E8E7E0] dark:border-[#2C302A] focus:border-[#303FCA] dark:focus:border-[#5263FA] outline-none resize-none transition leading-relaxed placeholder:text-[#6B6F67]/60 dark:placeholder:text-[#9C9F97]/60"
          />

          {/* Voice Dictation Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-[#C73E2E] text-white'
                  : 'text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isListening ? 'Listening... click to stop' : 'Start voice dictation'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Destination Bucket & Priority Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Destination Bucket Selector */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-[10px] font-semibold text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider mr-0.5 whitespace-nowrap">
              Save To:
            </span>

            <button
              type="button"
              onClick={() => setBucket('inbox')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                bucket === 'inbox'
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714]'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
              }`}
            >
              <Inbox className="w-3 h-3 stroke-[1.75]" />
              Inbox
            </button>

            <button
              type="button"
              onClick={() => setBucket('today')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                bucket === 'today'
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714]'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
              }`}
            >
              <Sun className="w-3 h-3 stroke-[1.75]" />
              Today
            </button>

            <button
              type="button"
              onClick={() => setBucket('someday')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap ${
                bucket === 'someday'
                  ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714]'
                  : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
              }`}
            >
              <Archive className="w-3 h-3 stroke-[1.75]" />
              Someday
            </button>
          </div>

          {/* Priority Dots & Save Action */}
          <div className="flex items-center justify-between sm:justify-end flex-wrap gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E7E0] dark:border-[#2C302A]">
            <div className="flex items-center gap-1">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                const isSelected = priority === p;
                const dotColor =
                  p === 'high' ? 'bg-[#C73E2E]' : p === 'medium' ? 'bg-[#C47D14]' : 'bg-[#6B6F67]';
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#E8E7E0] dark:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED]'
                        : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F]'
                    }`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} mr-1`} />
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 active:scale-[0.98] transition shadow-xs disabled:opacity-40 whitespace-nowrap shrink-0"
            >
              <span>Capture</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
