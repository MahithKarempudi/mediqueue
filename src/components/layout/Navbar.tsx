import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_PROFILES } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/services/firebase';
import { dbService } from '@/services/db';
import type { UserRole, Notification } from '@/types';
import { Modal, Button, Badge } from '@/components/ui';
import {
  Activity,
  ShieldCheck,
  Radio,
  ChevronDown,
  Users,
  CheckCircle2,
  Building2,
  Stethoscope,
  Landmark,
  Menu,
  Bell,
  Database,
  CheckCheck,
  Lock,
  LogOut,
  KeyRound,
  Bot,
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  patient: <Users className="h-4 w-4 text-teal-600" />,
  staff: <Stethoscope className="h-4 w-4 text-mediblue-600" />,
  hospital_admin: <Building2 className="h-4 w-4 text-indigo-600" />,
  government_officer: <Landmark className="h-4 w-4 text-amber-600" />,
  super_admin: <ShieldCheck className="h-4 w-4 text-red-600" />,
};

const ROLE_HOME_PATHS: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  staff: '/staff/dashboard',
  hospital_admin: '/admin/dashboard',
  government_officer: '/government/dashboard',
  super_admin: '/superadmin/dashboard',
};

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const {
    user,
    authMode,
    sessionExpiresAt,
    switchRole,
    loginWithEmailPassword,
    logout,
  } = useAuth();
  const navigate = useNavigate();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'session' | 'signin' | 'persona'>('session');

  // Sign-in form state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const switcherRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = dbService.subscribeCollection<Notification>('notifications', (items) => {
      const userNotifs = items.filter((n) => n.userId === user.uid || n.userId === 'all');
      if (userNotifs.length === 0) {
        const defaultNotifs: Notification[] = [
          {
            notificationId: 'notif_sys_01',
            userId: user.uid,
            message: `Active session verified as ${ROLE_PROFILES[user.role].label} (${user.name}).`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            notificationId: 'notif_sys_02',
            userId: 'all',
            message: 'AIIMS Apex Trauma Center reports ICU capacity above 85% surge threshold.',
            read: false,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
          },
        ];
        setNotifications(defaultNotifs);
      } else {
        setNotifications(
          userNotifs.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      }
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchRole = async (role: UserRole) => {
    await switchRole(role);
    setSwitcherOpen(false);
    navigate(ROLE_HOME_PATHS[role]);
  };

  const handleCloudSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;
    setIsLoggingIn(true);
    setLoginError(null);

    const res = await loginWithEmailPassword(emailInput, passwordInput);
    setIsLoggingIn(false);

    if (res.success) {
      setAuthModalOpen(false);
      setEmailInput('');
      setPasswordInput('');
    } else {
      setLoginError(res.error || 'Authentication rejected.');
    }
  };

  const handleLogoutAction = async () => {
    await logout();
    setAuthModalOpen(false);
    navigate('/patient/dashboard');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    for (const n of updated) {
      await dbService.setDocument('notifications', n.notificationId, n);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Left: Mobile Menu Trigger + Brand Identity */}
          <div className="flex items-center gap-3">
            {onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="inline-flex md:hidden items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div
              onClick={() => user && navigate(ROLE_HOME_PATHS[user.role])}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B172A] text-teal-400 shadow-xs border border-slate-800">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 font-display">
                    Medi<span className="text-teal-600">Queue</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                    Clinical SaaS OS
                  </span>
                </div>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Hospital Resource &amp; Patient Flow Coordination
                </p>
              </div>
            </div>
          </div>

          {/* Right: Storage Status, Notifications, Role Switcher, Auth Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Dataset Mode Indicator */}
            <div
              className={`hidden lg:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs ${
                isFirebaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
              title={
                isFirebaseConfigured
                  ? 'Active connection to Cloud Firestore & Firebase RTDB'
                  : 'Academic research workspace operating on local reactive engine with deterministic clinical data'
              }
            >
              {isFirebaseConfigured ? (
                <>
                  <Radio className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  <span>Live Cloud DB</span>
                </>
              ) : (
                <>
                  <Database className="h-3.5 w-3.5 text-amber-600" />
                  <span>Synthetic Research Dataset</span>
                </>
              )}
            </div>

            {/* AI Engine Status Indicator */}
            <div
              className="hidden xl:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
              title={
                import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'
                  ? 'Live Gemini 1.5 Flash Neural Assistant'
                  : 'Operating in deterministic clinical rule-based fallback mode'
              }
            >
              <Bot className="h-3.5 w-3.5 text-teal-600" />
              <span>
                {import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY'
                  ? 'AI: Gemini 1.5 Live'
                  : 'AI: Clinical NLU (Rule Fallback)'}
              </span>
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                aria-label="System notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-clinical-lg z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-800 font-display">
                        Operational Alerts
                      </p>
                      <p className="text-xs text-slate-500">
                        Hospital network telemetry &amp; queue updates
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>

                  <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        className={`py-2.5 px-2 rounded-lg text-xs ${
                          n.read ? 'text-slate-600' : 'bg-teal-50/50 text-slate-900 font-medium'
                        }`}
                      >
                        <p className="leading-relaxed">{n.message}</p>
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stakeholder Portal Workspace Switcher */}
            <div className="relative" ref={switcherRef}>
              <button
                id="role-switcher-btn"
                type="button"
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-teal-600 hover:bg-slate-50"
                title="Switch active stakeholder portal persona"
              >
                {user ? ROLE_ICONS[user.role] : <Users className="h-4 w-4 text-teal-600" />}
                <span className="hidden sm:inline text-slate-500">Workspace:</span>
                <span className="font-semibold text-slate-900">
                  {user ? ROLE_PROFILES[user.role].label : 'Select Role'}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                    switcherOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {switcherOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 origin-top-right rounded-xl border border-slate-200 bg-white p-2.5 shadow-clinical-lg z-50 animate-fade-in">
                  <div className="px-2.5 py-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-800 font-display">
                        Stakeholder Portal Switcher
                      </p>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                        Evaluation Persona
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Select any of the 5 healthcare stakeholder portals. Security scopes, route access, and data isolation update immediately.
                    </p>
                  </div>

                  <div className="mt-1.5 space-y-1">
                    {(Object.keys(ROLE_PROFILES) as UserRole[]).map((role) => {
                      const profile = ROLE_PROFILES[role];
                      const isSelected = user?.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleSwitchRole(role)}
                          className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left text-xs transition ${
                            isSelected
                              ? 'bg-teal-50/80 text-slate-900 border border-teal-200'
                              : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                            {ROLE_ICONS[role]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">{profile.label}</span>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs font-medium text-slate-600 mt-0.5">
                              {profile.user.name}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {profile.tagline}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill / Identity Modal Trigger */}
            {user && (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden lg:flex items-center gap-2.5 border-l border-slate-200 pl-3.5 hover:opacity-80 transition cursor-pointer text-left"
                title="View active session security & authentication credentials"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B172A] text-teal-400 text-xs font-bold shadow-2xs">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">
                      {user.name}
                    </p>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        authMode === 'cloud_identity' ? 'bg-emerald-500' : 'bg-teal-500'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-[130px] font-mono">
                    {user.hospitalId ? user.hospitalId : user.email}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Identity & Session Security Modal */}
      <Modal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Authentication & Identity Security Hub"
        subtitle="Manage verified identity credentials, review active session token validity, and enforce least-privilege RBAC scope."
        icon={<Lock className="w-5 h-5 text-teal-600" />}
        size="lg"
      >
        <div className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setAuthTab('session')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                authTab === 'session'
                  ? 'bg-navy-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active Session Scope
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('signin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                authTab === 'signin'
                  ? 'bg-navy-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Cloud Credentials Sign-In
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('persona')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                authTab === 'persona'
                  ? 'bg-navy-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Persona Switcher
            </button>
          </div>

          {authTab === 'session' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Security Context
                  </span>
                  <Badge variant={authMode === 'cloud_identity' ? 'success' : 'teal'} dot>
                    {authMode === 'cloud_identity' ? 'Cloud Verified Identity' : 'Academic Evaluation Persona'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Authenticated User</span>
                    <strong className="text-slate-900 font-display">{user?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Assigned Role</span>
                    <strong className="text-slate-900 font-display uppercase">{user?.role}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">User UID / UHID</span>
                    <span className="font-mono text-slate-800">{user?.patientId || user?.uid}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hospital Facility Scope</span>
                    <span className="font-mono text-slate-800">{user?.hospitalId || 'State-Wide / Unrestricted'}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block">Session Validity Horizon</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {sessionExpiresAt ? `Expires: ${new Date(sessionExpiresAt).toLocaleString()}` : 'Rolling Browser Session'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Storage: {isFirebaseConfigured ? 'Google Cloud Firestore' : 'Reactive Local Storage'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<LogOut className="w-4 h-4 text-red-600" />}
                  onClick={handleLogoutAction}
                >
                  Terminate Session (Log Out)
                </Button>
              </div>
            </div>
          )}

          {authTab === 'signin' && (
            <form onSubmit={handleCloudSignIn} className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your institutional credentials or registered email address. If Firebase Authentication is active, genuine OAuth tokens are validated; otherwise, directory credentials are verified.
              </p>

              {loginError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {loginError}
                </div>
              )}

              <div>
                <label className="mq-label">Institutional Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. priya.sharma@mediqueue.org or doctor@hospital.org"
                  className="mq-input"
                  required
                />
              </div>

              <div>
                <label className="mq-label">Password / Token</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="mq-input"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAuthModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isLoggingIn}
                  icon={<KeyRound className="w-4 h-4" />}
                >
                  Verify &amp; Sign In
                </Button>
              </div>
            </form>
          )}

          {authTab === 'persona' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 mb-2">
                Instant 1-click persona switching for research demonstrations and presentation defense:
              </p>
              {(Object.keys(ROLE_PROFILES) as UserRole[]).map((role) => {
                const p = ROLE_PROFILES[role];
                const active = user?.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      handleSwitchRole(role);
                      setAuthModalOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition cursor-pointer ${
                      active
                        ? 'bg-teal-50 border-teal-300 text-slate-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-slate-100 border border-slate-200">
                        {ROLE_ICONS[role]}
                      </div>
                      <div>
                        <strong className="text-slate-900 block">{p.label}</strong>
                        <span className="text-slate-500 text-[11px]">{p.user.name} • {p.user.email}</span>
                      </div>
                    </div>
                    {active && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
