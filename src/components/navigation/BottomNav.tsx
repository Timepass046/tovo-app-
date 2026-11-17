import React from 'react';
import { Home, Inbox, Calendar, CheckSquare, Settings, Plus } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';

export type NavTab = 'home' | 'inbox' | 'planner' | 'habits' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenQuickCapture: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenQuickCapture,
}) => {
  const { tasks } = useTasks();

  // Badges calculation
  const inboxCount = tasks.filter(t => t.bucket === 'inbox' && !t.archived && t.status !== 'completed').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = tasks.filter(t => {
    if (t.archived || t.status === 'completed' || !t.dueDate) return false;
    return t.dueDate.split('T')[0] < todayStr;
  }).length;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#F7F6F2]/95 dark:bg-[#151713]/95 backdrop-blur-md border-t border-[#E8E7E0] dark:border-[#30332D] pb-[var(--tovo-safe-bottom)] transition-colors select-none"
        role="navigation"
        aria-label="Primary mobile navigation"
      >
        <div className="max-w-lg mx-auto px-1.5 sm:px-4 h-15 sm:h-16 grid grid-cols-5 items-center">
          {/* 1. Home */}
          <button
            onClick={() => onTabChange('home')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center py-1 px-1 transition-colors relative active:scale-95 ${
              activeTab === 'home'
                ? 'text-[#6467F5]'
                : 'text-[#6B6F67] dark:text-[#A4A69F] hover:text-[#20231F] dark:hover:text-[#F4F3EE]'
            }`}
            aria-label="Home"
            aria-current={activeTab === 'home' ? 'page' : undefined}
          >
            <div className="relative">
              <Home className="w-5 h-5 stroke-[1.75]" />
              {overdueCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-[#C73E2E] dark:bg-[#E05445]" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">Home</span>
          </button>

          {/* 2. Inbox */}
          <button
            onClick={() => onTabChange('inbox')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center py-1 px-1 transition-colors relative active:scale-95 ${
              activeTab === 'inbox'
                ? 'text-[#6467F5]'
                : 'text-[#6B6F67] dark:text-[#A4A69F] hover:text-[#20231F] dark:hover:text-[#F4F3EE]'
            }`}
            aria-label="Inbox"
            aria-current={activeTab === 'inbox' ? 'page' : undefined}
          >
            <div className="relative">
              <Inbox className="w-5 h-5 stroke-[1.75]" />
              {inboxCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 min-w-[13px] h-3.5 rounded-full bg-[#6467F5] text-white text-[9px] font-mono tabular-nums font-semibold flex items-center justify-center leading-none">
                  {inboxCount > 9 ? '9+' : inboxCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">Inbox</span>
          </button>

          {/* 3. Planner */}
          <button
            onClick={() => onTabChange('planner')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center py-1 px-1 transition-colors relative active:scale-95 ${
              activeTab === 'planner'
                ? 'text-[#6467F5]'
                : 'text-[#6B6F67] dark:text-[#A4A69F] hover:text-[#20231F] dark:hover:text-[#F4F3EE]'
            }`}
            aria-label="Planner"
            aria-current={activeTab === 'planner' ? 'page' : undefined}
          >
            <Calendar className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">Planner</span>
          </button>

          {/* 4. Habits */}
          <button
            onClick={() => onTabChange('habits')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center py-1 px-1 transition-colors relative active:scale-95 ${
              activeTab === 'habits'
                ? 'text-[#6467F5]'
                : 'text-[#6B6F67] dark:text-[#A4A69F] hover:text-[#20231F] dark:hover:text-[#F4F3EE]'
            }`}
            aria-label="Habits"
            aria-current={activeTab === 'habits' ? 'page' : undefined}
          >
            <CheckSquare className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">Habits</span>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => onTabChange('settings')}
            className={`min-h-[44px] min-w-0 flex flex-col items-center justify-center py-1 px-1 transition-colors relative active:scale-95 ${
              activeTab === 'settings'
                ? 'text-[#6467F5]'
                : 'text-[#6B6F67] dark:text-[#A4A69F] hover:text-[#20231F] dark:hover:text-[#F4F3EE]'
            }`}
            aria-label="Settings"
            aria-current={activeTab === 'settings' ? 'page' : undefined}
          >
            <Settings className="w-5 h-5 stroke-[1.75]" />
            <span className="text-[10px] font-medium tracking-tight mt-1 truncate max-w-full">Settings</span>
          </button>
        </div>
      </nav>

      {/* Floating Action Button (FAB) for Quick Add */}
      <div className="fixed right-4 sm:right-5 bottom-[calc(4.65rem+var(--tovo-safe-bottom))] z-40">
        <button
          onClick={onOpenQuickCapture}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#6467F5] text-white shadow-lg hover:bg-[#7579F7] active:scale-95 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#6467F5] focus:ring-offset-2 dark:focus:ring-offset-[#151713]"
          aria-label="Quick capture thought or task"
          title="Quick capture (C)"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.25]" />
        </button>
      </div>
    </>
  );
};
