import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PERSONAS } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/services/firebase';
import type { UserRole } from '@/types';
import {
  Activity,
  ShieldCheck,
  Radio,
  ChevronDown,
  LogOut,
  Sparkles,
  Users,
  CheckCircle2,
  Building2,
  Stethoscope,
  Landmark,
  UserCheck,
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  patient: <Users className="h-4 w-4 text-teal-400" />,
  staff: <Stethoscope className="h-4 w-4 text-sky-400" />,
  hospital_admin: <Building2 className="h-4 w-4 text-indigo-400" />,
  government_officer: <Landmark className="h-4 w-4 text-amber-400" />,
  super_admin: <ShieldCheck className="h-4 w-4 text-rose-400" />,
};

const ROLE_HOME_PATHS: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  staff: '/staff/dashboard',
  hospital_admin: '/admin/dashboard',
  government_officer: '/government/dashboard',
  super_admin: '/superadmin/dashboard',
};

export const Navbar: React.FC = () => {
  const { user, loginAsPersona, logout } = useAuth();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const handleSwitchPersona = async (role: UserRole) => {
    await loginAsPersona(role);
    setSwitcherOpen(false);
    navigate(ROLE_HOME_PATHS[role]);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-mediblue-600 to-teal-400 shadow-md shadow-mediblue-500/20">
            <Activity className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">Medi<span className="text-mediblue-400">Queue</span></span>
              <span className="rounded-full bg-mediblue-500/10 px-2 py-0.5 text-[11px] font-semibold text-mediblue-300 border border-mediblue-500/20">
                v1.0-Live
              </span>
            </div>
            <p className="hidden text-[11px] text-slate-400 sm:block">Unified Hospital Resource Cloud</p>
          </div>
        </div>

        {/* Real-time Sync Status & Quick Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* Persistent Environment Mode Badge (Phase 2 Requirement) */}
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition shadow-sm select-none bg-amber-950/50 text-amber-300 border-amber-500/40">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{isFirebaseConfigured ? 'CLOUD MODE — FIREBASE AUTH' : 'DEMO MODE — SYNTHETIC DATA'}</span>
          </div>

          {/* Live Sync Badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-800/60">
            <Radio className="h-3 w-3 animate-ping text-emerald-400" />
            <span>{isFirebaseConfigured ? 'Firebase Live Sync' : 'Multi-Tab Broadcast Sync'}</span>
          </div>

          {/* Quick Demo Role Switcher (Simulation Only) */}
          <div className="relative">
            <button
              id="role-switcher-btn"
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-mediblue-500/50 hover:bg-slate-800"
              title="Demo Persona Switcher (Simulation Only)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline text-slate-400">Simulation Role:</span>
              <span className="font-semibold capitalize text-white">
                {user ? DEMO_PERSONAS[user.role].label : 'Select Role'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {switcherOpen && (
              <div
                className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-700/80 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-black/50 z-50 animate-fade-in"
                onMouseLeave={() => setSwitcherOpen(false)}
              >
                <div className="px-2 py-1.5 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      Persona Switcher (Simulation Only)
                    </p>
                    <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20">
                      Academic Demo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    Simulates RBAC persona boundaries without requiring live multi-account credentials.
                  </p>
                </div>
                <div className="mt-1 space-y-1">
                  {(Object.keys(DEMO_PERSONAS) as UserRole[]).map((role) => {
                    const persona = DEMO_PERSONAS[role];
                    const isSelected = user?.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => handleSwitchPersona(role)}
                        className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs transition ${
                          isSelected
                            ? 'bg-mediblue-950/80 text-white border border-mediblue-600/40'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="mt-0.5">{ROLE_ICONS[role]}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-100">{persona.label}</span>
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-mediblue-400" />}
                          </div>
                          <p className="text-[11px] text-slate-400">{persona.user.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-medium text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
