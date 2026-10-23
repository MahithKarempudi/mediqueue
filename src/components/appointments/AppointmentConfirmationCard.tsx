// Section 4: Appointment Confirmation Interface
// Illustrative UI prototype & Controlled Confirmation Card

import React, { useState, useEffect } from 'react';
import type { BookingIntent, ConsultationType } from '@/types/appointmentWorkflow';
import {
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  ShieldCheck,
  Video,
  UserCheck,
  AlertCircle,
  Timer,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface Props {
  intent: BookingIntent;
  onConfirm: (consultationType: ConsultationType, consentConfirmed: boolean) => Promise<void>;
  onCancel: () => void;
  isConfirming: boolean;
  errorMessage?: string | null;
}

export const AppointmentConfirmationCard: React.FC<Props> = ({
  intent,
  onConfirm,
  onCancel,
  isConfirming,
  errorMessage,
}) => {
  const [consultationType, setConsultationType] = useState<ConsultationType>(intent.consultationType || 'in_person');
  const [consentChecked, setConsentChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minute hold countdown

  useEffect(() => {
    const calculateRemaining = () => {
      const diff = Math.floor((new Date(intent.expiresAt).getTime() - Date.now()) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [intent.expiresAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft <= 0;

  return (
    <div className="rounded-2xl border-2 border-mediblue-500/40 bg-slate-900/90 p-5 sm:p-6 shadow-2xl backdrop-blur-xl animate-fade-in relative overflow-hidden">
      {/* Decorative Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-sky-400 to-mediblue-500" />

      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-400" />
              Review appointment
            </h2>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/40 animate-pulse">
              Pending
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 italic">
            Illustrative UI prototype — not a live booking until authorized
          </p>
        </div>

        {/* Hold Window Countdown */}
        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-mono border ${
          isExpired
            ? 'bg-rose-950/60 text-rose-300 border-rose-800'
            : 'bg-slate-950 text-sky-300 border-slate-800'
        }`}>
          <Timer className="h-4 w-4 animate-spin text-sky-400" />
          <span>Slot Hold: <strong className={isExpired ? 'text-rose-400' : 'text-amber-300'}>{formatTimer(timeLeft)}</strong></span>
        </div>
      </div>

      {/* Appointment Summary Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Hospital */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Building2 className="h-4 w-4 text-sky-400" />
            <span>Hospital</span>
          </div>
          <p className="mt-1 font-semibold text-white text-sm">
            {intent.hospitalName}
          </p>
          <span className="text-[11px] text-slate-400">Main Campus OPD Wing</span>
        </div>

        {/* Specialty */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Stethoscope className="h-4 w-4 text-teal-400" />
            <span>Specialty</span>
          </div>
          <p className="mt-1 font-semibold text-white text-sm">
            {intent.specialty}
          </p>
          <span className="text-[11px] text-slate-400">Doctor: {intent.doctorName}</span>
        </div>

        {/* Requested Date */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>Requested date</span>
          </div>
          <p className="mt-1 font-semibold text-white text-sm">
            {intent.requestedDate}
          </p>
          <span className="text-[11px] text-slate-400">Tomorrow morning</span>
        </div>

        {/* Preferred Time */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Preferred time</span>
          </div>
          <p className="mt-1 font-semibold text-white text-sm">
            {intent.preferredTime}
          </p>
          <span className="text-[11px] text-slate-400">
            Example times only; actual slots must come from the live availability service.
          </span>
        </div>
      </div>

      {/* Consultation Type Selector */}
      <div className="mt-5">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Consultation type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConsultationType('in_person')}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
              consultationType === 'in_person'
                ? 'border-sky-500 bg-sky-950/40 text-white ring-1 ring-sky-500'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg ${consultationType === 'in_person' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">In-person</p>
              <p className="text-[11px] text-slate-400">At hospital consultation desk</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setConsultationType('teleconsultation')}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
              consultationType === 'teleconsultation'
                ? 'border-teal-500 bg-teal-950/40 text-white ring-1 ring-teal-500'
                : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg ${consultationType === 'teleconsultation' ? 'bg-teal-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Video className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Teleconsultation</p>
              <p className="text-[11px] text-slate-400">Teleconsultation, if supported</p>
            </div>
          </button>
        </div>
      </div>

      {/* Fee & Policy Disclaimer */}
      <div className="mt-4 rounded-xl bg-slate-950/60 border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
        <div>
          <span>Applicable OPD Fee: </span>
          <strong className="text-white font-mono">₹{intent.fee} INR</strong>
          <span className="text-[11px] text-slate-400 ml-1">(Pay at desk or UPI/Card)</span>
        </div>
        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{intent.cancellationPolicy}</span>
        </div>
      </div>

      {/* Explicit Patient Consent Checkbox (MANDATORY REQUIREMENT) */}
      <div className="mt-5 rounded-xl border-2 border-sky-500/30 bg-sky-950/20 p-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            id="patient-explicit-consent-checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
          />
          <span className="text-xs font-medium text-slate-200 leading-relaxed">
            I have reviewed these details and authorize MediQueue to submit this appointment booking request.
          </span>
        </label>
      </div>

      {/* Error Message banner */}
      {errorMessage && (
        <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Lock className="h-3.5 w-3.5 text-amber-400" />
          <span>Backend will revalidate slot availability & prevent duplicates</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="w-1/2 sm:w-auto rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            Cancel Intent
          </button>

          <button
            type="button"
            id="confirm-booking-btn"
            disabled={!consentChecked || isExpired || isConfirming}
            onClick={() => onConfirm(consultationType, consentChecked)}
            className="w-1/2 sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-mediblue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-mediblue-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authorizing & Committing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm booking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Architectural Guarantee Notice */}
      <div className="mt-4 border-t border-slate-800/80 pt-3">
        <p className="text-[10px] text-slate-400 text-center leading-normal">
          <strong className="text-slate-400 font-semibold">MediQueue Security Policy:</strong> In production, the card must display the actual doctor, available slot, applicable fee and cancellation terms where relevant. The backend must revalidate the selected slot when the patient confirms. The interactive card above only demonstrates the interface; it connects to hospital scheduling and creates an authoritative booking only upon successful backend authorization.
        </p>
      </div>
    </div>
  );
};
