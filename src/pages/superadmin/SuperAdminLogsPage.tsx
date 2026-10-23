import React, { useState, useEffect } from 'react';
import { auditChainService } from '@/services/forensics/auditChainService';
import type { ForensicAuditEvent, ChainVerificationResult } from '@/types/appointmentWorkflow';
import {
  FileText,
  ShieldCheck,
  Radio,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Hash,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const SuperAdminLogsPage: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [forensicEvents, setForensicEvents] = useState<ForensicAuditEvent[]>([]);
  const [verification, setVerification] = useState<ChainVerificationResult | null>(null);

  const loadLogs = () => {
    const chain = auditChainService.getChain();
    setForensicEvents(chain.slice().reverse());
    setVerification(auditChainService.verifyChainIntegrity());
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSimulateTamper = () => {
    const chain = auditChainService.getChain();
    if (chain.length > 1) {
      auditChainService.simulateTamper(1, 'Unauthorized attacker altered patient record details in database.');
      loadLogs();
    }
  };

  const handleReset = () => {
    auditChainService.resetChain();
    loadLogs();
  };

  const filteredLogs = forensicEvents.filter(
    (l) => filterType === 'all' || l.severity === filterType || l.eventType.includes(filterType)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
              National Health Cloud Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">Immutable SHA-256 Audit Trail</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Platform Security & Forensics Ledger
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Trace real-time operational broadcasts, cross-dashboard synchronization events, transactional bed releases, controlled AI booking workflows, and cryptographic RBAC security checks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-mono">Forensic Daemon Active</span>
        </div>
      </div>

      {/* Cryptographic Chain Verification Banner */}
      {verification && (
        <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
          verification.isValid
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
            : 'border-rose-500/60 bg-rose-950/50 text-rose-200 animate-pulse'
        }`}>
          <div className="flex items-center gap-3">
            {verification.isValid ? (
              <ShieldCheck className="h-7 w-7 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-7 w-7 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {verification.isValid ? 'Cryptographic Hash Chain Valid & Tamper-Free' : 'Chain Integrity Anomaly Detected!'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {verification.totalBlocks} Blocks Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-sans">
                {verification.isValid
                  ? 'All sequential SHA-256 hash links match parent currentHash from Genesis block to tip. No records modified or deleted.'
                  : verification.error}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSimulateTamper}
              className="rounded-xl border border-rose-800 bg-rose-950/60 px-3.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900 transition flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Simulate Tamper</span>
            </button>
            <button
              onClick={handleReset}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Chain</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 text-xs">
        {['all', 'INFO', 'WARN', 'BOOKING_COMMITTED', 'BOOKING_DENIED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`rounded-xl px-3.5 py-1.5 font-bold transition ${
              filterType === f
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {f === 'all' ? 'All Forensic Events' : f}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-sans font-semibold">
              <tr>
                <th className="px-4 py-3">Block #</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Classification</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Authenticated Actor</th>
                <th className="px-4 py-3">Event Telemetry Details</th>
                <th className="px-4 py-3">Current SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-800/40 transition ${
                    log.tampered ? 'bg-rose-950/40 text-rose-200' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-white whitespace-nowrap">#{log.index}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-sky-300">{log.eventType}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        log.severity === 'WARN'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : log.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{log.actor.name} ({log.actor.role})</td>
                  <td className="px-4 py-3 font-sans text-xs text-slate-300 max-w-sm truncate">{log.details}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-emerald-400 font-bold">
                    {log.currentHash.substring(0, 12)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
