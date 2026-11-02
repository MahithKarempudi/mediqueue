import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital, IpdBed, OpdVisit } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button } from '@/components/ui';
import {
  Download,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';

export const GovernmentReportsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);

  useEffect(() => {
    const loadReports = async () => {
      const [h, b, v] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getCollection<OpdVisit>('opd_visits'),
      ]);
      setHospitals(h);
      setBeds(b);
      setVisits(v);
    };
    loadReports();
  }, []);

  const handleExportRegionalCsv = () => {
    const header = 'Hospital_ID,Hospital_Name,District,Sector_Type,Total_Beds,Occupied_Beds,ICU_Available,Total_OPD_Encounters\n';
    const rows = hospitals.map((h) => {
      const hb = beds.filter((b) => b.hospitalId === h.hospitalId);
      const occ = hb.filter((b) => b.status === 'occupied').length;
      const icuOpen = hb.filter((b) => b.type === 'ICU' && b.status === 'available').length;
      const hv = visits.filter((v) => v.hospitalId === h.hospitalId).length;
      return `${h.hospitalId},"${h.name}",${h.district},${h.type},${hb.length},${occ},${icuOpen},${hv}`;
    });

    const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state_health_surveillance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Public Health Statutory Reporting"
        title="Regional Epidemiological & Capacity Audit Export"
        subtitle="Download anonymized, district-stratified hospital capacity and outpatient volume datasets."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" icon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
              Print Statutory Ledger
            </Button>
            <Button variant="primary" size="md" icon={<Download className="w-4 h-4" />} onClick={handleExportRegionalCsv}>
              Download Regional CSV
            </Button>
          </div>
        }
      />

      <Card padding="lg">
        <SectionHeader
          title="Statewide Facility Capacity & Utilization Ledger"
          subtitle="Aggregated without personally identifiable patient health information"
          icon={<FileSpreadsheet className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Facility ID</th>
                <th className="mq-table-th">Hospital Name</th>
                <th className="mq-table-th">District & Sector</th>
                <th className="mq-table-th">Occupied / Total Beds</th>
                <th className="mq-table-th">Open ICU Beds</th>
                <th className="mq-table-th">OPD Consultations</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => {
                const hb = beds.filter((b) => b.hospitalId === h.hospitalId);
                const occ = hb.filter((b) => b.status === 'occupied').length;
                const icuOpen = hb.filter((b) => b.type === 'ICU' && b.status === 'available').length;
                const hv = visits.filter((v) => v.hospitalId === h.hospitalId).length;

                return (
                  <tr key={h.hospitalId} className="hover:bg-slate-50">
                    <td className="mq-table-td font-mono font-bold text-slate-700">{h.hospitalId}</td>
                    <td className="mq-table-td font-bold text-slate-900">{h.name}</td>
                    <td className="mq-table-td">
                      <Badge variant="neutral">{h.district}</Badge>{' '}
                      <span className="text-xs text-slate-500 ml-1">{h.type}</span>
                    </td>
                    <td className="mq-table-td font-mono font-bold text-slate-900">
                      {occ} / {hb.length} Beds
                    </td>
                    <td className="mq-table-td font-mono font-bold text-mediblue-700">{icuOpen} ICU</td>
                    <td className="mq-table-td font-mono text-slate-800">{hv} Visits</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
