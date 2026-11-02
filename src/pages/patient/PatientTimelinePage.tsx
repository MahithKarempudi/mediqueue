import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type {
  OpdVisit,
  Prescription,
  IpdAdmission,
  PathologyReport,
  RadiologyReport,
  Billing,
} from '@/types';
import { PageHeader, Card, Badge } from '@/components/ui';
import {
  Stethoscope,
  Pill,
  Bed,
  FlaskConical,
  CreditCard,
  Calendar,
  FileCheck,
} from 'lucide-react';

type TimelineCategory = 'ALL' | 'CONSULTATION' | 'PRESCRIPTION' | 'DIAGNOSTIC' | 'ADMISSION' | 'BILLING';

interface TimelineEntry {
  id: string;
  category: Exclude<TimelineCategory, 'ALL'>;
  title: string;
  subtitle: string;
  details: string;
  timestamp: string;
  referenceId: string;
}

export const PatientTimelinePage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_0001';

  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TimelineCategory>('ALL');

  useEffect(() => {
    const loadTimeline = async () => {
      const [visits, rxs, adms, pReps, rReps, bills] = await Promise.all([
        dbService.getCollection<OpdVisit>('opd_visits'),
        dbService.getCollection<Prescription>('prescriptions'),
        dbService.getCollection<IpdAdmission>('ipd_admissions'),
        dbService.getCollection<PathologyReport>('pathology_reports'),
        dbService.getCollection<RadiologyReport>('radiology_reports'),
        dbService.getCollection<Billing>('billing'),
      ]);

      const list: TimelineEntry[] = [];

      visits
        .filter((v) => v.patientId === patientId)
        .forEach((v) => {
          list.push({
            id: `v_${v.visitId}`,
            category: 'CONSULTATION',
            title: `OPD Clinical Consultation — ${v.diagnosis}`,
            subtitle: `Attending Physician ID: ${v.doctorId} • Facility: ${v.hospitalId}`,
            details: v.notes || 'Outpatient clinical evaluation completed and treatment protocol updated.',
            timestamp: v.createdAt,
            referenceId: v.visitId,
          });
        });

      rxs
        .filter((rx) => rx.patientId === patientId)
        .forEach((rx) => {
          list.push({
            id: `rx_${rx.prescriptionId}`,
            category: 'PRESCRIPTION',
            title: `Electronic Medication Prescription (${rx.medications.length} Agents)`,
            subtitle: `Prescribed by ${rx.doctorId}`,
            details: rx.medications
              .map((m) => `${m.name} (${m.dosage}, ${m.frequency} for ${m.duration})`)
              .join(' • '),
            timestamp: rx.createdAt,
            referenceId: rx.prescriptionId,
          });
        });

      pReps
        .filter((r) => r.patientId === patientId)
        .forEach((r) => {
          list.push({
            id: `pr_${r.reportId}`,
            category: 'DIAGNOSTIC',
            title: `Pathology Assay Released: ${r.testName}`,
            subtitle: `Order Ref: ${r.orderId}`,
            details: r.summary,
            timestamp: r.reportedAt,
            referenceId: r.reportId,
          });
        });

      rReps
        .filter((r) => r.patientId === patientId)
        .forEach((r) => {
          list.push({
            id: `rr_${r.reportId}`,
            category: 'DIAGNOSTIC',
            title: `Radiology Study Finalized: ${r.modality}`,
            subtitle: `Order Ref: ${r.orderId}`,
            details: r.impression,
            timestamp: r.reportedAt,
            referenceId: r.reportId,
          });
        });

      adms
        .filter((a) => a.patientId === patientId)
        .forEach((a) => {
          list.push({
            id: `adm_${a.admissionId}`,
            category: 'ADMISSION',
            title: `Inpatient Ward Admission (${a.status.toUpperCase()})`,
            subtitle: `Bed ID: ${a.bedId} • Admitting Doctor: ${a.admittingDoctorId}`,
            details: `Primary Diagnosis: ${a.diagnosis}`,
            timestamp: a.admittedAt,
            referenceId: a.admissionId,
          });
        });

      bills
        .filter((b) => b.patientId === patientId)
        .forEach((b) => {
          list.push({
            id: `bill_${b.billId}`,
            category: 'BILLING',
            title: `Hospital Invoice ₹${b.totalAmount.toLocaleString('en-IN')} (${b.status.toUpperCase()})`,
            subtitle: `${b.items.length} tariff line items`,
            details: b.items.map((i) => `${i.description}: ₹${i.amount}`).join(' • '),
            timestamp: b.createdAt,
            referenceId: b.billId,
          });
        });

      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEntries(list);
    };

    loadTimeline();
  }, [patientId]);

  const filteredEntries =
    selectedCategory === 'ALL' ? entries : entries.filter((e) => e.category === selectedCategory);

  const categoryMeta: Record<
    Exclude<TimelineCategory, 'ALL'>,
    { icon: React.ReactNode; badge: 'info' | 'teal' | 'success' | 'warning' | 'neutral' }
  > = {
    CONSULTATION: { icon: <Stethoscope className="w-4 h-4" />, badge: 'info' },
    PRESCRIPTION: { icon: <Pill className="w-4 h-4" />, badge: 'teal' },
    DIAGNOSTIC: { icon: <FlaskConical className="w-4 h-4" />, badge: 'success' },
    ADMISSION: { icon: <Bed className="w-4 h-4" />, badge: 'warning' },
    BILLING: { icon: <CreditCard className="w-4 h-4" />, badge: 'neutral' },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Longitudinal Electronic Health Record (EHR)"
        title="Chronological Medical History Timeline"
        subtitle={`Complete clinical encounter log for ${user?.name || 'Aarav Sharma'} (UHID: ${patientId.toUpperCase()})`}
      />

      {/* Category Filter Pills */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2 p-1">
          {(['ALL', 'CONSULTATION', 'PRESCRIPTION', 'DIAGNOSTIC', 'ADMISSION', 'BILLING'] as TimelineCategory[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-navy-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? `All Encounters (${entries.length})` : cat}
              </button>
            )
          )}
        </div>
      </Card>

      {/* Vertical Chronological Timeline */}
      <Card padding="lg">
        {filteredEntries.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No longitudinal records found in this category.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {filteredEntries.map((item) => {
              const meta = categoryMeta[item.category];
              return (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-white border-2 border-mediteal-600 shadow-2xs" />
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-all">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant={meta.badge} dot>
                          {item.category}
                        </Badge>
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
                          Ref: {item.referenceId}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-mediblue-600" />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{item.subtitle}</p>
                    <p className="text-xs text-slate-700 mt-2 pt-2 border-t border-slate-200/70 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
