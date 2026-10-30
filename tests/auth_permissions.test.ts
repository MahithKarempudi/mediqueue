// Automated Test Suite: Role-Based Access Control (RBAC) & Scope Enforcement
import { describe, it, expect, beforeEach } from 'vitest';
import { aiAppointmentBackend } from '../src/services/appointments/aiAppointmentBackend';
import { aiAssistantService } from '../src/services/ai/aiAssistantService';
import { dbService } from '../src/services/db';
import { seedDatabase } from '../src/services/seed';
import type { User, OpdAppointment, ConsultationType } from '../src/types';

describe('Auth Permissions & RBAC Scope Enforcement', () => {
  const patientA: User = {
    uid: 'pat_01_uid',
    patientId: 'PAT-2026-001',
    name: 'Priya Sharma',
    email: 'priya@demo.com',
    role: 'patient',
  };

  const patientB: User = {
    uid: 'pat_02_uid',
    patientId: 'PAT-2026-002',
    name: 'Rajesh Verma',
    email: 'rajesh@demo.com',
    role: 'patient',
  };

  const staffHospital1: User = {
    uid: 'staff_01_uid',
    name: 'Dr. Anita Desai',
    email: 'anita@hosp1.demo',
    role: 'staff',
    hospitalId: 'HOSP-METRO-001',
    departmentId: 'DEPT-CARDIO-001',
  };

  const govOfficer: User = {
    uid: 'gov_01_uid',
    name: 'Director Rajiv Kumar',
    email: 'rajiv@mohfw.gov.in',
    role: 'government_officer',
  };

  beforeEach(async () => {
    await seedDatabase(true);
  });

  it('rejects cross-patient access when Patient A attempts to view Patient B appointment', async () => {
    // Seed an appointment for Patient B
    const apptB: OpdAppointment = {
      appointmentId: 'APT-TEST-002',
      patientId: patientB.patientId!,
      hospitalId: 'HOSP-METRO-001',
      departmentId: 'DEPT-CARDIO-001',
      doctorId: 'DOC-001',
      slotTime: '2026-10-25 10:00 AM',
      status: 'scheduled',
    };
    await dbService.setDocument('opd_appointments', apptB.appointmentId, apptB);

    // Patient A tries to view Patient B's appointment
    const result = await aiAppointmentBackend.getAppointmentSummary(apptB.appointmentId, patientA);
    expect(result.appointment).toBeUndefined();
    expect(result.error).toContain('FORBIDDEN');
  });

  it('rejects cross-patient booking intent creation when Patient A tries to book for Patient B', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    expect(searchRes.slots.length).toBeGreaterThan(0);
    const slot = searchRes.slots[0];

    // Patient A tries to create booking intent specifying Patient B's patientId
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

  it('rejects staff from querying slots for an external hospital', async () => {
    const foreignHospitalId = 'HOSP-REGIONAL-999';
    const result = await aiAppointmentBackend.searchAppointmentSlots(
      { hospitalId: foreignHospitalId },
      staffHospital1
    );

    expect(result.slots).toHaveLength(0);
    expect(result.error).toContain('FORBIDDEN: Staff is restricted to assigned hospital');
  });

  it('rejects staff from viewing appointment records from an external hospital', async () => {
    const foreignAppt: OpdAppointment = {
      appointmentId: 'APT-TEST-FOREIGN',
      patientId: 'PAT-999',
      hospitalId: 'HOSP-OTHER-002',
      departmentId: 'DEPT-GENERAL',
      doctorId: 'DOC-OTHER',
      slotTime: '2026-10-25 02:00 PM',
      status: 'scheduled',
    };
    await dbService.setDocument('opd_appointments', foreignAppt.appointmentId, foreignAppt);

    const result = await aiAppointmentBackend.getAppointmentSummary(foreignAppt.appointmentId, staffHospital1);
    expect(result.appointment).toBeUndefined();
    expect(result.error).toContain('FORBIDDEN');
  });

  it('enforces aggregate-only restriction on government officer for clinical slot search', async () => {
    const result = await aiAppointmentBackend.searchAppointmentSlots({}, govOfficer);
    expect(result.slots).toHaveLength(0);
    expect(result.error).toContain('Government officers have aggregate reporting access only');
  });

  it('enforces aggregate-only restriction on government officer for booking intents', async () => {
    const dummySlot = {
      slotId: 'slot_dummy_01',
      hospitalId: 'HOSP-METRO-001',
      hospitalName: 'Metro Hospital',
      departmentId: 'DEPT-01',
      specialty: 'Cardiology',
      doctorId: 'DOC-01',
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

  it('blocks patient from executing staff-only operational mutations like bed status updates', async () => {
    const result = await aiAssistantService.updateBedStatus(
      { bedId: 'bed_metro_01', newStatus: 'maintenance', reason: 'Unsanctioned attempt' },
      patientA
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('Forbidden');
  });
});
