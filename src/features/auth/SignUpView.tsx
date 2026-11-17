import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Check, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { AuthService } from '../../services/auth/auth.service';
import { auth } from '../../lib/firebase';

interface SignUpViewProps {
  onNavigate: (path: string) => void;
}

export const SignUpView: React.FC<SignUpViewProps> = ({ onNavigate }) => {
  const { registerWithEmail, signInWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Password criteria checklist
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!AuthService.validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg('Please fulfill all password requirements below.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(cleanName, cleanEmail, password);
      // Navigate to verify email
      onNavigate('/verify-email');
    } catch (err: any) {
      console.error('Registration error:', err);
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email address already exists. Try signing in instead.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('The password chosen is too weak. Please use a stronger combination.');
      } else {
        setErrorMsg(err?.message || 'Failed to create your account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (auth.currentUser) {
        onNavigate('/app/home');
      }
    } catch (err: any) {
      console.error('Google sign-up error:', err);
      if (err?.code === 'auth/account-exists-with-different-credential') {
        if (err?.pendingCredential) {
          onNavigate('/login');
          return;
        }
        setErrorMsg(
          err?.message ||
            'An account already exists with this email using email and password. Please sign in and link Google in Settings.'
        );
      } else {
        setErrorMsg(err?.message || 'Google sign-up failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start capturing thoughts and building momentum with your personal workspace."
    >
      {/* Error notification banner */}
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

      {/* Registration Form */}
      <form onSubmit={handleSignUp} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] mb-1">
            Full Name
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-[#92968E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              autoFocus
              autoComplete="name"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#92968E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              autoComplete="email"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] mb-1">
            Create Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#92968E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
              className="w-full pl-9 pr-10 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-[#92968E] hover:text-[#20231F] dark:hover:text-[#F2F1ED]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#92968E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
              className="w-full pl-9 pr-10 py-2 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-[#92968E] hover:text-[#20231F] dark:hover:text-[#F2F1ED]"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Password Strength Checklist */}
        <div className="p-2.5 rounded-xl bg-[#F7F6F2] dark:bg-[#151714] border border-[#E8E7E0] dark:border-[#2C302A] text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-[#6B6F67] dark:text-[#9C9F97]">
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                hasMinLength ? 'bg-[#2E7D32] text-white' : 'bg-[#E8E7E0] dark:bg-[#2C302A]'
              }`}
            >
              {hasMinLength && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>At least 8 characters</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#6B6F67] dark:text-[#9C9F97]">
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                hasLetter ? 'bg-[#2E7D32] text-white' : 'bg-[#E8E7E0] dark:bg-[#2C302A]'
              }`}
            >
              {hasLetter && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>Contains at least one letter</span>
          </div>

          <div className="flex items-center gap-1.5 text-[#6B6F67] dark:text-[#9C9F97]">
            <span
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                hasNumber ? 'bg-[#2E7D32] text-white' : 'bg-[#E8E7E0] dark:bg-[#2C302A]'
              }`}
            >
              {hasNumber && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </span>
            <span>Contains at least one number</span>
          </div>

          {confirmPassword && (
            <div className="flex items-center gap-1.5 text-[#6B6F67] dark:text-[#9C9F97]">
              <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                  passwordsMatch ? 'bg-[#2E7D32] text-white' : 'bg-[#C73E2E] text-white'
                }`}
              >
                {passwordsMatch && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>
              <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match yet'}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading || !isPasswordValid || (confirmPassword !== '' && !passwordsMatch)}
          className="w-full py-2.5 px-4 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:bg-[#303FCA] dark:hover:bg-[#5263FA] hover:text-white dark:hover:text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E8E7E0] dark:border-[#2C302A]" />
        <span className="text-[11px] uppercase tracking-wider text-[#92968E] font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-[#E8E7E0] dark:border-[#2C302A]" />
      </div>

      {/* Google Sign Up */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isLoading || isGoogleLoading}
        className="w-full py-2.5 px-4 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-white dark:bg-[#242722] hover:bg-[#F7F6F2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] text-xs sm:text-sm font-medium transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#303FCA]" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>Sign up with Google</span>
      </button>

      {/* Switch to Login */}
      <div className="mt-5 pt-4 border-t border-[#E8E7E0] dark:border-[#2C302A] text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('/login')}
          className="font-semibold text-[#303FCA] dark:text-[#5263FA] hover:underline cursor-pointer ml-1"
        >
          Sign in
        </button>
      </div>
    </AuthLayout>
  );
};
