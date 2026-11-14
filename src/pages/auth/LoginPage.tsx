import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_PROFILES } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import {
  Activity,
  ShieldCheck,
  Stethoscope,
  Building2,
  Landmark,
  Users,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  patient: <Users className="h-5 w-5 text-teal-600" />,
  staff: <Stethoscope className="h-5 w-5 text-sky-600" />,
  hospital_admin: <Building2 className="h-5 w-5 text-indigo-600" />,
  government_officer: <Landmark className="h-5 w-5 text-amber-600" />,
  super_admin: <ShieldCheck className="h-5 w-5 text-rose-600" />,
};

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  staff: '/staff/dashboard',
  hospital_admin: '/admin/dashboard',
  government_officer: '/government/dashboard',
  super_admin: '/superadmin/dashboard',
};

export const LoginPage: React.FC = () => {
  const { user, loginWithEmailPassword, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as { reason?: string; from?: string } | undefined;
  const isSessionExpired = state?.reason === 'session_expired';

  const [activeTab, setActiveTab] = useState<'personas' | 'credentials'>('personas');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated and not expired, redirect to their home
  React.useEffect(() => {
    if (user && !isSessionExpired) {
      navigate(ROLE_DASHBOARDS[user.role] || '/patient/dashboard', { replace: true });
    }
  }, [user, isSessionExpired, navigate]);

  const handlePersonaSelect = async (role: UserRole) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await switchRole(role);
      const dest = state?.from || ROLE_DASHBOARDS[role];
      navigate(dest, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch role persona.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const result = await loginWithEmailPassword(email, password);
      if (result.success) {
        // Redirection will occur via AuthContext update or manually:
        const dest = state?.from || '/patient/dashboard';
        navigate(dest, { replace: true });
      } else {
        setErrorMsg(result.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-teal-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 shadow-clinical-sm">
          <Activity className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-display text-white">
          MediQueue <span className="text-teal-400">AI</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          AI-Assisted Platform for Real-Time Hospital Resource Coordination & Clinical Scheduling
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        {/* Session Expired Banner */}
        {isSessionExpired && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Security Session Expired</p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Your authenticated clinical token has expired. Please select a role persona or sign in again to resume.
              </p>
            </div>
          </div>
        )}

        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-clinical-lg p-6 sm:p-8">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 mb-6">
            <button
              type="button"
              onClick={() => { setActiveTab('personas'); setErrorMsg(null); }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'personas'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Evaluation Personas
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('credentials'); setErrorMsg(null); }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              Institutional Sign-In
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Role Personas (Academic Demonstration) */}
          {activeTab === 'personas' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Select an institutional stakeholder persona to test authorized workflows, RBAC access gates, and operational telemetry:
              </p>
              {(Object.keys(ROLE_PROFILES) as UserRole[]).map((roleKey) => {
                const profile = ROLE_PROFILES[roleKey];
                return (
                  <button
                    key={roleKey}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePersonaSelect(roleKey)}
                    className="w-full text-left p-3.5 rounded-xl border border-slate-700/70 bg-slate-900/50 hover:bg-slate-700/40 hover:border-teal-500/40 transition-all flex items-start gap-3.5 group cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                      {ROLE_ICONS[roleKey]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white group-hover:text-teal-300 transition-colors">
                          {profile.label}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {profile.user.email}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {profile.tagline}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all mt-2" />
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: Credential Sign-In */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya.sharma@mediqueue.org"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                <p className="font-semibold text-slate-300 mb-1">Pre-configured Demonstration Credentials:</p>
                <p className="font-mono text-[11px] text-teal-300">priya.sharma@mediqueue.org | any password</p>
                <p className="font-mono text-[11px] text-sky-300">rajesh.kumar@mediqueue.org | any password</p>
                <p className="font-mono text-[11px] text-amber-300">dev.anand@mediqueue.org | any password</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-clinical-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              RBAC Scope Enforced
            </span>
            <span>MediQueue AI v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

