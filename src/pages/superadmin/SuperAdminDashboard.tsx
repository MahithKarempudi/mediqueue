import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Hospital,
  UserCog,
  FileText,
  Server,
  KeyRound,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/services/firebase';

export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Super Admin Header */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/30">
                National Health Infrastructure Command
              </span>
              <span className="text-xs text-slate-400 font-mono">Role: Super Administrator</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Platform Master Console — {user?.name || 'Administrator'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Global system control: onboarding regional hospitals, provisioning administrative & staff credentials, configuring RTDB seams, and monitoring audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/superadmin/hospitals"
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/40 hover:bg-rose-500 transition"
            >
              <Hospital className="h-4 w-4" />
              <span>Onboard New Hospital</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cloud & Infrastructure Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-rose-500/10 p-2.5 border border-rose-500/20 text-rose-400">
              <Database className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">Database & Real-Time Sync</h3>
          <p className="mt-1 text-xs text-slate-400">
            {isFirebaseConfigured
              ? 'Connected to Google Cloud Firestore & Firebase Realtime Database.'
              : 'Operating on Local Reactive In-Memory Engine with Web BroadcastChannel synchrony.'}
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            Engine: {isFirebaseConfigured ? 'Firebase Client SDK v10+' : 'MockStorage Engine (Zero-Blocker Seam)'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-sky-500/10 p-2.5 border border-sky-500/20 text-sky-400">
              <Server className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
              Scaffolded
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">AI OPD Wait-Time Predictor</h3>
          <p className="mt-1 text-xs text-slate-400">
            FastAPI microservice with scikit-learn regression models scheduled for Phase 8.
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            Target Port: 8000 (Python 3.13)
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-teal-500/10 p-2.5 border border-teal-500/20 text-teal-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20">
              Rules Enforced
            </span>
          </div>
          <h3 className="mt-4 text-base font-semibold text-white">Security & RBAC Layer</h3>
          <p className="mt-1 text-xs text-slate-400">
            Production security rules generated in `firestore.rules` and `database.rules.json`.
          </p>
          <div className="mt-3 text-[11px] font-mono text-slate-500">
            5 Distinct Roles Verified
          </div>
        </div>
      </div>

      {/* Super Admin Control Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/superadmin/hospitals"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-rose-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-rose-500/10 p-2.5 w-fit border border-rose-500/20 text-rose-400">
            <Hospital className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-rose-300">
            Hospital Directory & Facility Management
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Register new hospital establishments, assign geographic coordinates, and configure department templates.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-rose-400">
            <span>Manage hospital network</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/superadmin/accounts"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-indigo-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-indigo-500/10 p-2.5 w-fit border border-indigo-500/20 text-indigo-400">
            <UserCog className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-indigo-300">
            System Accounts & Role Assignments
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Provision Hospital Admin, Government Officer, and Medical Staff credentials across facilities.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-400">
            <span>Provision accounts</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Super Admin Privileges */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">Full System Super Administrator Authority</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Unrestricted global read/write capability across all 15 Firestore collections and Realtime Database trees. Capable of performing cross-tenant configuration and system maintenance.
        </p>
      </div>
    </div>
  );
};
