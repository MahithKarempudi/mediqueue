import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type {
  Patient,
  OpdVisit,
  Prescription,
  IpdAdmission,
  PathologyReport,
  RadiologyReport,
  Billing,
} from '@/types';
import {
  History,
  Calendar,
  Stethoscope,
  HeartPulse,
  Microscope,
  FileText,
  CreditCard,
  User,
  Clock,
  CheckCircle2,
  Droplet,
  MapPin,
  Phone,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'VISIT' | 'ADMISSION' | 'PRESCRIPTION' | 'LAB' | 'SCAN' | 'BILL';
  date: string;
  title: string;
  subtitle: string;
  details?: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
}

export const PatientTimelinePage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_demo_01';

  const [patient, setPatient] = useState<Patient | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pats, visits, rxList, adms, pathReps, radReps, bills] = await Promise.all([
        dbService.getCollection<Patient>('patients'),
        dbService.getCollection<OpdVisit>('opd_visits'),
        dbService.getCollection<Prescription>('prescriptions'),
        dbService.getCollection<IpdAdmission>('ipd_admissions'),
        dbService.getCollection<PathologyReport>('pathology_reports'),
        dbService.getCollection<RadiologyReport>('radiology_reports'),
        dbService.getCollection<Billing>('billing'),
      ]);

      const currentPat = pats.find((p) => p.patientId === patientId) || {
        patientId,
        userId: 'demo_user',
        name: user?.name || 'Priya Sharma',
        dob: '1992-04-14',
        gender: 'female',
        phone: '+91 98201 12345',
        address: 'Flat 402, Lotus Enclave, Sector 14, New Delhi',
        bloodGroup: 'B+',
      };
      setPatient(currentPat);

      const timeline: TimelineEvent[] = [];

      // 1. OPD Visits
      visits
        .filter((v) => v.patientId === patientId)
        .forEach((v) => {
          timeline.push({
            id: v.visitId,
            type: 'VISIT',
            date: v.checkInTime,
            title: `OPD Consultation — Token #${v.tokenNo}`,
            subtitle: `Department: ${v.departmentId} • Attending: ${v.doctorId}`,
            details: v.consultationNotes,
            badge: 'Consultation',
            badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
            icon: <Stethoscope className="h-4 w-4 text-sky-400" />,
          });
        });

      // 2. Prescriptions
      rxList
        .filter((r) => r.patientId === patientId)
        .forEach((r) => {
          timeline.push({
            id: r.prescriptionId,
            type: 'PRESCRIPTION',
            date: r.prescribedAt || new Date().toISOString(),
            title: `Digital Prescription Issued (${r.medicines.length} Medicines)`,
            subtitle: `Prescribed by: ${r.doctorName || 'Attending Physician'}`,
            details: r.medicines.map((m) => `${m.medicineName} (${m.dosage}) - ${m.frequency}`).join(' • '),
            badge: 'Prescription',
            badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
            icon: <FileText className="h-4 w-4 text-teal-400" />,
          });
        });

      // 3. IPD Admissions
      adms
        .filter((a) => a.patientId === patientId)
        .forEach((a) => {
          timeline.push({
            id: a.admissionId,
            type: 'ADMISSION',
            date: a.admitDate,
            title: `Inpatient Admission — Bed ${a.bedId}`,
            subtitle: `Status: ${a.status.toUpperCase()} ${a.dischargeDate ? `(Discharged: ${new Date(a.dischargeDate).toLocaleDateString()})` : ''}`,
            details: `Diagnosis: ${a.diagnosis} • Tariff: ₹${a.dailyCharge}/day`,
            badge: 'Inpatient Stay',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            icon: <HeartPulse className="h-4 w-4 text-indigo-400" />,
          });
        });

      // 4. Pathology Reports
      pathReps
        .filter((p) => p.patientId === patientId || !p.patientId)
        .forEach((p) => {
          timeline.push({
            id: p.reportId,
            type: 'LAB',
            date: p.generatedAt,
            title: `Laboratory Pathology: ${p.testType || 'Diagnostic Panel'}`,
            subtitle: `Authorized by: ${p.verifiedBy}`,
            details: Object.keys(p.resultData || {})
              .map((k) => `${k}: ${p.resultData[k].value} ${p.resultData[k].unit}`)
              .join(' | '),
            badge: 'Pathology Lab',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            icon: <Microscope className="h-4 w-4 text-emerald-400" />,
          });
        });

      // 5. Radiology Reports
      radReps
        .filter((r) => r.patientId === patientId || !r.patientId)
        .forEach((r) => {
          timeline.push({
            id: r.reportId,
            type: 'SCAN',
            date: r.generatedAt,
            title: `Radiology Imaging: ${r.scanType || 'Radiological Scan'}`,
            subtitle: `Radiologist: ${r.radiologistId}`,
            details: r.findings,
            badge: 'Medical Imaging',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            icon: <FileText className="h-4 w-4 text-purple-400" />,
          });
        });

      // 6. Bills
      bills
        .filter((b) => b.patientId === patientId)
        .forEach((b) => {
          timeline.push({
            id: b.billId,
            type: 'BILL',
            date: b.createdAt || new Date().toISOString(),
            title: `Unified Invoice #${b.billId} (₹${b.total})`,
            subtitle: `Category: ${b.sourceType} • Payment Status: ${b.status.toUpperCase()}`,
            details: b.lineItems.map((li) => li.description).join(', '),
            badge: 'Financial Statement',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            icon: <CreditCard className="h-4 w-4 text-amber-400" />,
          });
        });

      // Sort newest first
      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(timeline);
      setLoading(false);
    };
    load();
  }, [patientId]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
            Centralized Electronic Health Record (EHR)
          </span>
          <span className="text-xs text-slate-400">Chronological Aggregate View</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Unified Patient Medical Timeline
        </h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl">
          Consolidated longitudinal health record fusing OPD consultations, digital prescriptions, inpatient admissions, laboratory biomarkers, radiological imaging, and financial ledger items.
        </p>
      </div>

      {/* Patient Profile Snapshot Card */}
      {patient && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-bold text-lg">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{patient.name}</h2>
                <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="capitalize">{patient.gender}, DOB: {patient.dob}</span>
                  <span>•</span>
                  <span className="font-mono text-teal-300">UHID: {patient.patientId}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="rounded-xl bg-slate-950 p-2 border border-slate-800 flex items-center gap-1.5">
                <Droplet className="h-4 w-4 text-rose-400" />
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-rose-300">{patient.bloodGroup}</span>
              </div>
              <div className="rounded-xl bg-slate-950 p-2 border border-slate-800 flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-sky-400" />
                <span className="text-slate-300 font-mono">{patient.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2.5 before:w-0.5 before:bg-slate-800">
        {events.map((evt, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 border-2 border-teal-500 shadow-sm shadow-teal-500/20 group-hover:scale-125 transition-transform" />

            {/* Event Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md transition hover:border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
                    {evt.icon}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${evt.badgeColor}`}>
                    {evt.badge}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(evt.date).toLocaleDateString()} at {new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </div>

              <h3 className="mt-3 text-sm font-bold text-white">{evt.title}</h3>
              <p className="mt-0.5 text-xs text-slate-400">{evt.subtitle}</p>

              {evt.details && (
                <div className="mt-3 rounded-xl bg-slate-950/60 p-3 border border-slate-800/70 text-xs text-slate-300 font-sans leading-relaxed">
                  {evt.details}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
