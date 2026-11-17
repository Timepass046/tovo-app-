import React, { useState } from 'react';
import { Shield, KeyRound, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/admin/admin.service';
import { BrandMark } from '../../components/common/BrandLogo';

interface AdminLoginViewProps {
  onNavigateHome: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onNavigateHome, onLoginSuccess }) => {
  const { user, loginWithEmail, signOutUser, bootstrapAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapNotice, setBootstrapNotice] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your administrator email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Sign in via Firebase Auth
      await loginWithEmail(email.trim(), password);

      // 2. Verify administrator privileges
      const verify = await adminService.verifyAdmin();
      if (!verify.isAdmin) {
        await signOutUser();
        setError('Access Denied: This account is authenticated but does not possess verified administrator privileges.');
        setLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAdmin = async () => {
    try {
      setBootstrapLoading(true);
      setBootstrapNotice(null);
      const res = await bootstrapAdmin();
      if (res.success) {
        setBootstrapNotice(res.message);
        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Bootstrap failed');
    } finally {
      setBootstrapLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#151714] text-[#20231F] dark:text-[#F2F1ED] flex flex-col justify-center items-center px-4 pt-[calc(1rem+var(--tovo-safe-top))] pb-[calc(1rem+var(--tovo-safe-bottom))]">
      <div className="max-w-md w-full space-y-6">
        {/* Navigation back */}
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs text-[#6B6F67] dark:text-[#9C9F97] hover:text-[#20231F] dark:hover:text-[#F2F1ED] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Tovo Workspace
        </button>

        {/* Card */}
        <div className="bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E8E7E0] dark:border-[#2C302A] pb-5">
            <div className="flex items-center gap-2.5">
              <BrandMark size={24} className="text-[#303FCA] dark:text-[#5263FA]" />
              <span className="text-sm font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED]">
                Tovo <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-sm bg-[#303FCA]/10 text-[#303FCA] dark:text-[#5263FA]">Console</span>
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#303FCA] dark:text-[#5263FA]" />
              Restricted
            </span>
          </div>

          <div>
            <h1 className="text-xl font-semibold text-[#20231F] dark:text-[#F2F1ED] tracking-tight">
              Administrator Access
            </h1>
            <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-1">
              Sign in with your authorized administrator credentials to manage platform users, monitor health, and view aggregated telemetry.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#C73E2E]/10 border border-[#C73E2E]/20 text-xs text-[#C73E2E] dark:text-[#E06C5E] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {bootstrapNotice && (
            <div className="p-3 rounded-lg bg-[#375336]/10 border border-[#375336]/20 text-xs text-[#375336] dark:text-[#DCE7DB] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#375336]" />
              <span>{bootstrapNotice}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tovo.app"
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6F67] dark:text-[#9C9F97] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full text-xs px-3.5 py-2.5 rounded-lg bg-[#F7F6F2] dark:bg-[#242722] border border-[#E8E7E0] dark:border-[#2C302A] text-[#20231F] dark:text-[#F2F1ED] focus:outline-none focus:border-[#303FCA] dark:focus:border-[#5263FA] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#20231F] dark:bg-[#F2F1ED] text-[#F7F6F2] dark:text-[#151714] text-xs font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Verifying Authorization...</span>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Project owner bootstrap prompt */}
          {user && (
            <div className="pt-4 border-t border-[#E8E7E0] dark:border-[#2C302A] flex flex-col gap-2">
              <span className="text-[11px] text-[#6B6F67] dark:text-[#9C9F97]">
                Signed in as <strong className="text-[#20231F] dark:text-[#F2F1ED]">{user.email}</strong>
              </span>
              <button
                type="button"
                onClick={handleClaimAdmin}
                disabled={bootstrapLoading}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-[#303FCA]/10 dark:bg-[#5263FA]/20 text-[#303FCA] dark:text-[#5263FA] hover:opacity-85 transition"
              >
                <Shield className="w-3.5 h-3.5" />
                {bootstrapLoading ? 'Verifying Project Authority...' : 'Verify & Claim Administrator Role'}
              </button>
            </div>
          )}

          <div className="pt-2">
            <p className="text-[11px] text-center text-[#6B6F67] dark:text-[#9C9F97]">
              Public registration of administrator accounts is prohibited. Privileges are managed via Firebase Custom Claims.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
