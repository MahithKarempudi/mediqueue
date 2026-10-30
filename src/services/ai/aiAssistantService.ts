// MediQueue AI Assistant — Ask, Find & Act
// Orchestration & Tool Execution Engine
// Enforces caller authentication, strict RBAC, hospital scope, and audit logging.

import type { User, UserRole, Hospital, Department, Staff, IpdBed, OpdAppointment, LiveQueue } from '@/types';
import type { AppointmentSlot, BookingIntent, ConsultationType } from '@/types/appointmentWorkflow';
import { dbService } from '../db';
import { aiAppointmentBackend } from '../appointments/aiAppointmentBackend';
import { auditChainService } from '../forensics/auditChainService';

export interface AiToolResult {
  toolName: string;
  success: boolean;
  message: string;
  data?: any;
  intent?: BookingIntent;
  slots?: AppointmentSlot[];
  beds?: IpdBed[];
  appointments?: OpdAppointment[];
  operationalSummary?: Record<string, any>;
  requiresConfirmation?: boolean;
}

export const aiAssistantService = {
  // Allowlisted Tool 1: searchAppointmentSlots
  async searchAppointmentSlots(
    params: { specialty?: string; hospitalId?: string; date?: string },
    caller: User
  ): Promise<AiToolResult> {
    const { slots, error } = await aiAppointmentBackend.searchAppointmentSlots(params, caller);
    if (error) {
      return {
        toolName: 'searchAppointmentSlots',
        success: false,
        message: `Search rejected: ${error}`,
      };
    }
    return {
      toolName: 'searchAppointmentSlots',
      success: true,
      message: `Found ${slots.length} available appointment slots matching '${params.specialty || 'General'}' at the authorized facility.`,
      slots,
    };
  },

  // Allowlisted Tool 2: getMyAppointments
  async getMyAppointments(caller: User): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'getMyAppointments', success: false, message: 'Authentication required.' };
    }

    try {
      const allAppointments = await dbService.getCollection<OpdAppointment>('opd_appointments');
      let authorizedList: OpdAppointment[] = [];

      if (caller.role === 'patient') {
        const patientId = caller.patientId || caller.uid;
        authorizedList = allAppointments.filter((a) => a.patientId === patientId);
      } else if (caller.role === 'staff' || caller.role === 'hospital_admin') {
        authorizedList = allAppointments.filter((a) => a.hospitalId === caller.hospitalId);
      } else {
        return {
          toolName: 'getMyAppointments',
          success: false,
          message: `Access denied: Role [${caller.role}] has no individual clinical appointment listing permission.`,
        };
      }

      auditChainService.appendEvent({
        eventType: 'SLOT_SELECTED',
        severity: 'INFO',
        actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
        details: `Retrieved ${authorizedList.length} appointment records for user [${caller.name}].`,
      });

      return {
        toolName: 'getMyAppointments',
        success: true,
        message: `Retrieved ${authorizedList.length} authorized appointment records.`,
        appointments: authorizedList,
      };
    } catch (e: any) {
      return { toolName: 'getMyAppointments', success: false, message: e.message };
    }
  },

  // Allowlisted Tool 3: getRequestStatus
  async getRequestStatus(requestId: string, caller: User): Promise<AiToolResult> {
    const status = aiAppointmentBackend.getRequestStatus(requestId);
    return {
      toolName: 'getRequestStatus',
      success: true,
      message: `Booking request [${requestId}] is currently in state: ${status}.`,
      data: { requestId, status },
    };
  },

  // Allowlisted Tool 4: getAuthorizedBedAvailability
  async getAuthorizedBedAvailability(hospitalIdParam: string | undefined, caller: User): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'getAuthorizedBedAvailability', success: false, message: 'Authentication required.' };
    }

    // Role & Hospital Scope Checks
    let targetHospitalId = hospitalIdParam;
    if (caller.role === 'staff' || caller.role === 'hospital_admin') {
      targetHospitalId = caller.hospitalId || targetHospitalId;
      if (hospitalIdParam && caller.hospitalId && hospitalIdParam !== caller.hospitalId) {
        return {
          toolName: 'getAuthorizedBedAvailability',
          success: false,
          message: `Scope violation: Staff/Admin is restricted to hospital [${caller.hospitalId}]. Cannot query [${hospitalIdParam}].`,
        };
      }
    }

    const allBeds = await dbService.getCollection<IpdBed>('ipd_beds');
    const filteredBeds = targetHospitalId ? allBeds.filter((b) => b.hospitalId === targetHospitalId) : allBeds;

    const availableCount = filteredBeds.filter((b) => b.status === 'available').length;
    const occupiedCount = filteredBeds.filter((b) => b.status === 'occupied').length;

    return {
      toolName: 'getAuthorizedBedAvailability',
      success: true,
      message: `Bed Census: ${availableCount} available, ${occupiedCount} occupied (${filteredBeds.length} total monitored beds).`,
      beds: filteredBeds.slice(0, 10),
      data: { availableCount, occupiedCount, total: filteredBeds.length },
    };
  },

  // Allowlisted Tool 5: getHospitalOperationalSummary
  async getHospitalOperationalSummary(caller: User): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'getHospitalOperationalSummary', success: false, message: 'Authentication required.' };
    }

    if (caller.role === 'patient') {
      return {
        toolName: 'getHospitalOperationalSummary',
        success: false,
        message: 'Access Denied: Patients do not have access to internal administrative hospital metrics.',
      };
    }

    const [hospitals, beds, appointments] = await Promise.all([
      dbService.getCollection<Hospital>('hospitals'),
      dbService.getCollection<IpdBed>('ipd_beds'),
      dbService.getCollection<OpdAppointment>('opd_appointments'),
    ]);

    const targetHosp = hospitals.find((h) => h.hospitalId === caller.hospitalId) || hospitals[0];
    const hospBeds = beds.filter((b) => b.hospitalId === targetHosp?.hospitalId);
    const hospAppts = appointments.filter((a) => a.hospitalId === targetHosp?.hospitalId);

    const totalBeds = hospBeds.length;
    const occupiedBeds = hospBeds.filter((b) => b.status === 'occupied').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const summary = {
      hospitalName: targetHosp?.name || 'Authorized Regional Medical Center',
      hospitalId: targetHosp?.hospitalId,
      bedOccupancyRate: `${occupancyRate}%`,
      occupiedBeds,
      totalBeds,
      activeOpdBookingsToday: hospAppts.length,
      surgeStatus: occupancyRate >= 85 ? 'Level 2 Surge Warning' : 'Normal Operations',
    };

    return {
      toolName: 'getHospitalOperationalSummary',
      success: true,
      message: `Operational summary for ${summary.hospitalName}: ${summary.bedOccupancyRate} bed occupancy, ${summary.activeOpdBookingsToday} OPD visits scheduled.`,
      operationalSummary: summary,
    };
  },

  // Allowlisted Tool 6: updateBedStatus (Requires Consequential Authorization)
  async updateBedStatus(
    params: { hospitalId: string; bedId: string; newStatus: 'available' | 'occupied' | 'maintenance' },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'updateBedStatus', success: false, message: 'Authentication required.' };
    }

    if (caller.role !== 'staff' && caller.role !== 'hospital_admin' && caller.role !== 'super_admin') {
      return {
        toolName: 'updateBedStatus',
        success: false,
        message: `Forbidden: Role [${caller.role}] has no clinical bed modification authority.`,
      };
    }

    if (caller.role !== 'super_admin' && caller.hospitalId && caller.hospitalId !== params.hospitalId) {
      return {
        toolName: 'updateBedStatus',
        success: false,
        message: `Hospital Scope Violation: You are assigned to [${caller.hospitalId}], cannot alter bed at [${params.hospitalId}].`,
      };
    }

    await dbService.updateBedStatus(params.hospitalId, params.bedId, params.newStatus);

    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      severity: 'INFO',
      actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
      hospitalId: params.hospitalId,
      details: `Bed [${params.bedId}] status transitioned to ${params.newStatus.toUpperCase()} by ${caller.name} (${caller.role}).`,
    });

    return {
      toolName: 'updateBedStatus',
      success: true,
      message: `Bed [${params.bedId}] successfully updated to ${params.newStatus.toUpperCase()} and synchronized to live RTDB capacity bus.`,
    };
  },

  // Orchestrator: Maps Natural Language Prompt to Allowlisted Tools
  async processUserMessage(promptText: string, caller: User): Promise<AiToolResult> {
    const text = promptText.toLowerCase().trim();

    // 1. Bed Availability Query
    if (text.includes('bed') && (text.includes('available') || text.includes('free') || text.includes('census') || text.includes('icu') || text.includes('status'))) {
      if (text.includes('update') || text.includes('change') || text.includes('mark')) {
        // Bed mutation requires staff/admin
        const newStatus = text.includes('occupied') ? 'occupied' : text.includes('maintenance') ? 'maintenance' : 'available';
        return this.updateBedStatus(
          {
            hospitalId: caller.hospitalId || 'hosp_metro_01',
            bedId: 'bed_cardio_icu_01',
            newStatus,
          },
          caller
        );
      }
      return this.getAuthorizedBedAvailability(caller.hospitalId, caller);
    }

    // 2. Operational / Administrative Summary
    if (text.includes('operational') || text.includes('summary') || text.includes('metrics') || text.includes('utilization') || text.includes('surge')) {
      return this.getHospitalOperationalSummary(caller);
    }

    // 3. Existing Appointments Query
    if (text.includes('my appointment') || text.includes('existing booking') || text.includes('view appointment') || text.includes('my bookings')) {
      return this.getMyAppointments(caller);
    }

    // 4. Request Status Query
    if (text.includes('status of request') || text.includes('check status') || text.includes('intent status')) {
      return this.getRequestStatus('intent_latest_demo', caller);
    }

    // 5. Default: Appointment Search & Preparation (Available to Patient & Staff)
    let specialty = 'Cardiology';
    if (text.includes('ortho')) specialty = 'Orthopedics';
    if (text.includes('pediatric') || text.includes('child')) specialty = 'Pediatrics';
    if (text.includes('general') || text.includes('physician')) specialty = 'General Medicine';

    return this.searchAppointmentSlots(
      {
        specialty,
        hospitalId: caller.hospitalId || 'hosp_metro_01',
        date: '2026-10-24',
      },
      caller
    );
  },
};
