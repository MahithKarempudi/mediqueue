// MediQueue AI: Controlled Appointment Confirmation Workflow & Booking Types

import type { UserRole } from './index';

export type AppointmentWorkflowState =
  | 'IDLE'
  | 'SEARCHING'
  | 'AVAILABLE'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'UNAVAILABLE'
  | 'CANCELLED'
  | 'FAILED';

export type ConsultationType = 'in_person' | 'teleconsultation';

export interface AppointmentSlot {
  slotId: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  specialty: string;
  doctorId: string;
  doctorName: string;
  doctorQualification: string;
  date: string;
  time: string;
  available: boolean;
  fee: number;
}

export interface BookingIntent {
  intentId: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  specialty: string;
  doctorId: string;
  doctorName: string;
  requestedDate: string;
  preferredTime: string;
  consultationType: ConsultationType;
  fee: number;
  cancellationPolicy: string;
  expiresAt: string; // ISO timestamp (5 minute hold)
  status: AppointmentWorkflowState;
  idempotencyKey: string;
  createdAt: string;
}

export interface ConfirmedBookingResult {
  appointmentId: string;
  intentId: string;
  tokenNo: number;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  doctorName: string;
  scheduledTime: string;
  consultationType: ConsultationType;
  fee: number;
  status: 'CONFIRMED';
  committedAt: string;
  bookingReference: string;
}

export interface AppointmentWorkflowContext {
  state: AppointmentWorkflowState;
  selectedSlot: AppointmentSlot | null;
  activeIntent: BookingIntent | null;
  confirmedResult: ConfirmedBookingResult | null;
  error: string | null;
}
