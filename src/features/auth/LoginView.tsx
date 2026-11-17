import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Link2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { AuthService } from '../../services/auth/auth.service';
import { auth } from '../../lib/firebase';

interface LoginViewProps {
  onNavigate: (path: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { loginWithEmail, signInWithGoogle, pendingGoogleLink, clearPendingGoogleLink } = useAuth();

  const [email, setEmail] = useState(pendingGoogleLink?.email || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (pendingGoogleLink?.email) {
      setEmail((prev) => prev || pendingGoogleLink.email);
    }
  }, [pendingGoogleLink]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!AuthService.validateEmail(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginWithEmail(cleanEmail, password, rememberMe);

      const currentUser = auth.currentUser;
      const isGoogle = currentUser?.providerData?.some((p: { providerId: string }) => p.providerId === 'google.com');

      if (currentUser && !currentUser.emailVerified && !isGoogle) {
        onNavigate('/verify-email');
      } else {
        onNavigate('/app/home');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-email'
      ) {
        setErrorMsg('Invalid email or password. Please verify your credentials and try again.');
      } else if (code === 'auth/user-disabled') {
        setErrorMsg('This account has been disabled. Please contact the administrator.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many failed attempts. Please reset your password or wait a few minutes.');
      } else {
        setErrorMsg(err?.message || 'Failed to sign in. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (auth.currentUser) {
        onNavigate('/app/home');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err?.code === 'auth/account-exists-with-different-credential') {
        if (err?.email) {
          setEmail(err.email);
        }
        setPassword('');
        if (!err?.pendingCredential) {
          setErrorMsg(err?.message);
        }
      } else {
        setErrorMsg(err?.message || 'Google sign-in was unsuccessful. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Tovo workspace to access your thoughts and tasks."
    >
      {/* Account linking prompt when email/password account already exists */}
      {pendingGoogleLink && (
        <div className="mb-5 p-3.5 rounded-xl bg-[#EEF0FD] dark:bg-[#1D234A]/60 border border-[#C7CFFB] dark:border-[#303FCA]/50 text-xs text-[#20231F] dark:text-[#F2F1ED] space-y-2 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5">
            <Link2 className="w-4 h-4 shrink-0 mt-0.5 text-[#303FCA] dark:text-[#5263FA]" />
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold text-[#303FCA] dark:text-[#7D8BFF]">
                Link Google to your existing account
              </p>
              <p className="mt-0.5 text-[#4A4E46] dark:text-[#C5C8C0]">
                An account already exists
                {pendingGoogleLink.email ? ` for ${pendingGoogleLink.email}` : ''} using email and password.
                Sign in with your password below to verify ownership and link Google Sign-In.
              </p>
            </div>
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
              Cancel Google linking
            </button>
          </div>
        </div>
      )}

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

      {/* Primary Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED] mb-1.5">
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
              autoFocus={!pendingGoogleLink}
              autoComplete="email"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-[#20231F] dark:text-[#F2F1ED]">
              Password
            </label>
            <button
              type="button"
              onClick={() => onNavigate('/forgot-password')}
              className="text-xs text-[#303FCA] dark:text-[#5263FA] hover:underline font-medium"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#92968E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoFocus={Boolean(pendingGoogleLink)}
              autoComplete="current-password"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#E8E7E0] dark:border-[#2C302A] bg-[#F7F6F2] dark:bg-[#151714] text-xs sm:text-sm text-[#20231F] dark:text-[#F2F1ED] placeholder-[#92968E] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 absolute right-3 top-1/2 -translate-y-1/2 text-[#92968E] hover:text-[#20231F] dark:hover:text-[#F2F1ED]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center pt-1">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-[#E8E7E0] text-[#303FCA] focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <label
            htmlFor="remember-me"
            className="ml-2 text-xs text-[#6B6F67] dark:text-[#9C9F97] cursor-pointer"
          >
            Remember me on this browser
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] hover:bg-[#303FCA] dark:hover:bg-[#5263FA] hover:text-white dark:hover:text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{pendingGoogleLink ? 'Signing in & linking...' : 'Signing in...'}</span>
            </>
          ) : (
            <>
              <span>{pendingGoogleLink ? 'Sign In & Link Google Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E8E7E0] dark:border-[#2C302A]" />
        <span className="text-[11px] uppercase tracking-wider text-[#92968E] font-medium">
          or
        </span>
        <div className="flex-1 h-px bg-[#E8E7E0] dark:border-[#2C302A]" />
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
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
        <span>Sign in with Google</span>
      </button>

      {/* Switch to Sign Up */}
      <div className="mt-6 pt-5 border-t border-[#E8E7E0] dark:border-[#2C302A] text-center text-xs text-[#6B6F67] dark:text-[#9C9F97]">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('/signup')}
          className="font-semibold text-[#303FCA] dark:text-[#5263FA] hover:underline cursor-pointer ml-1"
        >
          Sign up
        </button>
      </div>
    </AuthLayout>
  );
};
