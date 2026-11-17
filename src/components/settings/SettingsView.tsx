import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Bell,
  Cloud,
  RefreshCw,
  Download,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Shield,
  Clock,
  Sparkles,
  Command,
  Info,
  Mail,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  KeyRound,
  Link2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { notificationService, NotificationStatus } from '../../lib/notifications';
import { sound } from '../../lib/audio';
import { BrandMark } from '../common/BrandLogo';

export const SettingsView: React.FC = () => {
  const {
    user,
    profile,
    isAdmin,
    signOutUser,
    bootstrapAdmin,
    resendVerification,
    linkGoogleAccount,
    deleteAccount,
    setShowAuthModal,
    setAuthModalMode,
    setShowAdminModal,
  } = useAuth();
  const {
    preferences,
    updatePreferences,
    isOnline,
    syncState,
    syncPendingCount,
    forceSync,
    tasks,
    habits,
    habitLogs,
  } = useTasks();

  const [notifStatus, setNotifStatus] = useState<NotificationStatus>('default');
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  // Auth actions state
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapMessage, setBootstrapMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [linkGoogleLoading, setLinkGoogleLoading] = useState(false);
  const [linkGoogleFeedback, setLinkGoogleFeedback] = useState<{ text: string; success: boolean } | null>(null);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setNotifStatus(notificationService.getStatus());
  }, []);

  const handleNotificationRequest = async () => {
    const status = await notificationService.requestPermission();
    setNotifStatus(status);
    if (status === 'granted') {
      notificationService.showNotification('Tovo Notifications Enabled', {
        body: 'You are now ready to receive reminders.',
      });
    }
  };

  const handleTestNotification = () => {
    notificationService.showNotification('Tovo Reminder', {
      body: 'Quiet reminder alerts are working as intended.',
    });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await forceSync();
    setTimeout(() => setIsSyncing(false), 500);
  };

  // Export JSON backup
  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      tasks,
      habits,
      habitLogs,
      preferences,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minddrop_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      setResendMessage(null);
      await resendVerification();
      setResendMessage('Verification email sent! Check your inbox.');
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to send verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBootstrapAdmin = async () => {
    try {
      setBootstrapLoading(true);
      setBootstrapMessage(null);
      const res = await bootstrapAdmin();
      setBootstrapMessage({ text: res.message, success: res.success });
    } catch (err: any) {
      setBootstrapMessage({ text: err.message || 'Bootstrap failed', success: false });
    } finally {
      setBootstrapLoading(false);
    }
  };

  const handleLinkGoogleAccount = async () => {
    try {
      setLinkGoogleLoading(true);
      setLinkGoogleFeedback(null);
      await linkGoogleAccount();
      setLinkGoogleFeedback({
        text: 'Google account linked cleanly. You can now sign in with either Email or Google.',
        success: true,
      });
    } catch (err: any) {
      setLinkGoogleFeedback({
        text: err?.message || 'Could not link Google account. Please try again.',
        success: false,
      });
    } finally {
      setLinkGoogleLoading(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    if (deleteInputText.trim().toUpperCase() !== 'DELETE') return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      await deleteAccount();
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. You may need to sign in again.');
      setDeleteLoading(false);
    }
  };

  const hasGoogleLinked = Boolean(user?.providerData?.some((p) => p.providerId === 'google.com'));
  const hasPasswordLinked = Boolean(user?.providerData?.some((p) => p.providerId === 'password'));

  return (
    <div className="space-y-5 sm:space-y-6 pb-4">
      {/* Editorial Header */}
      <div className="border-b border-[#E8E7E0] dark:border-[#2C302A] pb-4 sm:pb-5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
          Preferences & Workspace
        </span>
        <h1 className="text-[22px] sm:text-3xl font-semibold tracking-tight leading-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
          Settings
        </h1>
        <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1">
          Customize your experience, offline sync, security, and notification schedules.
        </p>
      </div>

      {/* 1. Account Section */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
            Account & Identity
          </span>
          <span className="text-[11px] font-mono text-[#6B6F67] dark:text-[#9C9F97]">
            {user ? 'Authenticated' : 'Local Guest Session'}
          </span>
        </div>

        {user ? (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-10 h-10 rounded-lg object-cover border border-[#E8E7E0] dark:border-[#2C302A]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] text-[#20231F] dark:text-[#F2F1ED] flex items-center justify-center font-medium text-sm">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#20231F] dark:text-[#F2F1ED]">
                      {user.displayName || profile?.displayName || 'Tovo User'}
                    </h3>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm bg-[#303FCA]/10 dark:bg-[#5263FA]/20 text-[#303FCA] dark:text-[#5263FA]">
                        <Shield className="w-3 h-3" />
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.location.pathname !== '/admin') {
                        window.history.pushState({}, '', '/admin');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#303FCA] dark:text-[#5263FA] bg-[#303FCA]/5 dark:bg-[#5263FA]/10 border border-[#303FCA]/20 dark:border-[#5263FA]/20 hover:opacity-85 transition whitespace-nowrap"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    Admin Console
                  </button>
                )}
                <button
                  onClick={async () => {
                    await signOutUser();
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#C73E2E] dark:text-[#E06C5E] hover:bg-[#C73E2E]/10 border border-[#C73E2E]/20 transition whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Connected Sign-In Providers */}
            <div className="p-3.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-[#303FCA] dark:text-[#5263FA]" />
                  Connected Sign-In Methods
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {hasPasswordLinked && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED]">
                      Email &amp; Password
                    </span>
                  )}
                  {hasGoogleLinked && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#303FCA]/10 dark:bg-[#5263FA]/20 text-[#303FCA] dark:text-[#7D8BFF] border border-[#303FCA]/20 dark:border-[#5263FA]/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Google Linked
                    </span>
                  )}
                </div>
              </div>

              {!hasGoogleLinked && (
                <button
                  type="button"
                  onClick={handleLinkGoogleAccount}
                  disabled={linkGoogleLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#1C1F1B] text-[#20231F] dark:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] transition disabled:opacity-50 self-start sm:self-auto flex-shrink-0 whitespace-nowrap"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {linkGoogleLoading ? 'Linking Google...' : 'Link Google Account'}
                </button>
              )}
            </div>
            {linkGoogleFeedback && (
              <p
                className={`text-xs ${
                  linkGoogleFeedback.success
                    ? 'text-[#375336] dark:text-[#DCE7DB]'
                    : 'text-[#C73E2E] dark:text-[#E06C5E]'
                }`}
              >
                {linkGoogleFeedback.text}
              </p>
            )}

            {/* Email verification status bar if not verified */}
            {!user.emailVerified && user.providerData.some((p) => p.providerId === 'password') && (
              <div className="p-3 rounded-lg bg-[#C99700]/10 dark:bg-[#C99700]/20 border border-[#C99700]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-[#20231F] dark:text-[#F2F1ED]">
                  <Mail className="w-4 h-4 text-[#C99700] flex-shrink-0" />
                  <span>Your email address is unverified. Verify your email to ensure full account recovery.</span>
                </div>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-xs font-medium text-[#303FCA] dark:text-[#5263FA] underline hover:opacity-80 flex-shrink-0 self-start sm:self-auto disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Link'}
                </button>
              </div>
            )}
            {resendMessage && (
              <p className="text-xs text-[#375336] dark:text-[#DCE7DB]">{resendMessage}</p>
            )}

            {/* Initial Administrator Setup Callout (for project owner) */}
            {!isAdmin && (
              <div className="p-3.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#303FCA] dark:text-[#5263FA]" />
                    Initial Administrator Bootstrap
                  </h4>
                  <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                    Authorize this account as the primary Tovo platform administrator.
                  </p>
                </div>
                <button
                  onClick={handleBootstrapAdmin}
                  disabled={bootstrapLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:opacity-90 transition disabled:opacity-50 self-start sm:self-auto flex-shrink-0"
                >
                  {bootstrapLoading ? 'Claiming...' : 'Claim Admin Access'}
                </button>
              </div>
            )}
            {bootstrapMessage && (
              <p
                className={`text-xs ${
                  bootstrapMessage.success
                    ? 'text-[#375336] dark:text-[#DCE7DB]'
                    : 'text-[#C73E2E] dark:text-[#E06C5E]'
                }`}
              >
                {bootstrapMessage.text}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED]">
                Local Guest Session
              </h3>
              <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                Tasks persist on this device. Sign in or register to securely sync across web and mobile.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#1C1F1B] text-[#20231F] dark:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Appearance & Theme */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
          Appearance
        </span>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {(
            [
              { id: 'light', label: 'Warm Ivory', icon: Sun },
              { id: 'dark', label: 'Charcoal Dark', icon: Moon },
              { id: 'system', label: 'System Default', icon: Monitor },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = preferences.theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => updatePreferences({ theme: item.id })}
                className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-lg border transition text-center ${
                  active
                    ? 'border-[#303FCA] dark:border-[#5263FA] bg-[#303FCA]/5 dark:bg-[#5263FA]/10 text-[#303FCA] dark:text-[#5263FA] font-medium'
                    : 'border-[#E8E7E0] dark:border-[#2C302A] text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722]'
                }`}
              >
                <Icon className="w-4 h-4 mb-1.5 stroke-[1.75] shrink-0" />
                <span className="text-[11px] sm:text-xs leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Audio feedback toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8E7E0] dark:border-[#2C302A]">
          <div>
            <span className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] flex items-center gap-1.5">
              {preferences.soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-[#303FCA] dark:text-[#5263FA]" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-[#6B6F67]" />
              )}
              Completion Audio Chimes
            </span>
            <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
              Quiet, gentle audio chime upon completing a task or habit.
            </p>
          </div>

          <button
            onClick={() => {
              const next = !preferences.soundEnabled;
              updatePreferences({ soundEnabled: next });
              if (next) sound.playComplete();
            }}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              preferences.soundEnabled ? 'bg-[#303FCA] dark:bg-[#5263FA]' : 'bg-[#E8E7E0] dark:bg-[#2C302A]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                preferences.soundEnabled ? 'translate-x-4' : 'translate-x-0.5'
              } top-0.5 absolute shadow-xs`}
            />
          </button>
        </div>
      </div>

      {/* 3. Notifications */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
          Reminders & Notifications
        </span>

        <div className="flex items-start justify-between gap-3 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#20231F] dark:text-[#F2F1ED]">
              System Notification Permission
            </p>
            <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
              {notifStatus === 'granted'
                ? 'Authorized. Real system alerts trigger for scheduled tasks.'
                : notifStatus === 'denied'
                ? 'Blocked in browser permissions.'
                : 'Not requested yet.'}
            </p>
          </div>

          <span className="font-mono text-[11px] capitalize text-[#6B6F67] dark:text-[#9C9F97] whitespace-nowrap shrink-0">
            [{notifStatus}]
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {notifStatus !== 'granted' && (
            <button
              onClick={handleNotificationRequest}
              className="px-3 py-1.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 transition whitespace-nowrap"
            >
              Request Permission
            </button>
          )}

          <button
            onClick={handleTestNotification}
            className="px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium transition whitespace-nowrap"
          >
            Test Alert
          </button>
        </div>
      </div>

      {/* 4. Focus Session Lengths */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
          Focus Mode Timer
        </span>

        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] mb-1">
              Focus Duration
            </label>
            <select
              value={preferences.focusSessionDuration}
              onChange={(e) => updatePreferences({ focusSessionDuration: Number(e.target.value) })}
              className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
            >
              <option value="15">15 minutes</option>
              <option value="25">25 minutes (Pomodoro)</option>
              <option value="45">45 minutes</option>
              <option value="50">50 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] mb-1">
              Rest Duration
            </label>
            <select
              value={preferences.breakDuration}
              onChange={(e) => updatePreferences({ breakDuration: Number(e.target.value) })}
              className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none"
            >
              <option value="3">3 minutes</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Offline Storage & Backup */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
          Persistence & Sync
        </span>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
            <span className="text-[#6B6F67] dark:text-[#9C9F97] shrink-0">Runtime:</span>
            <span className="font-mono text-[#20231F] dark:text-[#F2F1ED] truncate text-right min-w-0">
              {typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()
                ? `Capacitor (${(window as any).Capacitor.getPlatform()})`
                : 'Web Browser / IndexedDB'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 py-1 border-b border-[#E8E7E0]/60 dark:border-[#2C302A]/60">
            <span className="text-[#6B6F67] dark:text-[#9C9F97] shrink-0">Sync State:</span>
            <span className="font-mono text-[#20231F] dark:text-[#F2F1ED] capitalize truncate text-right min-w-0">
              {syncState} ({syncPendingCount} in queue)
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-[#6B6F67] dark:text-[#9C9F97] shrink-0">Network:</span>
            <span className="font-mono text-[#20231F] dark:text-[#F2F1ED]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E8E7E0] dark:border-[#2C302A]">
          <button
            onClick={handleManualSync}
            disabled={isSyncing || syncPendingCount === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium disabled:opacity-40 transition whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[1.75] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Force Sync</span>
          </button>

          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium transition whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Export Backup (JSON)</span>
          </button>
        </div>

        {exportNotice && (
          <p className="text-xs text-[#375336] dark:text-[#DCE7DB] font-medium">
            Backup JSON downloaded successfully.
          </p>
        )}
      </div>

      {/* Danger Zone: Account Deletion */}
      {user && (
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#C73E2E]/30 dark:border-[#C73E2E]/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C73E2E] dark:text-[#E06C5E] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Danger Zone
            </span>
            <span className="text-[11px] font-mono text-[#6B6F67] dark:text-[#9C9F97]">
              Irreversible Action
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-medium text-[#20231F] dark:text-[#F2F1ED]">
              Delete Account & Clear Cloud Workspace
            </h4>
            <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
              Permanently delete your Tovo account credentials, authentication record, and all cloud Firestore documents (tasks, habits, and logs). All local data on this device will also be wiped.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => {
                setShowDeleteConfirm(true);
                setDeleteInputText('');
                setDeleteError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#C73E2E] dark:text-[#E06C5E] bg-[#C73E2E]/10 border border-[#C73E2E]/20 hover:bg-[#C73E2E]/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account...
            </button>
          ) : (
            <div className="p-3.5 rounded-lg bg-[#C73E2E]/5 border border-[#C73E2E]/20 space-y-3">
              <p className="text-xs text-[#C73E2E] dark:text-[#E06C5E] font-medium">
                To confirm deletion, please type <span className="font-mono font-bold">DELETE</span> below:
              </p>
              <input
                type="text"
                value={deleteInputText}
                onChange={(e) => setDeleteInputText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full text-xs font-mono px-3 py-2 rounded-lg bg-white dark:bg-[#151714] border border-[#C73E2E]/30 text-[#20231F] dark:text-[#F2F1ED] outline-none"
              />
              {deleteError && (
                <p className="text-xs text-[#C73E2E] dark:text-[#E06C5E]">{deleteError}</p>
              )}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDeleteAccountConfirm}
                  disabled={deleteInputText.trim().toUpperCase() !== 'DELETE' || deleteLoading}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#C73E2E] text-white hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  {deleteLoading ? 'Deleting Account...' : 'Permanently Delete Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInputText('');
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] dark:hover:bg-[#242722] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. About MindDrop & Keyboard Shortcuts */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-4">
        <div className="flex items-center gap-3">
          <BrandMark size={24} className="text-[#303FCA] dark:text-[#5263FA]" />
          <div>
            <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Tovo <span className="text-xs font-mono font-normal text-[#6B6F67] dark:text-[#9C9F97]">v1.0.0</span>
            </h3>
            <p className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
              Capture it. Get it done.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
          Local-first architecture: your tasks, habits, and schedules are stored securely on your device and replicate quietly when cloud access is available.
        </p>

        <div className="pt-2 border-t border-[#E8E7E0] dark:border-[#2C302A]">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-2 flex items-center gap-1.5">
            <Command className="w-3 h-3" /> Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F7F6F2] dark:bg-[#242722]">
              <span className="text-[#6B6F67] dark:text-[#9C9F97]">Quick Capture</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1C1F1B] rounded border border-[#E8E7E0] dark:border-[#2C302A] shrink-0">
                C
              </kbd>
            </div>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F7F6F2] dark:bg-[#242722]">
              <span className="text-[#6B6F67] dark:text-[#9C9F97]">Close Modals</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#1C1F1B] rounded border border-[#E8E7E0] dark:border-[#2C302A] shrink-0">
                Esc
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
