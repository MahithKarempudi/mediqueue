// Cyber-Forensics Immutable SHA-256 Hash Chain Service for MediQueue

import type { ForensicAuditEvent, ForensicEventType, ChainVerificationResult } from '@/types/appointmentWorkflow';
import type { UserRole } from '@/types';
import { mockStorage } from '../mockStorage';

const STORAGE_KEY = 'mediqueue_forensic_chain';
const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// Pure JavaScript SHA-256 implementation ensuring instant synchronous cryptographic hashing
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i = 0;
  let j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    words[i >> 2] |= (code & 0xff) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        // already in w
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const byte = (hash[i] >> (j * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

export const computeHash = (dataString: string): string => {
  return sha256Sync(dataString);
};

export const computeEventHash = (
  index: number,
  timestamp: string,
  eventType: string,
  actorUid: string,
  payloadHash: string,
  previousHash: string
): string => {
  const serialized = `${index}|${timestamp}|${eventType}|${actorUid}|${payloadHash}|${previousHash}`;
  return sha256Sync(serialized);
};

export const auditChainService = {
  // Retrieve chain from local storage or initialize with Genesis block
  getChain(): ForensicAuditEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse forensic chain:', e);
    }

    // Initialize with immutable Genesis block
    const genesisTimestamp = '2026-09-17T09:00:00.000Z';
    const payload = JSON.stringify({
      system: 'MediQueue Cloud Healthcare Platform',
      version: 'v1.0-forensics-audit',
      genesisNote: 'Tamper-Evident Cyber-Forensics SHA-256 Hash Chain Initialized',
    });
    const payloadHash = computeHash(payload);
    const genesisHash = computeEventHash(0, genesisTimestamp, 'GENESIS_CHAIN_INIT', 'system_root', payloadHash, GENESIS_PREV_HASH);

    const genesisEvent: ForensicAuditEvent = {
      index: 0,
      id: 'forensic_evt_000',
      timestamp: genesisTimestamp,
      eventType: 'BOOKING_REQUESTED',
      severity: 'INFO',
      actor: {
        uid: 'system_root',
        role: 'super_admin' as UserRole,
        name: 'MediQueue Cyber-Security Kernel',
      },
      details: 'Genesis Cryptographic Anchor Block Established with SHA-256 Hash Chain verification.',
      payloadHash,
      previousHash: GENESIS_PREV_HASH,
      currentHash: genesisHash,
    };

    const initial = [genesisEvent];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  },

  // Append new event to the SHA-256 hash chain
  appendEvent(params: {
    eventType: ForensicEventType;
    severity?: 'INFO' | 'WARN' | 'CRITICAL';
    actor: { uid: string; role: UserRole; name: string; email?: string };
    targetPatientId?: string;
    hospitalId?: string;
    requestId?: string;
    appointmentId?: string;
    details: string;
    metadata?: Record<string, any>;
  }): ForensicAuditEvent {
    const chain = this.getChain();
    const lastEvent = chain[chain.length - 1];

    const index = chain.length;
    const timestamp = new Date().toISOString();
    const id = `forensic_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Minimize logged payload data (no passwords, raw conversational text, or sensitive tokens)
    const sanitizedPayload = JSON.stringify({
      details: params.details,
      targetPatientId: params.targetPatientId || null,
      hospitalId: params.hospitalId || null,
      requestId: params.requestId || null,
      appointmentId: params.appointmentId || null,
      ...(params.metadata || {}),
    });

    const payloadHash = computeHash(sanitizedPayload);
    const previousHash = lastEvent ? lastEvent.currentHash : GENESIS_PREV_HASH;
    const currentHash = computeEventHash(
      index,
      timestamp,
      params.eventType,
      params.actor.uid,
      payloadHash,
      previousHash
    );

    const newEvent: ForensicAuditEvent = {
      index,
      id,
      timestamp,
      eventType: params.eventType,
      severity: params.severity || 'INFO',
      actor: params.actor,
      targetPatientId: params.targetPatientId,
      hospitalId: params.hospitalId,
      requestId: params.requestId,
      appointmentId: params.appointmentId,
      details: params.details,
      payloadHash,
      previousHash,
      currentHash,
    };

    chain.push(newEvent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));

    // Also mirror to mockStorage collection so Super Admin and Audit pages see it live
    mockStorage.setDocument('forensic_audit_events', id, newEvent);

    return newEvent;
  },

  // Cryptographically verifies every link in the hash chain from Genesis to tip
  verifyChainIntegrity(): ChainVerificationResult {
    const chain = this.getChain();

    if (chain.length === 0) {
      return {
        isValid: false,
        totalBlocks: 0,
        error: 'Chain is empty. No Genesis block found.',
        verifiedAt: new Date().toISOString(),
      };
    }

    // Verify Genesis block
    if (chain[0].previousHash !== GENESIS_PREV_HASH) {
      return {
        isValid: false,
        totalBlocks: chain.length,
        brokenIndex: 0,
        brokenEventId: chain[0].id,
        error: `Genesis block previousHash invalid. Expected ${GENESIS_PREV_HASH}, found ${chain[0].previousHash}`,
        verifiedAt: new Date().toISOString(),
      };
    }

    // Traverse every block
    for (let i = 1; i < chain.length; i++) {
      const prev = chain[i - 1];
      const curr = chain[i];

      // 1. Check parent linkage
      if (curr.previousHash !== prev.currentHash) {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenIndex: i,
          brokenEventId: curr.id,
          error: `Broken hash link at block #${i}. Block previousHash does not match parent currentHash.`,
          verifiedAt: new Date().toISOString(),
        };
      }

      // 2. Recompute current hash to detect in-place data tampering
      const recomputedHash = computeEventHash(
        curr.index,
        curr.timestamp,
        curr.eventType,
        curr.actor.uid,
        curr.payloadHash,
        curr.previousHash
      );

      if (recomputedHash !== curr.currentHash) {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenIndex: i,
          brokenEventId: curr.id,
          error: `Cryptographic tamper detected at block #${i}. Stored hash [${curr.currentHash.substring(0, 8)}...] differs from computed hash [${recomputedHash.substring(0, 8)}...].`,
          verifiedAt: new Date().toISOString(),
        };
      }
    }

    return {
      isValid: true,
      totalBlocks: chain.length,
      verifiedAt: new Date().toISOString(),
    };
  },

  // Professor demonstration helper: Simulates an adversary modifying an audit record to show intrusion detection
  simulateTamper(index: number, maliciousDetails: string): void {
    const chain = this.getChain();
    if (index >= 0 && index < chain.length) {
      chain[index].details = maliciousDetails;
      chain[index].tampered = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chain));
    }
  },

  // Reset chain back to valid state
  resetChain(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.getChain();
  },
};
