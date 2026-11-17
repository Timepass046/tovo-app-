/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { TopBar } from './components/navigation/TopBar';
import { BottomNav, NavTab } from './components/navigation/BottomNav';
import { HomeView } from './components/home/HomeView';
import { InboxView } from './components/inbox/InboxView';
import { PlannerView } from './components/planner/PlannerView';
import { HabitsView } from './components/habits/HabitsView';
import { SettingsView } from './components/settings/SettingsView';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { QuickCaptureModal } from './components/capture/QuickCaptureModal';
import { FocusSessionModal } from './components/focus/FocusSessionModal';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminDashboardModal } from './components/admin/AdminDashboardModal';
import { AdminLoginView } from './features/admin/AdminLoginView';
import { AdminLayout } from './features/admin/AdminLayout';
import {
  LoginView,
  SignUpView,
  ForgotPasswordView,
  VerifyEmailView,
} from './features/auth';
import { BrandMark } from './components/common/BrandLogo';
import { Task, TaskBucket } from './types';
import { Loader2 } from 'lucide-react';

interface MindDropAppProps {
  currentTab: NavTab;
  onNavigate: (path: string) => void;
}

function MindDropApp({ currentTab, onNavigate }: MindDropAppProps) {
  const [activeTab, setActiveTab] = useState<NavTab>(currentTab);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureBucket, setQuickCaptureBucket] = useState<TaskBucket>('inbox');
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalMode, setAiModalMode] = useState<'braindump' | 'breakdown' | 'plan'>('braindump');

  const { selectedTaskId, setSelectedTaskId, tasks } = useTasks();

  // Sync internal activeTab with currentTab prop when route changes
  useEffect(() => {
    setActiveTab(currentTab);
  }, [currentTab]);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    onNavigate(`/app/${tab}`);
  };

  useEffect(() => {
    if (selectedTaskId) {
      const found = tasks.find((t: Task) => t.id === selectedTaskId);
      if (found) {
        setSelectedTask(found);
      }
      setSelectedTaskId(null);
    }
  }, [selectedTaskId, tasks, setSelectedTaskId]);

  const handleOpenQuickCapture = (bucket: TaskBucket = 'inbox') => {
    setQuickCaptureBucket(bucket);
    setQuickCaptureOpen(true);
  };

  const handleOpenAiModal = (mode: 'braindump' | 'breakdown' | 'plan' = 'braindump') => {
    setAiModalMode(mode);
    setAiModalOpen(true);
  };

  // Global keyboard shortcut: 'c' to open quick capture when no input is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && !quickCaptureOpen) {
          e.preventDefault();
          handleOpenQuickCapture(activeTab === 'home' ? 'today' : 'inbox');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, quickCaptureOpen]);

  // Android hardware back button handling in Capacitor WebView
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listenerHandle: { remove: () => Promise<void> } | null = null;

    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (selectedTask) {
        setSelectedTask(null);
        return;
      }
      if (quickCaptureOpen) {
        setQuickCaptureOpen(false);
        return;
      }
      if (focusModalOpen) {
        setFocusModalOpen(false);
        return;
      }
      if (aiModalOpen) {
        setAiModalOpen(false);
        return;
      }
      if (activeTab !== 'home') {
        handleTabChange('home');
        return;
      }
      if (canGoBack && window.history.length > 1) {
        window.history.back();
        return;
      }
      CapacitorApp.minimizeApp().catch(() => {});
    }).then((handle) => {
      listenerHandle = handle;
    }).catch(() => {});

    return () => {
      if (listenerHandle) {
        listenerHandle.remove().catch(() => {});
      }
    };
  }, [selectedTask, quickCaptureOpen, focusModalOpen, aiModalOpen, activeTab]);

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151714] text-[#20231F] dark:text-[#F2F1ED] transition-colors flex flex-col font-sans antialiased selection:bg-[#303FCA] selection:text-white overflow-x-clip">
      {/* Top Header */}
      <TopBar onOpenAiModal={() => handleOpenAiModal('braindump')} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-3.5 sm:px-4 pt-4 sm:pt-6 pb-[calc(6.25rem+var(--tovo-safe-bottom))]">
        {activeTab === 'home' && (
          <HomeView
            onSelectTask={setSelectedTask}
            onOpenQuickCapture={() => handleOpenQuickCapture('today')}
            onOpenFocusModal={() => setFocusModalOpen(true)}
            onOpenAiModal={() => handleOpenAiModal('plan')}
            onNavigateToInbox={() => handleTabChange('inbox')}
          />
        )}

        {activeTab === 'inbox' && (
          <InboxView
            onSelectTask={setSelectedTask}
            onOpenAiBrainDump={() => handleOpenAiModal('braindump')}
          />
        )}

        {activeTab === 'planner' && (
          <PlannerView
            onSelectTask={setSelectedTask}
            onOpenQuickCapture={() => handleOpenQuickCapture('today')}
          />
        )}

        {activeTab === 'habits' && <HabitsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Mobile-First Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenQuickCapture={() => handleOpenQuickCapture(activeTab === 'home' ? 'today' : 'inbox')}
      />

      {/* Modals & Overlays */}
      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        defaultBucket={quickCaptureBucket}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      <FocusSessionModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
      />

      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialMode={aiModalMode}
      />

      {/* Multi-User Authentication & Admin Management Modals */}
      <AuthModal />
      <AdminDashboardModal />
    </div>
  );
}

/**
 * Editorial Loading Screen during Firebase Auth Session Check
 * Strictly prevents flashing private dashboard or demo tasks
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151714] text-[#20231F] dark:text-[#F2F1ED] flex flex-col items-center justify-center px-6 pt-[calc(1.5rem+var(--tovo-safe-top))] pb-[calc(1.5rem+var(--tovo-safe-bottom))] text-center select-none">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center shadow-xs mb-4">
        <BrandMark size={24} />
      </div>

      <h1 className="text-base font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
        Tovo
      </h1>

      <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1 max-w-xs leading-normal">
        Your thoughts, tasks and plans — all in one place.
      </p>

      <div className="mt-6 flex items-center gap-2 text-xs text-[#92968E] font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#303FCA] dark:text-[#5263FA]" />
        <span>Verifying secure workspace session...</span>
      </div>
    </div>
  );
}

function RootRouter() {
  const { user, profile, isAdmin, isEmailVerified, loading, signOutUser } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    try {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } catch (e) {
      console.warn('Navigation state warning:', e);
    }
    setCurrentPath(path);
  };

  // URL synchronization side effects (cleanly isolated from render)
  useEffect(() => {
    if (loading) return;

    // Unauthenticated: redirect non-public routes to /login in URL bar
    if (!user) {
      const publicAuthRoutes = ['/login', '/signup', '/forgot-password', '/admin/login'];
      if (!publicAuthRoutes.includes(currentPath)) {
        try {
          if (window.location.pathname !== '/login') {
            window.history.replaceState({}, '', '/login');
          }
        } catch (e) {
          console.warn('History replaceState warning:', e);
        }
        setCurrentPath('/login');
      }
      return;
    }

    // Authenticated but unverified: hold URL at /verify-email
    if (!isEmailVerified) {
      if (currentPath !== '/verify-email') {
        try {
          if (window.location.pathname !== '/verify-email') {
            window.history.replaceState({}, '', '/verify-email');
          }
        } catch (e) {
          console.warn('History replaceState warning:', e);
        }
        setCurrentPath('/verify-email');
      }
      return;
    }

    // Authenticated & verified accessing public auth routes: redirect URL to /app/home
    const publicAuthRoutes = ['/', '/login', '/signup', '/forgot-password', '/verify-email'];
    if (publicAuthRoutes.includes(currentPath)) {
      try {
        if (window.location.pathname !== '/app/home') {
          window.history.replaceState({}, '', '/app/home');
        }
      } catch (e) {
        console.warn('History replaceState warning:', e);
      }
      setCurrentPath('/app/home');
    }
  }, [loading, user, isEmailVerified, currentPath]);

  // State 1: Initializing - Firebase is resolving session
  if (loading) {
    return <AuthLoadingScreen />;
  }

  // State 2: Suspended Account
  if (user && profile?.accountStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151714] flex flex-col items-center justify-center px-4 pt-[calc(1.5rem+var(--tovo-safe-top))] pb-[calc(1.5rem+var(--tovo-safe-bottom))] text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#1C1F1B] border border-[#F5C2BC] dark:border-[#5C231E] p-6 rounded-2xl shadow-sm text-center space-y-3">
          <h2 className="text-lg font-semibold text-[#C73E2E]">Account Suspended</h2>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">
            This account has been suspended by an administrator. Access to the Tovo workspace is denied.
          </p>
          <button
            onClick={async () => {
              await signOutUser();
              navigate('/login');
            }}
            className="px-4 py-2 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-white dark:text-[#151714] text-xs font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // State 3: Unauthenticated - User must authenticate before accessing any protected content
  if (!user) {
    if (currentPath === '/admin/login') {
      return (
        <AdminLoginView
          onNavigateHome={() => navigate('/login')}
          onLoginSuccess={() => navigate('/admin')}
        />
      );
    }
    if (currentPath === '/signup') {
      return <SignUpView onNavigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordView onNavigate={navigate} />;
    }
    // Any other URL (e.g. '/', '/app/*', '/app/home', unauthenticated visits) unconditionally displays the Login panel
    return <LoginView onNavigate={navigate} />;
  }

  // State 4: Authenticated but Email Unverified
  // Must remain on verification screen and CANNOT reach application dashboard
  if (!isEmailVerified) {
    return <VerifyEmailView onNavigate={navigate} />;
  }

  // State 5: Authenticated and Verified User
  // Admin Routes: Strictly requires custom claim isAdmin
  if (currentPath === '/admin/login') {
    if (isAdmin) {
      return (
        <AdminLayout
          onNavigateHome={() => navigate('/app/home')}
          onSignOut={async () => {
            await signOutUser();
            navigate('/admin/login');
          }}
        />
      );
    }
    return (
      <AdminLoginView
        onNavigateHome={() => navigate('/app/home')}
        onLoginSuccess={() => navigate('/admin')}
      />
    );
  }

  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    if (!isAdmin) {
      return (
        <AdminLoginView
          onNavigateHome={() => navigate('/app/home')}
          onLoginSuccess={() => navigate('/admin')}
        />
      );
    }

    return (
      <AdminLayout
        onNavigateHome={() => navigate('/app/home')}
        onSignOut={async () => {
          await signOutUser();
          navigate('/admin/login');
        }}
      />
    );
  }

  // Authenticated workspace routes (/app/*)
  if (currentPath.startsWith('/app')) {
    let tab: NavTab = 'home';
    if (currentPath === '/app/inbox') tab = 'inbox';
    else if (currentPath === '/app/planner') tab = 'planner';
    else if (currentPath === '/app/habits') tab = 'habits';
    else if (currentPath === '/app/settings') tab = 'settings';
    else if (currentPath === '/app' || currentPath === '/app/home') tab = 'home';

    return <MindDropApp currentTab={tab} onNavigate={navigate} />;
  }

  // Default authenticated fallback
  return <MindDropApp currentTab="home" onNavigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <RootRouter />
      </TaskProvider>
    </AuthProvider>
  );
}
