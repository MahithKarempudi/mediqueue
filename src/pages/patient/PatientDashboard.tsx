import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import { estimatePatientWaitTime } from '@/services/analytics/waitTimeEngine';
import type {
  Hospital,
  Department,
  Staff,
  OpdAppointment,
  LiveQueue,
  PathologyReport,
  RadiologyReport,
  Billing,
  Patient,
  EmergencyCapacity,
} from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, Button } from '@/components/ui';
import {
  Calendar,
  Clock,
  Activity,
  FileText,
  CreditCard,
  Building2,
  Bot,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_0001';

  const [patientRecord, setPatientRecord] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<OpdAppointment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [liveQueue, setLiveQueue] = useState<LiveQueue | null>(null);
  const [pathReports, setPathReports] = useState<PathologyReport[]>([]);
  const [radReports, setRadReports] = useState<RadiologyReport[]>([]);
  const [bills, setBills] = useState<Billing[]>([]);
  const [capacities, setCapacities] = useState<Record<string, EmergencyCapacity>>({});

  useEffect(() => {
    const loadPatientPortalData = async () => {
      const [pats, appts, hosps, depts, stf, pReps, rReps, bls, caps] = await Promise.all([
        dbService.getCollection<Patient>('patients'),
        dbService.getCollection<OpdAppointment>('opd_appointments'),
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
        dbService.getCollection<PathologyReport>('pathology_reports'),
        dbService.getCollection<RadiologyReport>('radiology_reports'),
        dbService.getCollection<Billing>('billing'),
        dbService.getRTDB<Record<string, EmergencyCapacity>>('emergencyCapacity'),
      ]);

      setPatientRecord(pats.find((p) => p.patientId === patientId) || pats[0] || null);
      setAppointments(appts.filter((a) => a.patientId === patientId));
      setHospitals(hosps);
      setDepartments(depts);
      setStaff(stf);
      setPathReports(pReps.filter((r) => r.patientId === patientId));
      setRadReports(rReps.filter((r) => r.patientId === patientId));
      setBills(bls.filter((b) => b.patientId === patientId));
      if (caps) setCapacities(caps);
    };

    loadPatientPortalData();
    const unsubAppts = dbService.subscribeCollection<OpdAppointment>('opd_appointments', (data) => {
      setAppointments(data.filter((a) => a.patientId === patientId));
    });
    const unsubQueue = dbService.subscribeRTDB<LiveQueue>('liveQueues/hosp_metro_01/dept_cardio_01', (q) => {
      if (q) setLiveQueue(q);
    });
    const unsubBills = dbService.subscribeCollection<Billing>('billing', (data) => {
      setBills(data.filter((b) => b.patientId === patientId));
    });

    return () => {
      unsubAppts();
      unsubQueue();
      unsubBills();
    };
  }, [patientId]);

  const activeAppointments = appointments.filter(
    (a) =>
      a.status === 'scheduled' ||
      a.status === 'Confirmed' ||
      a.status === 'confirmed' ||
      a.status === 'Pending' ||
      a.status === 'pending'
  );
  const nextAppt = activeAppointments[0];
  const nextHospital = hospitals.find((h) => h.hospitalId === (nextAppt?.hospitalId || 'hosp_metro_01'));
  const nextDept = departments.find((d) => d.departmentId === (nextAppt?.departmentId || 'dept_cardio_01'));
  const nextDoctor = staff.find((s) => s.staffId === (nextAppt?.doctorId || 'staff_cardio_01'));

  const myQueueToken = liveQueue?.tokenList?.find((t) => t.patientId === patientId && t.status !== 'completed') ||
    liveQueue?.tokenList?.find((t) => t.tokenNo === 18);
  const servingToken = liveQueue?.currentToken || 15;
  const userTokenNo = myQueueToken?.tokenNo || 18;
  const waitEstimate = estimatePatientWaitTime({
    currentServingToken: servingToken,
    userTokenNumber: userTokenNo,
    activeDoctorsCount: 2,
    avgConsultationMinutes: 8,
    emergencyInterruptionsCount: 0,
  });

  const pendingAmount = bills
    .filter((b) => b.status === 'pending')
    .reduce((acc, b) => acc + b.totalAmount, 0);

  const totalReportsCount = pathReports.length + radReports.length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Patient Care & Digital Health Portal"
        title={`Welcome back, ${user?.name || patientRecord?.name || 'Aarav Sharma'}`}
        subtitle={`Unified Health Identifier (UHID): ${patientId.toUpperCase()} • Blood Group: ${patientRecord?.bloodGroup || 'O+'} • Verified Patient Access`}
        actions={
          <>
            <Link to="/patient/emergency">
              <Button variant="danger" size="md" icon={<AlertTriangle className="w-4 h-4" />}>
                Emergency Triage & Routing
              </Button>
            </Link>
            <Link to="/patient/ai-booking">
              <Button variant="secondary" size="md" icon={<Bot className="w-4 h-4 text-mediteal-600" />}>
                AI Slot Concierge
              </Button>
            </Link>
            <Link to="/patient/book">
              <Button variant="primary" size="md" icon={<Calendar className="w-4 h-4" />}>
                Book OPD Appointment
              </Button>
            </Link>
          </>
        }
      />

      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active OPD Queue Token"
          value={`#${userTokenNo}`}
          subtitle={`Serving #${servingToken} • ~${waitEstimate.estimatedMinutes} min est. wait`}
          icon={<Clock className="w-5 h-5" />}
          accent="teal"
          trend={{ value: `${waitEstimate.tokensAhead} Ahead`, direction: 'neutral' }}
        />
        <MetricCard
          label="Scheduled Appointments"
          value={activeAppointments.length}
          subtitle={nextAppt ? `${nextDept?.name || 'Cardiology'} • ${nextAppt.slotTime}` : 'No upcoming OPD slots'}
          icon={<Calendar className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Verified Diagnostic Reports"
          value={totalReportsCount}
          subtitle={`${pathReports.length} Lab Panels • ${radReports.length} Imaging Studies`}
          icon={<FileText className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          label="Outstanding Balance"
          value={`₹${pendingAmount.toLocaleString('en-IN')}`}
          subtitle={pendingAmount > 0 ? 'Pending hospital invoice settlement' : 'All clinical invoices settled'}
          icon={<CreditCard className="w-5 h-5" />}
          accent={pendingAmount > 0 ? 'amber' : 'navy'}
        />
      </div>

      {/* Main Clinical Row: Active Appointment + Live Queue Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 columns: Upcoming Appointment & Live Queue */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="border-t-4 border-t-mediblue-600">
            <SectionHeader
              title="Next Scheduled OPD Consultation"
              subtitle="Confirmed clinical appointment with cryptographic booking verification"
              icon={<Calendar className="w-5 h-5" />}
              action={
                <Link to="/patient/book">
                  <Button variant="outline" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Manage Bookings
                  </Button>
                </Link>
              }
            />

            {nextAppt ? (
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          nextAppt.status === 'Confirmed' || nextAppt.status === 'confirmed' || nextAppt.status === 'scheduled'
                            ? 'success'
                            : nextAppt.status === 'Pending' || nextAppt.status === 'pending'
                            ? 'warning'
                            : 'info'
                        }
                        dot
                      >
                        {nextAppt.status.toUpperCase()} OPD SLOT
                      </Badge>
                      <span className="text-xs font-mono text-slate-500">Ref: {nextAppt.appointmentId}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      {nextDoctor?.name || 'Dr. Rajesh Kumar'}
                    </h3>
                    <p className="text-xs font-medium text-slate-600">
                      {nextDoctor?.designation || 'Senior Consultant Cardiologist, MD'} • {nextDept?.name || 'Cardiology'}
                    </p>
                  </div>
                  <div className="text-right bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Queue Token
                    </span>
                    <span className="text-2xl font-extrabold font-display text-mediteal-600">
                      #{userTokenNo}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">Medical Facility</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {nextHospital?.name || 'Metro General Hospital'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">Date & Time</span>
                    <span className="font-bold text-mediblue-700 mt-0.5 block">{nextAppt.slotTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase block">Queue Status</span>
                    <span className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked In • Est. {waitEstimate.estimatedMinutes} min
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">
                      Queue Progression: Serving Token <strong className="font-mono text-slate-900">#{servingToken}</strong> → Your Token <strong className="font-mono text-mediteal-700">#{userTokenNo}</strong>
                    </span>
                    <span className="font-mono font-bold text-mediteal-700">
                      {waitEstimate.tokensAhead} ahead (~{waitEstimate.estimatedMinutes}m)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-mediblue-600 to-mediteal-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(18, Math.round((servingToken / Math.max(1, userTokenNo)) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-mediteal-600" />
                    <span>Protected by SHA-256 Appointment Authorization Ledger</span>
                  </div>
                  <Link to="/patient/queue">
                    <Button variant="secondary" size="sm" icon={<Activity className="w-3.5 h-3.5 text-mediteal-600" />}>
                      Open Live Queue Tracker
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-700">No active appointments scheduled</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Book an OPD consultation directly or use the AI Appointment Assistant to find the earliest specialist slot.
                </p>
                <div className="flex justify-center gap-3">
                  <Link to="/patient/book">
                    <Button variant="primary" size="sm">Book Standard Slot</Button>
                  </Link>
                  <Link to="/patient/ai-booking">
                    <Button variant="outline" size="sm">Launch AI Assistant</Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* Recent Diagnostic Results Preview */}
          <Card padding="lg">
            <SectionHeader
              title="Recent Laboratory & Imaging Reports"
              subtitle="Released pathology and radiology investigations verified by hospital specialists"
              icon={<FileText className="w-5 h-5" />}
              action={
                <Link to="/patient/reports">
                  <Button variant="ghost" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View All Reports
                  </Button>
                </Link>
              }
            />

            <div className="divide-y divide-slate-100">
              {pathReports.slice(0, 2).map((rep) => (
                <div key={rep.reportId} className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-mediblue-50 border border-mediblue-100 flex items-center justify-center text-mediblue-600 shrink-0 mt-0.5">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{rep.testName}</h4>
                        <Badge variant="success">Verified</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{rep.summary}</p>
                      <span className="text-[11px] font-mono text-slate-400">
                        Report ID: {rep.reportId} • {new Date(rep.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link to="/patient/reports">
                    <Button variant="outline" size="xs">Inspect</Button>
                  </Link>
                </div>
              ))}

              {radReports.slice(0, 1).map((rep) => (
                <div key={rep.reportId} className="py-3.5 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-mediteal-50 border border-mediteal-100 flex items-center justify-center text-mediteal-600 shrink-0 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{rep.modality}</h4>
                        <Badge variant="teal">Radiology</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{rep.impression}</p>
                      <span className="text-[11px] font-mono text-slate-400">
                        Report ID: {rep.reportId} • {new Date(rep.reportedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link to="/patient/reports">
                    <Button variant="outline" size="xs">Inspect</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 5 columns: Regional Hospital Bed Availability & Patient Care Links */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Regional Hospital Capacity"
              subtitle="Live ICU and general ward bed availability across network hospitals"
              icon={<Building2 className="w-5 h-5" />}
              action={
                <Link to="/patient/hospitals">
                  <Button variant="ghost" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Directory
                  </Button>
                </Link>
              }
            />

            <div className="space-y-3">
              {hospitals.slice(0, 4).map((hosp) => {
                const cap = capacities[hosp.hospitalId] || {
                  icuBedsFree: 4,
                  generalBedsFree: 12,
                  emergencyStatus: 'Normal',
                };
                return (
                  <div
                    key={hosp.hospitalId}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{hosp.name}</h4>
                        <p className="text-xs text-slate-500">{hosp.district} District • {hosp.type}</p>
                      </div>
                      <Badge
                        variant={
                          cap.emergencyStatus === 'Normal'
                            ? 'success'
                            : cap.emergencyStatus === 'Surge'
                            ? 'warning'
                            : 'danger'
                        }
                        dot
                      >
                        {cap.emergencyStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/70 text-xs">
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">ICU Open</span>
                        <span className="font-mono font-bold text-slate-900">{cap.icuBedsFree} Beds</span>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-slate-500 font-medium">General Open</span>
                        <span className="font-mono font-bold text-slate-900">{cap.generalBedsFree} Beds</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Quick Clinical Navigation Card */}
          <Card padding="lg" className="bg-navy-950 text-white border-navy-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-mediteal-500/20 border border-mediteal-500/30 flex items-center justify-center text-mediteal-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Complete Longitudinal EHR</h3>
                <p className="text-xs text-slate-400">
                  Access chronological consultations, prescriptions, admissions, and itemized invoices
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <Link
                to="/patient/timeline"
                className="px-3.5 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
              >
                <span>Medical Timeline</span>
                <ArrowRight className="w-3.5 h-3.5 text-mediteal-400" />
              </Link>
              <Link
                to="/patient/billing"
                className="px-3.5 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-slate-200 flex items-center justify-between transition-colors"
              >
                <span>Invoices & Receipts</span>
                <ArrowRight className="w-3.5 h-3.5 text-mediteal-400" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
