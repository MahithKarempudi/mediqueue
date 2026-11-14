// MediQueue AI 10-Tool Allowlist Declaration Schema
export const GEMINI_TOOLS_SCHEMA = [
  {
    name: 'search_doctors',
    description: 'Search for registered specialist physicians by medical specialty, department, hospital, or physician name.',
    parameters: {
      type: 'OBJECT',
      properties: {
        specialty: { type: 'STRING', description: 'Medical specialty e.g. Cardiology, Orthopedics, Pediatrics, Neurology, General Medicine' },
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
        specialty: { type: 'STRING', description: 'Medical specialty e.g. Cardiology' },
        hospitalId: { type: 'STRING', description: 'Hospital ID' },
        doctorId: { type: 'STRING', description: 'Doctor/Staff ID' },
        date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
      },
    },
  },
  {
    name: 'search_hospitals',
    description: 'Find hospital facilities by name, geographic district, facility type, or emergency availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        district: { type: 'STRING', description: 'District name e.g. Central, North, South, East, West' },
        emergencyOnly: { type: 'BOOLEAN', description: 'Filter only facilities with active emergency/trauma services' },
      },
    },
  },
  {
    name: 'get_appointment_details',
    description: 'Retrieve authorized appointment records and statuses for the signed-in patient or authorized hospital staff.',
    parameters: {
      type: 'OBJECT',
      properties: {
        appointmentId: { type: 'STRING', description: 'Specific appointment ID e.g. APT-2026-10001 (optional)' },
      },
    },
  },
  {
    name: 'create_appointment',
    description: 'Prepare an authoritative appointment booking intent placing a 5-minute hold on the selected slot. Requires explicit patient confirmation before commit.',
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
    description: 'Cancel an existing scheduled appointment with explicit verification and record update.',
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

