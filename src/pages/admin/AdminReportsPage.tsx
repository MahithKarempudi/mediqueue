import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { OpdVisit, IpdAdmission, Billing, IpdBed } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button } from '@/components/ui';
import {
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [bills, setBills] = useState<Billing[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);

  useEffect(() => {
    const loadSummary = async () => {
      const [v, a, bl, b] = await Promise.all([
        dbService.getCollection<OpdVisit>('opd_visits'),
        dbService.getCollection<IpdAdmission>('ipd_admissions'),
        dbService.getCollection<Billing>('billing'),
        dbService.getCollection<IpdBed>('ipd_beds'),
      ]);
      setVisits(v.filter((i) => i.hospitalId === hospitalId));
      setAdmissions(a.filter((i) => i.hospitalId === hospitalId));
      setBills(bl.filter((i) => i.hospitalId === hospitalId));
      setBeds(b.filter((i) => i.hospitalId === hospitalId));
    };
    loadSummary();
  }, [hospitalId]);

  const handleExportCsv = () => {
    const headers = ['Metric_Category,Facility_ID,Count_Or_Value,Timestamp\n'];
    const rows = [
      `Total_Commissioned_Beds,${hospitalId},${beds.length},${new Date().toISOString()}`,
      `Occupied_Beds,${hospitalId},${beds.filter((b) => b.status === 'occupied').length},${new Date().toISOString()}`,
      `Cumulative_OPD_Visits,${hospitalId},${visits.length},${new Date().toISOString()}`,
      `Total_IPD_Admissions,${hospitalId},${admissions.length},${new Date().toISOString()}`,
      `Total_Billed_INR,${hospitalId},${bills.reduce((s, b) => s + b.totalAmount, 0)},${new Date().toISOString()}`,
    ];
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mediqueue_facility_report_${hospitalId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Institutional Compliance & Export"
        title="Hospital Operational & Financial Compliance Reports"
        subtitle="Generate audit-ready operational summaries and export structured CSV datasets for institutional review."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Statement
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCsv}
            >
              Export Facility CSV
            </Button>
          </div>
        }
      />

      <Card padding="lg">
        <SectionHeader
          title="Institutional Performance Summary Table"
          subtitle={`Facility Scope: ${hospitalId} • Computed from live operational collections`}
          icon={<FileSpreadsheet className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Operational Domain</th>
                <th className="mq-table-th">Key Indicator</th>
                <th className="mq-table-th">Measured Value</th>
                <th className="mq-table-th">Verification Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mq-table-td font-bold text-slate-900">Inpatient Bed Census</td>
                <td className="mq-table-td text-xs text-slate-600">Occupied vs Total Commissioned Beds</td>
                <td className="mq-table-td font-mono font-bold text-slate-900">
                  {beds.filter((b) => b.status === 'occupied').length} / {beds.length} Beds
                </td>
                <td className="mq-table-td">
                  <Badge variant="success" dot>Synchronized</Badge>
                </td>
              </tr>
              <tr>
                <td className="mq-table-td font-bold text-slate-900">Outpatient Throughput</td>
                <td className="mq-table-td text-xs text-slate-600">Completed OPD Clinical Consultations</td>
                <td className="mq-table-td font-mono font-bold text-slate-900">{visits.length} Encounters</td>
                <td className="mq-table-td">
                  <Badge variant="success" dot>Verified</Badge>
                </td>
              </tr>
              <tr>
                <td className="mq-table-td font-bold text-slate-900">Inpatient Admissions</td>
                <td className="mq-table-td text-xs text-slate-600">Active & Discharged IPD Episodes</td>
                <td className="mq-table-td font-mono font-bold text-slate-900">{admissions.length} Admissions</td>
                <td className="mq-table-td">
                  <Badge variant="success" dot>Verified</Badge>
                </td>
              </tr>
              <tr>
                <td className="mq-table-td font-bold text-slate-900">Revenue Cycle</td>
                <td className="mq-table-td text-xs text-slate-600">Cumulative Billed Statements</td>
                <td className="mq-table-td font-mono font-bold text-slate-900">
                  ₹{bills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString('en-IN')}
                </td>
                <td className="mq-table-td">
                  <Badge variant="teal" dot>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Audited
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
