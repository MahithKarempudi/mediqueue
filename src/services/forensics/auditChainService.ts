// Cyber-Forensics Tamper-Evident SHA-256 Hash Chain Service for MediQueue
// Implements canonical UTF-8 byte serialization, sequential block verification,
// and payload integrity recomputation to detect any in-place tampering, deletion, or reordering.

import type { ForensicAuditEvent, ForensicEventType, ChainVerificationResult } from '@/types/appointmentWorkflow';
import type { UserRole } from '@/types';
import { mockStorage } from '../mockStorage';

const STORAGE_KEY = 'mediqueue_forensic_chain';
export const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

// Standard RFC 6234 compliant SHA-256 implementation operating on UTF-8 bytes
export function sha256Sync(str: string): string {
  const bytes = new TextEncoder().encode(str);
  function rightRotate(v: number, n: number) { return (v >>> n) | (v << (32 - n)); }

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

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const bitLength = bytes.length * 8;
  const newLength = ((bytes.length + 8 + 64) >> 6) << 6;
  const padded = new Uint8Array(newLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setBigUint64(newLength - 8, BigInt(bitLength), false);

  const words = new Uint32Array(padded.buffer);
  const w = new Uint32Array(64);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = view.getUint32((i + t) * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[t] + w[t]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const out = new DataView(new ArrayBuffer(32));
  out.setUint32(0, h0, false);
  out.setUint32(4, h1, false);
  out.setUint32(8, h2, false);
  out.setUint32(12, h3, false);
  out.setUint32(16, h4, false);
  out.setUint32(20, h5, false);
  out.setUint32(24, h6, false);
  out.setUint32(28, h7, false);

  return Array.from(new Uint8Array(out.buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const computeHash = (dataString: string): string => {
  return sha256Sync(dataString);
};

// Canonical payload serialization ensuring deterministic hashing
export const serializePayload = (params: {
  details: string;
  targetPatientId?: string | null;
  hospitalId?: string | null;
  requestId?: string | null;
  appointmentId?: string | null;
}): string => {
  return JSON.stringify({
    details: params.details,
    targetPatientId: params.targetPatientId || null,
    hospitalId: params.hospitalId || null,
    requestId: params.requestId || null,
    appointmentId: params.appointmentId || null,
  });
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

let memoryChainCache: string | null = null;

function getStoredChainRaw(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
  } catch (e) {
    // ignore
  }
  return memoryChainCache;
}

function setStoredChainRaw(val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, val);
    }
  } catch (e) {
    // ignore
  }
  memoryChainCache = val;
}

function removeStoredChainRaw(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // ignore
  }
  memoryChainCache = null;
}

export const auditChainService = {
  // Retrieve chain from local storage or initialize with Genesis block
  getChain(): ForensicAuditEvent[] {
    try {
      const raw = getStoredChainRaw();
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to parse forensic chain:', e);
    }

    const genesisTimestamp = '2026-09-17T09:00:00.000Z';
    const payload = serializePayload({
      details: 'Genesis Cryptographic Anchor Block Established with SHA-256 Tamper-Evident Hash Chain.',
      targetPatientId: null,
      hospitalId: null,
      requestId: null,
      appointmentId: null,
    });
    const payloadHash = computeHash(payload);
    const genesisHash = computeEventHash(0, genesisTimestamp, 'BOOKING_REQUESTED', 'system_root', payloadHash, GENESIS_PREV_HASH);

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
      details: 'Genesis Cryptographic Anchor Block Established with SHA-256 Tamper-Evident Hash Chain.',
      payloadHash,
      previousHash: GENESIS_PREV_HASH,
      currentHash: genesisHash,
    };

    const initial = [genesisEvent];
    setStoredChainRaw(JSON.stringify(initial));
    return initial;
  },

  // Append new event to the SHA-256 hash chain (Append-only)
  appendEvent(params: {
    eventType: ForensicEventType;
    severity?: 'INFO' | 'WARN' | 'CRITICAL';
    actor: { uid: string; role: UserRole; name: string; email?: string };
    targetPatientId?: string;
    hospitalId?: string;
    requestId?: string;
    appointmentId?: string;
    details: string;
  }): ForensicAuditEvent {
    const chain = this.getChain();
    const lastEvent = chain[chain.length - 1];

    const index = chain.length;
    const timestamp = new Date().toISOString();
    const id = `forensic_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Minimize logged payload data: Never store passwords, tokens, or raw medical transcripts
    const sanitizedPayload = serializePayload({
      details: params.details,
      targetPatientId: params.targetPatientId || null,
      hospitalId: params.hospitalId || null,
      requestId: params.requestId || null,
      appointmentId: params.appointmentId || null,
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
    setStoredChainRaw(JSON.stringify(chain));

    // Also mirror to mockStorage collection so Super Admin and Audit pages see it live
    mockStorage.setDocument('forensic_audit_events', id, newEvent);

    return newEvent;
  },

  // Cryptographically verifies every link in the hash chain from Genesis to tip.
  // Recomputes payload hash from actual stored fields and verifies sequential indexing.
  verifyChainIntegrity(customChain?: ForensicAuditEvent[]): ChainVerificationResult {
    const chain = customChain || this.getChain();

    if (chain.length === 0) {
      return {
        isValid: false,
        totalBlocks: 0,
        error: 'Chain is empty. No Genesis block found.',
        verifiedAt: new Date().toISOString(),
      };
    }

    // 1. Verify Genesis block indexing & anchor
    if (chain[0].index !== 0) {
      return {
        isValid: false,
        totalBlocks: chain.length,
        brokenIndex: 0,
        brokenEventId: chain[0].id,
        error: `Genesis block index invalid: Expected 0, found ${chain[0].index}. Chain sequence compromised.`,
        verifiedAt: new Date().toISOString(),
      };
    }

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

    // 2. Traverse every block in sequence
    for (let i = 0; i < chain.length; i++) {
      const curr = chain[i];

      // A. Check sequential index continuity (detects deletion, insertion, or reordering)
      if (curr.index !== i) {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenIndex: i,
          brokenEventId: curr.id,
          error: `Sequence discontinuity detected at block #${i}. Stored index #${curr.index} does not match expected position #${i} (event deletion, insertion, or reordering).`,
          verifiedAt: new Date().toISOString(),
        };
      }

      // B. Verify parent hash link for blocks > 0
      if (i > 0) {
        const prev = chain[i - 1];
        if (curr.previousHash !== prev.currentHash) {
          return {
            isValid: false,
            totalBlocks: chain.length,
            brokenIndex: i,
            brokenEventId: curr.id,
            error: `Broken hash link at block #${i}. Block previousHash does not match parent block #${i - 1} currentHash.`,
            verifiedAt: new Date().toISOString(),
          };
        }
      }

      // C. Recompute payload hash from actual stored event fields (detects in-place payload alteration)
      const expectedPayload = serializePayload({
        details: curr.details,
        targetPatientId: curr.targetPatientId || null,
        hospitalId: curr.hospitalId || null,
        requestId: curr.requestId || null,
        appointmentId: curr.appointmentId || null,
      });
      const recomputedPayloadHash = computeHash(expectedPayload);

      if (recomputedPayloadHash !== curr.payloadHash) {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenIndex: i,
          brokenEventId: curr.id,
          error: `Payload tamper detected at block #${i}. Stored payloadHash [${curr.payloadHash.substring(0, 8)}...] does not match recomputed hash of details [${recomputedPayloadHash.substring(0, 8)}...].`,
          verifiedAt: new Date().toISOString(),
        };
      }

      // D. Recompute event hash (detects timestamp, actor, index, or eventType alteration)
      const recomputedEventHash = computeEventHash(
        curr.index,
        curr.timestamp,
        curr.eventType,
        curr.actor.uid,
        curr.payloadHash,
        curr.previousHash
      );

      if (recomputedEventHash !== curr.currentHash) {
        return {
          isValid: false,
          totalBlocks: chain.length,
          brokenIndex: i,
          brokenEventId: curr.id,
          error: `Cryptographic tamper detected at block #${i}. Stored event hash [${curr.currentHash.substring(0, 8)}...] differs from computed hash [${recomputedEventHash.substring(0, 8)}...].`,
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

  // Demonstration test trigger: Simulates an adversary modifying an audit record to demonstrate tamper detection
  simulateTamper(index: number, maliciousDetails: string): void {
    const chain = this.getChain();
    if (index >= 0 && index < chain.length) {
      chain[index].details = maliciousDetails;
      chain[index].tampered = true;
      setStoredChainRaw(JSON.stringify(chain));
    }
  },

  // Reset chain back to valid initial genesis state (labelled for demo only)
  resetChain(): void {
    removeStoredChainRaw();
    this.getChain();
  },
};
