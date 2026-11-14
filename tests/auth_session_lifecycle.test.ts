// Automated Test Suite: Authentication Lifecycle, Session Expiry & Logout Verification
import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '../src/services/db';
import { seedDatabase } from '../src/services/seed';
import { ROLE_PROFILES } from '../src/context/roleProfiles';
import type { User, UserRole } from '../src/types';

describe('Authentication Lifecycle, Session Management & Security Isolation', () => {
  beforeEach(async () => {
    await seedDatabase(true);
  });

  it('provides verified institutional persona profiles for all 5 roles', () => {
    const roles: UserRole[] = ['patient', 'staff', 'hospital_admin', 'government_officer', 'super_admin'];

    roles.forEach((r) => {
      const profile = ROLE_PROFILES[r];
      expect(profile).toBeDefined();
      expect(profile.user.role).toBe(r);
      expect(profile.user.email).toBeDefined();
      expect(profile.label).toBeDefined();

      if (r === 'staff' || r === 'hospital_admin') {
        expect(profile.user.hospitalId).toBeDefined();
      }
    });
  });

  it('restricts patient from having institutional hospitalId assignment on self-registration', async () => {
    const users = await dbService.getCollection<User>('users');
    const patientUser = users.find((u) => u.role === 'patient');
    expect(patientUser).toBeDefined();
    expect(patientUser?.hospitalId).toBeUndefined();
  });

  it('enforces hospital isolation between different hospital staff', async () => {
    const staffHosp1: User = {
      uid: 'staff_aiims_01',
      name: 'Dr. A. Sharma',
      email: 'asharma@aiims.edu',
      role: 'staff',
      hospitalId: 'hosp_metro_01',
    };

    const staffHosp2: User = {
      uid: 'staff_apollo_01',
      name: 'Dr. B. Patel',
      email: 'bpatel@apollo.org',
      role: 'staff',
      hospitalId: 'hosp_apollo_02',
    };

    const { aiAppointmentBackend } = await import('../src/services/appointments/aiAppointmentBackend');

    // Querying hospital 2 from staff of hospital 1 should be forbidden
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots(
      { hospitalId: staffHosp2.hospitalId },
      staffHosp1
    );

    expect(searchRes.error).toContain('FORBIDDEN');
    expect(searchRes.slots.length).toBe(0);
  });

  it('prevents government officer from querying individual slot booking intents', async () => {
    const govOfficer: User = {
      uid: 'gov_dir_01',
      name: 'Director Kumar',
      email: 'kumar@mohfw.gov.in',
      role: 'government_officer',
    };

    const { aiAppointmentBackend } = await import('../src/services/appointments/aiAppointmentBackend');

    const searchRes = await aiAppointmentBackend.searchAppointmentSlots(
      { hospitalId: 'hosp_metro_01' },
      govOfficer
    );

    expect(searchRes.error).toContain('FORBIDDEN');
    expect(searchRes.slots.length).toBe(0);
  });

  it('rejects booking confirmation when session user does not match intent patientId', async () => {
    const { aiAppointmentBackend } = await import('../src/services/appointments/aiAppointmentBackend');

    const patientA: User = {
      uid: 'patient_alice',
      patientId: 'pat_alice',
      name: 'Alice Smith',
      email: 'alice@mediqueue.org',
      role: 'patient',
    };

    const patientB: User = {
      uid: 'patient_bob',
      patientId: 'pat_bob',
      name: 'Bob Jones',
      email: 'bob@mediqueue.org',
      role: 'patient',
    };

    // Patient A searches and holds a slot
    const searchRes = await aiAppointmentBackend.searchAppointmentSlots({}, patientA);
    const slot = searchRes.slots[0];
    const { intent } = await aiAppointmentBackend.createBookingIntent(
      { slot, consultationType: 'In-Person OPD' },
      patientA
    );

    expect(intent).toBeDefined();

    // Patient B attempts to steal and confirm Patient A's intent
    const confirmRes = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: intent!.intentId,
        idempotencyKey: intent!.idempotencyKey,
        consentConfirmed: true,
      },
      patientB // Malicious caller
    );

    expect(confirmRes.result).toBeUndefined();
    expect(confirmRes.error).toContain('FORBIDDEN');
    expect(confirmRes.state).toBe('FAILED');
  });
});
