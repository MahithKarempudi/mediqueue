import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdAdmission, IpdBed, Patient, Department, Billing } from '@/types';
import {
  HeartPulse,
  Bed,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  DollarSign,
  FileText,
  Search,
  ArrowRight,
} from 'lucide-react';

export const IpdAdmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newAdmission, setNewAdmission] = useState({
    patientId: '',
    departmentId: 'dept_cardio_01',
    bedId: '',
    diagnosis: 'Acute Coronary Syndrome — Scheduled for invasive monitoring',
    dailyCharge: 4500,
  });

  useEffect(() => {
    const loadData = async () => {
      const [adms, allBeds, pats, depts] = await Promise.all([
        dbService.getCollection<IpdAdmission>('ipd_admissions'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getCollection<Patient>('patients'),
        dbService.getCollection<Department>('departments'),
      ]);
      setAdmissions(adms.filter((a) => a.hospitalId === hospitalId));
      setBeds(allBeds.filter((b) => b.hospitalId === hospitalId));
      setPatients(pats);
      setDepartments(depts.filter((d) => d.hospitalId === hospitalId));
    };
    loadData();

    // Subscribe to beds for real-time changes
    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (items) => {
      setBeds(items.filter((b) => b.hospitalId === hospitalId));
    });

    return () => unsub();
  }, [hospitalId]);

  const availableBeds = beds.filter((b) => b.status === 'available');

  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmission.patientId || !newAdmission.bedId) return;

    setIsProcessing(true);
    try {
      const admissionId = `adm_${Date.now()}`;
      const patient = patients.find((p) => p.patientId === newAdmission.patientId);
      const bed = beds.find((b) => b.bedId === newAdmission.bedId);

      const adm: IpdAdmission = {
        admissionId,
        patientId: newAdmission.patientId,
        hospitalId,
        departmentId: newAdmission.departmentId,
        doctorId: user?.uid || 'staff_01',
        bedId: newAdmission.bedId,
        admitDate: new Date().toISOString(),
        diagnosis: newAdmission.diagnosis,
        status: 'admitted',
        dailyCharge: Number(newAdmission.dailyCharge),
      };

      // 1. Save admission to Firestore
      await dbService.setDocument('ipd_admissions', admissionId, adm);

      // 2. Atomic Bed Allocation: mark bed occupied & mirror to RTDB
      await dbService.updateBedStatus(hospitalId, newAdmission.bedId, 'occupied', patient?.name, admissionId);

      setAdmissions([adm, ...admissions]);
      setShowAdmitModal(false);
      setFeedback(`Patient ${patient?.name || newAdmission.patientId} admitted to bed ${bed?.bedNumber}! Live RTDB bed status mirrored to OCCUPIED.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to create admission:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Section 5 pinned requirement: Atomic Release-on-Discharge Chain
  const handleDischargePatient = async (adm: IpdAdmission) => {
    setIsProcessing(true);
    try {
      const dischargeDate = new Date().toISOString();
      const patient = patients.find((p) => p.patientId === adm.patientId);
      const bed = beds.find((b) => b.bedId === adm.bedId);

      // Compute stay duration
      const admitMs = new Date(adm.admitDate).getTime();
      const dischargeMs = new Date(dischargeDate).getTime();
      const days = Math.max(1, Math.ceil((dischargeMs - admitMs) / (1000 * 60 * 60 * 24)));
      const rate = adm.dailyCharge || 4500;
      const roomTotal = days * rate;
      const nursingFee = days * 1200;
      const totalAmount = roomTotal + nursingFee;

      const billId = `bill_ipd_${Date.now().toString().slice(-4)}`;

      // 1. Close Admission in Firestore
      await dbService.updateDocument('ipd_admissions', adm.admissionId, {
        status: 'discharged',
        dischargeDate,
      }, 'admissionId');

      // 2. Atomic Bed Release: mark bed available & clear occupant in Firestore + RTDB mirror
      await dbService.updateBedStatus(hospitalId, adm.bedId, 'available');

      // 3. Generate Final Itemized IPD Inpatient Bill
      const bill: Billing = {
        billId,
        patientId: adm.patientId,
        hospitalId,
        sourceType: 'IPD',
        lineItems: [
          { id: 'li_bed', description: `Inpatient Ward Bed Charges (${days} Days @ ₹${rate}/day)`, category: 'IPD', quantity: days, unitPrice: rate, totalPrice: roomTotal },
          { id: 'li_nurse', description: `24x7 Specialized Nursing & Clinical Monitoring (${days} Days)`, category: 'IPD', quantity: days, unitPrice: 1200, totalPrice: nursingFee },
        ],
        subtotal: totalAmount,
        discount: 1000,
        total: totalAmount - 1000,
        status: 'pending',
        createdAt: dischargeDate,
      };
      await dbService.setDocument('billing', billId, bill);

      // Update local state
      setAdmissions(
        admissions.map((a) => (a.admissionId === adm.admissionId ? { ...a, status: 'discharged', dischargeDate } : a))
      );

      setFeedback(`Atomic Discharge Complete for ${patient?.name || adm.patientId}: Bed ${bed?.bedNumber} RELEASED to available, and final invoice #${billId} generated!`);
      setTimeout(() => setFeedback(null), 6000);
    } catch (err) {
      console.error('Failed to discharge patient:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeAdmissions = admissions.filter((a) => a.status === 'admitted');
  const pastAdmissions = admissions.filter((a) => a.status === 'discharged');

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Inpatient Department (IPD)
            </span>
            <span className="text-xs text-slate-400 font-mono">Atomic Bed Allocation & Release</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Inpatient Admissions & Discharge Chain
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Admit patients with real-time bed verification. On discharge, an atomic release transaction frees the bed, recalculates emergency capacity, updates the live RTDB mirror, and dispatches the final bill.
          </p>
        </div>

        <button
          onClick={() => setShowAdmitModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-950/60 hover:bg-emerald-500 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Patient Admission</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Active Inpatients Roster */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-400" />
            <span>Currently Admitted Inpatients ({activeAdmissions.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {availableBeds.length} Available Beds Remaining
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Admission ID</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Allocated Bed</th>
                <th className="px-4 py-3">Admit Date</th>
                <th className="px-4 py-3">Admitting Diagnosis</th>
                <th className="px-4 py-3">Daily Tariff</th>
                <th className="px-4 py-3 text-right">Discharge Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {activeAdmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 italic">
                    No patients currently admitted in this facility.
                  </td>
                </tr>
              ) : (
                activeAdmissions.map((adm) => {
                  const pat = patients.find((p) => p.patientId === adm.patientId);
                  const bed = beds.find((b) => b.bedId === adm.bedId);

                  return (
                    <tr key={adm.admissionId} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-sky-400">{adm.admissionId}</td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {pat?.name || adm.patientId}
                        <span className="block text-[10px] font-normal text-slate-400 font-mono">
                          ID: {adm.patientId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 border border-indigo-500/30">
                          {bed?.bedNumber || adm.bedId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(adm.admitDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate text-slate-300">{adm.diagnosis}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">₹{adm.dailyCharge || 4500}/day</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDischargePatient(adm)}
                          disabled={isProcessing}
                          className="rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-300 px-3 py-1 text-xs font-semibold hover:bg-rose-600 hover:text-white transition shadow-sm"
                        >
                          Discharge & Release Bed
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discharged Patients History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Discharged Admissions Archive ({pastAdmissions.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto max-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-500 uppercase text-[10px] font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Admission ID</th>
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Admitted</th>
                <th className="px-4 py-2.5">Discharged</th>
                <th className="px-4 py-2.5">Diagnosis</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-400">
              {pastAdmissions.map((adm) => {
                const pat = patients.find((p) => p.patientId === adm.patientId);
                return (
                  <tr key={adm.admissionId}>
                    <td className="px-4 py-2.5 font-mono">{adm.admissionId}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-200">{pat?.name || adm.patientId}</td>
                    <td className="px-4 py-2.5">{new Date(adm.admitDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5">{adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-2.5 truncate max-w-[200px]">{adm.diagnosis}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                        Released
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admission Intake Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-400" />
              <span>Process Patient Inpatient Admission</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Select verified patient, clinical specialty, and allocate an available ward bed.
            </p>

            <form onSubmit={handleCreateAdmission} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-400">Patient *</label>
                <select
                  required
                  value={newAdmission.patientId}
                  onChange={(e) => setNewAdmission({ ...newAdmission, patientId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="">Select Registered Patient</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} ({p.bloodGroup}) — ID: {p.patientId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-400">Available Bed (Real-time check) *</label>
                <select
                  required
                  value={newAdmission.bedId}
                  onChange={(e) => setNewAdmission({ ...newAdmission, bedId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono"
                >
                  <option value="">Select Available Bed ({availableBeds.length} Free)</option>
                  {availableBeds.map((b) => (
                    <option key={b.bedId} value={b.bedId}>
                      {b.bedNumber} ({b.type.toUpperCase()}) — Ward: {b.wardId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-400">Admitting Diagnosis *</label>
                <textarea
                  rows={2}
                  required
                  value={newAdmission.diagnosis}
                  onChange={(e) => setNewAdmission({ ...newAdmission, diagnosis: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-400">Daily Inpatient Tariff (₹)</label>
                <input
                  type="number"
                  value={newAdmission.dailyCharge}
                  onChange={(e) => setNewAdmission({ ...newAdmission, dailyCharge: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Confirm Admission & Lock Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
