import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  HeartPulse,
  FileText,
  Shield,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from '../../components/common/BrandLogo';
import { AdminOverviewView } from './views/AdminOverviewView';
import { AdminUsersView } from './views/AdminUsersView';
import { AdminActivityView } from './views/AdminActivityView';
import { AdminAnalyticsView } from './views/AdminAnalyticsView';
import { AdminHealthView } from './views/AdminHealthView';
import { AdminAuditLogsView } from './views/AdminAuditLogsView';
import { AdminPrivacyView } from './views/AdminPrivacyView';

interface AdminLayoutProps {
  onNavigateHome: () => void;
  onSignOut: () => void;
}

export type AdminTab = 'overview' | 'users' | 'activity' | 'analytics' | 'health' | 'audit' | 'privacy';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNavigateHome, onSignOut }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'activity', label: 'Activity Tracker', icon: Activity },
    { id: 'analytics', label: 'Productivity Analytics', icon: BarChart3 },
    { id: 'health', label: 'Application Health', icon: HeartPulse },
    { id: 'audit', label: 'Admin Audit Logs', icon: FileText },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151714] text-[#20231F] dark:text-[#F2F1ED] flex flex-col antialiased selection:bg-[#303FCA] selection:text-white pb-[var(--tovo-safe-bottom)] overflow-x-clip">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 pt-[var(--tovo-safe-top)] bg-white/95 dark:bg-[#1C1F1B]/95 backdrop-blur-md border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <div className="h-14 px-3.5 sm:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] shrink-0"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <BrandMark size={20} className="text-[#303FCA] dark:text-[#5263FA] shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-sm tracking-tight whitespace-nowrap">Tovo</span>
              <span className="px-1.5 py-0.5 rounded-sm bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] text-[10px] font-mono font-medium whitespace-nowrap">
                ADMIN
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Operational status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#375336]/10 text-[#375336] dark:text-[#7EB384] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#375336] dark:bg-[#7EB384]" />
            <span>Platform Healthy</span>
          </div>

          {/* Admin Email Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-mono text-[#6B6F67] dark:text-[#9C9F97]">
            <Lock className="w-3 h-3 text-[#303FCA] dark:text-[#5263FA]" />
            <span>{user?.email || 'Admin'}</span>
          </div>

          <button
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] bg-[#F7F6F2] dark:bg-[#242722] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] border border-[#E8E7E0] dark:border-[#2C302A] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspace</span>
          </button>

          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg text-[#C73E2E] dark:text-[#E06C5E] hover:bg-[#C73E2E]/10 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        </div>
      </header>

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="w-60 hidden md:flex flex-col border-r border-[#E8E7E0] dark:border-[#2C302A] p-4 space-y-6 flex-shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] px-3">
              Management Modules
            </span>
            <nav className="space-y-1 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as AdminTab)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition ${
                      active
                        ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] font-medium shadow-xs'
                        : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] hover:text-[#20231F] dark:hover:text-[#F2F1ED]'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-4 border-t border-[#E8E7E0] dark:border-[#2C302A] space-y-2">
            <div className="px-3 py-2 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A]">
              <span className="text-[10px] font-mono text-[#6B6F67] dark:text-[#9C9F97] block">
                Privilege Level:
              </span>
              <span className="text-xs font-semibold text-[#303FCA] dark:text-[#5263FA] flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3" />
                Root Administrator
              </span>
            </div>
          </div>
        </aside>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 z-20 bg-white dark:bg-[#1C1F1B] border-b border-[#E8E7E0] dark:border-[#2C302A] p-4 shadow-lg space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition ${
                    active
                      ? 'bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] font-medium'
                      : 'text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'overview' && <AdminOverviewView onNavigateTab={(t) => setActiveTab(t as AdminTab)} />}
          {activeTab === 'users' && <AdminUsersView />}
          {activeTab === 'activity' && <AdminActivityView />}
          {activeTab === 'analytics' && <AdminAnalyticsView />}
          {activeTab === 'health' && <AdminHealthView />}
          {activeTab === 'audit' && <AdminAuditLogsView />}
          {activeTab === 'privacy' && <AdminPrivacyView />}
        </main>
      </div>
    </div>
  );
};
