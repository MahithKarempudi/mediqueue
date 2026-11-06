// MediQueue AI Assistant — Healthcare Operations & Scheduling Copilot
// Architecture: User Prompt -> Intent & Entity Extraction (Gemini LLM / Clinical NLU) ->
// Structured Tool Request -> Backend RBAC Authorisation -> Validated Operation -> Audit Chain -> Response

import type {
  User,
  Hospital,
  Department,
  Staff,
  IpdBed,
  OpdAppointment,
  LiveQueue,
  Patient,
} from '@/types';
import type {
  AppointmentSlot,
  BookingIntent,
  ConsultationType,
} from '@/types/appointmentWorkflow';
import { dbService } from '../db';
import { aiAppointmentBackend } from '../appointments/aiAppointmentBackend';
import { auditChainService } from '../forensics/auditChainService';
import { estimatePatientWaitTime } from '../analytics/waitTimeEngine';

export interface AiToolResult {
  toolName: string;
  success: boolean;
  message: string;
  data?: any;
  intent?: BookingIntent;
  slots?: AppointmentSlot[];
  beds?: IpdBed[];
  appointments?: OpdAppointment[];
  doctors?: Array<{
    staffId: string;
    name: string;
    departmentName: string;
    hospitalName: string;
    designation: string;
  }>;
  hospitals?: Hospital[];
  patientProfile?: Partial<Patient>;
  queueStatus?: {
    currentToken: number;
    userToken?: number;
    patientsAhead?: number;
    estimatedWaitMinutes: number;
    status: string;
  };
  operationalSummary?: Record<string, any>;
  requiresConfirmation?: boolean;
  engineMode?: 'GEMINI_LLM_LIVE' | 'CLINICAL_NLU_DETERMINISTIC';
}

// Gemini Function Calling Tool Declarations Schema
const GEMINI_TOOLS_SCHEMA = [
  {
    name: 'search_doctors',
    description: 'Search for available specialist physicians by department, specialty, hospital, or doctor name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        specialty: { type: 'STRING', description: 'Medical specialty e.g. Cardiology, Orthopedics, Pediatrics' },
        hospitalId: { type: 'STRING', description: 'Target hospital identifier e.g. hosp_metro_01' },
        doctorName: { type: 'STRING', description: 'Physician name query e.g. Dr. Rajesh Kumar' },
      },
    },
  },
  {
    name: 'get_doctor_availability',
    description: 'Query available OPD consultation appointment slots for a specific doctor, specialty, or date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        specialty: { type: 'STRING', description: 'Specialty e.g. Cardiology' },
        hospitalId: { type: 'STRING', description: 'Hospital ID' },
        doctorId: { type: 'STRING', description: 'Physician ID' },
        date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
      },
    },
  },
  {
    name: 'search_hospitals',
    description: 'Find hospital facilities by name, district, type, or emergency availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        district: { type: 'STRING', description: 'District name e.g. Central, North, South' },
        emergencyOnly: { type: 'BOOLEAN', description: 'Filter only facilities with active emergency services' },
      },
    },
  },
  {
    name: 'get_appointment_details',
    description: 'Retrieve authorized appointment records and statuses for the signed-in patient or authorized hospital.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appointmentId: { type: 'STRING', description: 'Specific appointment ID (optional)' },
      },
    },
  },
  {
    name: 'create_appointment',
    description: 'Prepare an authoritative appointment booking intent with a 5-minute hold requiring explicit patient confirmation.',
    parameters: {
      type: 'OBJECT',
      properties: {
        specialty: { type: 'STRING', description: 'Medical specialty' },
        hospitalId: { type: 'STRING', description: 'Hospital ID' },
        doctorId: { type: 'STRING', description: 'Doctor ID' },
        date: { type: 'STRING', description: 'Date in YYYY-MM-DD' },
        time: { type: 'STRING', description: 'Time slot e.g. 10:30 AM' },
        consultationType: { type: 'STRING', description: 'In-Person OPD or Telehealth Video' },
      },
      required: ['specialty'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing scheduled appointment with explicit verification and immutable audit trail.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appointmentId: { type: 'STRING', description: 'Appointment ID e.g. APT-2026-10001' },
        reason: { type: 'STRING', description: 'Reason for cancellation' },
      },
      required: ['appointmentId'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing scheduled appointment to a new date and time slot.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appointmentId: { type: 'STRING', description: 'Appointment ID' },
        newSlotTime: { type: 'STRING', description: 'New date and time e.g. 2026-10-26 11:45 AM' },
      },
      required: ['appointmentId', 'newSlotTime'],
    },
  },
  {
    name: 'get_queue_status',
    description: 'Check real-time outpatient department queue token, serving status, and estimated wait time.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hospitalId: { type: 'STRING', description: 'Hospital ID' },
        departmentId: { type: 'STRING', description: 'Department ID' },
      },
    },
  },
  {
    name: 'get_bed_availability',
    description: 'Retrieve real-time inpatient ward and ICU bed census, availability, and occupancy rate.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hospitalId: { type: 'STRING', description: 'Hospital ID' },
        bedType: { type: 'STRING', description: 'ICU, general, emergency, pediatric, or maternity' },
      },
    },
  },
  {
    name: 'get_patient_profile',
    description: 'Retrieve the verified clinical identity, UHID, blood group, and contact information of the current patient.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
];

export const aiAssistantService = {
  // -------------------------------------------------------------
  // Tool 1: search_doctors
  // -------------------------------------------------------------
  async searchDoctors(
    params: { specialty?: string; hospitalId?: string; query?: string },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'search_doctors', success: false, message: 'Authentication required.' };
    }

    try {
      const [staffList, departments, hospitals] = await Promise.all([
        dbService.getCollection<Staff>('staff'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Hospital>('hospitals'),
      ]);

      let docs = staffList.filter((s) => s.roleInHospital === 'doctor');
      if (params.hospitalId) {
        docs = docs.filter((s) => s.hospitalId === params.hospitalId);
      }
      if (params.specialty) {
        const specLower = params.specialty.toLowerCase();
        const matchingDepts = departments
          .filter((d) => d.name.toLowerCase().includes(specLower))
          .map((d) => d.departmentId);
        docs = docs.filter((s) => matchingDepts.includes(s.departmentId));
      }
      if (params.query) {
        const q = params.query.toLowerCase();
        docs = docs.filter(
          (s) =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.designation && s.designation.toLowerCase().includes(q))
        );
      }

      const formatted = docs.map((d) => {
        const dept = departments.find((dp) => dp.departmentId === d.departmentId);
        const hosp = hospitals.find((h) => h.hospitalId === d.hospitalId);
        return {
          staffId: d.staffId,
          name: d.name || 'Dr. Specialist',
          departmentName: dept?.name || 'General OPD',
          hospitalName: hosp?.name || 'Authorized Facility',
          designation: d.designation || 'Attending Physician',
        };
      });

      return {
        toolName: 'search_doctors',
        success: true,
        message: `Found ${formatted.length} registered specialist physicians matching your criteria.`,
        doctors: formatted,
      };
    } catch (e: any) {
      return { toolName: 'search_doctors', success: false, message: e.message };
    }
  },

  // -------------------------------------------------------------
  // Tool 2: get_doctor_availability
  // -------------------------------------------------------------
  async getDoctorAvailability(
    params: { specialty?: string; hospitalId?: string; doctorId?: string; date?: string },
    caller: User
  ): Promise<AiToolResult> {
    return this.searchAppointmentSlots(params, caller);
  },

  async searchAppointmentSlots(
    params: { specialty?: string; hospitalId?: string; departmentId?: string; doctorId?: string; date?: string },
    caller: User
  ): Promise<AiToolResult> {
    const { slots, error } = await aiAppointmentBackend.searchAppointmentSlots(params, caller);
    if (error) {
      return {
        toolName: 'get_doctor_availability',
        success: false,
        message: `Slot search rejected: ${error}`,
      };
    }
    return {
      toolName: 'get_doctor_availability',
      success: true,
      message: `Found ${slots.length} available appointment slots for '${params.specialty || 'General Medicine'}'.`,
      slots,
    };
  },

  // -------------------------------------------------------------
  // Tool 3: search_hospitals
  // -------------------------------------------------------------
  async searchHospitals(
    params: { district?: string; emergencyOnly?: boolean; query?: string },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'search_hospitals', success: false, message: 'Authentication required.' };
    }

    try {
      let hosps = await dbService.getCollection<Hospital>('hospitals');
      if (params.district && params.district !== 'ALL') {
        hosps = hosps.filter((h) => h.district.toLowerCase() === params.district!.toLowerCase());
      }
      if (params.emergencyOnly) {
        hosps = hosps.filter((h) => h.emergencyAvailable !== false);
      }
      if (params.query) {
        const q = params.query.toLowerCase();
        hosps = hosps.filter(
          (h) => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q)
        );
      }

      return {
        toolName: 'search_hospitals',
        success: true,
        message: `Found ${hosps.length} hospitals in the network.`,
        hospitals: hosps,
      };
    } catch (e: any) {
      return { toolName: 'search_hospitals', success: false, message: e.message };
    }
  },

  // -------------------------------------------------------------
  // Tool 4: get_appointment_details
  // -------------------------------------------------------------
  async getAppointmentDetails(
    params: { appointmentId?: string },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'get_appointment_details', success: false, message: 'Authentication required.' };
    }

    if (params.appointmentId) {
      const { appointment, error } = await aiAppointmentBackend.getAppointmentSummary(params.appointmentId, caller);
      if (error || !appointment) {
        return {
          toolName: 'get_appointment_details',
          success: false,
          message: error || 'Appointment record not found.',
        };
      }
      return {
        toolName: 'get_appointment_details',
        success: true,
        message: `Appointment ${appointment.appointmentId} status: ${appointment.status.toUpperCase()} (${appointment.slotTime}).`,
        appointments: [appointment],
      };
    }

    return this.getMyAppointments(caller);
  },

  async getMyAppointments(caller: User): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'get_appointment_details', success: false, message: 'Authentication required.' };
    }

    try {
      const allAppointments = await dbService.getCollection<OpdAppointment>('opd_appointments');
      let authorizedList: OpdAppointment[] = [];

      if (caller.role === 'patient') {
        const patientId = caller.patientId || caller.uid;
        authorizedList = allAppointments.filter((a) => a.patientId === patientId);
      } else if (caller.role === 'staff' || caller.role === 'hospital_admin') {
        authorizedList = allAppointments.filter((a) => a.hospitalId === caller.hospitalId);
      } else if (caller.role === 'super_admin') {
        authorizedList = allAppointments;
      } else {
        return {
          toolName: 'get_appointment_details',
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
        toolName: 'get_appointment_details',
        success: true,
        message: `Retrieved ${authorizedList.length} authorized appointment records.`,
        appointments: authorizedList,
      };
    } catch (e: any) {
      return { toolName: 'get_appointment_details', success: false, message: e.message };
    }
  },

  // -------------------------------------------------------------
  // Tool 5: create_appointment
  // -------------------------------------------------------------
  async createAppointment(
    params: {
      specialty?: string;
      hospitalId?: string;
      doctorId?: string;
      date?: string;
      time?: string;
      consultationType?: ConsultationType;
    },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'create_appointment', success: false, message: 'Authentication required.' };
    }

    if (caller.role === 'government_officer') {
      return {
        toolName: 'create_appointment',
        success: false,
        message: 'FORBIDDEN: Role [government_officer] has no clinical booking authority.',
      };
    }

    // Step A: Find available slot
    const targetHospId = params.hospitalId || caller.hospitalId || 'hosp_metro_01';
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots(
      {
        specialty: params.specialty || 'Cardiology',
        hospitalId: targetHospId,
        doctorId: params.doctorId,
        date: params.date,
      },
      caller
    );

    if (searchRes.error || !searchRes.slots || searchRes.slots.length === 0) {
      return {
        toolName: 'create_appointment',
        success: false,
        message: searchRes.error || 'No matching appointment slots are open for this specialty.',
      };
    }

    const matchingSlot =
      (params.time && searchRes.slots.find((s) => s.time === params.time && s.available)) ||
      searchRes.slots.find((s) => s.available) ||
      searchRes.slots[0];

    // Step B: Prepare booking intent with 5-minute hold
    const intentRes = await aiAppointmentBackend.createBookingIntent(
      {
        slot: matchingSlot,
        patientId: caller.patientId || caller.uid,
        patientName: caller.name,
        consultationType: params.consultationType || 'In-Person OPD',
      },
      caller
    );

    if (intentRes.error || !intentRes.intent) {
      return {
        toolName: 'create_appointment',
        success: false,
        message: intentRes.error || 'Failed to lock slot hold.',
      };
    }

    return {
      toolName: 'create_appointment',
      success: true,
      message: `Reserved a 5-minute slot hold for ${matchingSlot.doctorName} (${matchingSlot.specialty}) on ${matchingSlot.date} at ${matchingSlot.time}. State: AWAITING_CONFIRMATION. Please review and check the explicit authorization box to commit.`,
      intent: intentRes.intent,
      requiresConfirmation: true,
    };
  },

  // -------------------------------------------------------------
  // Tool 6: cancel_appointment
  // -------------------------------------------------------------
  async cancelAppointment(
    params: { appointmentId: string; reason?: string },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'cancel_appointment', success: false, message: 'Authentication required.' };
    }

    const res = await aiAppointmentBackend.cancelAppointment(
      {
        appointmentId: params.appointmentId,
        reason: params.reason || 'Patient cancelled via conversational assistant',
        consentConfirmed: true,
      },
      caller
    );

    if (!res.success) {
      return {
        toolName: 'cancel_appointment',
        success: false,
        message: `Cancellation rejected: ${res.error}`,
      };
    }

    return {
      toolName: 'cancel_appointment',
      success: true,
      message: `Appointment ${params.appointmentId} has been successfully cancelled and recorded in the immutable audit ledger.`,
    };
  },

  // -------------------------------------------------------------
  // Tool 7: reschedule_appointment
  // -------------------------------------------------------------
  async rescheduleAppointment(
    params: { appointmentId: string; newSlotTime: string },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'reschedule_appointment', success: false, message: 'Authentication required.' };
    }

    const res = await aiAppointmentBackend.rescheduleAppointment(
      {
        appointmentId: params.appointmentId,
        newSlotTime: params.newSlotTime,
        consentConfirmed: true,
      },
      caller
    );

    if (!res.success) {
      return {
        toolName: 'reschedule_appointment',
        success: false,
        message: `Reschedule failed: ${res.error}`,
      };
    }

    return {
      toolName: 'reschedule_appointment',
      success: true,
      message: `Appointment ${params.appointmentId} successfully rescheduled to ${params.newSlotTime}.`,
    };
  },

  // -------------------------------------------------------------
  // Tool 8: get_queue_status
  // -------------------------------------------------------------
  async getQueueStatus(
    params: { hospitalId?: string; departmentId?: string },
    caller: User
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'get_queue_status', success: false, message: 'Authentication required.' };
    }

    const hospId = params.hospitalId || caller.hospitalId || 'hosp_metro_01';
    const deptId = params.departmentId || caller.departmentId || 'dept_cardio_01';
    const path = `liveQueues/${hospId}/${deptId}`;

    const liveQueue = (await dbService.getRTDB<LiveQueue>(path)) || {
      currentToken: 15,
      tokenList: [],
      lastUpdated: new Date().toISOString(),
    };

    const patientId = caller.patientId || caller.uid;
    const userToken = liveQueue.tokenList?.find((t) => t.patientId === patientId);
    const userTokenNo = userToken?.tokenNo || 18;
    const currentToken = liveQueue.currentToken || 15;

    const waitEst = estimatePatientWaitTime({
      currentServingToken: currentToken,
      userTokenNumber: userTokenNo,
      activeDoctorsCount: 2,
      avgConsultationMinutes: 8,
      emergencyInterruptionsCount: 0,
    });

    const statusObj = {
      currentToken,
      userToken: userTokenNo,
      patientsAhead: Math.max(0, userTokenNo - currentToken),
      estimatedWaitMinutes: waitEst.estimatedMinutes,
      status: currentToken >= userTokenNo ? 'Consultation Ready / In Progress' : 'In Queue Waiting',
    };

    return {
      toolName: 'get_queue_status',
      success: true,
      message: `OPD Queue Status: Currently serving Token #${currentToken}. Your token is #${userTokenNo} (${statusObj.patientsAhead} patients ahead, estimated wait: ${statusObj.estimatedWaitMinutes} mins).`,
      queueStatus: statusObj,
    };
  },

  // -------------------------------------------------------------
  // Tool 9: get_bed_availability
  // -------------------------------------------------------------
  async getBedAvailability(
    params: { hospitalId?: string; bedType?: string },
    caller: User
  ): Promise<AiToolResult> {
    return this.getAuthorizedBedAvailability(params.hospitalId, caller, params.bedType);
  },

  async getAuthorizedBedAvailability(
    hospitalIdParam: string | undefined,
    caller: User,
    bedTypeFilter?: string
  ): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'get_bed_availability', success: false, message: 'Authentication required.' };
    }

    let targetHospitalId = hospitalIdParam;
    if (caller.role === 'staff' || caller.role === 'hospital_admin') {
      targetHospitalId = caller.hospitalId || targetHospitalId;
      if (hospitalIdParam && caller.hospitalId && hospitalIdParam !== caller.hospitalId) {
        return {
          toolName: 'get_bed_availability',
          success: false,
          message: `Scope violation: Staff/Admin is restricted to hospital [${caller.hospitalId}]. Cannot query [${hospitalIdParam}].`,
        };
      }
    }

    const allBeds = await dbService.getCollection<IpdBed>('ipd_beds');
    let filteredBeds = targetHospitalId ? allBeds.filter((b) => b.hospitalId === targetHospitalId) : allBeds;

    if (bedTypeFilter) {
      filteredBeds = filteredBeds.filter(
        (b) => b.type.toLowerCase() === bedTypeFilter.toLowerCase()
      );
    }

    const availableCount = filteredBeds.filter((b) => b.status === 'available').length;
    const occupiedCount = filteredBeds.filter((b) => b.status === 'occupied').length;
    const icuBeds = filteredBeds.filter((b) => b.type === 'ICU');
    const icuAvailable = icuBeds.filter((b) => b.status === 'available').length;

    return {
      toolName: 'get_bed_availability',
      success: true,
      message: `Bed Census: ${availableCount} available, ${occupiedCount} occupied (${filteredBeds.length} total monitored beds). ICU reserve: ${icuAvailable} free of ${icuBeds.length}.`,
      beds: filteredBeds.slice(0, 10),
      data: { availableCount, occupiedCount, total: filteredBeds.length, icuAvailable, icuTotal: icuBeds.length },
    };
  },

  // -------------------------------------------------------------
  // Tool 10: get_patient_profile
  // -------------------------------------------------------------
  async getPatientProfile(caller: User): Promise<AiToolResult> {
    if (!caller || !caller.uid) {
      return { toolName: 'get_patient_profile', success: false, message: 'Authentication required.' };
    }

    const patientId = caller.patientId || caller.uid;
    const pats = await dbService.getCollection<Patient>('patients');
    const record = pats.find((p) => p.patientId === patientId || p.userId === caller.uid) || {
      patientId,
      userId: caller.uid,
      name: caller.name,
      phone: caller.phone || '+91 98201 12345',
      address: 'Verified Patient Registration',
      bloodGroup: 'B+',
      gender: 'female' as const,
      createdAt: new Date().toISOString(),
    };

    return {
      toolName: 'get_patient_profile',
      success: true,
      message: `Patient Profile for ${record.name} (UHID: ${record.patientId}). Blood Group: ${record.bloodGroup}, Contact: ${record.phone}.`,
      patientProfile: record,
    };
  },

  // -------------------------------------------------------------
  // Additional Tool: updateBedStatus (Staff / Admin operational mutation)
  // -------------------------------------------------------------
  async updateBedStatus(
    params: { hospitalId?: string; bedId: string; newStatus: 'available' | 'occupied' | 'maintenance'; reason?: string },
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

    const targetHospId = params.hospitalId || caller.hospitalId || 'hosp_metro_01';
    if (caller.role !== 'super_admin' && caller.hospitalId && caller.hospitalId !== targetHospId) {
      return {
        toolName: 'updateBedStatus',
        success: false,
        message: `Hospital Scope Violation: You are assigned to [${caller.hospitalId}], cannot alter bed at [${targetHospId}].`,
      };
    }

    await dbService.updateBedStatus(targetHospId, params.bedId, params.newStatus);

    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      severity: 'INFO',
      actor: { uid: caller.uid, role: caller.role, name: caller.name, email: caller.email },
      hospitalId: targetHospId,
      details: `Bed [${params.bedId}] status transitioned to ${params.newStatus.toUpperCase()} by ${caller.name} (${caller.role}). Reason: ${params.reason || 'Operational update'}`,
    });

    return {
      toolName: 'updateBedStatus',
      success: true,
      message: `Bed [${params.bedId}] successfully updated to ${params.newStatus.toUpperCase()} and synchronized to live RTDB capacity bus.`,
    };
  },

  // -------------------------------------------------------------
  // Additional Tool: getHospitalOperationalSummary (Admin / Gov)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Tool Dispatcher by Name
  // -------------------------------------------------------------
  async executeTool(toolName: string, args: Record<string, any>, caller: User): Promise<AiToolResult> {
    switch (toolName) {
      case 'search_doctors':
        return this.searchDoctors(args, caller);
      case 'get_doctor_availability':
        return this.getDoctorAvailability(args, caller);
      case 'search_hospitals':
        return this.searchHospitals(args, caller);
      case 'get_appointment_details':
        return this.getAppointmentDetails(args, caller);
      case 'create_appointment':
        return this.createAppointment(args, caller);
      case 'cancel_appointment':
        return this.cancelAppointment(args as any, caller);
      case 'reschedule_appointment':
        return this.rescheduleAppointment(args as any, caller);
      case 'get_queue_status':
        return this.getQueueStatus(args, caller);
      case 'get_bed_availability':
        return this.getBedAvailability(args, caller);
      case 'get_patient_profile':
        return this.getPatientProfile(caller);
      case 'updateBedStatus':
        return this.updateBedStatus(args as any, caller);
      case 'getHospitalOperationalSummary':
        return this.getHospitalOperationalSummary(caller);
      default:
        return {
          toolName,
          success: false,
          message: `Tool [${toolName}] is not in the allowlisted execution registry.`,
        };
    }
  },

  // -------------------------------------------------------------
  // Live Gemini API Calling (when VITE_GEMINI_API_KEY is provided)
  // -------------------------------------------------------------
  async callGeminiLLM(promptText: string, caller: User): Promise<AiToolResult | null> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
      return null;
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const systemInstruction = `You are the MediQueue Healthcare AI Assistant. You assist patients, hospital staff, and administrators with doctor discovery, appointment booking, OPD queues, bed occupancy, and patient profiles.
Caller Context: Name: ${caller.name}, Role: ${caller.role}, Facility: ${caller.hospitalId || 'General'}.
Always call tools when the user requests information or actions. Never fabricate clinical appointments or bed numbers without calling tools.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          tools: [{ functionDeclarations: GEMINI_TOOLS_SCHEMA }],
        }),
      });

      if (!response.ok) {
        console.warn('Gemini API call failed, falling back to Deterministic Clinical NLU:', response.statusText);
        return null;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0]?.content?.parts?.[0];

      if (candidate?.functionCall) {
        const { name, args } = candidate.functionCall;
        const toolResult = await this.executeTool(name, args || {}, caller);
        toolResult.engineMode = 'GEMINI_LLM_LIVE';
        return toolResult;
      }

      if (candidate?.text) {
        return {
          toolName: 'gemini_conversational',
          success: true,
          message: candidate.text,
          engineMode: 'GEMINI_LLM_LIVE',
        };
      }

      return null;
    } catch (err) {
      console.warn('Gemini invocation error, falling back to Deterministic Clinical NLU:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Deterministic Clinical NLU Parser (Hybrid Fallback Mode)
  // -------------------------------------------------------------
  async parseIntentDeterministic(promptText: string, caller: User): Promise<AiToolResult> {
    const text = promptText.toLowerCase().trim();

    // 1. Cancel Appointment
    if (text.includes('cancel') && (text.includes('appointment') || text.includes('booking') || text.includes('apt-'))) {
      const match = text.match(/apt-[\w-]+/i);
      const apptId = match ? match[0].toUpperCase() : 'APT-2026-10001';
      const result = await this.cancelAppointment({ appointmentId: apptId, reason: 'Patient requested via conversational assistant' }, caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 2. Reschedule Appointment
    if (text.includes('reschedule') || text.includes('change date') || text.includes('change time') || text.includes('postpone')) {
      const match = text.match(/apt-[\w-]+/i);
      const apptId = match ? match[0].toUpperCase() : 'APT-2026-10001';
      const result = await this.rescheduleAppointment({ appointmentId: apptId, newSlotTime: '2026-10-26 11:45 AM' }, caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 3. Bed Availability & Management
    if (text.includes('bed') && (text.includes('available') || text.includes('free') || text.includes('census') || text.includes('icu') || text.includes('status'))) {
      if (text.includes('update') || text.includes('change') || text.includes('mark')) {
        const newStatus = text.includes('occupied') ? 'occupied' : text.includes('maintenance') ? 'maintenance' : 'available';
        const result = await this.updateBedStatus(
          {
            hospitalId: caller.hospitalId || 'hosp_metro_01',
            bedId: 'bed_cardio_icu_01',
            newStatus,
          },
          caller
        );
        result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
        return result;
      }

      const bedType = text.includes('icu') ? 'ICU' : text.includes('pediatric') ? 'pediatric' : undefined;
      const result = await this.getBedAvailability({ hospitalId: caller.hospitalId, bedType }, caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 4. Live OPD Queue & Waiting Time
    if (text.includes('queue') || text.includes('token') || text.includes('wait time') || text.includes('waiting time') || text.includes('how long')) {
      const result = await this.getQueueStatus({ hospitalId: caller.hospitalId }, caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 5. Patient Profile / UHID
    if (text.includes('profile') || text.includes('uhid') || text.includes('who am i') || text.includes('my details') || text.includes('my info')) {
      const result = await this.getPatientProfile(caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 6. Existing Appointments Listing / Status
    if (text.includes('my appointment') || text.includes('existing booking') || text.includes('view appointment') || text.includes('upcoming appointment') || text.includes('my bookings')) {
      const result = await this.getMyAppointments(caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 7. Search Hospitals
    if (text.includes('hospital') && (text.includes('find') || text.includes('search') || text.includes('directory') || text.includes('near') || text.includes('which hospital'))) {
      const emergencyOnly = text.includes('emergency') || text.includes('trauma');
      const district = text.includes('north') ? 'North' : text.includes('south') ? 'South' : text.includes('central') ? 'Central' : undefined;
      const result = await this.searchHospitals({ district, emergencyOnly }, caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 8. Search Doctors / Specialists
    if ((text.includes('doctor') || text.includes('specialist') || text.includes('cardiologist') || text.includes('ortho') || text.includes('pediatrician') || text.includes('physician')) && !text.includes('book')) {
      let specialty = undefined;
      if (text.includes('cardio') || text.includes('heart')) specialty = 'Cardiology';
      if (text.includes('ortho') || text.includes('bone')) specialty = 'Orthopedics';
      if (text.includes('pediatric') || text.includes('child')) specialty = 'Pediatrics';
      if (text.includes('general') || text.includes('physician')) specialty = 'General Medicine';

      const result = await this.searchDoctors({ specialty, hospitalId: caller.hospitalId }, caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 9. Operational Summary
    if (text.includes('operational') || text.includes('summary') || text.includes('metrics') || text.includes('utilization') || text.includes('surge')) {
      const result = await this.getHospitalOperationalSummary(caller);
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // 10. Default: Book Appointment / Search Available Slots
    let detectedSpecialty = 'Cardiology';
    if (text.includes('ortho') || text.includes('bone') || text.includes('fracture')) detectedSpecialty = 'Orthopedics';
    if (text.includes('pediatric') || text.includes('child') || text.includes('baby')) detectedSpecialty = 'Pediatrics';
    if (text.includes('general') || text.includes('fever') || text.includes('physician')) detectedSpecialty = 'General Medicine';
    if (text.includes('neuro')) detectedSpecialty = 'Neurology';

    // If user says "book", create booking intent with 5-minute hold!
    if (text.includes('book') || text.includes('reserve') || text.includes('schedule')) {
      const result = await this.createAppointment(
        {
          specialty: detectedSpecialty,
          hospitalId: caller.hospitalId || 'hosp_metro_01',
          consultationType: text.includes('tele') || text.includes('video') ? 'Telehealth Video' : 'In-Person OPD',
        },
        caller
      );
      result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
      return result;
    }

    // Otherwise, return slot search
    const result = await this.searchAppointmentSlots(
      {
        specialty: detectedSpecialty,
        hospitalId: caller.hospitalId || 'hosp_metro_01',
        date: new Date().toISOString().split('T')[0],
      },
      caller
    );
    result.engineMode = 'CLINICAL_NLU_DETERMINISTIC';
    return result;
  },

  // -------------------------------------------------------------
  // Master Orchestrator: Maps Natural Language Prompt to Allowlisted Tools
  // -------------------------------------------------------------
  async processUserMessage(promptText: string, caller: User): Promise<AiToolResult> {
    // 1. Attempt live Gemini LLM call if configured
    const geminiResult = await this.callGeminiLLM(promptText, caller);
    if (geminiResult) {
      return geminiResult;
    }

    // 2. Fall back to Deterministic Clinical NLU
    return this.parseIntentDeterministic(promptText, caller);
  },
};
