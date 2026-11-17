import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ShieldAlert,
  Link2,
} from 'lucide-react';
import { useAuth, AuthModalMode } from '../../context/AuthContext';
import { BrandMark } from '../common/BrandLogo';
import { AuthService } from '../../services/auth/auth.service';

export const AuthModal: React.FC = () => {
  const {
    user,
    showAuthModal,
    setShowAuthModal,
    authModalMode,
    setAuthModalMode,
    pendingGoogleLink,
    clearPendingGoogleLink,
    registerWithEmail,
    loginWithEmail,
    signInWithGoogle,
    continueAsGuest,
    sendPasswordReset,
    resendVerification,
    reloadUser,
    signOutUser,
  } = useAuth();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!showAuthModal) return null;

  // Password strength checker
  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (mode: AuthModalMode) => {
    resetFormState();
    setAuthModalMode(mode);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const check = AuthService.validatePassword(password);
    if (!check.valid) {
      setErrorMsg(check.message || 'Invalid password.');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(name, email, password);
      setSuccessMsg('Account created! A verification link has been sent to your email.');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Try signing in instead.');
      } else {
        setErrorMsg(err?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await loginWithEmail(email, password, rememberMe);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        setErrorMsg('Invalid email or password.');
      } else if (err?.code === 'auth/user-disabled') {
        setErrorMsg('This account has been disabled. Please contact administrator.');
      } else {
        setErrorMsg(err?.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/account-exists-with-different-credential') {
        if (err?.email) {
          setEmail(err.email);
        }
        setPassword('');
        setAuthModalMode('login');
        if (!err?.pendingCredential) {
          setErrorMsg(err?.message);
        }
      } else {
        setErrorMsg(err?.message || 'Google sign-in failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Password reset email sent to ${email}. Check your inbox for reset instructions.`);
    } catch (err: any) {
      if (err?.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email address.');
      } else {
        setErrorMsg(err?.message || 'Failed to send password reset email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await resendVerification();
      setSuccessMsg('New verification email sent. Please check your inbox.');
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to resend verification email.');
    }
  };

  const handleCheckVerified = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await reloadUser();
      if (user?.emailVerified) {
        setShowAuthModal(false);
      } else {
        setErrorMsg('Email not verified yet. Please click the link in your email first.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not refresh verification status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => {
        // Only allow clicking outside if not in required verification or suspended mode
        if (authModalMode !== 'suspended' && authModalMode !== 'verify') {
          setShowAuthModal(false);
        }
      }}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white dark:bg-[#1C1F1B] rounded-2xl shadow-xl border border-[#E8E7E0] dark:border-[#2C302A] p-5 sm:p-7 flex flex-col gap-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E7E0] dark:border-[#2C302A]">
          <div className="flex items-center gap-2">
            <BrandMark size={20} className="text-[#303FCA] dark:text-[#5263FA]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
              Tovo Account
            </span>
          </div>

          {authModalMode !== 'suspended' && authModalMode !== 'verify' && (
            <button
              onClick={() => setShowAuthModal(false)}
              className="p-1 text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error / Success Feedback Banners */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#FDF1EF] dark:bg-[#2E1917] border border-[#F5C2BC] dark:border-[#522521] text-xs text-[#C73E2E] dark:text-[#E05445] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-[#EDF7EE] dark:bg-[#162618] border border-[#C5E8C8] dark:border-[#203D23] text-xs text-[#2E7D32] dark:text-[#43A047] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* 1. WELCOME MODE */}
        {authModalMode === 'welcome' && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-semibold text-[#20231F] dark:text-[#F2F1ED] tracking-tight">
                Welcome to Tovo
              </h2>
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
                Capture thoughts instantly and turn them into actionable tasks. Sign in to synchronize your private workspace across all devices.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-white dark:bg-[#242722] hover:bg-[#F7F6F2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] text-xs font-semibold shadow-xs transition"
              >
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
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] hover:opacity-90 text-[#F7F6F2] dark:text-[#151714] text-xs font-semibold transition shadow-xs"
              >
                <Mail className="w-4 h-4 stroke-[2]" />
                <span>Sign in with Email</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F7F6F2] dark:bg-[#242722] hover:bg-[#EBE9E2] dark:hover:bg-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-semibold transition"
              >
                <span>Create New Account</span>
              </button>
            </div>

            <div className="pt-2 text-center border-t border-[#E8E7E0] dark:border-[#2C302A]">
              <button
                type="button"
                onClick={continueAsGuest}
                className="text-xs text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] underline underline-offset-4"
              >
                Explore as Guest (Offline Mode)
              </button>
            </div>
          </div>
        )}

        {/* 2. LOGIN MODE */}
        {authModalMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#20231F] dark:text-[#F2F1ED] tracking-tight">
                Sign In
              </h2>
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                Access your private tasks, planner, and habits.
              </p>
            </div>

            {pendingGoogleLink && (
              <div className="p-3 rounded-lg bg-[#EEF0FD] dark:bg-[#1D234A]/60 border border-[#C7CFFB] dark:border-[#303FCA]/50 text-xs space-y-1.5">
                <div className="flex items-start gap-2">
                  <Link2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#303FCA] dark:text-[#5263FA]" />
                  <p className="flex-1 text-[#20231F] dark:text-[#F2F1ED] leading-relaxed">
                    Sign in with your password
                    {pendingGoogleLink.email ? ` (${pendingGoogleLink.email})` : ''} to verify ownership and link Google Sign-In.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      clearPendingGoogleLink();
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:underline"
                  >
                    Cancel linking
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  autoFocus={!pendingGoogleLink}
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <Mail className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-[11px] font-medium text-[#303FCA] dark:text-[#5263FA] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoFocus={Boolean(pendingGoogleLink)}
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 pr-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <Lock className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#6B6F67] hover:text-[#20231F] absolute right-2.5 top-2"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-[#6B6F67] dark:text-[#9C9F97] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#303FCA] focus:ring-0"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition shadow-xs"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{pendingGoogleLink ? 'Sign In & Link Google' : 'Sign In'}</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] bg-white dark:bg-[#242722] hover:bg-[#F7F6F2] text-xs text-[#20231F] dark:text-[#F2F1ED] font-medium transition"
              >
                <span>Or continue with Google</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97] border-t border-[#E8E7E0] dark:border-[#2C302A]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-semibold text-[#303FCA] dark:text-[#5263FA] hover:underline ml-1"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* 3. SIGN UP MODE */}
        {authModalMode === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <h2 className="text-lg font-semibold text-[#20231F] dark:text-[#F2F1ED] tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                Join Tovo to organize your day and build habits.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  autoFocus
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <UserIcon className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <Mail className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 pr-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <Lock className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#6B6F67] hover:text-[#20231F] absolute right-2.5 top-2"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password Strength Checklist */}
              {password.length > 0 && (
                <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                  <span className={hasMinLength ? 'text-[#2E7D32]' : 'text-[#6B6F67]'}>
                    {hasMinLength ? '✓ 8+ chars' : '○ 8+ chars'}
                  </span>
                  <span className={hasLetter ? 'text-[#2E7D32]' : 'text-[#6B6F67]'}>
                    {hasLetter ? '✓ Letter' : '○ Letter'}
                  </span>
                  <span className={hasNumber ? 'text-[#2E7D32]' : 'text-[#6B6F67]'}>
                    {hasNumber ? '✓ Number' : '○ Number'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 pr-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <Lock className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 text-[#6B6F67] hover:text-[#20231F] absolute right-2.5 top-2"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !hasMinLength || !hasLetter || !hasNumber || !passwordsMatch}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition shadow-xs"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Create Account</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-[#6B6F67] dark:text-[#9C9F97] border-t border-[#E8E7E0] dark:border-[#2C302A]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-semibold text-[#303FCA] dark:text-[#5263FA] hover:underline ml-1"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD MODE */}
        {authModalMode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[#20231F] dark:text-[#F2F1ED] tracking-tight">
                Reset Password
              </h2>
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
                Enter your registered email and we'll send a secure password reset link.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  required
                  autoFocus
                  className="w-full text-xs font-medium bg-[#F7F6F2] dark:bg-[#242722] rounded-lg p-2.5 pl-8 border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA]"
                />
                <Mail className="w-3.5 h-3.5 text-[#6B6F67] absolute left-2.5 top-3" />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 disabled:opacity-50 transition shadow-xs"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>Send Reset Link</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-2 text-xs text-[#6B6F67] hover:text-[#20231F] dark:hover:text-[#F2F1ED] font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* 5. EMAIL VERIFICATION PENDING */}
        {authModalMode === 'verify' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#303FCA]/10 dark:bg-[#5263FA]/15 text-[#303FCA] dark:text-[#5263FA] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6 stroke-[1.75]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                Verify Your Email
              </h2>
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1 leading-relaxed">
                We sent a verification link to <span className="font-semibold text-[#20231F] dark:text-[#F2F1ED]">{user?.email || email}</span>.
                Please check your inbox (and spam folder) and click the link to confirm your account.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 transition shadow-xs"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>I've Verified My Email</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0}
                className="w-full py-2 rounded-lg border border-[#E8E7E0] dark:border-[#2C302A] text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] hover:bg-[#F7F6F2] disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                }}
                className="w-full py-1.5 text-xs text-[#6B6F67] hover:underline"
              >
                Continue to App for Now
              </button>
            </div>
          </div>
        )}

        {/* 6. ACCOUNT SUSPENDED */}
        {authModalMode === 'suspended' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#C73E2E]/10 text-[#C73E2E] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 stroke-[1.75]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#20231F] dark:text-[#F2F1ED]">
                Account Suspended
              </h2>
              <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1 leading-relaxed">
                Your Tovo account access has been suspended by an administrator.
                If you believe this was in error, please reach out to workspace support.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  signOutUser();
                  setShowAuthModal(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Return to Guest Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
