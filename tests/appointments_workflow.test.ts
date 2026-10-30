// Automated Test Suite: Appointments Workflow & Concurrency Control
import { describe, it, expect, beforeEach } from 'vitest';
import { aiAppointmentBackend } from '../src/services/appointments/aiAppointmentBackend';
import { dbService } from '../src/services/db';
import { seedDatabase } from '../src/services/seed';
import type { User, ConsultationType } from '../src/types';

describe('Appointments Workflow & Concurrency Control', () => {
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

  beforeEach(async () => {
    await seedDatabase(true);
  });

  it('searches available slots for patient successfully', async () => {
    const result = await aiAppointmentBackend.searchAppointmentSlots(
      { specialty: 'Cardiology' },
      patientA
    );
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0].hospitalId).toBeDefined();
    expect(result.slots[0].available).toBe(true);
    expect(result.slots[0].fee).toBe(500);
  });

  it('creates booking intent placing 5-minute hold in AWAITING_CONFIRMATION state', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];

    const intentRes = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        consultationType: 'in_person' as ConsultationType,
      },
      patientA
    );

    expect(intentRes.intent).toBeDefined();
    const intent = intentRes.intent!;
    expect(intent.status).toBe('AWAITING_CONFIRMATION');
    expect(intent.patientId).toBe(patientA.patientId);
    expect(new Date(intent.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects confirmation if explicit consent is not checked', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        consultationType: 'in_person' as ConsultationType,
      },
      patientA
    );

    const confirmRes = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent!.intentId,
        idempotencyKey: intent!.idempotencyKey,
        consentConfirmed: false, // User didn't check consent
      },
      patientA
    );

    expect(confirmRes.result).toBeUndefined();
    expect(confirmRes.error).toContain('CONSENT_REQUIRED');
    expect(confirmRes.state).toBe('AWAITING_CONFIRMATION');
  });

  it('atomically commits booking, generates token, and returns authoritative booking reference', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        consultationType: 'teleconsult' as ConsultationType,
      },
      patientA
    );

    const confirmRes = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent!.intentId,
        idempotencyKey: intent!.idempotencyKey,
        consentConfirmed: true,
      },
      patientA
    );

    expect(confirmRes.state).toBe('CONFIRMED');
    expect(confirmRes.result).toBeDefined();
    const res = confirmRes.result!;
    expect(res.appointmentId).toMatch(/^APT-\d{4}-\d+$/);
    expect(res.tokenNo).toBeGreaterThanOrEqual(1);
    expect(res.consultationType).toBe('teleconsult');
    expect(res.bookingReference).toBe(res.appointmentId);

    // Verify appointment was persisted in database
    const storedAppt = await dbService.getDocument('opd_appointments', res.appointmentId);
    expect(storedAppt).toBeDefined();
  });

  it('handles duplicate submission via idempotency key and prevents duplicate commit', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        consultationType: 'in_person' as ConsultationType,
      },
      patientA
    );

    // First commit
    const firstConfirm = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent!.intentId,
        idempotencyKey: intent!.idempotencyKey,
        consentConfirmed: true,
      },
      patientA
    );
    expect(firstConfirm.state).toBe('CONFIRMED');

    // Duplicate commit with identical key
    const secondConfirm = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent!.intentId,
        idempotencyKey: intent!.idempotencyKey,
        consentConfirmed: true,
      },
      patientA
    );

    expect(secondConfirm.state).toBe('CONFIRMED');
    expect(secondConfirm.result?.appointmentId).toBe(firstConfirm.result?.appointmentId);
    expect(secondConfirm.result?.tokenNo).toBe(firstConfirm.result?.tokenNo);
  });

  it('rejects booking when concurrent collision occurs during confirmation', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[1];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        consultationType: 'in_person' as ConsultationType,
      },
      patientA
    );

    const collisionRes = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent!.intentId,
        idempotencyKey: intent!.idempotencyKey,
        consentConfirmed: true,
        simulateCollision: true,
      },
      patientA
    );

    expect(collisionRes.result).toBeUndefined();
    expect(collisionRes.state).toBe('UNAVAILABLE');
    expect(collisionRes.error).toContain('booked by another patient');
  });

  it('prevents non-owner from cancelling an appointment', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      { slot, consultationType: 'in_person' as ConsultationType },
      patientA
    );
    const confirm = await aiAppointmentBackend.confirmAppointment(
      { intentId: intent!.intentId, idempotencyKey: intent!.idempotencyKey, consentConfirmed: true },
      patientA
    );

    // Patient B attempts to cancel Patient A's appointment
    const cancelRes = await aiAppointmentBackend.cancelAppointment(
      {
        appointmentId: confirm.result!.appointmentId,
        reason: 'Malicious cancellation',
        consentConfirmed: true,
      },
      patientB
    );

    expect(cancelRes.success).toBe(false);
    expect(cancelRes.error).toContain('FORBIDDEN');
  });

  it('allows owner to cancel appointment with explicit consent', async () => {
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      { slot, consultationType: 'in_person' as ConsultationType },
      patientA
    );
    const confirm = await aiAppointmentBackend.confirmAppointment(
      { intentId: intent!.intentId, idempotencyKey: intent!.idempotencyKey, consentConfirmed: true },
      patientA
    );

    const cancelRes = await aiAppointmentBackend.cancelAppointment(
      {
        appointmentId: confirm.result!.appointmentId,
        reason: 'Schedule conflict',
        consentConfirmed: true,
      },
      patientA
    );

    expect(cancelRes.success).toBe(true);

    const updated = await dbService.getDocument('opd_appointments', confirm.result!.appointmentId);
    expect((updated as any).status).toBe('cancelled');
  });
});
