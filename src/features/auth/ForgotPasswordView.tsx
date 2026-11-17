import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { AuthService } from '../../services/auth/auth.service';

interface ForgotPasswordViewProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigate }) => {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!AuthService.validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setSuccessMsg(
        `If an account exists for ${cleanEmail}, password reset instructions have been sent to your inbox.`
      );
    } catch (err: any) {
      console.error('Password reset error:', err);
      // For security, don't expose account existence leaks unless critical error
      if (err?.code === 'auth/user-not-found') {
        setSuccessMsg(
          `If an account exists for ${cleanEmail}, password reset instructions have been sent to your inbox.`
        );
      } else {
        setErrorMsg(err?.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email address tied to your Tovo workspace and we'll send you a recovery link."
    >
      {/* Error alert */}
      {errorMsg && (
        <div className="mb-5 p-3 rounded-xl bg-[#FDF1EF] dark:bg-[#2E1917] border border-[#F5C2BC] dark:border-[#5C231E] flex items-start gap-2.5 text-xs text-[#C73E2E] dark:text-[#E05445] animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs font-semibold hover:opacity-80 ml-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Success notification */}
      {successMsg ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#EFF9F0] dark:bg-[#1B291D] border border-[#C5E6C7] dark:border-[#2D4D31] flex items-start gap-3 text-xs sm:text-sm text-[#2E7D32] dark:text-[#43A047]">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>

          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
            Please check your spam or promotions folder if the email does not appear within two minutes.
          </p>

          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:bg-[#303FCA] dark:hover:bg-[#5263FA] hover:text-white dark:hover:text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Sign In</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] mb-1.5">
              Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#92968E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoFocus
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:bg-[#303FCA] dark:hover:bg-[#5263FA] hover:text-white dark:hover:text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending instructions...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
