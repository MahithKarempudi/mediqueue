import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import { aiAppointmentBackend } from '@/services/appointments/aiAppointmentBackend';
import { AppointmentConfirmationCard } from '@/components/appointments/AppointmentConfirmationCard';
import type { Hospital, Department, Staff, OpdAppointment } from '@/types';
import type {
  AppointmentSlot,
  BookingIntent,
  ConfirmedBookingResult,
  ConsultationType,
} from '@/types/appointmentWorkflow';
import { PageHeader, Card, SectionHeader, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  Calendar,
  Building2,
  Stethoscope,
  UserCheck,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  XCircle,
  Hash,
  FileCheck,
} from 'lucide-react';

export const BookAppointmentPage: React.FC = () => {
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [myAppointments, setMyAppointments] = useState<OpdAppointment[]>([]);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp_metro_01');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept_cardio_01');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [consultationType, setConsultationType] = useState<ConsultationType>('In-Person OPD');

  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [activeIntent, setActiveIntent] = useState<BookingIntent | null>(null);
  const [confirmedReceipt, setConfirmedReceipt] = useState<ConfirmedBookingResult | null>(null);

  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelStatusMessage, setCancelStatusMessage] = useState<string | null>(null);

  const patientId = user?.patientId || 'pat_0001';

  useEffect(() => {
    const loadMetadata = async () => {
      const [h, d, s, a] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
        dbService.getCollection<OpdAppointment>('opd_appointments'),
      ]);
      setHospitals(h);
      setDepartments(d);
      setStaffList(s);
      setMyAppointments(a.filter((item) => item.patientId === patientId));

      if (h.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(h[0].hospitalId);
      }
    };
    loadMetadata();

    const unsub = dbService.subscribeCollection<OpdAppointment>('opd_appointments', (all) => {
      setMyAppointments(all.filter((item) => item.patientId === patientId));
    });
    return () => unsub();
  }, [patientId]);

  const hospitalDepts = departments.filter((d) => d.hospitalId === selectedHospitalId);
  const deptDoctors = staffList.filter(
    (s) => s.hospitalId === selectedHospitalId && s.departmentId === selectedDeptId && s.roleInHospital === 'doctor'
  );

  // Sync department when hospital changes
  useEffect(() => {
    if (hospitalDepts.length > 0 && !hospitalDepts.some((d) => d.departmentId === selectedDeptId)) {
      setSelectedDeptId(hospitalDepts[0].departmentId);
    }
  }, [selectedHospitalId, hospitalDepts, selectedDeptId]);

  // Sync doctor when department changes
  useEffect(() => {
    if (deptDoctors.length > 0) {
      setSelectedDoctorId(deptDoctors[0].staffId);
    } else {
      setSelectedDoctorId('');
    }
  }, [selectedDeptId, selectedHospitalId, deptDoctors.length]);

  // Query authoritative slots whenever Hospital, Department, Doctor, or Date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!user || !selectedHospitalId || !selectedDeptId) return;
      setIsLoadingSlots(true);
      setErrorMessage(null);
      const deptObj = departments.find((d) => d.departmentId === selectedDeptId);
      const { slots, error } = await aiAppointmentBackend.searchAppointmentSlots(
        {
          hospitalId: selectedHospitalId,
          departmentId: selectedDeptId,
          doctorId: selectedDoctorId || undefined,
          specialty: deptObj?.name,
          date: selectedDate,
        },
        user
      );
      setIsLoadingSlots(false);
      if (error) {
        setErrorMessage(error);
      } else {
        setAvailableSlots(slots);
      }
    };
    fetchSlots();
  }, [user, selectedHospitalId, selectedDeptId, selectedDoctorId, selectedDate, departments]);

  const handlePrepareSlotHold = async (slot: AppointmentSlot) => {
    if (!user) return;
    setErrorMessage(null);
    setConfirmedReceipt(null);
    setSelectedSlot(slot);

    const { intent, error } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        patientId: user.patientId || 'pat_0001',
        patientName: user.name,
        consultationType,
      },
      user
    );

    if (error || !intent) {
      setErrorMessage(error || 'Unable to lock slot hold.');
      return;
    }
    setActiveIntent(intent);
  };

  const handleConfirmBooking = async (
    intentId: string,
    idempotencyKey: string,
    consentConfirmed: boolean,
    chosenType: ConsultationType
  ) => {
    if (!user || !activeIntent) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    activeIntent.consultationType = chosenType;

    const response = await aiAppointmentBackend.confirmAppointment(
      {
        intentId,
        idempotencyKey,
        consentConfirmed,
      },
      user
    );
    setIsSubmitting(false);

    if (response.error || !response.result) {
      setErrorMessage(response.error || 'Booking authorization failed.');
      return;
    }

    setConfirmedReceipt(response.result);
    setActiveIntent(null);
    setSelectedSlot(null);
  };

  const handleCancelExistingAppointment = async (appointmentId: string) => {
    if (!user) return;
    const res = await aiAppointmentBackend.cancelAppointment(
      {
        appointmentId,
        reason: 'Patient cancelled via OPD Appointment Portal',
        consentConfirmed: true,
      },
      user
    );
    if (res.success) {
      setCancelStatusMessage(`Appointment ${appointmentId} has been cancelled and recorded in the audit ledger.`);
    } else {
      setErrorMessage(res.error || 'Unable to cancel appointment.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Authoritative Clinical Scheduling"
        title="OPD Consultation Booking"
        subtitle="Select a facility, clinical department, specialist physician, and time slot. All bookings use a 5-minute slot hold, explicit patient consent, and cryptographic audit verification."
        actions={
          <Link to="/patient/ai-booking">
            <Button variant="secondary" size="md" icon={<Sparkles className="w-4 h-4 text-mediteal-600" />}>
              Switch to AI Conversational Booking
            </Button>
          </Link>
        }
      />

      {/* Visual 4-Step Clinical Scheduling Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: '01', label: 'Facility & Specialty', active: true, done: Boolean(selectedHospitalId && selectedDeptId) },
            { step: '02', label: '5-Min Slot Hold', active: availableSlots.length > 0, done: Boolean(activeIntent || confirmedReceipt) },
            { step: '03', label: 'Patient Consent', active: Boolean(activeIntent), done: Boolean(confirmedReceipt) },
            { step: '04', label: 'Token & Audit Seal', active: Boolean(confirmedReceipt), done: Boolean(confirmedReceipt) },
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                item.done
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : item.active
                  ? 'bg-mediblue-50/70 border-mediblue-200 text-mediblue-900'
                  : 'bg-slate-50 border-slate-200/70 text-slate-400'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center shrink-0 ${
                  item.done
                    ? 'bg-emerald-600 text-white'
                    : item.active
                    ? 'bg-mediblue-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {item.done ? '✓' : item.step}
              </span>
              <span className="text-xs font-bold truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <NoticeBanner variant="critical" title="Booking Authorization Notice" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </NoticeBanner>
      )}

      {cancelStatusMessage && (
        <NoticeBanner variant="info" title="Appointment Status Updated" onDismiss={() => setCancelStatusMessage(null)}>
          {cancelStatusMessage}
        </NoticeBanner>
      )}

      {/* Confirmed Receipt Banner */}
      {confirmedReceipt && (
        <Card padding="lg" className="border-2 border-emerald-500 bg-emerald-50/30">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">AUTHORITATIVE COMMIT VERIFIED</Badge>
                  <span className="text-xs font-mono text-slate-500">{confirmedReceipt.committedAt}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  OPD Appointment Confirmed — {confirmedReceipt.appointmentId}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {confirmedReceipt.doctorName} ({confirmedReceipt.specialty}) at {confirmedReceipt.hospitalName}
                </p>
              </div>
            </div>

            <div className="bg-white px-5 py-3 rounded-xl border border-emerald-200 text-right shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Live Queue Token
              </span>
              <span className="text-2xl font-extrabold font-display text-emerald-700">
                Token #{confirmedReceipt.tokenNo}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-200/70 text-xs">
            <div>
              <span className="text-slate-500 font-semibold uppercase block">Scheduled Slot</span>
              <span className="font-bold text-slate-900">{confirmedReceipt.scheduledTime}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase block">Consultation Mode</span>
              <span className="font-bold text-slate-900">{confirmedReceipt.consultationType} (₹{confirmedReceipt.fee})</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase block">SHA-256 Audit Seal</span>
              <span className="font-mono text-[11px] text-emerald-800 break-all">{confirmedReceipt.forensicHash}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Link to="/patient/queue">
              <Button variant="primary" size="sm">Track Live OPD Queue</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Structured 4-Step Slot Selection */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="1. Select Facility, Specialty & Specialist"
              subtitle="Filter open outpatient consultation slots across accredited MediQueue hospitals"
              icon={<Building2 className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mq-label">Hospital Facility</label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => {
                    setSelectedHospitalId(e.target.value);
                    setActiveIntent(null);
                  }}
                  className="mq-input"
                >
                  {hospitals.map((h) => (
                    <option key={h.hospitalId} value={h.hospitalId}>
                      {h.name} ({h.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mq-label">Clinical Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setActiveIntent(null);
                  }}
                  className="mq-input"
                >
                  {hospitalDepts.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mq-label">Attending Specialist</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setActiveIntent(null);
                  }}
                  className="mq-input"
                >
                  {deptDoctors.length > 0 ? (
                    deptDoctors.map((doc) => (
                      <option key={doc.staffId} value={doc.staffId}>
                        {doc.name} — {doc.designation || 'Consultant'}
                      </option>
                    ))
                  ) : (
                    <option value="">Dr. Rajesh Kumar — Senior Consultant</option>
                  )}
                </select>
              </div>

              <div>
                <label className="mq-label">Preferred Consultation Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setActiveIntent(null);
                  }}
                  className="mq-input"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Default Consultation Format
              </span>
              <div className="flex gap-2">
                {(['In-Person OPD', 'Telehealth Video'] as ConsultationType[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setConsultationType(mode)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      consultationType === mode
                        ? 'bg-mediblue-600 text-white border-mediblue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Step 2: Available Time Slots */}
          <Card padding="lg">
            <SectionHeader
              title="2. Choose Time Slot & Reserve 5-Minute Hold"
              subtitle="Selecting a slot creates an authoritative booking intent with row-level lock protection"
              icon={<Clock className="w-5 h-5" />}
            />

            {isLoadingSlots ? (
              <div className="py-8 text-center text-sm text-slate-500">Querying hospital schedule...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.slotId === slot.slotId && activeIntent !== null;
                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => handlePrepareSlotHold(slot)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-mediteal-50 border-mediteal-600 ring-2 ring-mediteal-500/20'
                          : slot.available
                          ? 'bg-white border-slate-200 hover:border-mediblue-500 hover:shadow-xs'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{slot.time}</span>
                        <Badge variant={slot.available ? 'success' : 'neutral'}>
                          {slot.available ? 'Open' : 'Booked'}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1.5 truncate">{slot.doctorName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {slot.specialty} • ₹{slot.fee}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Step 3: Confirmation & Explicit Consent Card */}
          {activeIntent && (
            <div>
              <AppointmentConfirmationCard
                intent={activeIntent}
                isSubmitting={isSubmitting}
                onConfirm={handleConfirmBooking}
                onModify={() => setActiveIntent(null)}
                onCancel={() => {
                  setActiveIntent(null);
                  setSelectedSlot(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Right 5 Columns: Patient's Existing Appointments & Governance Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Your OPD Appointment Ledger"
              subtitle="Active and historical outpatient consultations"
              icon={<FileCheck className="w-5 h-5" />}
            />

            {myAppointments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No outpatient appointments recorded for this patient profile.
              </p>
            ) : (
              <div className="space-y-3">
                {myAppointments.map((appt) => {
                  const hosp = hospitals.find((h) => h.hospitalId === appt.hospitalId);
                  const dept = departments.find((d) => d.departmentId === appt.departmentId);
                  const doc = staffList.find((s) => s.staffId === appt.doctorId);

                  return (
                    <div
                      key={appt.appointmentId}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-mediblue-600" />
                          {appt.appointmentId}
                        </span>
                        <Badge
                          variant={
                            appt.status === 'scheduled'
                              ? 'info'
                              : appt.status === 'completed'
                              ? 'success'
                              : 'danger'
                          }
                          dot
                        >
                          {appt.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {doc?.name || 'Dr. Rajesh Kumar'} • {dept?.name || 'Cardiology'}
                        </h4>
                        <p className="text-xs text-slate-600">{hosp?.name || 'Metro General Hospital'}</p>
                        <p className="text-xs font-semibold text-mediblue-700 mt-1 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {appt.slotTime}
                        </p>
                      </div>

                      {appt.status === 'scheduled' && (
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          <Link to="/patient/queue">
                            <Button variant="outline" size="xs">View Queue Token</Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-red-600 hover:bg-red-50"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleCancelExistingAppointment(appt.appointmentId)}
                          >
                            Cancel Slot
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card padding="lg" className="bg-slate-50/80">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-mediteal-50 border border-mediteal-200 flex items-center justify-center text-mediteal-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-900">Two-Step Clinical Booking Integrity</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Both standard OPD scheduling and the AI Appointment Assistant execute on the same authoritative backend service:
                </p>
                <ul className="text-xs text-slate-600 space-y-1 pt-1">
                  <li className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-mediblue-600 shrink-0" />
                    <span>5-minute temporary slot reservation hold</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-mediteal-600 shrink-0" />
                    <span>Mandatory explicit patient authorization check</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Idempotent commit & tamper-evident SHA-256 log</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
