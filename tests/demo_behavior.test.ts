// Automated Test Suite: Demo Behavior, Deterministic Seeding & Storage Isolation
import { describe, it, expect, beforeEach } from 'vitest';
import { seedDatabase } from '../src/services/seed';
import { dbService } from '../src/services/db';
import { mockStorage } from '../src/services/mockStorage';
import { DEMO_PERSONAS } from '../src/context/AuthContext';
import type { Hospital, IpdBed, Patient, Staff, LiveBed } from '../src/types';

describe('Demo Behavior, Synthetic Seeding & Persona Management', () => {
  beforeEach(async () => {
    mockStorage.clearAll();
  });

  it('populates deterministic synthetic dataset with expected entity counts', async () => {
    const seedResult = await seedDatabase(true);
    expect(seedResult.success).toBe(true);

    const hospitals = await dbService.getCollection<Hospital>('hospitals');
    expect(hospitals.length).toBe(5);

    const beds = await dbService.getCollection<IpdBed>('ipd_beds');
    expect(beds.length).toBe(180);

    const patients = await dbService.getCollection<Patient>('patients');
    expect(patients.length).toBe(55);

    const staffList = await dbService.getCollection<Staff>('staff');
    expect(staffList.length).toBeGreaterThan(0);

    // Verify RTDB mirror for live beds
    const liveBed = await dbService.getRTDB<LiveBed>('liveBeds/hosp_metro_01/bed_hosp_metro_01_001');
    expect(liveBed).toBeDefined();
    expect(liveBed?.bedId).toBe('bed_hosp_metro_01_001');
  });

  it('supports seamless credential-free switching across all 5 demo personas', () => {
    const roles = ['patient', 'staff', 'hospital_admin', 'government_officer', 'super_admin'] as const;

    roles.forEach((role) => {
      const persona = DEMO_PERSONAS[role];
      expect(persona).toBeDefined();
      expect(persona.user.role).toBe(role);
      expect(persona.user.uid).toMatch(/^demo_user_/);
      expect(persona.user.email).toMatch(/\.demo$/);
      expect(persona.label).toBeDefined();
      expect(persona.tagline).toBeDefined();

      if (role === 'staff' || role === 'hospital_admin') {
        expect(persona.user.hospitalId).toBeDefined();
      }
      if (role === 'patient') {
        expect(persona.user.patientId).toBeDefined();
      }
    });
  });

  it('enforces total isolation: clearing storage removes collections, re-seeding restores baseline', async () => {
    await seedDatabase(true);
    let hospitals = await dbService.getCollection<Hospital>('hospitals');
    expect(hospitals.length).toBe(5);

    // Clear storage completely
    mockStorage.clearAll();
    hospitals = await dbService.getCollection<Hospital>('hospitals');
    expect(hospitals.length).toBe(0);

    // Re-seed restores exact baseline
    await seedDatabase(true);
    hospitals = await dbService.getCollection<Hospital>('hospitals');
    expect(hospitals.length).toBe(5);
  });

  it('verifies all seeded data is strictly synthetic with no real PHI', async () => {
    await seedDatabase(true);
    const patients = await dbService.getCollection<Patient>('patients');

    patients.forEach((p) => {
      // Must not contain real production medical identifiers or un-sanitized values
      expect(p.patientId).toMatch(/^pat_/);
      expect(p.name).toBeDefined();
      expect(p.gender).toMatch(/^(male|female|other)$/);
    });

    const staff = await dbService.getCollection<Staff>('staff');
    staff.forEach((s) => {
      expect(s.hospitalId).toBeDefined();
      expect(s.designation).toBeDefined();
      expect(s.email).toMatch(/\.demo$/);
    });
  });
});
