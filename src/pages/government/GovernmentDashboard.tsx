import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Landmark,
  Building2,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowRight,
  Eye,
} from 'lucide-react';

export const GovernmentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Government Header */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                District Health Surveillance & Public Policy
              </span>
              <span className="text-xs text-slate-400 font-mono">Jurisdiction: Central Health District</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Public Health Command Center — {user?.name || 'Director Sen'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Real-time cross-hospital capacity monitoring, epidemic surge detection, and district-wide healthcare resource allocation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/government/surge-map"
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-900/40 hover:bg-amber-500 transition"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Surge Monitor (&gt;85% Red Alert)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* District Aggregate Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hospitals Monitored</span>
            <Building2 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">5</span>
            <span className="text-xs text-emerald-400 font-medium">All Active</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Connected to live RTDB telemetry</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>District Bed Occupancy</span>
            <Activity className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">79.4%</span>
            <span className="text-xs text-amber-400 font-medium">Moderate Load</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">412 occupied / 518 total beds</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Surge Alert Status</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">1 Hospital</span>
            <span className="text-xs text-rose-400 font-medium">&gt;85% Critical</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-400/80">St. Jude Trauma Care at 88%</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated OPD Load</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">1,248</span>
            <span className="text-xs text-emerald-400 font-medium">Patients Today</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">District throughput normal</p>
        </div>
      </div>

      {/* Government Portal Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/government/surge-map"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-amber-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-amber-500/10 p-2.5 w-fit border border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-amber-300">
            Surge Detection & Real-Time Capacity Monitor
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Visual inspection of district hospitals with color-coded capacity thresholds (&gt;85% Red, 70-85% Amber, &lt;70% Green).
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-400">
            <span>Launch surge monitor</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/government/reports"
          className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition hover:border-sky-500/50 hover:bg-slate-800/80"
        >
          <div className="rounded-lg bg-sky-500/10 p-2.5 w-fit border border-sky-500/20 text-sky-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-white group-hover:text-sky-300">
            District Epidemiological & Utilization Reports
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Review aggregated daily and monthly institutional performance reports and export summaries to CSV.
          </p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-sky-400">
            <span>View aggregated trends</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Strict Privacy & Anonymization Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Aggregated-Only Privacy Enforcement</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          In strict compliance with healthcare data regulations and the system security rules, the Government Officer role is granted read-only telemetry over aggregate statistics and bed capacities. Direct access to individual patient records, personal medical data, or itemized patient invoices is strictly prohibited at both the API and database rule layers.
        </p>
      </div>
    </div>
  );
};
