import React, { useState } from 'react';
import { auditChainService } from '@/services/forensics/auditChainService';
import type { ForensicAuditLog } from '@/types/appointmentWorkflow';
import { PageHeader, Card, SectionHeader, Badge, Button, SearchInput } from '@/components/ui';
import {
  ShieldCheck,
  RefreshCw,
  Lock,
  FileSearch,
} from 'lucide-react';

export const SuperAdminLogsPage: React.FC = () => {
  const [ledger, setLedger] = useState<ForensicAuditLog[]>(() => auditChainService.getLedger());
  const [integrity, setIntegrity] = useState(() => auditChainService.verifyChainIntegrity());
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'CRITICAL'>('ALL');

  const refreshAuditLedger = () => {
    setLedger(auditChainService.getLedger());
    setIntegrity(auditChainService.verifyChainIntegrity());
  };

  const filteredLogs = ledger.filter((entry) => {
    const matchesSeverity = severityFilter === 'ALL' || entry.severity === severityFilter;
    const matchesSearch =
      entry.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.currentHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge="HIPAA §164.312 System Audit Controls"
        title="Clinical Audit Trail & System Event Logs"
        subtitle="Append-only verifiable event logs capturing clinical scheduling, booking authorization, consent verification, and RBAC security events."
        actions={
          <Button
            variant="secondary"
            size="md"
            icon={<RefreshCw className="w-4 h-4 text-mediteal-400" />}
            onClick={refreshAuditLedger}
          >
            Re-Verify Audit Log Integrity
          </Button>
        }
      />

      {/* Chain Integrity Verification Banner */}
      <Card padding="md" className="bg-navy-950 text-white border-navy-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mediteal-500/20 border border-mediteal-500/40 flex items-center justify-center text-mediteal-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Audit Trail Integrity Verification: {integrity.valid ? 'PASSED (UNALTERED)' : 'TAMPER DETECTED'}
              </h3>
              <p className="text-xs text-slate-400">{integrity.details}</p>
            </div>
          </div>
          <Badge variant={integrity.valid ? 'teal' : 'danger'} dot>
            {integrity.totalEvents} Verified Records
          </Badge>
        </div>
      </Card>

      {/* Filter Bar */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by actor name, event type, appointment ID, or SHA-256 hash..."
            />
          </div>
          <div className="flex gap-1.5">
            {(['ALL', 'INFO', 'WARN', 'CRITICAL'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Audit Blocks List */}
      <Card padding="lg">
        <SectionHeader
          title={`Chained Forensic Blocks (${filteredLogs.length})`}
          subtitle="Each block's SHA-256 digest commits to the previous block's hash"
          icon={<FileSearch className="w-5 h-5" />}
        />

        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.sequenceNumber}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-navy-900 text-white font-mono text-xs font-bold">
                    Block #{log.sequenceNumber}
                  </span>
                  <Badge
                    variant={
                      log.severity === 'CRITICAL'
                        ? 'danger'
                        : log.severity === 'WARN'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {log.eventType}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-700">
                    Actor: {log.actor.name} ({log.actor.role})
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed">{log.details}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono text-slate-500">
                <div className="truncate">
                  <strong className="text-slate-700">Previous Hash:</strong> {log.previousHash}
                </div>
                <div className="truncate flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-mediteal-600 shrink-0" />
                  <strong className="text-mediteal-800">Block Digest:</strong> {log.currentHash}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
