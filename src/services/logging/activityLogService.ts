// Enterprise Security Activity & Operational Audit Log Service
// Provides structured, role-attributed logging for access events, clinical state transitions, and administrative operations.

import type { UserRole } from '@/types';
import { mockStorage } from '../mockStorage';

export type ActivityEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'ACCESS_DENIED'
  | 'SLOT_SEARCH'
  | 'BOOKING_INTENT_CREATED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'BED_STATUS_UPDATED'
  | 'PATIENT_ADMITTED'
  | 'PATIENT_DISCHARGED'
  | 'TOKEN_CALLED'
  | 'DIAGNOSTIC_ORDERED'
  | 'INVOICE_GENERATED'
  | 'HOSPITAL_ONBOARDED'
  | 'SYSTEM_CONFIG_UPDATED';

export type LogSeverity = 'INFO' | 'WARN' | 'ERROR';

export interface SecurityActivityLog {
  id: string;
  timestamp: string;
  eventType: ActivityEventType;
  severity: LogSeverity;
  actor: {
    uid: string;
    role: UserRole;
    name: string;
    email?: string;
  };
  targetPatientId?: string | null;
  hospitalId?: string | null;
  actionSummary: string;
  details?: string;
}

const COLLECTION_NAME = 'security_activity_logs';

export const activityLogService = {
  // Retrieve all logged activity events (sorted newest first)
  getLogs(filters?: {
    severity?: LogSeverity;
    eventType?: ActivityEventType;
    hospitalId?: string;
  }): SecurityActivityLog[] {
    const rawLogs = mockStorage.getCollection<SecurityActivityLog>(COLLECTION_NAME);
    let filtered = rawLogs.slice().reverse();

    if (filters?.severity) {
      filtered = filtered.filter((l) => l.severity === filters.severity);
    }
    if (filters?.eventType) {
      filtered = filtered.filter((l) => l.eventType === filters.eventType);
    }
    if (filters?.hospitalId) {
      filtered = filtered.filter((l) => l.hospitalId === filters.hospitalId);
    }

    return filtered;
  },

  // Record an enterprise security activity event
  logActivity(params: {
    eventType: ActivityEventType;
    severity?: LogSeverity;
    actor: { uid: string; role: UserRole; name: string; email?: string };
    targetPatientId?: string | null;
    hospitalId?: string | null;
    actionSummary: string;
    details?: string;
  }): SecurityActivityLog {
    const id = `act_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const logEntry: SecurityActivityLog = {
      id,
      timestamp: new Date().toISOString(),
      eventType: params.eventType,
      severity: params.severity || 'INFO',
      actor: params.actor,
      targetPatientId: params.targetPatientId || null,
      hospitalId: params.hospitalId || null,
      actionSummary: params.actionSummary,
      details: params.details || '',
    };

    mockStorage.setDocument(COLLECTION_NAME, id, logEntry);
    return logEntry;
  },

  // Clear activity logs (labelled for demo environment reset only)
  clearLogs(): void {
    mockStorage.setCollection(COLLECTION_NAME, []);
  },
};
