// MediQueue AI: Controlled Appointment Confirmation Workflow & Forensics Types

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

export type ConsultationType = 'in_person' | 'teleconsultation' | 'In-Person OPD' | 'Telehealth Video';

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
  expiresAt: string;
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
  forensicHash: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  workflowState?: AppointmentWorkflowState;
  toolInvoked?: string;
  suggestedSlots?: AppointmentSlot[];
  bookingIntent?: BookingIntent;
  confirmedBooking?: ConfirmedBookingResult;
}

export type ForensicEventType =
  | 'BOOKING_REQUESTED'
  | 'SLOT_SELECTED'
  | 'CONFIRMATION_ATTEMPTED'
  | 'BOOKING_COMMITTED'
  | 'BOOKING_DENIED'
  | 'RESCHEDULE_COMMITTED'
  | 'APPOINTMENT_CANCELLED'
  | 'AI_TOOL_FAILURE';

export interface ForensicAuditEvent {
  index: number;
  sequenceNumber: number;
  id: string;
  timestamp: string;
  eventType: ForensicEventType;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  actor: {
    uid: string;
    role: UserRole;
    name: string;
    email?: string;
  };
  targetPatientId?: string;
  hospitalId?: string;
  requestId?: string;
  appointmentId?: string;
  details: string;
  payloadHash: string;
  previousHash: string;
  currentHash: string;
  tampered?: boolean;
}

export type ForensicAuditLog = ForensicAuditEvent;

export interface ChainVerificationResult {
  isValid: boolean;
  valid: boolean;
  totalBlocks: number;
  totalEvents: number;
  brokenIndex?: number;
  brokenAtSequence?: number;
  brokenEventId?: string;
  error?: string;
  details: string;
  verifiedAt: string;
}
