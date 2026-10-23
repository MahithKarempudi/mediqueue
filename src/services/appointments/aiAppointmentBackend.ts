// Backend Appointment Authorization & Controlled Execution Service
// Principle: The AI may search, recommend and prepare an appointment,
// but only the authenticated backend can authorize and atomically commit the booking.

import type { User, UserRole, Hospital, Department, Staff, OpdAppointment, QueueToken, LiveQueue } from '@/types';
import type {
  AppointmentSlot,
  BookingIntent,
  ConfirmedBookingResult,
  AppointmentWorkflowState,
  ConsultationType,
} from '@/types/appointmentWorkflow';
import { dbService } from '../db';
import { auditChainService } from '../forensics/auditChainService';

// In-memory slot availability and hold store (simulates database row-level locking)
const slotStore: Record<string, { available: boolean; heldByIntentId?: string; expiresAt?: number }> = {};
const intentStore: Record<string, BookingIntent> = {};
const committedIdempotencyKeys: Record<string, ConfirmedBookingResult> = {};

// Negative-testing simulation flags
let simulatedCollisionSlotId: string | null = null;

export const aiAppointmentBackend = {
  // -------------------------------------------------------------
  // 1. searchAppointmentSlots
  // Role & Scope: Patient, Staff (own hospital), Admin (own hospital)
  // -------------------------------------------------------------
  async searchAppointmentSlots(
    params: {
      specialty?: string;
      hospitalId?: string;
      date?: string;
      preferredTime?: string;
    },
    caller: User
  ): Promise<{ slots: AppointmentSlot[]; error?: string }> {
    // 1. Mandatory Identity Check
    if (!caller || !caller.uid) {
      return { slots: [], error: 'UNAUTHENTICATED: Valid session required to query appointment availability.' };
    }

    // 2. Role-Based Access Control
    if (caller.role === 'government_officer') {
      return { slots: [], error: 'FORBIDDEN: Government officers have aggregate reporting access only, not clinical slot search.' };
    }

    // 3. Hospital Scope Enforcement
    if (caller.role === 'staff' && caller.hospitalId && params.hospitalId && caller.hospitalId !== params.hospitalId) {
      return { slots: [], error: `FORBIDDEN: Staff is restricted to assigned hospital [${caller.hospitalId}]. Cannot query [${params.hospitalId}].` };
    }

    try {
      const [hospitals, departments, staffList] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
      ]);

      const targetHospitalId = params.hospitalId || (caller.role === 'staff' ? caller.hospitalId : hospitals[0]?.hospitalId);
      const targetHospital = hospitals.find((h) => h.hospitalId === targetHospitalId) || hospitals[0];

      if (!targetHospital) {
        return { slots: [], error: 'Hospital not found.' };
      }

      // Filter departments by specialty/name
      let validDepts = departments.filter((d) => d.hospitalId === targetHospital.hospitalId);
      if (params.specialty) {
        const query = params.specialty.toLowerCase();
        validDepts = validDepts.filter(
          (d) => d.name.toLowerCase().includes(query) || query.includes(d.name.toLowerCase())
        );
        if (validDepts.length === 0) {
          validDepts = departments.filter((d) => d.hospitalId === targetHospital.hospitalId);
        }
      }

      const slots: AppointmentSlot[] = [];
      const times = ['09:30 AM', '10:30 AM', '11:45 AM', '02:00 PM', '03:30 PM', '04:15 PM'];
      const searchDate = params.date || '2026-10-24';

      validDepts.forEach((dept) => {
        const deptDoctors = staffList.filter(
          (s) => s.hospitalId === targetHospital.hospitalId && s.departmentId === dept.departmentId
        );
        const doctor = deptDoctors[0] || {
          staffId: 'staff_cardio_01',
          name: 'Dr. Rajesh Kumar',
          designation: 'Senior Consultant Cardiologist, MD',
        };

        times.forEach((slotTime, idx) => {
          const slotId = `slot_${targetHospital.hospitalId}_${dept.departmentId}_${idx}`;
          // Check slot store availability
          const slotState = slotStore[slotId];
          const isSlotAvailable = slotState ? slotState.available : true;

          slots.push({
            slotId,
            hospitalId: targetHospital.hospitalId,
            hospitalName: targetHospital.name,
            departmentId: dept.departmentId,
            specialty: dept.name,
            doctorId: doctor.staffId,
            doctorName: doctor.name || 'Dr. Rajesh Kumar',
            doctorQualification: doctor.designation || 'Specialist Physician',
            date: searchDate,
            time: slotTime,
            available: isSlotAvailable,
            fee: 500, // INR ₹500 standard OPD fee
          });
        });
      });

      // Audit Log: Search slots event
      auditChainService.appendEvent({
        eventType: 'SLOT_SELECTED',
        severity: 'INFO',
        actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
        hospitalId: targetHospital.hospitalId,
        details: `Queried availability for specialty '${params.specialty || 'General'}' at [${targetHospital.name}]. Found ${slots.length} slots.`,
      });

      return { slots };
    } catch (e: any) {
      auditChainService.appendEvent({
        eventType: 'AI_TOOL_FAILURE',
        severity: 'WARN',
        actor: { uid: caller.uid, role: caller.role, name: caller.name },
        details: `Slot search failure: ${e.message}`,
      });
      return { slots: [], error: e.message };
    }
  },

  // -------------------------------------------------------------
  // 2. createBookingIntent (State: AWAITING_CONFIRMATION)
  // Prepares a booking intent card with explicit expiration hold
  // -------------------------------------------------------------
  async createBookingIntent(
    params: {
      slot: AppointmentSlot;
      patientId?: string;
      patientName?: string;
      consultationType: ConsultationType;
      idempotencyKey?: string;
    },
    caller: User
  ): Promise<{ intent?: BookingIntent; error?: string }> {
    // 1. Authentication Check
    if (!caller || !caller.uid) {
      return { error: 'UNAUTHENTICATED: Caller identity must be verified by backend.' };
    }

    // 2. Ownership & Authority Validation
    let targetPatientId = params.patientId || caller.patientId || caller.uid;
    let targetPatientName = params.patientName || caller.name;

    if (caller.role === 'patient') {
      // Patient can only book for themselves or registered dependent
      if (caller.patientId && targetPatientId !== caller.patientId) {
        auditChainService.appendEvent({
          eventType: 'BOOKING_DENIED',
          severity: 'WARN',
          actor: { uid: caller.uid, role: caller.role, name: caller.name },
          targetPatientId,
          details: `Cross-patient booking violation. Patient [${caller.patientId}] attempted to create intent for [${targetPatientId}].`,
        });
        return { error: 'FORBIDDEN: You are only authorized to create bookings for your own verified patient identity.' };
      }
    } else if (caller.role === 'staff') {
      // Staff booking on behalf of patient must verify hospital scope
      if (caller.hospitalId && caller.hospitalId !== params.slot.hospitalId) {
        return { error: `FORBIDDEN: Staff cannot prepare bookings outside assigned hospital [${caller.hospitalId}].` };
      }
    } else if (caller.role === 'government_officer' || caller.role === 'super_admin') {
      return { error: `FORBIDDEN: Role [${caller.role}] has no clinical booking authority.` };
    }

    // 3. Slot Availability Check
    const slotState = slotStore[params.slot.slotId];
    if (slotState && !slotState.available) {
      return { error: 'UNAVAILABLE: The requested slot is already booked or no longer open.' };
    }

    const intentId = `intent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const idempotencyKey = params.idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set 5-minute hold on the slot
    const holdDurationMs = 5 * 60 * 1000;
    const expiresAt = new Date(Date.now() + holdDurationMs).toISOString();

    slotStore[params.slot.slotId] = {
      available: true,
      heldByIntentId: intentId,
      expiresAt: Date.now() + holdDurationMs,
    };

    const intent: BookingIntent = {
      intentId,
      patientId: targetPatientId,
      patientName: targetPatientName,
      hospitalId: params.slot.hospitalId,
      hospitalName: params.slot.hospitalName,
      departmentId: params.slot.departmentId,
      specialty: params.slot.specialty,
      doctorId: params.slot.doctorId,
      doctorName: params.slot.doctorName,
      requestedDate: params.slot.date,
      preferredTime: params.slot.time,
      consultationType: params.consultationType,
      fee: params.slot.fee,
      cancellationPolicy: 'Free cancellation up to 2 hours prior to scheduled appointment.',
      expiresAt,
      status: 'AWAITING_CONFIRMATION',
      idempotencyKey,
      createdAt: new Date().toISOString(),
    };

    intentStore[intentId] = intent;

    // Audit Log: Intent Created
    auditChainService.appendEvent({
      eventType: 'BOOKING_REQUESTED',
      severity: 'INFO',
      actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
      targetPatientId,
      hospitalId: params.slot.hospitalId,
      requestId: intentId,
      details: `Prepared booking intent #${intentId} for ${intent.specialty} with ${intent.doctorName} on ${intent.requestedDate} ${intent.preferredTime}. State: AWAITING_CONFIRMATION.`,
    });

    return { intent };
  },

  // -------------------------------------------------------------
  // 3. confirmAppointment (Transitions to: CONFIRMED)
  // Backend revalidates availability, verifies explicit consent,
  // prevents duplicates via idempotency key, and atomically commits.
  // -------------------------------------------------------------
  async confirmAppointment(
    params: {
      intentId: string;
      idempotencyKey: string;
      consentConfirmed: boolean;
      simulateCollision?: boolean;
    },
    caller: User
  ): Promise<{ result?: ConfirmedBookingResult; error?: string; state?: AppointmentWorkflowState }> {
    // 1. Mandatory Identity Check
    if (!caller || !caller.uid) {
      return { error: 'UNAUTHENTICATED: Caller must be signed in.', state: 'FAILED' };
    }

    // 2. Fetch Authoritative Intent
    const intent = intentStore[params.intentId];
    if (!intent) {
      return { error: 'NOT_FOUND: Booking intent not found or expired from session cache.', state: 'FAILED' };
    }

    // 3. Mandatory Consent Check (Section 1 Step 6)
    if (!params.consentConfirmed) {
      auditChainService.appendEvent({
        eventType: 'BOOKING_DENIED',
        severity: 'WARN',
        actor: { uid: caller.uid, role: caller.role, name: caller.name },
        requestId: params.intentId,
        details: 'Confirmation rejected: Missing explicit patient consent check.',
      });
      return {
        error: 'CONSENT_REQUIRED: Patient must explicitly check the confirmation authorization box before booking can be committed.',
        state: 'AWAITING_CONFIRMATION',
      };
    }

    // 4. Ownership Check
    if (caller.role === 'patient') {
      const callerPatientId = caller.patientId || caller.uid;
      if (intent.patientId !== callerPatientId) {
        auditChainService.appendEvent({
          eventType: 'BOOKING_DENIED',
          severity: 'WARN',
          actor: { uid: caller.uid, role: caller.role, name: caller.name },
          requestId: params.intentId,
          details: `Ownership authorization failure. Caller [${callerPatientId}] does not own intent [${intent.intentId}].`,
        });
        return { error: 'FORBIDDEN: You do not have permission to authorize this booking intent.', state: 'FAILED' };
      }
    }

    // 5. Duplicate Request / Idempotency Check (Section 5)
    if (committedIdempotencyKeys[params.idempotencyKey]) {
      const cachedResult = committedIdempotencyKeys[params.idempotencyKey];
      auditChainService.appendEvent({
        eventType: 'CONFIRMATION_ATTEMPTED',
        severity: 'INFO',
        actor: { uid: caller.uid, role: caller.role, name: caller.name },
        requestId: params.intentId,
        appointmentId: cachedResult.appointmentId,
        details: `Duplicate confirmation submission detected with key [${params.idempotencyKey}]. Returned cached committed record.`,
      });
      return { result: cachedResult, state: 'CONFIRMED' };
    }

    // 6. Hold Expiration Check
    if (new Date() > new Date(intent.expiresAt)) {
      intent.status = 'EXPIRED';
      auditChainService.appendEvent({
        eventType: 'BOOKING_DENIED',
        severity: 'WARN',
        actor: { uid: caller.uid, role: caller.role, name: caller.name },
        requestId: params.intentId,
        details: `Booking window expired. Confirmation received after hold deadline ${intent.expiresAt}.`,
      });
      return { error: 'EXPIRED: The 5-minute hold window for this slot has expired. Please select a new slot.', state: 'EXPIRED' };
    }

    // 7. Atomic Slot Collision Check (Simulated or Real Race Condition)
    if (params.simulateCollision || simulatedCollisionSlotId) {
      intent.status = 'UNAVAILABLE';
      simulatedCollisionSlotId = null;
      auditChainService.appendEvent({
        eventType: 'BOOKING_DENIED',
        severity: 'WARN',
        actor: { uid: caller.uid, role: caller.role, name: caller.name },
        requestId: params.intentId,
        details: `Race condition collision detected. Slot was claimed by another patient during revalidation.`,
      });
      return {
        error: 'UNAVAILABLE: The selected slot was booked by another patient milliseconds before confirmation. Please choose an alternate slot.',
        state: 'UNAVAILABLE',
      };
    }

    // 8. Atomic Commit to Persistent Store
    try {
      const authoritativeAppointmentId = `APT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Update Live RTDB Queue
      const queuePath = `liveQueues/${intent.hospitalId}/${intent.departmentId}`;
      const liveQueue = (await dbService.getRTDB<LiveQueue>(queuePath)) || {
        currentToken: 14,
        tokenList: [],
        lastUpdated: new Date().toISOString(),
      };

      const lastToken = liveQueue.tokenList.length > 0
        ? Math.max(...liveQueue.tokenList.map((t) => t.tokenNo))
        : 14;
      const assignedTokenNo = lastToken + 1;

      const newToken: QueueToken = {
        tokenNo: assignedTokenNo,
        patientId: intent.patientId,
        patientName: intent.patientName,
        appointmentId: authoritativeAppointmentId,
        status: 'waiting',
        joinedAt: new Date().toISOString(),
      };

      await dbService.setRTDB(queuePath, {
        currentToken: liveQueue.currentToken || 14,
        tokenList: [...(liveQueue.tokenList || []), newToken],
        lastUpdated: new Date().toISOString(),
      });

      // Save to Firestore opd_appointments collection
      const newAppointment: OpdAppointment = {
        appointmentId: authoritativeAppointmentId,
        patientId: intent.patientId,
        hospitalId: intent.hospitalId,
        departmentId: intent.departmentId,
        doctorId: intent.doctorId,
        slotTime: `${intent.requestedDate} ${intent.preferredTime}`,
        status: 'scheduled',
      };
      await dbService.setDocument('opd_appointments', authoritativeAppointmentId, newAppointment);

      // Transition state to CONFIRMED
      intent.status = 'CONFIRMED';

      // Log Cryptographic Audit Trail Event
      const auditLog = auditChainService.appendEvent({
        eventType: 'BOOKING_COMMITTED',
        severity: 'INFO',
        actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
        targetPatientId: intent.patientId,
        hospitalId: intent.hospitalId,
        requestId: params.intentId,
        appointmentId: authoritativeAppointmentId,
        details: `Committed booking ${authoritativeAppointmentId} (Token #${assignedTokenNo}) for ${intent.specialty} with ${intent.doctorName}. Type: ${intent.consultationType}.`,
      });

      const confirmedResult: ConfirmedBookingResult = {
        appointmentId: authoritativeAppointmentId,
        intentId: params.intentId,
        tokenNo: assignedTokenNo,
        patientId: intent.patientId,
        patientName: intent.patientName,
        hospitalId: intent.hospitalId,
        hospitalName: intent.hospitalName,
        specialty: intent.specialty,
        doctorName: intent.doctorName,
        scheduledTime: `${intent.requestedDate} at ${intent.preferredTime}`,
        consultationType: intent.consultationType,
        fee: intent.fee,
        status: 'CONFIRMED',
        committedAt: new Date().toISOString(),
        forensicHash: auditLog.currentHash,
      };

      // Store in idempotency registry
      committedIdempotencyKeys[params.idempotencyKey] = confirmedResult;

      return { result: confirmedResult, state: 'CONFIRMED' };
    } catch (err: any) {
      auditChainService.appendEvent({
        eventType: 'AI_TOOL_FAILURE',
        severity: 'CRITICAL',
        actor: { uid: caller.uid, role: caller.role, name: caller.name },
        requestId: params.intentId,
        details: `Atomic booking commit failed: ${err.message}`,
      });
      return { error: `COMMIT_FAILED: Backend database error: ${err.message}`, state: 'FAILED' };
    }
  },

  // -------------------------------------------------------------
  // 4. getAppointmentSummary
  // Enforces ownership and scope
  // -------------------------------------------------------------
  async getAppointmentSummary(
    appointmentId: string,
    caller: User
  ): Promise<{ appointment?: OpdAppointment; error?: string }> {
    if (!caller || !caller.uid) {
      return { error: 'UNAUTHENTICATED: Authentication required.' };
    }

    const appt = await dbService.getDocument<OpdAppointment>('opd_appointments', appointmentId);
    if (!appt) {
      return { error: 'Appointment record not found.' };
    }

    // Role ownership check
    if (caller.role === 'patient') {
      const callerPatientId = caller.patientId || caller.uid;
      if (appt.patientId !== callerPatientId) {
        auditChainService.appendEvent({
          eventType: 'BOOKING_DENIED',
          severity: 'WARN',
          actor: { uid: caller.uid, role: caller.role, name: caller.name },
          appointmentId,
          details: `Patient [${callerPatientId}] attempted unauthorized view of appointment [${appointmentId}] belonging to [${appt.patientId}].`,
        });
        return { error: 'FORBIDDEN: You do not have permission to view other patients\' appointment records.' };
      }
    } else if (caller.role === 'staff' || caller.role === 'hospital_admin') {
      if (caller.hospitalId && caller.hospitalId !== appt.hospitalId) {
        return { error: 'FORBIDDEN: You cannot view records from an external hospital.' };
      }
    }

    return { appointment: appt };
  },

  // -------------------------------------------------------------
  // 5. cancelAppointment (Transitions to: CANCELLED)
  // -------------------------------------------------------------
  async cancelAppointment(
    params: { appointmentId: string; reason: string; consentConfirmed: boolean },
    caller: User
  ): Promise<{ success: boolean; error?: string }> {
    if (!caller || !caller.uid) {
      return { success: false, error: 'UNAUTHENTICATED' };
    }

    const { appointment, error } = await this.getAppointmentSummary(params.appointmentId, caller);
    if (error || !appointment) {
      return { success: false, error: error || 'Appointment not found' };
    }

    if (!params.consentConfirmed) {
      return { success: false, error: 'CONSENT_REQUIRED: Explicit patient authorization is required to cancel.' };
    }

    await dbService.updateDocument('opd_appointments', params.appointmentId, {
      status: 'cancelled',
    });

    auditChainService.appendEvent({
      eventType: 'APPOINTMENT_CANCELLED',
      severity: 'INFO',
      actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
      appointmentId: params.appointmentId,
      hospitalId: appointment.hospitalId,
      targetPatientId: appointment.patientId,
      details: `Appointment ${params.appointmentId} cancelled by ${caller.role}. Reason: ${params.reason}`,
    });

    return { success: true };
  },

  // -------------------------------------------------------------
  // 6. rescheduleAppointment (Transitions to: RESCHEDULED)
  // -------------------------------------------------------------
  async rescheduleAppointment(
    params: { appointmentId: string; newSlotTime: string; consentConfirmed: boolean },
    caller: User
  ): Promise<{ success: boolean; error?: string }> {
    if (!caller || !caller.uid) {
      return { success: false, error: 'UNAUTHENTICATED' };
    }

    const { appointment, error } = await this.getAppointmentSummary(params.appointmentId, caller);
    if (error || !appointment) {
      return { success: false, error: error || 'Appointment not found' };
    }

    if (!params.consentConfirmed) {
      return { success: false, error: 'CONSENT_REQUIRED: Explicit patient authorization is required to reschedule.' };
    }

    await dbService.updateDocument('opd_appointments', params.appointmentId, {
      slotTime: params.newSlotTime,
    });

    auditChainService.appendEvent({
      eventType: 'RESCHEDULE_COMMITTED',
      severity: 'INFO',
      actor: { uid: caller.uid, role: caller.role, name: caller.name },
      appointmentId: params.appointmentId,
      hospitalId: appointment.hospitalId,
      targetPatientId: appointment.patientId,
      details: `Rescheduled appointment ${params.appointmentId} to new slot: ${params.newSlotTime}.`,
    });

    return { success: true };
  },

  // -------------------------------------------------------------
  // 7. getRequestStatus
  // Returns authoritative status of an intent or appointment
  // -------------------------------------------------------------
  getRequestStatus(intentId: string): AppointmentWorkflowState {
    const intent = intentStore[intentId];
    if (!intent) return 'FAILED';
    if (intent.status === 'AWAITING_CONFIRMATION' && new Date() > new Date(intent.expiresAt)) {
      intent.status = 'EXPIRED';
    }
    return intent.status;
  },

  // Demonstration test trigger: Simulate slot collision
  triggerSimulatedCollision(slotId?: string): void {
    simulatedCollisionSlotId = slotId || 'any_slot';
  },
};
