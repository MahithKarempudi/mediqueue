// Automated Test Suite: Role-Based Access Control (RBAC) & Scope Enforcement Across All 5 Roles
import { describe, it, expect, beforeEach } from 'vitest';
import { aiAppointmentBackend } from '../src/services/appointments/aiAppointmentBackend';
import { aiAssistantService } from '../src/services/ai/aiAssistantService';
import { dbService } from '../src/services/db';
import { seedDatabase } from '../src/services/seed';
import type { User, OpdAppointment, ConsultationType } from '../src/types';

describe('Auth Permissions & RBAC Scope Enforcement Across All 5 Stakeholder Roles', () => {
  const patientA: User = {
    uid: 'pat_01_uid',
    patientId: 'PAT-2026-001',
    name: 'Priya Sharma',
    email: 'priya@mediqueue.org',
    role: 'patient',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const patientB: User = {
    uid: 'pat_02_uid',
    patientId: 'PAT-2026-002',
    name: 'Rajesh Verma',
    email: 'rajesh@mediqueue.org',
    role: 'patient',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const staffHospital1: User = {
    uid: 'staff_01_uid',
    name: 'Dr. Anita Desai',
    email: 'anita@hosp1.org',
    role: 'staff',
    hospitalId: 'hosp_metro_01',
    departmentId: 'dept_cardio_01',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const hospitalAdminHosp1: User = {
    uid: 'admin_01_uid',
    name: 'Sunita Rao',
    email: 'sunita@hosp1.org',
    role: 'hospital_admin',
    hospitalId: 'hosp_metro_01',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const govOfficer: User = {
    uid: 'gov_01_uid',
    name: 'Director Rajiv Kumar',
    email: 'rajiv@mohfw.gov.in',
    role: 'government_officer',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const superAdmin: User = {
    uid: 'superadmin_01_uid',
    name: 'Dev Anand',
    email: 'dev@mediqueue.org',
    role: 'super_admin',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    await seedDatabase(true);
  });

  // 1. PATIENT ROLE TESTS
  it('allows Patient A to view their own appointment (positive test)', async () => {
    const apptA: OpdAppointment = {
      appointmentId: 'APT-TEST-001',
      patientId: patientA.patientId!,
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 10:00 AM',
      status: 'Confirmed',
    };
    await dbService.setDocument('opd_appointments', apptA.appointmentId, apptA);

    const result = await aiAppointmentBackend.getAppointmentSummary(apptA.appointmentId, patientA);
    expect(result.appointment).toBeDefined();
    expect(result.appointment?.patientId).toBe(patientA.patientId);
  });

  it('rejects cross-patient access when Patient A attempts to view Patient B appointment (negative test)', async () => {
    const apptB: OpdAppointment = {
      appointmentId: 'APT-TEST-002',
      patientId: patientB.patientId!,
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 10:00 AM',
      status: 'Confirmed',
    };
    await dbService.setDocument('opd_appointments', apptB.appointmentId, apptB);

    const result = await aiAppointmentBackend.getAppointmentSummary(apptB.appointmentId, patientA);
    expect(result.appointment).toBeUndefined();
    expect(result.error).toContain('FORBIDDEN');
  });

  it('rejects cross-patient booking intent creation when Patient A tries to book for Patient B (negative test)', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    expect(searchRes.slots.length).toBeGreaterThan(0);
    const slot = searchRes.slots[0];

    const intentRes = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        patientId: patientB.patientId,
        patientName: patientB.name,
        consultationType: 'in_person' as ConsultationType,
      },
      patientA
    );

    expect(intentRes.intent).toBeUndefined();
    expect(intentRes.error).toContain('FORBIDDEN');
  });

  it('blocks patient from executing staff-only operational mutations like bed status updates (negative test)', async () => {
    const result = await aiAssistantService.updateBedStatus(
      { bedId: 'bed_metro_01', newStatus: 'maintenance', reason: 'Unsanctioned attempt' },
      patientA
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Forbidden');
  });

  // 2. HOSPITAL STAFF ROLE TESTS
  it('allows Hospital Staff to view appointments in their assigned hospital (positive test)', async () => {
    const apptInHospital: OpdAppointment = {
      appointmentId: 'APT-TEST-HOSP1',
      patientId: 'PAT-999',
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 09:30 AM',
      status: 'Confirmed',
    };
    await dbService.setDocument('opd_appointments', apptInHospital.appointmentId, apptInHospital);

    const result = await aiAppointmentBackend.getAppointmentSummary(apptInHospital.appointmentId, staffHospital1);
    expect(result.appointment).toBeDefined();
    expect(result.appointment?.hospitalId).toBe('hosp_metro_01');
  });

  it('rejects staff from querying slots for an external hospital (negative test)', async () => {
    const foreignHospitalId = 'HOSP-REGIONAL-999';
    const result = await aiAppointmentBackend.searchAppointmentSlots(
      { hospitalId: foreignHospitalId },
      staffHospital1
    );

    expect(result.slots).toHaveLength(0);
    expect(result.error).toContain('FORBIDDEN: Staff is restricted to assigned hospital');
  });

  it('rejects staff from viewing appointment records from an external hospital (negative test)', async () => {
    const foreignAppt: OpdAppointment = {
      appointmentId: 'APT-TEST-FOREIGN',
      patientId: 'PAT-999',
      hospitalId: 'HOSP-OTHER-002',
      departmentId: 'DEPT-GENERAL',
      doctorId: 'DOC-OTHER',
      slotTime: '2026-10-25 02:00 PM',
      status: 'Confirmed',
    };
    await dbService.setDocument('opd_appointments', foreignAppt.appointmentId, foreignAppt);

    const result = await aiAppointmentBackend.getAppointmentSummary(foreignAppt.appointmentId, staffHospital1);
    expect(result.appointment).toBeUndefined();
    expect(result.error).toContain('FORBIDDEN');
  });

  // 3. HOSPITAL ADMINISTRATOR ROLE TESTS
  it('allows Hospital Admin to reject an appointment in their facility (positive test)', async () => {
    const appt: OpdAppointment = {
      appointmentId: 'APT-TEST-REJECT-01',
      patientId: 'PAT-001',
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 11:45 AM',
      status: 'Pending',
    };
    await dbService.setDocument('opd_appointments', appt.appointmentId, appt);

    const result = await aiAppointmentBackend.rejectAppointment(
      { appointmentId: appt.appointmentId, reason: 'Physician emergency leave' },
      hospitalAdminHosp1
    );

    expect(result.success).toBe(true);
    const updated = await dbService.getDocument<OpdAppointment>('opd_appointments', appt.appointmentId);
    expect(updated?.status).toBe('Rejected');
  });

  it('rejects Patient from rejecting an appointment (negative test)', async () => {
    const appt: OpdAppointment = {
      appointmentId: 'APT-TEST-REJECT-02',
      patientId: patientA.patientId!,
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 11:45 AM',
      status: 'Pending',
    };
    await dbService.setDocument('opd_appointments', appt.appointmentId, appt);

    const result = await aiAppointmentBackend.rejectAppointment(
      { appointmentId: appt.appointmentId, reason: 'Unauthorized caller' },
      patientA
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('FORBIDDEN');
  });

  // 4. GOVERNMENT OFFICER ROLE TESTS
  it('enforces aggregate-only restriction on government officer for clinical slot search (negative test)', async () => {
    const result = await aiAppointmentBackend.searchAppointmentSlots({}, govOfficer);
    expect(result.slots).toHaveLength(0);
    expect(result.error).toContain('Government officers have aggregate reporting access only');
  });

  it('enforces aggregate-only restriction on government officer for booking intents (negative test)', async () => {
    const dummySlot = {
      slotId: 'slot_dummy_01',
      hospitalId: 'hosp_metro_01',
      hospitalName: 'Metro Hospital',
      departmentId: 'dept_cardio_01',
      specialty: 'Cardiology',
      doctorId: 'staff_cardio_01',
      doctorName: 'Dr. Rao',
      doctorQualification: 'MD',
      date: '2026-10-25',
      time: '10:00 AM',
      available: true,
      fee: 500,
    };

    const result = await aiAppointmentBackend.createBookingIntent(
      {
        slot: dummySlot,
        consultationType: 'in_person' as ConsultationType,
      },
      govOfficer
    );

    expect(result.intent).toBeUndefined();
    expect(result.error).toContain('FORBIDDEN: Role [government_officer] has no clinical booking authority');
  });

  // 5. SUPER ADMINISTRATOR ROLE TESTS
  it('allows Super Administrator to inspect cross-hospital appointments (positive test)', async () => {
    const anyAppt: OpdAppointment = {
      appointmentId: 'APT-SUPER-ANY',
      patientId: 'PAT-999',
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 04:15 PM',
      status: 'Confirmed',
    };
    await dbService.setDocument('opd_appointments', anyAppt.appointmentId, anyAppt);

    const result = await aiAppointmentBackend.getAppointmentSummary(anyAppt.appointmentId, superAdmin);
    expect(result.appointment).toBeDefined();
    expect(result.appointment?.appointmentId).toBe('APT-SUPER-ANY');
  });

  // 6. APPOINTMENT STATUS LIFECYCLE TESTS (Pending, Confirmed, Cancelled, Completed, Rejected)
  it('supports complete appointment status lifecycle (Pending -> Confirmed -> Completed)', async () => {
    const appt: OpdAppointment = {
      appointmentId: 'APT-LIFECYCLE-01',
      patientId: patientA.patientId!,
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_cardio_01',
      slotTime: '2026-10-25 02:00 PM',
      status: 'Pending',
    };
    await dbService.setDocument('opd_appointments', appt.appointmentId, appt);

    let doc = await dbService.getDocument<OpdAppointment>('opd_appointments', appt.appointmentId);
    expect(doc?.status).toBe('Pending');

    await dbService.updateDocument('opd_appointments', appt.appointmentId, { status: 'Confirmed' });
    doc = await dbService.getDocument<OpdAppointment>('opd_appointments', appt.appointmentId);
    expect(doc?.status).toBe('Confirmed');

    const completeRes = await aiAppointmentBackend.completeAppointment({ appointmentId: appt.appointmentId }, staffHospital1);
    expect(completeRes.success).toBe(true);
    doc = await dbService.getDocument<OpdAppointment>('opd_appointments', appt.appointmentId);
    expect(doc?.status).toBe('Completed');
  });
});
