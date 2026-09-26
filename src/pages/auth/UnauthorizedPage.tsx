import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_PERSONAS } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { ShieldAlert, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, loginAsPersona } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    currentRole?: UserRole;
    requiredRoles?: UserRole[];
    from?: string;
  } | undefined;

  const currentRole = state?.currentRole || user?.role || 'patient';
  const requiredRoles = state?.requiredRoles || [];

  const handleSwitchToAuthorized = async (role: UserRole) => {
    await loginAsPersona(role);
    if (state?.from) {
      navigate(state.from, { replace: true });
    } else {
      navigate(`/${role}/dashboard`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-rose-900/40 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">
          403 — RBAC Access Restricted
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Your active persona does not hold the permissions required to view or write to this endpoint.
        </p>

        {/* Audit Details */}
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-500">Attempted Route:</span>
            <span className="font-mono text-slate-300">{state?.from || 'Protected Module'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/80">
            <span className="text-slate-500">Your Current Role:</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-rose-300 capitalize">
              {currentRole.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Required Role(s):</span>
            <div className="flex gap-1">
              {requiredRoles.map((r) => (
                <span key={r} className="rounded bg-mediblue-500/10 border border-mediblue-500/20 px-2 py-0.5 font-semibold text-mediblue-300 capitalize">
                  {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Switch Persona Shortcuts */}
        {requiredRoles.length > 0 && (
          <div className="mt-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Switch to an authorized demo persona to continue:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {requiredRoles.map((role) => {
                const persona = DEMO_PERSONAS[role];
                return (
                  <button
                    key={role}
                    onClick={() => handleSwitchToAuthorized(role)}
                    className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 text-xs font-medium text-white hover:border-mediblue-500 hover:bg-slate-800 transition"
                  >
                    <span>{persona.label}</span>
                    <RefreshCw className="h-3.5 w-3.5 text-mediblue-400" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => navigate(`/${currentRole}/dashboard`)}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to My Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
