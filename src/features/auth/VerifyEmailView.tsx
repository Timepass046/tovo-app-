import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, RefreshCw, AlertCircle, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

interface VerifyEmailViewProps {
  onNavigate: (path: string) => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ onNavigate }) => {
  const { user, resendVerification, reloadUser, signOutUser } = useAuth();

  const [isLoadingCheck, setIsLoadingCheck] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );
  const [cooldown, setCooldown] = useState(0);

  // Check if user is already verified
  useEffect(() => {
    if (user?.emailVerified) {
      onNavigate('/app/home');
    }
  }, [user, onNavigate]);

  // Handle countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckStatus = async () => {
    setIsLoadingCheck(true);
    setStatusMsg(null);
    try {
      await reloadUser();
      // If after reload it is verified, redirect
      if (user?.emailVerified) {
        setStatusMsg({
          type: 'success',
          text: 'Email verified successfully! Redirecting to your workspace...',
        });
        setTimeout(() => onNavigate('/app/home'), 1200);
      } else {
        setStatusMsg({
          type: 'info',
          text: "We haven't received confirmation yet. Please click the link in your email and try checking again.",
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Could not verify status. Please try again.',
      });
    } finally {
      setIsLoadingCheck(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setStatusMsg(null);
    try {
      await resendVerification();
      setCooldown(60);
      setStatusMsg({
        type: 'success',
        text: 'A fresh verification link has been sent to your email inbox.',
      });
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setStatusMsg({
          type: 'error',
          text: 'Too many requests. Please wait a moment before requesting another email.',
        });
        setCooldown(60);
      } else {
        setStatusMsg({
          type: 'error',
          text: err?.message || 'Failed to send verification email.',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    onNavigate('/login');
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We've sent a verification link to confirm ownership of your workspace."
    >
      <div className="space-y-5">
        {/* User email badge */}
        <div className="p-3.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151714] border border-[#E8E7E0] dark:border-[#2C302A] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA] flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] text-[#6B6F67] dark:text-[#9C9F97] uppercase tracking-wider font-semibold">
              Pending Verification
            </span>
            <span className="block text-xs sm:text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED] truncate">
              {user?.email || 'Your registered email'}
            </span>
          </div>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-150 ${
              statusMsg.type === 'success'
                ? 'bg-[#EFF9F0] dark:bg-[#1B291D] border-[#C5E6C7] dark:border-[#2D4D31] text-[#2E7D32] dark:text-[#43A047]'
                : statusMsg.type === 'error'
                ? 'bg-[#FDF1EF] dark:bg-[#2E1917] border-[#F5C2BC] dark:border-[#5C231E] text-[#C73E2E] dark:text-[#E05445]'
                : 'bg-[#EEF0FD] dark:bg-[#1D234A] border-[#C7CFFB] dark:border-[#2E3773] text-[#303FCA] dark:text-[#5263FA]'
            }`}
          >
            {statusMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
            {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {statusMsg.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="leading-relaxed flex-1">{statusMsg.text}</span>
          </div>
        )}

        <div className="text-xs text-[#6B6F67] dark:text-[#9C9F97] space-y-2 leading-relaxed">
          <p>
            Please check your inbox (and spam folder) for an email from Tovo and click the confirmation link.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Check Verification Status */}
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={isLoadingCheck}
            className="w-full py-2.5 px-4 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:bg-[#303FCA] dark:hover:bg-[#5263FA] hover:text-white dark:hover:text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            {isLoadingCheck ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking confirmation...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>I&apos;ve verified my email</span>
              </>
            )}
          </button>

          {/* Resend Link */}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-white dark:bg-[#242722] hover:bg-[#F7F6F2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#303FCA]" />
                <span>Dispatching link...</span>
              </>
            ) : cooldown > 0 ? (
              <span>Resend email in {cooldown}s</span>
            ) : (
              <span>Resend verification email</span>
            )}
          </button>
        </div>

        {/* Switch Account */}
        <div className="pt-4 border-t border-[#E8E7E0] dark:border-[#2C302A] flex items-center justify-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs text-[#C73E2E] dark:text-[#E05445] hover:underline"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out / Switch account</span>
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
