import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  Bed,
  HeartPulse,
  Microscope,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Staff Header */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-300 border border-sky-500/30">
                Clinical Staff & Physician Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">Hospital: {user?.hospitalId || 'hosp_metro_01'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Doctor Consultation Desk — {user?.name || 'Medical Officer'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Conduct OPD consultations, call next tokens in real-time, allocate inpatient beds, request lab tests, and dispatch billing line-items.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/staff/opd"
              className="flex items-center gap-2 rounded-xl bg-mediblue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-mediblue-900/40 hover:bg-mediblue-500 transition"
            >
              <Users className="h-4 w-4" />
              <span>Open OPD Consultation Queue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Clinical Operations Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Operational Workflows
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/staff/opd"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-sky-500/50 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-sky-500/10 p-2.5 border border-sky-500/20 text-sky-400">
                <Users className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 animate-pulse">
                Live Calls
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-sky-300">
              OPD Queue & Consultations
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Advance tokens, view patient history, record diagnoses, and issue digital prescriptions.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-sky-400">
              <span>Manage OPD queue</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/staff/beds"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-indigo-500/50 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-500/10 p-2.5 border border-indigo-500/20 text-indigo-400">
                <Bed className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                RTDB Synced
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-indigo-300">
              Live Bed Status & Wards
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Toggle bed statuses (available/occupied/maintenance) with cross-dashboard synchrony.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-400">
              <span>Open live beds</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/staff/admissions"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-emerald-500/50 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-emerald-500/10 p-2.5 border border-emerald-500/20 text-emerald-400">
                <HeartPulse className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                Atomic Release
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-emerald-300">
              IPD Admissions & Discharge
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Admit patients to available ward beds and execute atomic discharge with billing calculations.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span>Manage IPD cases</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/staff/diagnostics"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-teal-500/50 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-teal-500/10 p-2.5 border border-teal-500/20 text-teal-400">
                <Microscope className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400 border border-teal-500/20">
                Path & Rad
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-teal-300">
              Diagnostic Investigations
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Order pathology tests (CBC, LFT, KFT) and radiology imaging (X-Ray, CT, MRI).
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-400">
              <span>View investigation orders</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/staff/billing"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-amber-500/50 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20 text-amber-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                Point of Care
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-amber-300">
              Billing Dispatch
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Generate unified bills across OPD consultations, IPD charges, and diagnostic fees.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-400">
              <span>Process bills</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* RBAC Scoping Details */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">RBAC Hospital Scoping Active</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Staff permissions are scoped strictly to hospital <span className="font-mono text-sky-300">{user?.hospitalId || 'hosp_metro_01'}</span>. Writes to `liveBeds`, `liveQueues`, `opd_visits`, and `billing` are verified against this hospital ID at both the client and security rules layers.
        </p>
      </div>
    </div>
  );
};
