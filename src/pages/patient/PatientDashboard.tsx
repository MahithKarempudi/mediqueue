import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Building2,
  AlertTriangle,
  FileText,
  CreditCard,
  History,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-semibold text-teal-300 border border-teal-500/30">
                Patient Portal
              </span>
              <span className="text-xs text-slate-400">ID: {user?.patientId || 'PAT-001'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {user?.name || 'Patient'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Monitor live OPD queue tokens in real-time, view verified hospital bed counts, check lab reports, and route to emergency care.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/patient/emergency"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/40 hover:from-rose-500 hover:to-red-500 transition"
            >
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <span>Emergency Routing</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Matrix */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Core Healthcare Services
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/patient/queue"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-teal-500/50 hover:bg-slate-800/80 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-teal-500/10 p-2.5 border border-teal-500/20 text-teal-400">
                <Users className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 animate-pulse">
                Live RTDB
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-teal-300">
              Live Queue Tracker
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              View current token serving, tokens ahead of you, and ML-predicted wait times.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-400">
              <span>Open live queue</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/patient/hospitals"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-mediblue-500/50 hover:bg-slate-800/80 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-sky-500/10 p-2.5 border border-sky-500/20 text-sky-400">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
                Verified
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-sky-300">
              Hospitals & Live Beds
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Search nearby accredited hospitals and see real-time ICU & General bed counts.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-sky-400">
              <span>Browse availability</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/patient/book"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-indigo-500/10 p-2.5 border border-indigo-500/20 text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                OPD Slot
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-indigo-300">
              Book Appointment
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Select department, specialist doctor, and generate instant appointment token.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-400">
              <span>Schedule slot</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/patient/timeline"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-amber-500/50 hover:bg-slate-800/80 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20 text-amber-400">
                <History className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                Unified
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white group-hover:text-amber-300">
              Medical Timeline
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Complete chronological patient record: OPD, IPD, lab reports, and prescriptions.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-400">
              <span>View record</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* RBAC Role Validation Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">RBAC Security Enforcement Check</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          As a registered Patient, you have scoped read access to your own medical records and real-time operational views (beds/queues). Protected staff and administrative endpoints are strictly guarded at the routing and Firestore/RTDB rules layer.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="flex items-center gap-1 rounded bg-teal-500/10 text-teal-300 px-2.5 py-1 border border-teal-500/20">
            <CheckCircle2 className="h-3 w-3" /> View Own Visits & Records
          </span>
          <span className="flex items-center gap-1 rounded bg-teal-500/10 text-teal-300 px-2.5 py-1 border border-teal-500/20">
            <CheckCircle2 className="h-3 w-3" /> Real-Time Bed & Queue Read
          </span>
          <span className="flex items-center gap-1 rounded bg-teal-500/10 text-teal-300 px-2.5 py-1 border border-teal-500/20">
            <CheckCircle2 className="h-3 w-3" /> Book Appointments & Emergency Route
          </span>
          <span className="flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 px-2.5 py-1 border border-rose-500/20">
            ✕ Cannot Mutate Bed Statuses
          </span>
          <span className="flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 px-2.5 py-1 border border-rose-500/20">
            ✕ Cannot Access Other Patient Records
          </span>
        </div>
      </div>
    </div>
  );
};
