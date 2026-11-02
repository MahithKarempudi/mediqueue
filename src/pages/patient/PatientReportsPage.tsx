import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { PathologyReport, RadiologyReport, PathologyOrder, RadiologyOrder } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, Modal } from '@/components/ui';
import {
  FileText,
  FlaskConical,
  Activity,
  Printer,
  CheckCircle2,
  Clock,
  Eye,
  ShieldCheck,
} from 'lucide-react';

export const PatientReportsPage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_0001';

  const [pathReports, setPathReports] = useState<PathologyReport[]>([]);
  const [radReports, setRadReports] = useState<RadiologyReport[]>([]);
  const [pathOrders, setPathOrders] = useState<PathologyOrder[]>([]);
  const [radOrders, setRadOrders] = useState<RadiologyOrder[]>([]);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PATHOLOGY' | 'RADIOLOGY'>('ALL');
  const [selectedPathReport, setSelectedPathReport] = useState<PathologyReport | null>(null);
  const [selectedRadReport, setSelectedRadReport] = useState<RadiologyReport | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      const [pr, rr, po, ro] = await Promise.all([
        dbService.getCollection<PathologyReport>('pathology_reports'),
        dbService.getCollection<RadiologyReport>('radiology_reports'),
        dbService.getCollection<PathologyOrder>('pathology_orders'),
        dbService.getCollection<RadiologyOrder>('radiology_orders'),
      ]);
      setPathReports(pr.filter((r) => r.patientId === patientId));
      setRadReports(rr.filter((r) => r.patientId === patientId));
      setPathOrders(po.filter((o) => o.patientId === patientId));
      setRadOrders(ro.filter((o) => o.patientId === patientId));
    };
    loadReports();

    const unsubPath = dbService.subscribeCollection<PathologyReport>('pathology_reports', (all) => {
      setPathReports(all.filter((r) => r.patientId === patientId));
    });
    const unsubRad = dbService.subscribeCollection<RadiologyReport>('radiology_reports', (all) => {
      setRadReports(all.filter((r) => r.patientId === patientId));
    });
    return () => {
      unsubPath();
      unsubRad();
    };
  }, [patientId]);

  const pendingOrders = [
    ...pathOrders.filter((o) => o.status !== 'completed').map((o) => ({
      id: o.orderId,
      type: 'Pathology Lab',
      name: o.testName,
      status: o.status,
      orderedAt: o.orderedAt,
    })),
    ...radOrders.filter((o) => o.status !== 'completed').map((o) => ({
      id: o.orderId,
      type: `Radiology (${o.modality})`,
      name: o.bodyPart,
      status: o.status,
      orderedAt: o.orderedAt,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="LIS & RIS Clinical Records"
        title="Diagnostic Laboratory & Imaging Reports"
        subtitle="Inspect verified pathology analyte panels with physiological reference ranges and diagnostic radiology impressions."
        actions={
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
            {(['ALL', 'PATHOLOGY', 'RADIOLOGY'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterTab === tab
                    ? 'bg-navy-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Verified Reports' : tab === 'PATHOLOGY' ? 'Pathology Lab' : 'Radiology & Imaging'}
              </button>
            ))}
          </div>
        }
      />

      {/* Active In-Progress Diagnostic Orders */}
      {pendingOrders.length > 0 && (
        <Card padding="md" className="bg-slate-50 border-slate-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-mediblue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              In-Progress Diagnostic Orders ({pendingOrders.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono text-slate-400">{ord.id} • {ord.type}</span>
                  <h4 className="text-sm font-bold text-slate-900">{ord.name}</h4>
                </div>
                <Badge variant="warning" dot>
                  {ord.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pathology Reports Section */}
      {(filterTab === 'ALL' || filterTab === 'PATHOLOGY') && (
        <div className="space-y-4">
          <SectionHeader
            title={`Pathology & Biochemistry Panels (${pathReports.length})`}
            subtitle="Quantitative laboratory assays with reference interval comparisons"
            icon={<FlaskConical className="w-5 h-5" />}
          />

          {pathReports.length === 0 ? (
            <Card padding="lg">
              <p className="text-xs text-slate-500 text-center py-4">No released pathology reports found.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pathReports.map((rep) => (
                <Card key={rep.reportId} padding="lg">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-mediblue-50 border border-mediblue-100 flex items-center justify-center text-mediblue-600 shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{rep.testName}</h3>
                          <Badge variant="success" dot>Verified Lab Assay</Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Report Ref: {rep.reportId} • Order Ref: {rep.orderId} • Released:{' '}
                          {new Date(rep.reportedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedPathReport(rep)}
                      >
                        Full Certificate
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => window.print()}
                      >
                        Print
                      </Button>
                    </div>
                  </div>

                  {/* Parameter Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-4">
                    {Object.entries(rep.resultData).map(([analyte, val]) => (
                      <div
                        key={analyte}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                      >
                        <span className="text-xs font-semibold text-slate-500">{analyte}</span>
                        <span className="text-sm font-bold font-mono text-slate-900 mt-1">{val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Pathologist Clinical Summary: </strong>
                      {rep.summary}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Radiology Reports Section */}
      {(filterTab === 'ALL' || filterTab === 'RADIOLOGY') && (
        <div className="space-y-4">
          <SectionHeader
            title={`Diagnostic Radiology & Cardiology Studies (${radReports.length})`}
            subtitle="Structured imaging findings and specialist consultant impressions"
            icon={<Activity className="w-5 h-5" />}
          />

          {radReports.length === 0 ? (
            <Card padding="lg">
              <p className="text-xs text-slate-500 text-center py-4">No released radiology studies found.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {radReports.map((rep) => (
                <Card key={rep.reportId} padding="lg">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-mediteal-50 border border-mediteal-100 flex items-center justify-center text-mediteal-600 shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900">{rep.modality}</h3>
                          <Badge variant="teal" dot>Finalized Study</Badge>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          Report Ref: {rep.reportId} • Order Ref: {rep.orderId} • Released:{' '}
                          {new Date(rep.reportedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedRadReport(rep)}
                    >
                      View Study Certificate
                    </Button>
                  </div>

                  <div className="space-y-3 mt-4 text-xs leading-relaxed">
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Radiological Findings
                      </span>
                      <p className="text-slate-800">{rep.findings}</p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-mediblue-50/60 border border-mediblue-200">
                      <span className="font-bold uppercase tracking-wider text-mediblue-800 block mb-1">
                        Diagnostic Impression
                      </span>
                      <p className="font-semibold text-slate-900">{rep.impression}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pathology Modal */}
      <Modal
        open={selectedPathReport !== null}
        onClose={() => setSelectedPathReport(null)}
        title={selectedPathReport?.testName || 'Laboratory Certificate'}
        subtitle={`Report ID: ${selectedPathReport?.reportId} • Patient ID: ${patientId}`}
        size="lg"
      >
        {selectedPathReport && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span>Patient: <strong>{user?.name || 'Aarav Sharma'}</strong></span>
              <span>Verified Date: <strong>{new Date(selectedPathReport.reportedAt).toLocaleString()}</strong></span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="mq-table-th">Analyte Parameter</th>
                  <th className="mq-table-th">Observed Value & Reference Range</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedPathReport.resultData).map(([k, v]) => (
                  <tr key={k}>
                    <td className="mq-table-td font-semibold text-slate-800">{k}</td>
                    <td className="mq-table-td font-mono text-slate-900">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              <strong>Pathologist Remarks:</strong> {selectedPathReport.summary}
            </div>
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-mediteal-600" />
                Electronically signed by Department of Laboratory Medicine
              </span>
              <Button variant="primary" size="sm" onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
                Print Official Report
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Radiology Modal */}
      <Modal
        open={selectedRadReport !== null}
        onClose={() => setSelectedRadReport(null)}
        title={selectedRadReport?.modality || 'Radiology Certificate'}
        subtitle={`Study ID: ${selectedRadReport?.reportId} • Patient ID: ${patientId}`}
        size="lg"
      >
        {selectedRadReport && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="uppercase text-slate-500 block mb-1">Detailed Findings</strong>
              <p className="text-sm text-slate-800">{selectedRadReport.findings}</p>
            </div>
            <div className="p-4 rounded-xl bg-mediteal-50 border border-mediteal-200">
              <strong className="uppercase text-mediteal-800 block mb-1">Final Consultant Impression</strong>
              <p className="text-sm font-bold text-slate-900">{selectedRadReport.impression}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => window.print()} icon={<FileText className="w-3.5 h-3.5" />}>
                Print Study Certificate
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
