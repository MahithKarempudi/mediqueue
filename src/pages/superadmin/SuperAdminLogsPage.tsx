import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
} from 'lucide-react';

export const SuperAdminLogsPage: React.FC = () => {
  const [filterType, setFilterType] = useState('all');

  const auditLogs = [
    { id: 'log_01', timestamp: '2026-09-17 11:22:15', event: 'RTDB_BROADCAST_SYNC', severity: 'INFO', actor: 'Dr. Rajesh Kumar (staff_01)', details: 'Live bed GEN-12 status transitioned to OCCUPIED. emergencyCapacity/hosp_metro_01 updated.' },
    { id: 'log_02', timestamp: '2026-09-17 11:20:04', event: 'OPD_TOKEN_ADVANCE', severity: 'INFO', actor: 'Dr. Rajesh Kumar (staff_01)', details: 'Advanced live queue token to #13 for Cardiology (dept_cardio_01).' },
    { id: 'log_03', timestamp: '2026-09-17 11:15:32', event: 'RBAC_SECURITY_INTERCEPT', severity: 'WARN', actor: 'Priya Sharma (pat_demo_01)', details: 'Prevented unauthorized access attempt to /staff/dashboard. 403 Forbidden issued.' },
    { id: 'log_04', timestamp: '2026-09-17 11:10:19', event: 'IPD_ATOMIC_DISCHARGE', severity: 'INFO', actor: 'Staff Ops (hosp_metro_01)', details: 'Discharged patient pat_004. Bed ICU-03 released to available. Bill #bill_ipd_8901 generated.' },
    { id: 'log_05', timestamp: '2026-09-17 11:05:44', event: 'SURGE_MONITOR_ALERT', severity: 'WARN', actor: 'System Telemetry Daemon', details: 'Hospital hosp_metro_04 exceeded 85% bed saturation (now 90%). Level 2 surge alert flagged.' },
    { id: 'log_06', timestamp: '2026-09-17 10:55:00', event: 'SYNTHETIC_SEED_INITIALIZE', severity: 'INFO', actor: 'Dev Anand (superadmin)', details: 'Seeded 5 hospitals, 180 beds, and 55 synthetic patients into cloud database.' },
  ];

  const filteredLogs = auditLogs.filter(
    (l) => filterType === 'all' || l.severity === filterType || l.event.includes(filterType)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
              National Health Cloud Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">Immutable Audit Trail</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Platform Security & Audit Logs
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Trace real-time operational broadcasts, cross-dashboard synchronization events, transactional bed releases, and cryptographic RBAC security checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-mono">Audit Daemon Active</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs">
        {['all', 'INFO', 'WARN', 'RBAC'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`rounded-xl px-3.5 py-1.5 font-bold transition ${
              filterType === f
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {f === 'all' ? 'All Audit Events' : f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-sans font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Classification</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Authenticated Actor</th>
                <th className="px-4 py-3">Event Telemetry Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-3 font-bold text-sky-300">{log.event}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        log.severity === 'WARN'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{log.actor}</td>
                  <td className="px-4 py-3 font-sans text-xs text-slate-300">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
