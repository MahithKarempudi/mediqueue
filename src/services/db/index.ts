import { isFirebaseConfigured, firestore, realtimeDb } from '../firebase';
import { mockStorage } from '../mockStorage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, set, update, onValue, get } from 'firebase/database';

export const dbService = {
  // --- Collections (Firestore) ---

  async getCollection<T>(collectionName: string): Promise<T[]> {
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDocs(collection(firestore, collectionName));
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
      } catch (err) {
        console.warn(`Firestore getDocs failed for ${collectionName}, falling back to mock:`, err);
      }
    }
    return mockStorage.getCollection<T>(collectionName);
  },

  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    if (isFirebaseConfigured && firestore) {
      try {
        const snap = await getDoc(doc(firestore, collectionName, docId));
        return snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null;
      } catch (err) {
        console.warn(`Firestore getDoc failed for ${collectionName}/${docId}, falling back:`, err);
      }
    }
    return mockStorage.getDocument<T>(collectionName, docId);
  },

  async setDocument<T extends Record<string, any>>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<T> {
    if (isFirebaseConfigured && firestore) {
      try {
        await setDoc(doc(firestore, collectionName, docId) as any, data as any, { merge: true });
        return { ...data, id: docId };
      } catch (err) {
        console.warn(`Firestore setDoc failed, saving to local mock:`, err);
      }
    }
    return mockStorage.setDocument<T>(collectionName, docId, data);
  },

  async updateDocument<T extends Record<string, any>>(
    collectionName: string,
    docId: string,
    updates: Partial<T>,
    idKey?: string
  ): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      try {
        await updateDoc(doc(firestore, collectionName, docId) as any, updates as any);
        return;
      } catch (err) {
        console.warn(`Firestore updateDoc failed, falling back:`, err);
      }
    }
    mockStorage.updateDocument<T>(collectionName, docId, updates, idKey);
  },

  subscribeCollection<T>(
    collectionName: string,
    callback: (items: T[]) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && firestore) {
      try {
        return onSnapshot(collection(firestore, collectionName), (snapshot) => {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as T));
          callback(items);
        }, (error) => {
          console.warn(`Firestore subscription failed on ${collectionName}:`, error);
        });
      } catch (e) {
        console.warn('Falling back to mock collection subscription:', e);
      }
    }
    return mockStorage.subscribeCollection<T>(collectionName, callback);
  },

  subscribeDocument<T>(
    collectionName: string,
    docId: string,
    callback: (item: T | null) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && firestore) {
      try {
        return onSnapshot(doc(firestore, collectionName, docId) as any, (snap: any) => {
          callback(snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null);
        });
      } catch (e) {
        console.warn('Falling back to mock document subscription:', e);
      }
    }
    return mockStorage.subscribeDocument<T>(collectionName, docId, callback);
  },

  // --- Realtime Database (RTDB) ---

  async getRTDB<T>(path: string): Promise<T | null> {
    if (isFirebaseConfigured && realtimeDb) {
      try {
        const snap = await get(ref(realtimeDb, path));
        return snap.exists() ? (snap.val() as T) : null;
      } catch (err) {
        console.warn(`RTDB get failed for ${path}:`, err);
      }
    }
    return mockStorage.getRTDB<T>(path);
  },

  async setRTDB<T>(path: string, data: T): Promise<void> {
    if (isFirebaseConfigured && realtimeDb) {
      try {
        await set(ref(realtimeDb, path), data);
        return;
      } catch (err) {
        console.warn(`RTDB set failed for ${path}:`, err);
      }
    }
    mockStorage.setRTDB(path, data);
  },

  async updateRTDB<T extends Record<string, any>>(path: string, updates: Partial<T>): Promise<void> {
    if (isFirebaseConfigured && realtimeDb) {
      try {
        await update(ref(realtimeDb, path), updates);
        return;
      } catch (err) {
        console.warn(`RTDB update failed for ${path}:`, err);
      }
    }
    mockStorage.updateRTDB(path, updates);
  },

  subscribeRTDB<T>(path: string, callback: (data: T | null) => void): () => void {
    if (isFirebaseConfigured && realtimeDb) {
      try {
        const dbRef = ref(realtimeDb, path);
        const unsubscribe = onValue(dbRef, (snapshot) => {
          callback(snapshot.val());
        });
        return () => unsubscribe();
      } catch (err) {
        console.warn(`RTDB subscription failed on ${path}:`, err);
      }
    }
    return mockStorage.subscribeRTDB<T>(path, callback);
  },

  // --- Operational Live Bed Mutations & Atomic Mirrors ---
  async updateBedStatus(
    hospitalId: string,
    bedId: string,
    status: 'available' | 'occupied' | 'maintenance',
    patientName?: string,
    currentAdmissionId?: string
  ): Promise<void> {
    // 1. Update Firestore persistent record
    const updates: Record<string, any> = {
      status,
      patientName: status === 'available' ? '' : (patientName || ''),
      currentAdmissionId: status === 'available' ? '' : (currentAdmissionId || ''),
    };
    await this.updateDocument('ipd_beds', bedId, updates, 'bedId');

    // 2. Mirror to Realtime Database liveBeds/{hospitalId}/{bedId}
    const rtdbPath = `liveBeds/${hospitalId}/${bedId}`;
    await this.updateRTDB(rtdbPath, {
      status,
      lastUpdated: new Date().toISOString(),
    });

    // 3. Recalculate and update emergencyCapacity/{hospitalId}
    const allBeds = await this.getCollection<any>('ipd_beds');
    const hospBeds = allBeds.filter((b: any) => b.hospitalId === hospitalId);
    const updatedBeds = hospBeds.map((b: any) => b.bedId === bedId ? { ...b, status } : b);

    const icuFree = updatedBeds.filter((b: any) => b.type === 'ICU' && b.status === 'available').length;
    const genFree = updatedBeds.filter((b: any) => b.type === 'general' && b.status === 'available').length;
    const totalOccupied = updatedBeds.filter((b: any) => b.status === 'occupied').length;
    const occupancyRatio = updatedBeds.length > 0 ? totalOccupied / updatedBeds.length : 0;

    let emergencyStatus: 'Normal' | 'Surge' | 'Critical' | 'Diverting' = 'Normal';
    if (occupancyRatio >= 0.85) {
      emergencyStatus = 'Surge';
    } else if (icuFree <= 1) {
      emergencyStatus = 'Critical';
    }

    await this.setRTDB(`emergencyCapacity/${hospitalId}`, {
      icuBedsFree: icuFree,
      generalBedsFree: genFree,
      emergencyStatus,
      lastUpdated: new Date().toISOString(),
    });

    await this.updateRTDB(`hospitalStatus/${hospitalId}`, {
      surgeAlert: occupancyRatio >= 0.85,
    });
  },
};
