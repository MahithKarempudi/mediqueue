import React, { useState, useEffect } from 'react';
import type { BookingIntent, ConsultationType } from '@/types/appointmentWorkflow';
import {
  ShieldCheck,
  Calendar,
  Clock,
  UserCheck,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface AppointmentConfirmationCardProps {
  intent: BookingIntent;
  onConfirm: (intentId: string, idempotencyKey: string, consentConfirmed: boolean, consultationType: ConsultationType) => void;
  onCancel: (intentId: string) => void;
  onModify: (intent: BookingIntent) => void;
  isSubmitting?: boolean;
}

export const AppointmentConfirmationCard: React.FC<AppointmentConfirmationCardProps> = ({
  intent,
  onConfirm,
  onCancel,
  onModify,
  isSubmitting = false,
}) => {
  const [consentChecked, setConsentChecked] = useState(false);
  const [consultationType, setConsultationType] = useState<ConsultationType>(intent.consultationType);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);

  useEffect(() => {
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(intent.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [intent.expiresAt]);

  const isExpired = secondsLeft <= 0 || intent.status === 'EXPIRED';
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-clinical-md my-3">
      {/* Top Clinical Authorization Banner */}
      <div className="bg-navy-950 px-5 py-3.5 border-b border-navy-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-mediteal-500/20 border border-mediteal-500/40 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-mediteal-400" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-white block">
              Patient Booking Authorization Required
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Intent Ref: {intent.intentId}
            </span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${
            isExpired
              ? 'bg-red-950/80 text-red-300 border-red-700/60'
              : secondsLeft < 60
              ? 'bg-amber-950/80 text-amber-300 border-amber-700/60 animate-pulse'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {isExpired ? 'SLOT HOLD EXPIRED' : `Slot Hold: ${formatTime(secondsLeft)}`}
        </div>
      </div>

      {/* Structured Clinical Details */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-mediblue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Identity</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{intent.patientName}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {intent.patientId}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-mediteal-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Facility & Department</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{intent.hospitalName}</p>
              <p className="text-xs text-mediteal-700 font-semibold">{intent.specialty}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 sm:border-t border-slate-200/70">
            <Calendar className="w-4 h-4 text-mediblue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consultant & Schedule</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{intent.doctorName}</p>
              <p className="text-xs text-mediblue-700 font-semibold">
                {intent.requestedDate} at {intent.preferredTime}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 sm:border-t border-slate-200/70">
            <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OPD Consultation Fee</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">₹{intent.fee}.00 INR</p>
              <p className="text-xs text-slate-500">{intent.cancellationPolicy}</p>
            </div>
          </div>
        </div>

        {/* Consultation Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Consultation Format</span>
          <div className="flex gap-2">
            {(['In-Person OPD', 'Telehealth Video'] as ConsultationType[]).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={isExpired || isSubmitting}
                onClick={() => setConsultationType(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  consultationType === mode
                    ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Explicit Mandatory Consent Checkbox */}
        <label
          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            consentChecked
              ? 'bg-emerald-50/70 border-emerald-300'
              : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
          }`}
        >
          <input
            type="checkbox"
            checked={consentChecked}
            disabled={isExpired || isSubmitting}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-mediteal-600 focus:ring-mediteal-500"
          />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900">Explicit Patient Authorization: </span>
            I verify that the clinical slot details above are accurate and authorize MediQueue to commit this appointment and issue a live OPD queue token.
          </div>
        </label>

        {/* Security & Idempotency Metadata */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-mediteal-600" />
            Idempotency Key: {intent.idempotencyKey}
          </span>
          <span>State: {intent.status}</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={!consentChecked || isExpired || isSubmitting}
            onClick={() => onConfirm(intent.intentId, intent.idempotencyKey, consentChecked, consultationType)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-mediteal-600 hover:bg-mediteal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Verifying & Committing...' : 'Authorize & Confirm Booking'}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onModify(intent)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Change Slot
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onCancel(intent.intentId)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-all cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel Hold
          </button>
        </div>

        {!consentChecked && !isExpired && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            Check the authorization box above to unlock appointment commit.
          </div>
        )}
      </div>
    </div>
  );
};
