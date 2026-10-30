import React, { useState, useEffect } from 'react';
import { activityLogService, type SecurityActivityLog, type LogSeverity } from '@/services/logging/activityLogService';
import {
  FileText,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  RefreshCw,
  Download,
  Filter,
  Activity,
  Building2,
  Lock,
} from 'lucide-react';

export const SuperAdminLogsPage: React.FC = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<SecurityActivityLog[]>([]);

  const loadLogs = () => {
    const rawLogs = activityLogService.getLogs();
    setLogs(rawLogs);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLogs = () => {
    activityLogService.clearLogs();
    loadLogs();
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mediqueue_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesSearch =
      searchQuery === '' ||
      log.actionSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.hospitalId && log.hospitalId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSeverity && matchesSearch;
  });

  const totalLogs = logs.length;
  const warningLogs = logs.filter((l) => l.severity === 'WARN' || l.severity === 'ERROR').length;
  const uniqueHospitals = new Set(logs.map((l) => l.hospitalId).filter(Boolean)).size;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-mediblue-500/10 px-2.5 py-0.5 text-xs font-semibold text-mediblue-400 border border-mediblue-500/20">
              Enterprise Governance
            </span>
            <span className="text-xs text-slate-400 font-mono">System Audit Log & RBAC Monitoring</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Platform Activity & Security Audit Logs
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Real-time audit log of access events, clinical transitions, OPD appointment reservations, and administrative operations across all tenant hospitals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4 text-sky-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="rounded-xl border border-rose-900/60 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset Logs (Demo)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Activity Events</p>
            <p className="text-2xl font-bold text-white mt-1">{totalLogs}</p>
          </div>
          <div className="p-3 rounded-xl bg-mediblue-500/10 border border-mediblue-500/20 text-mediblue-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Security Warnings / Denials</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{warningLogs}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Monitored Facilities</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{uniqueHospitals || 5}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Severity Tabs */}
        <div className="flex gap-2 text-xs">
          {['all', 'INFO', 'WARN', 'ERROR'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`rounded-xl px-3.5 py-1.5 font-bold transition ${
                filterSeverity === s
                  ? 'bg-mediblue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s === 'all' ? 'All Severities' : s}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by actor, action, or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-mediblue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Authenticated Actor</th>
                <th className="px-4 py-3">Action Summary</th>
                <th className="px-4 py-3">Target Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No activity logs matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-sky-300 font-mono text-[11px] whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          log.severity === 'ERROR'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : log.severity === 'WARN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-white">{log.actor.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{log.actor.role.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 max-w-md">
                      {log.actionSummary}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {log.hospitalId ? (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          {log.hospitalId}
                        </span>
                      ) : log.targetPatientId ? (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                          {log.targetPatientId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
