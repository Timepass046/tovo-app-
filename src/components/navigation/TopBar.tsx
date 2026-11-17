import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Search,
  LogIn,
  LogOut,
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { BrandLogo } from '../common/BrandLogo';

interface TopBarProps {
  onOpenAiModal?: () => void;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAiModal }) => {
  const {
    user,
    isAdmin,
    isGuest,
    signOutUser,
    setShowAuthModal,
    setAuthModalMode,
  } = useAuth();

  const {
    isOnline,
    syncPendingCount,
    forceSync,
    preferences,
    updatePreferences,
    searchQuery,
    setSearchQuery,
  } = useTasks();

  const [showSearch, setShowSearch] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDarkActive =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    const next = isDarkActive ? 'light' : 'dark';
    updatePreferences({ theme: next });
  };

  useEffect(() => {
    if (!showAuthMenu) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAuthMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [showAuthMenu]);

  const currentDateFormatted = React.useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 pt-[var(--tovo-safe-top)] bg-[#F7F6F2]/92 dark:bg-[#151714]/92 backdrop-blur-md border-b border-[#E8E7E0] dark:border-[#2C302A] transition-colors">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <BrandLogo size={18} showWordmark={true} />
          <span className="hidden sm:inline text-xs text-[#92968E] dark:text-[#6E726A] font-normal" aria-hidden="true">
            /
          </span>
          <span className="hidden sm:inline text-xs text-[#6B6F67] dark:text-[#9C9F97] font-medium tracking-tight whitespace-nowrap">
            {currentDateFormatted}
          </span>
        </div>

        {/* Action & Utility Zone — single compact row */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Admin Dashboard Trigger (sm+ in bar; in overflow menu on narrow mobile) */}
          {isAdmin && (
            <button
              onClick={() => {
                if (window.location.pathname !== '/admin') {
                  window.history.pushState({}, '', '/admin');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] hover:bg-[#303FCA]/20 text-xs font-semibold transition active:scale-[0.98] whitespace-nowrap shrink-0"
              title="Open Admin Console"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Admin</span>
            </button>
          )}

          {/* AI Assist Trigger */}
          {onOpenAiModal && (
            <button
              onClick={onOpenAiModal}
              className="inline-flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] sm:min-h-[32px] sm:min-w-0 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#EEF0FD] dark:bg-[#1D234A] text-[#303FCA] dark:text-[#5263FA] hover:bg-[#E3E6FB] dark:hover:bg-[#252C5C] text-xs font-medium transition-colors active:scale-[0.98] whitespace-nowrap shrink-0"
              title="AI Assistant"
              aria-label="Open AI Assistant"
            >
              <Sparkles className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Assist</span>
            </button>
          )}

          {/* Sync & Connectivity */}
          <div className="flex items-center shrink-0">
            {isOnline ? (
              syncPendingCount > 0 ? (
                <button
                  onClick={forceSync}
                  className="min-h-[38px] sm:min-h-[32px] px-2 py-1 rounded-lg text-xs text-[#C47D14] dark:text-[#DE932A] hover:bg-[#FCF5EB] dark:hover:bg-[#2B2113] flex items-center gap-1 transition-colors whitespace-nowrap"
                  title={`${syncPendingCount} pending changes. Click to sync.`}
                  aria-label={`${syncPendingCount} pending changes. Tap to sync.`}
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="tabular-nums font-mono text-[11px]">{syncPendingCount}</span>
                </button>
              ) : (
                <span
                  className="min-h-[38px] min-w-[30px] sm:min-h-[32px] flex items-center justify-center text-[#2E7D32] dark:text-[#43A047] opacity-85"
                  title="Synced with cloud"
                  aria-label="Synced with cloud"
                >
                  <Wifi className="w-3.5 h-3.5" />
                </span>
              )
            ) : (
              <span
                className="px-1.5 sm:px-2 py-1 rounded-md text-[11px] font-medium text-[#C73E2E] dark:text-[#E05445] bg-[#FDF1EF] dark:bg-[#2E1917] flex items-center gap-1 whitespace-nowrap"
                title="Offline mode. All data saved locally."
              >
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            )}
          </div>

          {/* Search Trigger */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`min-h-[38px] min-w-[38px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center rounded-lg transition-colors shrink-0 ${
              showSearch || searchQuery
                ? 'bg-[#EFEFE9] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED]'
                : 'text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] hover:bg-[#EFEFE9] dark:hover:bg-[#242722]'
            }`}
            title="Search tasks & notes"
            aria-label="Toggle search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Theme Switcher (shown directly on sm+, moved into compact menu on narrow mobile) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:flex min-h-[32px] min-w-[32px] items-center justify-center text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded-lg hover:bg-[#EFEFE9] dark:hover:bg-[#242722] transition-colors shrink-0"
            title="Toggle theme"
            aria-label="Toggle light or dark theme"
          >
            {isDarkActive ? (
              <Sun className="w-4 h-4 text-[#DE932A]" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Account & Overflow Menu Trigger */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowAuthMenu(!showAuthMenu)}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] hover:border-[#303FCA] dark:hover:border-[#6467F5] transition-colors overflow-hidden"
              title="Account & workspace menu"
              aria-label="User account and options menu"
              aria-expanded={showAuthMenu}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.displayName ? user.displayName[0].toUpperCase() : isGuest ? 'G' : 'M'}</span>
              )}
            </button>

            {/* Dropdown / Overflow Menu */}
            {showAuthMenu && (
              <div
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl bg-[#FFFFFF] dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-2 border-b border-[#E8E7E0] dark:border-[#2C302A] mb-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#20231F] dark:text-[#F2F1ED] truncate">
                      {user?.displayName || (isGuest ? 'Guest User' : 'Tovo User')}
                    </p>
                    {isAdmin && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] font-medium shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] truncate mt-0.5">
                    {user?.email || 'Local-first guest workspace'}
                  </p>

                  {user && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                      {user.emailVerified ? (
                        <span className="text-[#2E7D32] dark:text-[#43A047] flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Verified Account
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setAuthModalMode('verify');
                            setShowAuthModal(true);
                            setShowAuthMenu(false);
                          }}
                          className="text-[#C47D14] dark:text-[#DE932A] hover:underline flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" /> Verify Email
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  {/* Mobile Overflow: Theme Toggle */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowAuthMenu(false);
                    }}
                    className="sm:hidden w-full flex items-center justify-between px-2 py-2 text-xs text-[#20231F] dark:text-[#F2F1ED] hover:bg-[#EFEFE9] dark:hover:bg-[#242722] rounded-md transition"
                  >
                    <span className="flex items-center gap-2">
                      {isDarkActive ? (
                        <Sun className="w-3.5 h-3.5 text-[#DE932A]" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-[#6B6F67]" />
                      )}
                      <span>{isDarkActive ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                    </span>
                  </button>

                  {/* Mobile Overflow: Sync Now if pending */}
                  {isOnline && syncPendingCount > 0 && (
                    <button
                      onClick={() => {
                        forceSync();
                        setShowAuthMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2 py-2 text-xs text-[#C47D14] dark:text-[#DE932A] hover:bg-[#FCF5EB] dark:hover:bg-[#2B2113] rounded-md transition"
                    >
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync Now</span>
                      </span>
                      <span className="font-mono text-[11px] tabular-nums">{syncPendingCount}</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowAuthMenu(false);
                        if (window.location.pathname !== '/admin') {
                          window.history.pushState({}, '', '/admin');
                          window.dispatchEvent(new PopStateEvent('popstate'));
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 text-xs text-[#303FCA] dark:text-[#5263FA] hover:bg-[#EEF0FD] dark:hover:bg-[#1D234A] rounded-md transition font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  {user ? (
                    <button
                      onClick={async () => {
                        await signOutUser();
                        setShowAuthMenu(false);
                        window.history.pushState({}, '', '/login');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 text-xs text-[#C73E2E] dark:text-[#E05445] hover:bg-[#FDF1EF] dark:hover:bg-[#2E1917] rounded-md transition"
                    >
                      <LogOut className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAuthMenu(false);
                        window.history.pushState({}, '', '/login');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 text-xs text-[#303FCA] dark:text-[#5263FA] hover:bg-[#EEF0FD] dark:hover:bg-[#1D234A] rounded-md transition font-semibold"
                    >
                      <LogIn className="w-3.5 h-3.5 shrink-0" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {showSearch && (
        <div className="border-t border-[#E8E7E0] dark:border-[#2C302A] px-3.5 sm:px-4 py-2 bg-[#F7F6F2] dark:bg-[#151714] animate-in slide-in-from-top-2 duration-150">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Search className="w-4 h-4 text-[#92968E] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, thoughts, notes..."
              autoFocus
              className="flex-1 min-w-0 bg-transparent text-xs text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none py-1"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 text-[#92968E] hover:text-[#20231F] dark:hover:text-[#F2F1ED]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
