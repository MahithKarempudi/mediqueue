import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type {
  PathologyOrder,
  PathologyReport,
  RadiologyOrder,
  RadiologyReport,
} from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, Modal, NoticeBanner } from '@/components/ui';
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  FilePlus,
} from 'lucide-react';

export const DiagnosticOrdersPage: React.FC = () => {
  const [pathOrders, setPathOrders] = useState<PathologyOrder[]>([]);
  const [radOrders, setRadOrders] = useState<RadiologyOrder[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [activePathOrder, setActivePathOrder] = useState<PathologyOrder | null>(null);
  const [activeRadOrder, setActiveRadOrder] = useState<RadiologyOrder | null>(null);

  // Pathology Report Authoring State
  const [hemoglobin, setHemoglobin] = useState('14.2 g/dL (Ref: 13.5 - 17.5)');
  const [wbc, setWbc] = useState('7,100 /mcL (Ref: 4,500 - 11,000)');
  const [platelets, setPlatelets] = useState('260,000 /mcL (Ref: 150,000 - 450,000)');
  const [pathSummary, setPathSummary] = useState('All hematological and biochemical parameters within normal physiological limits.');

  // Radiology Report Authoring State
  const [radFindings, setRadFindings] = useState('Normal chamber dimensions and preserved biventricular systolic function (LVEF 60%). No pericardial effusion.');
  const [radImpression, setRadImpression] = useState('Unremarkable diagnostic imaging study.');

  useEffect(() => {
    const loadOrders = async () => {
      const [po, ro] = await Promise.all([
        dbService.getCollection<PathologyOrder>('pathology_orders'),
        dbService.getCollection<RadiologyOrder>('radiology_orders'),
      ]);
      setPathOrders(po);
      setRadOrders(ro);
    };
    loadOrders();

    const unsubPo = dbService.subscribeCollection<PathologyOrder>('pathology_orders', setPathOrders);
    const unsubRo = dbService.subscribeCollection<RadiologyOrder>('radiology_orders', setRadOrders);
    return () => {
      unsubPo();
      unsubRo();
    };
  }, []);

  const handleAdvancePathStatus = async (order: PathologyOrder) => {
    if (order.status === 'ordered') {
      await dbService.updateDocument('pathology_orders', order.orderId, { status: 'sample_collected' });
      setStatusMsg(`Sample accessioned for Pathology Order ${order.orderId}.`);
    } else if (order.status === 'sample_collected') {
      setActivePathOrder(order);
    }
  };

  const handlePublishPathReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePathOrder) return;

    const repId = `PATH-REP-${Date.now().toString().slice(-4)}`;
    const report: PathologyReport = {
      reportId: repId,
      orderId: activePathOrder.orderId,
      patientId: activePathOrder.patientId,
      testName: activePathOrder.testName,
      resultData: {
        'Hemoglobin': hemoglobin,
        'Total Leukocyte Count': wbc,
        'Platelet Count': platelets,
      },
      summary: pathSummary,
      reportedAt: new Date().toISOString(),
    };

    await dbService.setDocument('pathology_reports', repId, report);
    await dbService.updateDocument('pathology_orders', activePathOrder.orderId, { status: 'completed' });
    setStatusMsg(`Verified Pathology Report ${repId} published to Patient Portal for ${activePathOrder.patientId}.`);
    setActivePathOrder(null);
  };

  const handleAdvanceRadStatus = async (order: RadiologyOrder) => {
    if (order.status === 'ordered') {
      await dbService.updateDocument('radiology_orders', order.orderId, { status: 'scheduled' });
      setStatusMsg(`Imaging slot scheduled for Radiology Order ${order.orderId}.`);
    } else if (order.status === 'scheduled') {
      setActiveRadOrder(order);
    }
  };

  const handlePublishRadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRadOrder) return;

    const repId = `RAD-REP-${Date.now().toString().slice(-4)}`;
    const report: RadiologyReport = {
      reportId: repId,
      orderId: activeRadOrder.orderId,
      patientId: activeRadOrder.patientId,
      modality: `${activeRadOrder.modality} — ${activeRadOrder.bodyPart}`,
      findings: radFindings,
      impression: radImpression,
      reportedAt: new Date().toISOString(),
    };

    await dbService.setDocument('radiology_reports', repId, report);
    await dbService.updateDocument('radiology_orders', activeRadOrder.orderId, { status: 'completed' });
    setStatusMsg(`Verified Radiology Study ${repId} published to Patient Portal for ${activeRadOrder.patientId}.`);
    setActiveRadOrder(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="LIS & RIS Diagnostic Workstation"
        title="Laboratory & Radiology Order Fulfillment"
        subtitle="Process sample collection, author quantitative assay parameters, and release verified reports to patient records."
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="Diagnostic LIS/RIS Updated" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pathology Queue */}
        <Card padding="lg">
          <SectionHeader
            title={`Pathology & Biochemistry Queue (${pathOrders.length})`}
            subtitle="Ordered → Sample Collected → Verified Report"
            icon={<FlaskConical className="w-5 h-5" />}
          />

          <div className="space-y-3">
            {pathOrders.map((po) => (
              <div
                key={po.orderId}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-mediblue-700">{po.orderId}</span>
                    <Badge
                      variant={
                        po.status === 'completed'
                          ? 'success'
                          : po.status === 'sample_collected'
                          ? 'info'
                          : 'warning'
                      }
                      dot
                    >
                      {po.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{po.testName}</h4>
                  <p className="text-xs text-slate-500">
                    Patient ID: <strong>{po.patientId.toUpperCase()}</strong> • Ordered:{' '}
                    {new Date(po.orderedAt).toLocaleDateString()}
                  </p>
                </div>

                {po.status !== 'completed' && (
                  <Button
                    variant={po.status === 'sample_collected' ? 'primary' : 'outline'}
                    size="sm"
                    icon={<FilePlus className="w-3.5 h-3.5" />}
                    onClick={() => handleAdvancePathStatus(po)}
                  >
                    {po.status === 'ordered' ? 'Mark Sample Collected' : 'Author & Sign Report'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Radiology Queue */}
        <Card padding="lg">
          <SectionHeader
            title={`Radiology & Cardiology Imaging Queue (${radOrders.length})`}
            subtitle="Ordered → Scheduled → Finalized Study"
            icon={<Activity className="w-5 h-5" />}
          />

          <div className="space-y-3">
            {radOrders.map((ro) => (
              <div
                key={ro.orderId}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-mediteal-700">{ro.orderId}</span>
                    <Badge
                      variant={
                        ro.status === 'completed'
                          ? 'success'
                          : ro.status === 'scheduled'
                          ? 'info'
                          : 'warning'
                      }
                      dot
                    >
                      {ro.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {ro.modality} — {ro.bodyPart}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Patient ID: <strong>{ro.patientId.toUpperCase()}</strong> • Ordered:{' '}
                    {new Date(ro.orderedAt).toLocaleDateString()}
                  </p>
                </div>

                {ro.status !== 'completed' && (
                  <Button
                    variant={ro.status === 'scheduled' ? 'primary' : 'outline'}
                    size="sm"
                    icon={<FilePlus className="w-3.5 h-3.5" />}
                    onClick={() => handleAdvanceRadStatus(ro)}
                  >
                    {ro.status === 'ordered' ? 'Schedule Modality' : 'Author Study Findings'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pathology Authoring Modal */}
      <Modal
        open={activePathOrder !== null}
        onClose={() => setActivePathOrder(null)}
        title={`Author Pathology Assay — ${activePathOrder?.testName}`}
        subtitle={`Order ID: ${activePathOrder?.orderId} • Patient: ${activePathOrder?.patientId}`}
      >
        <form onSubmit={handlePublishPathReport} className="space-y-4">
          <div>
            <label className="mq-label">Hemoglobin (g/dL)</label>
            <input type="text" value={hemoglobin} onChange={(e) => setHemoglobin(e.target.value)} className="mq-input" />
          </div>
          <div>
            <label className="mq-label">Total Leukocyte Count (/mcL)</label>
            <input type="text" value={wbc} onChange={(e) => setWbc(e.target.value)} className="mq-input" />
          </div>
          <div>
            <label className="mq-label">Platelet Count (/mcL)</label>
            <input type="text" value={platelets} onChange={(e) => setPlatelets(e.target.value)} className="mq-input" />
          </div>
          <div>
            <label className="mq-label">Pathologist Clinical Interpretation</label>
            <textarea rows={2} value={pathSummary} onChange={(e) => setPathSummary(e.target.value)} className="mq-input" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setActivePathOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
              Sign & Release Lab Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Radiology Authoring Modal */}
      <Modal
        open={activeRadOrder !== null}
        onClose={() => setActiveRadOrder(null)}
        title={`Author Radiology Study — ${activeRadOrder?.modality}`}
        subtitle={`Order ID: ${activeRadOrder?.orderId} • Patient: ${activeRadOrder?.patientId}`}
      >
        <form onSubmit={handlePublishRadReport} className="space-y-4">
          <div>
            <label className="mq-label">Radiological Findings</label>
            <textarea rows={3} value={radFindings} onChange={(e) => setRadFindings(e.target.value)} className="mq-input" />
          </div>
          <div>
            <label className="mq-label">Consultant Diagnostic Impression</label>
            <input type="text" value={radImpression} onChange={(e) => setRadImpression(e.target.value)} className="mq-input" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setActiveRadOrder(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
              Sign & Release Imaging Study
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
