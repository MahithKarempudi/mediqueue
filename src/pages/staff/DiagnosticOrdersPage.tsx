import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { PathologyOrder, PathologyReport, RadiologyOrder, RadiologyReport, Patient } from '@/types';
import {
  Microscope,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  Eye,
  Filter,
} from 'lucide-react';

export const DiagnosticOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pathology' | 'radiology'>('pathology');
  const [pathOrders, setPathOrders] = useState<PathologyOrder[]>([]);
  const [radOrders, setRadOrders] = useState<RadiologyOrder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportFindings, setReportFindings] = useState('');

  useEffect(() => {
    const load = async () => {
      const [pOrders, rOrders, pats] = await Promise.all([
        dbService.getCollection<PathologyOrder>('pathology_orders'),
        dbService.getCollection<RadiologyOrder>('radiology_orders'),
        dbService.getCollection<Patient>('patients'),
      ]);

      if (pOrders.length === 0) {
        // Seed initial orders for immediate demo
        const initialPath: PathologyOrder[] = [
          { orderId: 'ord_path_01', patientId: 'pat_demo_01', testType: 'Complete Blood Count (CBC)', status: 'processing', orderedAt: new Date(Date.now() - 3600000).toISOString() },
          { orderId: 'ord_path_02', patientId: 'pat_002', testType: 'Lipid Profile', status: 'ordered', orderedAt: new Date(Date.now() - 7200000).toISOString() },
          { orderId: 'ord_path_03', patientId: 'pat_003', testType: 'Liver Function Test (LFT)', status: 'completed', orderedAt: new Date(Date.now() - 86400000).toISOString() },
        ];
        const initialRad: RadiologyOrder[] = [
          { orderId: 'ord_rad_01', patientId: 'pat_demo_01', scanType: 'Chest X-Ray PA View', status: 'processing', orderedAt: new Date(Date.now() - 7200000).toISOString() },
          { orderId: 'ord_rad_02', patientId: 'pat_004', scanType: 'MRI Knee Joint', status: 'ordered', orderedAt: new Date(Date.now() - 14400000).toISOString() },
        ];
        for (const o of initialPath) await dbService.setDocument('pathology_orders', o.orderId, o);
        for (const o of initialRad) await dbService.setDocument('radiology_orders', o.orderId, o);
        setPathOrders(initialPath);
        setRadOrders(initialRad);
      } else {
        setPathOrders(pOrders);
        setRadOrders(rOrders);
      }
      setPatients(pats);
    };
    load();
  }, []);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string, isPath: boolean) => {
    const nextStatus = currentStatus === 'ordered' ? 'sample_collected' : currentStatus === 'sample_collected' ? 'processing' : 'completed';
    const col = isPath ? 'pathology_orders' : 'radiology_orders';

    await dbService.updateDocument(col, orderId, { status: nextStatus as any }, 'orderId');
    if (isPath) {
      setPathOrders(pathOrders.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus as any } : o)));
    } else {
      setRadOrders(radOrders.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus as any } : o)));
    }
    setFeedback(`Order #${orderId} advanced to ${nextStatus.toUpperCase()}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveReport = async () => {
    if (!selectedOrder) return;
    const reportId = `rep_${Date.now()}`;

    if (activeTab === 'pathology') {
      const rep: PathologyReport = {
        reportId,
        orderId: selectedOrder.orderId,
        patientId: selectedOrder.patientId,
        testType: selectedOrder.testType,
        resultData: {
          'Hemoglobin': { value: 13.8, normalRange: '12.0 - 15.5', unit: 'g/dL', flag: 'normal' },
          'WBC Count': { value: 7200, normalRange: '4,000 - 11,000', unit: '/mcL', flag: 'normal' },
          'Platelets': { value: 245000, normalRange: '150,000 - 450,000', unit: '/mcL', flag: 'normal' },
          'Fasting Glucose': { value: 104, normalRange: '70 - 99', unit: 'mg/dL', flag: 'high' },
        },
        verifiedBy: user?.name || 'Dr. Pathologist',
        generatedAt: new Date().toISOString(),
      };
      await dbService.setDocument('pathology_reports', reportId, rep);
      await dbService.updateDocument('pathology_orders', selectedOrder.orderId, { status: 'completed' }, 'orderId');
      setPathOrders(pathOrders.map((o) => (o.orderId === selectedOrder.orderId ? { ...o, status: 'completed' } : o)));
    } else {
      const rep: RadiologyReport = {
        reportId,
        orderId: selectedOrder.orderId,
        patientId: selectedOrder.patientId,
        scanType: selectedOrder.scanType,
        findings: reportFindings || 'Normal cardiac shadow. Lung fields appear clear bilaterally. No pleural effusion or active infiltrates identified.',
        radiologistId: user?.uid || 'rad_01',
        generatedAt: new Date().toISOString(),
      };
      await dbService.setDocument('radiology_reports', reportId, rep);
      await dbService.updateDocument('radiology_orders', selectedOrder.orderId, { status: 'completed' }, 'orderId');
      setRadOrders(radOrders.map((o) => (o.orderId === selectedOrder.orderId ? { ...o, status: 'completed' } : o)));
    }

    setReportModalOpen(false);
    setFeedback(`Report #${reportId} verified and published to patient medical records!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
              Laboratory & Imaging Information System (LIS/RIS)
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Diagnostic Investigations Console
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Track pathology specimens (CBC, LFT, KFT) and radiology imaging workflows (X-Ray, CT, MRI) from order through sample processing to verified report delivery.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('pathology')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'pathology' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pathology Laboratory ({pathOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('radiology')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'radiology' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Radiology & Scans ({radOrders.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Microscope className="h-4 w-4 text-teal-400" />
            <span>Active {activeTab === 'pathology' ? 'Pathology Test' : 'Radiology Scan'} Orders</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Investigation Name</th>
                <th className="px-4 py-3">Ordered Date</th>
                <th className="px-4 py-3">Lifecycle Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {(activeTab === 'pathology' ? pathOrders : radOrders).map((ord: any) => {
                const pat = patients.find((p) => p.patientId === ord.patientId);
                const isCompleted = ord.status === 'completed';

                return (
                  <tr key={ord.orderId} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-400">{ord.orderId}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {pat?.name || ord.patientId}
                      <span className="block text-[10px] text-slate-500 font-mono">ID: {ord.patientId}</span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{ord.testType || ord.scanType}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(ord.orderedAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          ord.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : ord.status === 'processing'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {!isCompleted && (
                        <button
                          onClick={() => handleAdvanceStatus(ord.orderId, ord.status, activeTab === 'pathology')}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-[11px] font-semibold transition"
                        >
                          Advance Status
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setReportModalOpen(true);
                        }}
                        className="rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-300 hover:bg-teal-600 hover:text-white px-2.5 py-1 text-[11px] font-semibold transition"
                      >
                        {isCompleted ? 'View Report' : 'Author Report'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Author Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-400" />
              <span>Diagnostic Report Authorization</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Publish clinical findings for order #{selectedOrder?.orderId} ({selectedOrder?.testType || selectedOrder?.scanType}).
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Clinical Findings & Interpretation</label>
                <textarea
                  rows={4}
                  value={reportFindings}
                  onChange={(e) => setReportFindings(e.target.value)}
                  placeholder="Enter medical observation, pathology markers, or radiologic impression..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
                />
              </div>

              <div className="rounded-xl bg-slate-950/70 p-3 border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Sign-off Specialist:</span>
                  <span className="text-slate-200 font-semibold">{user?.name || 'Dr. Pathologist'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Record Security:</span>
                  <span className="text-emerald-400">Appends directly to centralized patient timeline</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReport}
                  className="rounded-xl bg-teal-600 px-4 py-2 font-bold text-white hover:bg-teal-500"
                >
                  Authorize & Release Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
