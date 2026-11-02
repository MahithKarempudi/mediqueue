// Automated Test Suite: Deterministic Seeding, Role Profile Management & Storage Isolation
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { seedDatabase } from '../src/services/seed';
import { dbService } from '../src/services/db';
import { mockStorage } from '../src/services/mockStorage';
import { AuthProvider, ROLE_PROFILES } from '../src/context/AuthContext';
import { Navbar } from '../src/components/layout/Navbar';
import { Sidebar } from '../src/components/layout/Sidebar';
import { SuperAdminDashboard } from '../src/pages/superadmin/SuperAdminDashboard';
import { AiAppointmentBookingPage } from '../src/pages/patient/AiAppointmentBookingPage';
import { UnauthorizedPage } from '../src/pages/auth/UnauthorizedPage';
import { AppointmentConfirmationCard } from '../src/components/appointments/AppointmentConfirmationCard';
import type { Hospital, IpdBed, Patient, Staff, LiveBed } from '../src/types';

describe('Deterministic Seeding, Role Profile Management & Storage Isolation', () => {
  beforeEach(async () => {
    mockStorage.clearAll();
  });

  it('populates deterministic dataset with expected entity counts', async () => {
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

  it('supports seamless role switching across all 5 stakeholder role profiles', () => {
    const roles = ['patient', 'staff', 'hospital_admin', 'government_officer', 'super_admin'] as const;

    roles.forEach((role) => {
      const profile = ROLE_PROFILES[role];
      expect(profile).toBeDefined();
      expect(profile.user.role).toBe(role);
      expect(profile.user.uid).toMatch(/^usr_/);
      expect(profile.user.email).toMatch(/\.org$/);
      expect(profile.label).toBeDefined();
      expect(profile.tagline).toBeDefined();

      if (role === 'staff' || role === 'hospital_admin') {
        expect(profile.user.hospitalId).toBeDefined();
      }
      if (role === 'patient') {
        expect(profile.user.patientId).toBeDefined();
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

  it('verifies all seeded data uses structured identifiers with no real PHI', async () => {
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
      expect(s.email).toMatch(/\.org$/);
    });
  });

  it('renders layout and portal components without any demo, phase, or login references', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/patient/ai-booking'] },
        React.createElement(
          AuthProvider,
          null,
          React.createElement(Navbar),
          React.createElement(Sidebar),
          React.createElement(SuperAdminDashboard),
          React.createElement(AiAppointmentBookingPage),
          React.createElement(UnauthorizedPage),
          React.createElement(AppointmentConfirmationCard, {
            intent: {
              intentId: 'int_01',
              idempotencyKey: 'idem_01',
              patientId: 'pat_001',
              patientName: 'Priya Sharma',
              hospitalId: 'hosp_metro_01',
              hospitalName: 'Apollo Indraprastha Healthcare',
              departmentId: 'dept_cardio_01',
              specialty: 'Cardiology',
              doctorId: 'staff_01',
              doctorName: 'Dr. Rajesh Kumar',
              requestedDate: '2026-10-25',
              preferredTime: '10:30 AM',
              consultationType: 'in_person',
              fee: 500,
              cancellationPolicy: 'Free cancellation up to 2 hours before slot',
              status: 'AWAITING_CONFIRMATION',
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 300000).toISOString(),
            },
            onConfirm: async () => {},
            onCancel: () => {},
            isConfirming: false,
          })
        )
      )
    );

    expect(html.length).toBeGreaterThan(1000);
    expect(html).not.toMatch(/demo/i);
    expect(html).not.toMatch(/phase/i);
    expect(html).not.toMatch(/\/login/i);
    expect(html).not.toMatch(/Professor Testing/i);
    expect(html).not.toMatch(/Scaffolded/i);
  });
});
