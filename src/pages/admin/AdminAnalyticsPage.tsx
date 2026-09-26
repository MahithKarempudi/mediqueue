import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdBed, OpdVisit, Billing, Hospital } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Bed,
  Users,
  DollarSign,
  Calendar,
  Building2,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  // Synthetic trend data for Recharts
  const bedUtilizationTrend = [
    { day: 'Mon', occupancy: 68, benchmark: 75 },
    { day: 'Tue', occupancy: 72, benchmark: 75 },
    { day: 'Wed', occupancy: 78, benchmark: 75 },
    { day: 'Thu', occupancy: 74, benchmark: 75 },
    { day: 'Fri', occupancy: 82, benchmark: 75 },
    { day: 'Sat', occupancy: 76, benchmark: 75 },
    { day: 'Sun', occupancy: 71, benchmark: 75 },
  ];

  const departmentWorkloadData = [
    { name: 'Cardiology', patients: 145, waitAvg: 18 },
    { name: 'Orthopedics', patients: 110, waitAvg: 22 },
    { name: 'Gen Medicine', patients: 180, waitAvg: 14 },
    { name: 'Pediatrics', patients: 95, waitAvg: 12 },
    { name: 'Trauma & Emerg', patients: 65, waitAvg: 5 },
  ];

  const revenueBySourceData = [
    { name: 'Inpatient (IPD)', value: 480000, color: '#6366f1' },
    { name: 'Outpatient (OPD)', value: 165000, color: '#0ea5e9' },
    { name: 'Pathology Lab', value: 95000, color: '#14b8a6' },
    { name: 'Radiology Scans', value: 135000, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Executive Business Intelligence (BI)
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital: {hospitalId}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Clinical Operations & Revenue Analytics
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Real-time visual telemetry on bed occupancy dynamics, departmental patient intake, diagnostic test throughput, and consolidated revenue performance.
          </p>
        </div>
      </div>

      {/* High-level Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Current Occupancy</span>
          <p className="mt-1 text-2xl font-extrabold text-white">76.4%</p>
          <span className="text-[10px] text-emerald-400">Normal Operating Band</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">7-Day OPD Volume</span>
          <p className="mt-1 text-2xl font-extrabold text-sky-400">595 Visits</p>
          <span className="text-[10px] text-slate-500">+12% vs prior week</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Avg Consult Duration</span>
          <p className="mt-1 text-2xl font-extrabold text-teal-400">7.8 Mins</p>
          <span className="text-[10px] text-slate-500">Across 18 physicians</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Gross Billed (MTD)</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">₹ 8.75 L</p>
          <span className="text-[10px] text-slate-500">92% Collection Rate</span>
        </div>
      </div>

      {/* Chart Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bed Utilization Trend AreaChart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <span>7-Day Bed Occupancy Curve (%)</span>
            </h3>
            <span className="text-[10px] text-slate-400">Target Threshold: 75%</span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bedUtilizationTrend}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOcc)" name="Occupancy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department OPD Load BarChart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <span>OPD Patient Footfall by Department</span>
            </h3>
            <span className="text-[10px] text-slate-400">Weekly Total</span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWorkloadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="patients" fill="#0284c7" radius={[6, 6, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Breakdown PieChart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Revenue Distribution by Clinical Source</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Consolidated</span>
          </div>

          <div className="mt-4 h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBySourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenueBySourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => `₹ ${Number(val).toLocaleString('en-IN')}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-48 text-xs space-y-2 pr-4">
              {revenueBySourceData.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-slate-300 text-[11px] truncate max-w-[90px]">{r.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 font-bold text-[10px]">
                    {Math.round((r.value / 875000) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Average Wait Times */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span>Turnaround Efficiency & Wait Times (Mins)</span>
            </h3>
            <span className="text-[10px] text-slate-400">OPD Wait Benchmark</span>
          </div>

          <div className="mt-4 space-y-3">
            {departmentWorkloadData.map((d) => (
              <div key={d.name} className="text-xs">
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>{d.name}</span>
                  <span className="font-mono text-amber-400 font-bold">{d.waitAvg} Mins Avg</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${Math.min(100, (d.waitAvg / 30) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
