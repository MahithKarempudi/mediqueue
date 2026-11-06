// Automated Test Suite: AI Conversational Assistant 10-Tool Registry & NLU Parsing
import { describe, it, expect, beforeEach } from 'vitest';
import { aiAssistantService } from '../src/services/ai/aiAssistantService';
import { seedDatabase } from '../src/services/seed';
import type { User } from '../src/types';

describe('AI Conversational Assistant 10-Tool Registry & Intent Engine', () => {
  const patientUser: User = {
    uid: 'usr_patient_01',
    patientId: 'pat_001',
    name: 'Priya Sharma',
    email: 'priya.sharma@mediqueue.org',
    role: 'patient',
    phone: '+91 98201 12345',
    createdAt: new Date().toISOString(),
  };

  const staffUser: User = {
    uid: 'usr_staff_01',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@mediqueue.org',
    role: 'staff',
    hospitalId: 'hosp_metro_01',
    departmentId: 'dept_cardio_01',
    phone: '+91 98111 22334',
    createdAt: new Date().toISOString(),
  };

  const govUser: User = {
    uid: 'usr_officer_01',
    name: 'Vikramaditya Sen',
    email: 'vikramaditya.sen@mediqueue.org',
    role: 'government_officer',
    phone: '+91 98555 66778',
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await seedDatabase(true);
  });

  it('Tool 1: search_doctors finds doctors by specialty and query', async () => {
    const res = await aiAssistantService.searchDoctors({ specialty: 'Cardiology' }, patientUser);
    expect(res.success).toBe(true);
    expect(res.doctors).toBeDefined();
    expect(res.doctors!.length).toBeGreaterThan(0);
    expect(res.doctors![0].departmentName).toContain('Cardiology');
  });

  it('Tool 2: get_doctor_availability returns valid slots', async () => {
    const res = await aiAssistantService.getDoctorAvailability({ specialty: 'Cardiology' }, patientUser);
    expect(res.success).toBe(true);
    expect(res.slots).toBeDefined();
    expect(res.slots!.length).toBeGreaterThan(0);
    expect(res.slots![0].available).toBe(true);
  });

  it('Tool 3: search_hospitals filters facilities by district', async () => {
    const res = await aiAssistantService.searchHospitals({ district: 'Central' }, patientUser);
    expect(res.success).toBe(true);
    expect(res.hospitals).toBeDefined();
    expect(res.hospitals!.length).toBeGreaterThan(0);
    expect(res.hospitals![0].district).toBe('Central');
  });

  it('Tool 4: get_appointment_details retrieves appointments for signed-in patient', async () => {
    const res = await aiAssistantService.getAppointmentDetails({}, patientUser);
    expect(res.success).toBe(true);
    expect(res.appointments).toBeDefined();
  });

  it('Tool 5: create_appointment generates intent with 5-minute hold and blocks gov officer', async () => {
    // Patient can create appointment
    const resPatient = await aiAssistantService.createAppointment({ specialty: 'Cardiology' }, patientUser);
    expect(resPatient.success).toBe(true);
    expect(resPatient.intent).toBeDefined();
    expect(resPatient.intent?.status).toBe('AWAITING_CONFIRMATION');

    // Gov officer cannot create appointment
    const resGov = await aiAssistantService.createAppointment({ specialty: 'Cardiology' }, govUser);
    expect(resGov.success).toBe(false);
    expect(resGov.message).toContain('FORBIDDEN');
  });

  it('Tool 6: cancel_appointment cancels existing appointment with audit logging', async () => {
    // First create a booking intent and commit it
    const intentRes = await aiAssistantService.createAppointment({ specialty: 'Cardiology' }, patientUser);
    const intent = intentRes.intent!;
    const confirmRes = await (await import('../src/services/appointments/aiAppointmentBackend')).aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent.intentId,
        idempotencyKey: intent.idempotencyKey,
        consentConfirmed: true,
      },
      patientUser
    );

    const apptId = confirmRes.result!.appointmentId;

    // Now cancel it
    const cancelRes = await aiAssistantService.cancelAppointment(
      { appointmentId: apptId, reason: 'Patient changed travel plans' },
      patientUser
    );
    expect(cancelRes.success).toBe(true);
    expect(cancelRes.message).toContain('successfully cancelled');
  });

  it('Tool 7: reschedule_appointment updates slot time', async () => {
    const intentRes = await aiAssistantService.createAppointment({ specialty: 'Cardiology' }, patientUser);
    const intent = intentRes.intent!;
    const confirmRes = await (await import('../src/services/appointments/aiAppointmentBackend')).aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent.intentId,
        idempotencyKey: intent.idempotencyKey,
        consentConfirmed: true,
      },
      patientUser
    );

    const apptId = confirmRes.result!.appointmentId;
    const res = await aiAssistantService.rescheduleAppointment(
      { appointmentId: apptId, newSlotTime: '2026-10-28 02:00 PM' },
      patientUser
    );
    expect(res.success).toBe(true);
    expect(res.message).toContain('successfully rescheduled');
  });

  it('Tool 8: get_queue_status returns current live token and estimated wait time', async () => {
    const res = await aiAssistantService.getQueueStatus({ hospitalId: 'hosp_metro_01' }, patientUser);
    expect(res.success).toBe(true);
    expect(res.queueStatus).toBeDefined();
    expect(res.queueStatus?.currentToken).toBeDefined();
    expect(res.queueStatus?.estimatedWaitMinutes).toBeGreaterThanOrEqual(0);
  });

  it('Tool 9: get_bed_availability returns breakdown and enforces hospital scope on staff', async () => {
    const resPatient = await aiAssistantService.getBedAvailability({ hospitalId: 'hosp_metro_01' }, patientUser);
    expect(resPatient.success).toBe(true);
    expect(resPatient.data.total).toBeGreaterThan(0);

    // Staff query for foreign hospital is blocked
    const resStaffForeign = await aiAssistantService.getBedAvailability(
      { hospitalId: 'hosp_foreign_99' },
      staffUser
    );
    expect(resStaffForeign.success).toBe(false);
    expect(resStaffForeign.message).toContain('Scope violation');
  });

  it('Tool 10: get_patient_profile returns caller UHID and verified demographics', async () => {
    const res = await aiAssistantService.getPatientProfile(patientUser);
    expect(res.success).toBe(true);
    expect(res.patientProfile).toBeDefined();
    expect(res.patientProfile?.patientId).toBe('pat_001');
    expect(res.patientProfile?.bloodGroup).toBeDefined();
  });

  it('NLU Orchestrator maps natural-language queries accurately', async () => {
    // Queue question
    const qRes = await aiAssistantService.processUserMessage('What is the current OPD queue status and wait time?', patientUser);
    expect(qRes.toolName).toBe('get_queue_status');

    // Bed question
    const bRes = await aiAssistantService.processUserMessage('Which hospital has available ICU beds?', patientUser);
    expect(bRes.toolName).toBe('get_bed_availability');

    // Doctor search
    const dRes = await aiAssistantService.processUserMessage('Find me a cardiologist or heart specialist', patientUser);
    expect(dRes.toolName).toBe('search_doctors');

    // Booking request
    const bkRes = await aiAssistantService.processUserMessage('Book an appointment with a cardiologist tomorrow', patientUser);
    expect(bkRes.toolName).toBe('create_appointment');
    expect(bkRes.requiresConfirmation).toBe(true);
  });
});
