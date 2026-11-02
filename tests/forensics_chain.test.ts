// Automated Test Suite: Cyber-Forensics SHA-256 Tamper-Evident Hash Chain
import { describe, it, expect, beforeEach } from 'vitest';
import {
  auditChainService,
  sha256Sync,
  serializePayload,
  computeEventHash,
  GENESIS_PREV_HASH,
} from '../src/services/forensics/auditChainService';
import type { ForensicAuditEvent, UserRole } from '../src/types';

describe('Cyber-Forensics Tamper-Evident Audit Hash Chain', () => {
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
    expect(verification.isValid).toBe(true);
    expect(verification.totalBlocks).toBe(4); // Genesis + 3 events
    expect(verification.error).toBeUndefined();
  });

  it('detects when an in-place event payload/details is modified by an adversary', () => {
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      severity: 'INFO',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya Sharma' },
      appointmentId: 'APT-2026-9901',
      details: 'Authorized booking committed.',
    });

    // Simulate database tamper on block #1
    auditChainService.simulateTamper(1, 'Malicious attacker forged appointment status');

    const verification = auditChainService.verifyChainIntegrity();
    expect(verification.isValid).toBe(false);
    expect(verification.brokenIndex).toBe(1);
    expect(verification.error).toContain('Payload tamper detected at block #1');
  });

  it('detects when an event is deleted from the middle of the chain', () => {
    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya' },
      details: 'Slot 1 selected',
    });
    auditChainService.appendEvent({
      eventType: 'CONFIRMATION_ATTEMPTED',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya' },
      details: 'Confirmed slot 1',
    });
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya' },
      details: 'Committed slot 1',
    });

    const chain = auditChainService.getChain();
    // Delete block #2
    const tamperedChain = [chain[0], chain[1], chain[3]];

    const verification = auditChainService.verifyChainIntegrity(tamperedChain);
    expect(verification.isValid).toBe(false);
    expect(verification.error).toContain('Sequence discontinuity detected');
  });

  it('detects when events are reordered in the chain', () => {
    auditChainService.appendEvent({
      eventType: 'SLOT_SELECTED',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya' },
      details: 'Step 1',
    });
    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'Priya' },
      details: 'Step 2',
    });

    const chain = auditChainService.getChain();
    // Swap block #1 and block #2
    const reorderedChain = [chain[0], chain[2], chain[1]];

    const verification = auditChainService.verifyChainIntegrity(reorderedChain);
    expect(verification.isValid).toBe(false);
  });

  it('detects when genesis block previousHash is altered', () => {
    const chain = auditChainService.getChain();
    chain[0].previousHash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

    const verification = auditChainService.verifyChainIntegrity(chain);
    expect(verification.isValid).toBe(false);
    expect(verification.brokenIndex).toBe(0);
    expect(verification.error).toContain('Genesis block previousHash invalid');
  });

  it('handles non-ASCII Unicode characters and emojis with standard deterministic SHA-256', () => {
    const unicodeInput = 'MediQueue 🏥 दिल्ली AIIMS कार्डियोलॉजी नमस्ते ❤️';
    const hash = sha256Sync(unicodeInput);
    expect(hash).toHaveLength(64);

    // Deterministic hashing check
    expect(sha256Sync(unicodeInput)).toBe(hash);

    auditChainService.appendEvent({
      eventType: 'BOOKING_COMMITTED',
      actor: { uid: 'pat_01', role: 'patient' as UserRole, name: 'प्रिया शर्मा' },
      details: 'विशेषज्ञ परामर्श: कार्डियोलॉजी ओपीडी 🏥',
    });

    const verification = auditChainService.verifyChainIntegrity();
    expect(verification.isValid).toBe(true);
  });
});
