import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { LiveQueue, QueueToken, OpdVisit, Prescription, MedicineItem, Billing } from '@/types';
import {
  Stethoscope,
  Users,
  Radio,
  ArrowRight,
  Plus,
  Trash2,
  FileCheck,
  CheckCircle2,
  Microscope,
  DollarSign,
  AlertCircle,
  Building2,
} from 'lucide-react';

export const DoctorOpdQueuePage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';
  const departmentId = user?.departmentId || 'dept_cardio_01';

  const [currentToken, setCurrentToken] = useState<number>(12);
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [activePatient, setActivePatient] = useState<{
    tokenNo: number;
    name: string;
    id: string;
  }>({
    tokenNo: 12,
    name: 'Aarav Patel',
    id: 'pat_002',
  });

  const [diagnosis, setDiagnosis] = useState(
    'Stage 1 Essential Hypertension with mild resting tachycardia.'
  );
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    {
      medicineName: 'Amlodipine Besylate',
      dosage: '5 mg',
      frequency: 'Once daily (Morning)',
      duration: '30 Days',
      instructions: 'After breakfast with water',
    },
    {
      medicineName: 'Metoprolol Succinate',
      dosage: '25 mg',
      frequency: 'Once daily',
      duration: '30 Days',
      instructions: 'Monitor resting pulse',
    },
  ]);

  const [newMed, setNewMed] = useState<MedicineItem>({
    medicineName: '',
    dosage: '10 mg',
    frequency: 'Once daily',
    duration: '15 Days',
    instructions: 'After meals',
  });

  const [orderLabTests, setOrderLabTests] = useState<{ [key: string]: boolean }>({
    'Complete Blood Count (CBC)': true,
    'Lipid Profile': true,
    'Liver Function Test (LFT)': false,
    'Renal Function Test (KFT)': false,
    'Chest X-Ray PA View': false,
  });

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const queuePath = `liveQueues/${hospitalId}/${departmentId}`;
    const unsub = dbService.subscribeRTDB<LiveQueue>(queuePath, (data) => {
      if (data) {
        setCurrentToken(data.currentToken || 12);
        if (data.tokenList && data.tokenList.length > 0) {
          setTokens(data.tokenList);
        } else {
          // Synthetic initial token list for demo
          setTokens([
            { tokenNo: 12, patientId: 'pat_002', patientName: 'Aarav Patel', status: 'in_consultation', joinedAt: new Date().toISOString() },
            { tokenNo: 13, patientId: 'pat_003', patientName: 'Sunita Mehra', status: 'waiting', joinedAt: new Date().toISOString() },
            { tokenNo: 14, patientId: 'pat_004', patientName: 'Rohan Deshmukh', status: 'waiting', joinedAt: new Date().toISOString() },
            { tokenNo: 15, patientId: 'pat_demo_01', patientName: 'Priya Sharma (Patient Demo)', status: 'waiting', joinedAt: new Date().toISOString() },
            { tokenNo: 16, patientId: 'pat_006', patientName: 'Vikram Chawla', status: 'waiting', joinedAt: new Date().toISOString() },
          ]);
        }
      }
    });

    return () => unsub();
  }, [hospitalId, departmentId]);

  const handleCallNextToken = async () => {
    const nextTokenNo = currentToken + 1;
    const nextPat = tokens.find((t) => t.tokenNo === nextTokenNo) || {
      tokenNo: nextTokenNo,
      patientName: `Patient #${nextTokenNo}`,
      patientId: `pat_${nextTokenNo}`,
    };

    setCurrentToken(nextTokenNo);
    setActivePatient({
      tokenNo: nextTokenNo,
      name: nextPat.patientName,
      id: nextPat.patientId,
    });

    // Update Realtime Database liveQueues so all connected patient apps update immediately!
    const queuePath = `liveQueues/${hospitalId}/${departmentId}`;
    await dbService.setRTDB(queuePath, {
      currentToken: nextTokenNo,
      tokenList: tokens.map((t) => (t.tokenNo === nextTokenNo ? { ...t, status: 'in_consultation' } : t)),
      lastUpdated: new Date().toISOString(),
      departmentId,
    });

    setFeedback(`Called Token #${nextTokenNo} (${nextPat.patientName}) to Consultation Desk. Patient dashboards updated!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAddMedicine = () => {
    if (!newMed.medicineName) return;
    setMedicines([...medicines, newMed]);
    setNewMed({ medicineName: '', dosage: '10 mg', frequency: 'Once daily', duration: '15 Days', instructions: 'After meals' });
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleCompleteConsultation = async () => {
    const visitId = `vis_${Date.now()}`;
    const prescriptionId = `rx_${Date.now()}`;
    const billId = `bill_opd_${Date.now().toString().slice(-4)}`;

    // 1. Record OPD visit in Firestore
    const visit: OpdVisit = {
      visitId,
      patientId: activePatient.id,
      hospitalId,
      departmentId,
      doctorId: user?.uid || 'staff_01',
      tokenNo: activePatient.tokenNo,
      checkInTime: new Date().toISOString(),
      consultationNotes: diagnosis,
      status: 'completed',
    };
    await dbService.setDocument('opd_visits', visitId, visit);

    // 2. Record digital prescription in Firestore
    const rx: Prescription = {
      prescriptionId,
      visitId,
      patientId: activePatient.id,
      medicines,
      notes: diagnosis,
      prescribedAt: new Date().toISOString(),
      doctorName: user?.name || 'Dr. Rajesh Kumar',
    };
    await dbService.setDocument('prescriptions', prescriptionId, rx);

    // 3. Dispatch Diagnostic Orders if any were selected
    const selectedLabList = Object.keys(orderLabTests).filter((k) => orderLabTests[k]);
    for (const test of selectedLabList) {
      const orderId = `ord_lab_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      await dbService.setDocument('pathology_orders', orderId, {
        orderId,
        patientId: activePatient.id,
        visitId,
        testType: test,
        status: 'ordered',
        orderedAt: new Date().toISOString(),
      });
    }

    // 4. Generate Point-of-Care OPD Consultation Bill
    const lineItems = [
      { id: 'li_cons', description: 'Consultant Medical Examination Fee', category: 'OPD' as any, quantity: 1, unitPrice: 800, totalPrice: 800 },
      ...selectedLabList.map((t, i) => ({
        id: `li_lab_${i}`,
        description: `Diagnostic: ${t}`,
        category: 'PATH' as any,
        quantity: 1,
        unitPrice: 450,
        totalPrice: 450,
      })),
    ];

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const bill: Billing = {
      billId,
      patientId: activePatient.id,
      hospitalId,
      sourceType: 'OPD',
      lineItems,
      subtotal,
      discount: 0,
      total: subtotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await dbService.setDocument('billing', billId, bill);

    setFeedback(`Consultation for ${activePatient.name} completed! Digital Rx saved, diagnostics ordered, and invoice dispatched.`);
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
              Doctor Consultation Desk
            </span>
            <span className="text-xs text-slate-400 font-mono">Room 104 • OPD Suite</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Live Consultation Console — {user?.name || 'Dr. Rajesh Kumar'}
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Advance the digital OPD queue in real-time, record patient diagnoses, prescribe medications, order lab investigations, and dispatch unified bills.
          </p>
        </div>

        {/* Call Next Token Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCallNextToken}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-mediblue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-sky-950/60 hover:from-sky-500 hover:to-mediblue-500 transition scale-105"
          >
            <Users className="h-4 w-4" />
            <span>Call Next Token (#{currentToken + 1})</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Main Consultation Desk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Queue Panel */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" />
                <span>OPD Queue Waiting Room</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40 animate-pulse">
                Live RTDB
              </span>
            </div>

            <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
              {tokens.map((t) => {
                const isActive = t.tokenNo === currentToken;
                return (
                  <div
                    key={t.tokenNo}
                    onClick={() => {
                      setCurrentToken(t.tokenNo);
                      setActivePatient({ tokenNo: t.tokenNo, name: t.patientName, id: t.patientId });
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isActive
                        ? 'border-sky-500 bg-sky-950/40 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">#{t.tokenNo}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          isActive
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isActive ? 'In Room' : 'Waiting'}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-xs text-white truncate">{t.patientName}</p>
                    <span className="text-[10px] font-mono text-slate-500">ID: {t.patientId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Columns: Active Consultation Sheet */}
        <div className="col-span-1 lg:col-span-2 space-y-5">
          {/* Active Patient Details Banner */}
          <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Active Consultation Case
                </span>
                <h2 className="mt-1 text-xl font-bold text-white flex items-center gap-2">
                  <span>{activePatient.name}</span>
                  <span className="rounded-lg bg-sky-500/20 text-sky-300 text-xs px-2 py-0.5 font-mono">
                    Token #{activePatient.tokenNo}
                  </span>
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400">Patient ID:</span>
                <p className="font-mono font-bold text-teal-400">{activePatient.id}</p>
              </div>
            </div>

            {/* Diagnosis Notes */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Clinical Diagnosis & Consultation Notes
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Digital Prescription Writer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-teal-400" />
                <span>Digital Prescription (Rx)</span>
              </h3>
              <span className="text-[10px] text-slate-400">{medicines.length} Medicines Prescribed</span>
            </div>

            {/* Medicine List */}
            <div className="mt-3 space-y-2">
              {medicines.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-950/70 p-2.5 border border-slate-800/80 text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{m.medicineName}</span>
                    <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-teal-300 font-mono">
                      {m.dosage}
                    </span>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {m.frequency} • {m.duration} ({m.instructions})
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMedicine(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Medicine Mini-Form */}
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                placeholder="Medicine (e.g. Atorvastatin)"
                value={newMed.medicineName}
                onChange={(e) => setNewMed({ ...newMed, medicineName: e.target.value })}
                className="col-span-1 sm:col-span-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white"
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 10 mg)"
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-white"
              />
              <button
                type="button"
                onClick={handleAddMedicine}
                className="rounded-lg bg-teal-600 px-3 py-1.5 font-bold text-white hover:bg-teal-500 transition text-[11px]"
              >
                + Add Medicine
              </button>
            </div>
          </div>

          {/* Diagnostic Investigation Orders */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Microscope className="h-4 w-4 text-indigo-400" />
              <span>Order Diagnostic Pathology & Radiology Tests</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.keys(orderLabTests).map((test) => (
                <label
                  key={test}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                    orderLabTests[test]
                      ? 'border-indigo-500 bg-indigo-950/30 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400'
                  }`}
                >
                  <span>{test}</span>
                  <input
                    type="checkbox"
                    checked={orderLabTests[test]}
                    onChange={(e) => setOrderLabTests({ ...orderLabTests, [test]: e.target.checked })}
                    className="rounded accent-indigo-500 h-4 w-4"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Complete Consultation Button */}
          <button
            onClick={handleCompleteConsultation}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 py-3.5 text-xs font-bold text-white shadow-xl hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete Visit, Save Prescription & Dispatch Billing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
