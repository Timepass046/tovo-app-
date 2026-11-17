import React from 'react';
import { BrandLogo, BrandMark } from '../../components/common/BrandLogo';
import { Zap, Calendar, Target, Cloud, Shield } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151714] text-[#20231F] dark:text-[#F2F1ED] flex flex-col justify-between transition-colors selection:bg-[#303FCA] selection:text-white overflow-x-clip">
      {/* Top minimal bar with logo */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[calc(1rem+var(--tovo-safe-top))] pb-4 flex items-center justify-between">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="flex items-center gap-2 group text-left focus:outline-none"
        >
          <BrandLogo size={20} showWordmark={true} />
        </button>

        <div className="flex items-center gap-3 text-xs text-[#6B6F67] dark:text-[#9C9F97]">
          <span className="hidden sm:inline">Secure Cloud Workspace</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" title="System operational" />
        </div>
      </header>

      {/* Main split viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Editorial Brand Column (Hidden on small mobile, visible on desktop/tablet) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] w-fit mb-6">
              <span className="w-2 h-2 rounded-full bg-[#303FCA]" />
              Personal Productivity Workspace
            </div>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] leading-[1.15] mb-5">
              Your mind is for creating. <br />
              <span className="text-[#303FCA] dark:text-[#5263FA]">
                Let Tovo remember the rest.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed mb-10 max-w-xl">
              Capture thoughts, organize your priorities, and make progress every day with an intentional, distraction-free workflow.
            </p>

            <div className="space-y-4 max-w-md">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-[#303FCA] dark:text-[#5263FA] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                    Frictionless Thought Capture
                  </h3>
                  <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5 leading-normal">
                    Turn passing thoughts and mental notes into actionable tasks in under three seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-[#303FCA] dark:text-[#5263FA] shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                    Today & Recurring Planner
                  </h3>
                  <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5 leading-normal">
                    Focus on what matters today while recurring routines and subtasks advance predictably.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-[#303FCA] dark:text-[#5263FA] shrink-0 mt-0.5">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                    Focused Deep Sessions & Habits
                  </h3>
                  <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5 leading-normal">
                    Timer intervals linked to tasks and daily habit streaks designed for calm consistency.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-[#303FCA] dark:text-[#5263FA] shrink-0 mt-0.5">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                    Multi-Device Sync & Local-First Resilience
                  </h3>
                  <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5 leading-normal">
                    Work offline seamlessly. Changes reconcile automatically with Firebase Cloud Firestore.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Card Column */}
          <div className="w-full lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-2xl shadow-sm p-6 sm:p-8">
              {/* Mobile brand header (shown on small screens) */}
              <div className="lg:hidden mb-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-[#EFEFE9] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center text-[#20231F] dark:text-[#F2F1ED] mb-3">
                  <BrandMark size={28} />
                </div>
                <h2 className="text-xs uppercase tracking-wider font-semibold text-[#303FCA] dark:text-[#5263FA]">
                  Tovo
                </h2>
                <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                  Your thoughts, tasks and plans — all in one place.
                </p>
              </div>

              {/* View title & subtitle */}
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
                  {title}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6F67] dark:text-[#9C9F97] mt-1.5 leading-normal">
                  {subtitle}
                </p>
              </div>

              {/* Dynamic form content */}
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-[calc(1.25rem+var(--tovo-safe-bottom))] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B6F67] dark:text-[#9C9F97] border-t border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
        <p className="tracking-tight">
          &copy; {new Date().getFullYear()} Tovo. Capture it. Get it done.
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              window.history.pushState({}, '', '/admin/login');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="hover:text-[#303FCA] dark:hover:text-[#5263FA] transition flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
          <span>&middot;</span>
          <span className="font-mono text-[11px]">v1.4.0</span>
        </div>
      </footer>
    </div>
  );
};
