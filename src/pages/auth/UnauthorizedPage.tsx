import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_PROFILES } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const { user, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as
    | {
        currentRole?: UserRole;
        requiredRoles?: UserRole[];
        from?: string;
      }
    | undefined;

  const currentRole = state?.currentRole || user?.role || 'patient';
  const requiredRoles = state?.requiredRoles || [];

  const handleSwitchToAuthorized = async (role: UserRole) => {
    await switchRole(role);
    if (state?.from) {
      navigate(state.from, { replace: true });
    } else {
      navigate(`/${role}/dashboard`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-clinical-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-600">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight font-display">
          403 — Portal Scope Restricted
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your active stakeholder profile does not hold permission to view or mutate this clinical module.
        </p>

        {/* Audit Details */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Requested Path:</span>
            <span className="font-mono font-semibold text-slate-800">
              {state?.from || 'Protected Module'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Active Workspace Role:</span>
            <span className="rounded-md bg-red-50 border border-red-200 px-2 py-0.5 font-semibold text-red-700 capitalize">
              {currentRole.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 font-medium">Authorized Role(s):</span>
            <div className="flex flex-wrap gap-1">
              {requiredRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 font-semibold text-teal-800 capitalize"
                >
                  {r.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Switch Role Shortcuts */}
        {requiredRoles.length > 0 && (
          <div className="mt-6 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Switch to an authorized workspace profile to continue:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {requiredRoles.map((role) => {
                const profile = ROLE_PROFILES[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSwitchToAuthorized(role)}
                    className="flex items-center justify-between rounded-xl border border-slate-300 bg-white p-3 text-xs font-semibold text-slate-800 hover:border-teal-600 hover:bg-teal-50/40 transition shadow-2xs"
                  >
                    <span>{profile.label}</span>
                    <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(`/${currentRole}/dashboard`)}
            className="flex items-center gap-2 rounded-xl bg-navy-950 px-5 py-2.5 text-xs font-semibold text-white hover:bg-navy-900 transition shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Active Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
