// Automated Test Suite: Enterprise Security Activity & Operational Audit Logs
import { describe, it, expect, beforeEach } from 'vitest';
import { activityLogService } from '../src/services/logging/activityLogService';
import type { UserRole } from '../src/types';

describe('Enterprise Security Activity & Audit Logging', () => {
  beforeEach(() => {
    activityLogService.clearLogs();
  });

  it('records an operational activity event with complete caller attribution', () => {
    const actor = {
      uid: 'staff_test_01',
      role: 'staff' as UserRole,
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh@apollo.demo',
    };

    const log = activityLogService.logActivity({
      eventType: 'BED_STATUS_UPDATED',
      severity: 'INFO',
      actor,
      hospitalId: 'hosp_metro_01',
      actionSummary: 'Updated bed ICU-01 to OCCUPIED status.',
    });

    expect(log.id).toMatch(/^act_log_/);
    expect(log.eventType).toBe('BED_STATUS_UPDATED');
    expect(log.severity).toBe('INFO');
    expect(log.actor.uid).toBe('staff_test_01');
    expect(log.actor.role).toBe('staff');
    expect(log.hospitalId).toBe('hosp_metro_01');
    expect(new Date(log.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('retrieves recorded logs sorted newest first and filters by severity', () => {
    const actor = { uid: 'user_01', role: 'patient' as UserRole, name: 'Priya Sharma' };

    activityLogService.logActivity({
      eventType: 'SLOT_SEARCH',
      severity: 'INFO',
      actor,
      actionSummary: 'Searched for cardiology slots.',
    });

    activityLogService.logActivity({
      eventType: 'ACCESS_DENIED',
      severity: 'WARN',
      actor,
      actionSummary: 'Cross-patient access rejected.',
    });

    activityLogService.logActivity({
      eventType: 'APPOINTMENT_CONFIRMED',
      severity: 'INFO',
      actor,
      actionSummary: 'Confirmed booking for APT-2026-001.',
    });

    const allLogs = activityLogService.getLogs();
    expect(allLogs.length).toBe(3);
    // Newest first
    expect(allLogs[0].eventType).toBe('APPOINTMENT_CONFIRMED');

    const warnLogs = activityLogService.getLogs({ severity: 'WARN' });
    expect(warnLogs.length).toBe(1);
    expect(warnLogs[0].eventType).toBe('ACCESS_DENIED');
  });

  it('filters logs by eventType and hospital scope', () => {
    const actor = { uid: 'user_01', role: 'staff' as UserRole, name: 'Dr. Anita' };

    activityLogService.logActivity({
      eventType: 'BED_STATUS_UPDATED',
      hospitalId: 'hosp_metro_01',
      actor,
      actionSummary: 'Metro hospital bed updated.',
    });

    activityLogService.logActivity({
      eventType: 'BED_STATUS_UPDATED',
      hospitalId: 'hosp_metro_02',
      actor,
      actionSummary: 'Max hospital bed updated.',
    });

    const hosp1Logs = activityLogService.getLogs({ hospitalId: 'hosp_metro_01' });
    expect(hosp1Logs.length).toBe(1);
    expect(hosp1Logs[0].hospitalId).toBe('hosp_metro_01');
  });

  it('resets log collection cleanly for demo environment reset', () => {
    const actor = { uid: 'user_01', role: 'super_admin' as UserRole, name: 'Admin' };

    activityLogService.logActivity({
      eventType: 'SYSTEM_CONFIG_UPDATED',
      actor,
      actionSummary: 'Configuration test entry.',
    });

    expect(activityLogService.getLogs().length).toBe(1);

    activityLogService.clearLogs();
    expect(activityLogService.getLogs().length).toBe(0);
  });
});
