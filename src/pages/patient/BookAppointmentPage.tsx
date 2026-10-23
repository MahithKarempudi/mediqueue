import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Hospital, Department, Staff, OpdAppointment, QueueToken, LiveQueue } from '@/types';
import {
  Calendar,
  Building2,
  Stethoscope,
  Clock,
  CheckCircle2,
  ArrowRight,
  User,
  Users,
  Bot,
  Sparkles,
} from 'lucide-react';

export const BookAppointmentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedHospitalId = (location.state as any)?.hospitalId || 'hosp_metro_01';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Staff[]>([]);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(preSelectedHospitalId);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [slotTime, setSlotTime] = useState<string>('10:30 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const [hosps, depts, staffList] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
      ]);
      setHospitals(hosps);
      setDepartments(depts);
      setDoctors(staffList);

      const availableDepts = depts.filter((d) => d.hospitalId === preSelectedHospitalId);
      if (availableDepts.length > 0) {
        setSelectedDeptId(availableDepts[0].departmentId);
      }
    };
    load();
  }, [preSelectedHospitalId]);

  const hospDepts = departments.filter((d) => d.hospitalId === selectedHospitalId);
  const deptDoctors = doctors.filter(
    (doc) => doc.hospitalId === selectedHospitalId && (selectedDeptId ? doc.departmentId === selectedDeptId : true)
  );

  const handleHospitalChange = (hospId: string) => {
    setSelectedHospitalId(hospId);
    const firstDept = departments.find((d) => d.hospitalId === hospId);
    if (firstDept) {
      setSelectedDeptId(firstDept.departmentId);
      setSelectedDoctorId('');
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalId || !selectedDeptId) return;

    setIsSubmitting(true);
    try {
      const patientId = user?.patientId || 'pat_demo_01';
      const patientName = user?.name || 'Priya Sharma';
      const appointmentId = `apt_${Date.now()}`;
      const doctorId = selectedDoctorId || (deptDoctors[0]?.staffId || 'staff_01');

      // 1. Fetch current queue for this hospital & department from RTDB or Mock
      const queuePath = `liveQueues/${selectedHospitalId}/${selectedDeptId}`;
      const existingQueue = (await dbService.getRTDB<LiveQueue>(queuePath)) || {
        currentToken: 12,
        tokenList: [],
        lastUpdated: new Date().toISOString(),
      };

      const lastTokenNo = existingQueue.tokenList.length > 0
        ? Math.max(...existingQueue.tokenList.map((t: QueueToken) => t.tokenNo))
        : 14;
      const newTokenNo = lastTokenNo + 1;

      const newToken: QueueToken = {
        tokenNo: newTokenNo,
        patientId,
        patientName,
        appointmentId,
        status: 'waiting',
        joinedAt: new Date().toISOString(),
      };

      const updatedTokenList = [...(existingQueue.tokenList || []), newToken];

      // 2. Save appointment to Firestore
      const newApt: OpdAppointment = {
        appointmentId,
        patientId,
        hospitalId: selectedHospitalId,
        departmentId: selectedDeptId,
        doctorId,
        slotTime: `${new Date().toISOString().split('T')[0]} ${slotTime}`,
        status: 'scheduled',
      };
      await dbService.setDocument('opd_appointments', appointmentId, newApt);

      // 3. Mirror live queue to RTDB
      await dbService.setRTDB(queuePath, {
        currentToken: existingQueue.currentToken || 12,
        tokenList: updatedTokenList,
        lastUpdated: new Date().toISOString(),
        departmentId: selectedDeptId,
      });

      setSuccessToken(newTokenNo);
    } catch (err) {
      console.error('Failed to book appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
            Outpatient Department
          </span>
          <span className="text-xs text-slate-400">Instant Queue Token Generation</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Book OPD Consultation Slot
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Select your desired medical institution, specialty department, and preferred physician to generate your live digital queue token.
        </p>
      </div>

      {/* AI Appointment Agent Banner */}
      <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-950/60 via-slate-900 to-mediblue-950/60 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-mediblue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-sky-500/20">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">MediQueue Controlled AI Agent</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Forensic Confirmation Card
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
              Prefer conversational booking? The AI prepares and revalidates your appointment with explicit confirmation, duplicate prevention, and SHA-256 audit logging.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/patient/ai-booking')}
          className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-500 transition shadow-md flex items-center justify-center gap-2 shrink-0"
        >
          <span>Launch AI Agent</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {successToken ? (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-8 text-center backdrop-blur-md shadow-2xl animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h2 className="mt-4 text-2xl font-bold text-white">OPD Appointment Confirmed!</h2>
          <p className="mt-1 text-sm text-slate-300">
            Your consultation token has been generated and added to the hospital's live OPD queue.
          </p>

          <div className="mt-6 mx-auto max-w-xs rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 text-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Your Queue Token</span>
            <div className="mt-2 text-5xl font-extrabold text-emerald-400 font-mono tracking-tight">
              #{successToken}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Slot: <span className="text-white font-medium">{slotTime} Today</span>
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() =>
                navigate('/patient/queue', {
                  state: { hospitalId: selectedHospitalId, departmentId: selectedDeptId, myToken: successToken },
                })
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/60"
            >
              <Users className="h-4 w-4" />
              <span>Track Live Queue & Wait Time</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBook} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-6">
          {/* Hospital Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Select Healthcare Institution
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {hospitals.map((h) => (
                <div
                  key={h.hospitalId}
                  onClick={() => handleHospitalChange(h.hospitalId)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition ${
                    selectedHospitalId === h.hospitalId
                      ? 'border-mediblue-500 bg-mediblue-950/40 text-white shadow-md'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Building2 className="h-4 w-4 text-mediblue-400" />
                    <span className="text-[10px] font-mono text-slate-500">{h.districtId.replace('dist_', '')}</span>
                  </div>
                  <p className="mt-2 font-bold text-xs text-white line-clamp-1">{h.name}</p>
                  <p className="mt-1 text-[11px] text-slate-400 truncate">{h.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Select Clinical Department
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {hospDepts.map((d) => (
                <button
                  type="button"
                  key={d.departmentId}
                  onClick={() => setSelectedDeptId(d.departmentId)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedDeptId === d.departmentId
                      ? 'border-teal-500 bg-teal-950/40 text-teal-200'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Stethoscope className="h-4 w-4 text-teal-400 mb-1" />
                  <p className="font-bold text-xs text-white">{d.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              3. Select Attending Specialist (Optional)
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
            >
              <option value="">Next Available Duty Consultant</option>
              {deptDoctors.map((doc) => (
                <option key={doc.staffId} value={doc.staffId}>
                  {doc.name || 'Doctor'} — {doc.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              4. Preferred Time Window
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:00 PM', '04:30 PM'].map((slot) => (
                <button
                  type="button"
                  key={slot}
                  onClick={() => setSlotTime(slot)}
                  className={`rounded-xl border py-2 text-center text-xs font-semibold transition ${
                    slotTime === slot
                      ? 'border-indigo-500 bg-indigo-950/50 text-indigo-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Details Preview */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Patient Identifier:</span>
              <span className="font-mono text-teal-400 font-bold">{user?.patientId || 'pat_demo_01'}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-400">Patient Name:</span>
              <span className="text-white font-medium">{user?.name || 'Priya Sharma'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-teal-600 via-sky-600 to-mediblue-600 py-3 text-xs font-bold text-white shadow-xl hover:opacity-90 transition"
            >
              {isSubmitting ? 'Reserving Appointment...' : 'Generate Live OPD Token & Confirm'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
