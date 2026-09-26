import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Building2,
  Bed,
  Users,
  BarChart3,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Admin Header */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                Hospital Operations Executive
              </span>
              <span className="text-xs text-slate-400 font-mono">Hospital: {user?.hospitalId || 'hosp_metro_01'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Facility Command Center — {user?.name || 'Administrator'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Comprehensive institutional oversight: bed inventory distribution, department staffing, financial performance, and compliance reporting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/beds"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition"
            >
              <Bed className="h-4 w-4" />
              <span>Manage Hospital Beds</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Preview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Bed Occupancy</span>
            <Bed className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">76%</span>
            <span className="text-xs text-emerald-400 font-medium">Optimal Capacity</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full w-3/4"></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>OPD Footfall Today</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">142</span>
            <span className="text-xs text-slate-400">patients registered</span>
          </div>
          <p className="mt-1 text-[11px] text-sky-400">Across 5 departments</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Critical Care (ICU)</span>
            <Activity className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">4</span>
            <span className="text-xs text-amber-400">free of 16 beds</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Emergency intake ready</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily Billed Volume</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">₹ 3.84 L</span>
            <span className="text-xs text-emerald-400">Consolidated</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">OPD + IPD + Diagnostics</p>
        </div>
      </div>

      {/* Admin Action Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/beds"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-indigo-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-indigo-500/10 p-2.5 w-fit border border-indigo-500/20 text-indigo-400">
            <Bed className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-indigo-300">
            Bed Inventory & Ward Configuration
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Configure ICU, general, and pediatric bed allocations with real-time status synchronization.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-400">
            <span>Configure beds</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/departments"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-sky-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-sky-500/10 p-2.5 w-fit border border-sky-500/20 text-sky-400">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-sky-300">
            Departments & Physician Rosters
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Manage specialty clinical units (Cardiology, Orthopedics, Pediatrics) and physician assignments.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-sky-400">
            <span>View departments</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/analytics"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-emerald-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit border border-emerald-500/20 text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-emerald-300">
            Institutional Analytics & Reports
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Interactive Recharts visualizations of patient turnaround times, bed utilization, and financial revenue.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-400">
            <span>Open analytics</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* RBAC Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Hospital Admin RBAC Clearance</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Full administrative authority over hospital <span className="font-mono text-indigo-300">{user?.hospitalId || 'hosp_metro_01'}</span>. Restricted from altering configurations of other hospital facilities.
        </p>
      </div>
    </div>
  );
};
