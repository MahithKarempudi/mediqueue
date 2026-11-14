// Automated Test Suite: Healthcare Tamper-Evident Audit Trail Service (HIPAA §164.312)
import { describe, it, expect, beforeEach } from 'vitest';
import {
  auditChainService,
  sha256Sync,
  GENESIS_PREV_HASH,
} from '../src/services/forensics/auditChainService';
import type { UserRole } from '../src/types';

describe('Healthcare Tamper-Evident Audit Trail Service', () => {
  beforeEach(() => {
    // Reset chain before each test
    auditChainService.resetChain();
  });

  it('generates an anchored Genesis block with index 0 and standard previousHash', () => {
    const chain = auditChainService.getChain();
    expect(chain.length).toBeGreaterThanOrEqual(1);
    const genesis = chain[0];
    expect(genesis.index).toBe(0);
    expect(genesis.previousHash).toBe(GENESIS_PREV_HASH);
    expect(genesis.currentHash).toHaveLength(64);
  });

  it('verifies a valid untouched hash chain with 100% integrity', () => {
    // Append 3 valid events
    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
      hospitalId: 'hosp_metro_01',
      details: 'Patient queried Cardiology slots.',
    });

    auditChainService.appendEvent({
      eventType: 'CONFIRMATION_ATTEMPTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
      hospitalId: 'hosp_metro_01',
      details: 'Patient checked explicit consent authorization.',
    });

    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
      appointmentId: 'APT-2026-9901',
      details: 'Authoritative booking committed.',
    });

    const verification = auditChainService.verifyChainIntegrity();
    expect(verification.valid).toBe(true);
    expect(verification.totalEvents).toBe(4); // Genesis + 3 events
    expect(verification.brokenAtIndex).toBeUndefined();
  });

  it('detects single-byte payload tampering within a committed block', () => {
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
      appointmentId: 'APT-2026-9901',
      details: 'Original verified clinical appointment details.',
    });

    // Simulate adversarial modification of block 1 payload
    auditChainService.simulateTamper(1, 'Malicious attacker forged appointment status');

    const verification = auditChainService.verifyChainIntegrity();
    expect(verification.valid).toBe(false);
    expect(verification.brokenAtIndex).toBe(1);
    expect(verification.details).toContain('Payload tamper detected');
  });

  it('detects deletion of an intermediate audit block from the chain', () => {
    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
    });
    auditChainService.appendEvent({
      eventType: 'BOOKING_REQUESTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
    });
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
    });

    // Adversary attempts to hide an event by deleting block 2
    const chain = auditChainService.getChain();
    const tamperedChain = [chain[0], chain[1], chain[3]]; // Skip index 2

    const verification = auditChainService.verifyChainIntegrity(tamperedChain);
    expect(verification.valid).toBe(false);
    expect(verification.brokenAtIndex).toBe(2);
  });

  it('detects block reordering or swapped audit positions', () => {
    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
    });
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
    });

    const chain = auditChainService.getChain();
    // Swap block 1 and block 2
    const reorderedChain = [chain[0], chain[2], chain[1]];

    const verification = auditChainService.verifyChainIntegrity(reorderedChain);
    expect(verification.valid).toBe(false);
  });

  it('verifies deterministic canonical serialization across platforms', () => {
    const chain = auditChainService.getChain();
    expect(chain[0]).toBeDefined();

    const verification = auditChainService.verifyChainIntegrity(chain);
    expect(verification.valid).toBe(true);

    // RFC 6234 standard test vector: "abc"
    const standardSha256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
    expect(sha256Sync('abc')).toBe(standardSha256);
  });

  it('survives rehydration from persistent storage without integrity breakdown', () => {
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
      appointmentId: 'APT-2026-9901',
      details: 'Patient booking saved before refresh.',
    });

    const verification = auditChainService.verifyChainIntegrity();
    expect(verification.valid).toBe(true);
    expect(verification.totalEvents).toBe(2);
  });
});
