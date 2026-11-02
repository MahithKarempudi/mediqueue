import { isFirebaseConfigured, firestore, realtimeDb } from '../firebase';
import { mockStorage } from '../mockStorage';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { ref, set, update, onValue, get } from 'firebase/database';

export const isLocalMode = !isFirebaseConfigured;
export const activeAdapterName = isFirebaseConfigured ? 'Firebase Cloud' : 'Local Storage Engine';

export const dbService = {
  isLocalMode,
  activeAdapterName,

  async getCollection<T>(collectionName: string): Promise<T[]> {
    if (isFirebaseConfigured) {
      if (!firestore) {
        throw new Error(`Firebase is configured but Firestore client is uninitialized. Cannot read ${collectionName}.`);
      }
      try {
        const snap = await getDocs(collection(firestore, collectionName));
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as T));
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] Firestore getDocs failed for ${collectionName}:`, err);
        throw new Error(`Cloud read failure for ${collectionName}: ${err.message || 'Permission denied or network failure'}`);
      }
    }
    return mockStorage.getCollection<T>(collectionName);
  },

  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    if (isFirebaseConfigured) {
      if (!firestore) {
        throw new Error(`Firebase is configured but Firestore client is uninitialized. Cannot read ${collectionName}/${docId}.`);
      }
      try {
        const snap = await getDoc(doc(firestore, collectionName, docId));
        return snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null;
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] Firestore getDoc failed for ${collectionName}/${docId}:`, err);
        throw new Error(`Cloud read failure for document ${docId}: ${err.message}`);
      }
    }
    return mockStorage.getDocument<T>(collectionName, docId);
  },

  async setDocument<T extends Record<string, any>>(
    collectionName: string,
    docId: string,
    data: T
  ): Promise<T> {
    if (isFirebaseConfigured) {
      if (!firestore) {
        throw new Error(`Firebase is configured but Firestore client is uninitialized. Cannot write ${collectionName}/${docId}.`);
      }
      try {
        await setDoc(doc(firestore, collectionName, docId) as any, data as any, { merge: true });
        return { ...data, id: docId };
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] Firestore setDoc failed for ${collectionName}/${docId}:`, err);
        throw new Error(`Cloud persistence failure for ${collectionName}/${docId}: ${err.message}`);
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
    if (isFirebaseConfigured) {
      if (!firestore) {
        throw new Error(`Firebase is configured but Firestore client is uninitialized. Cannot update ${collectionName}/${docId}.`);
      }
      try {
        await updateDoc(doc(firestore, collectionName, docId) as any, updates as any);
        return;
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] Firestore updateDoc failed for ${collectionName}/${docId}:`, err);
        throw new Error(`Cloud update failure for ${collectionName}/${docId}: ${err.message}`);
      }
    }
    mockStorage.updateDocument<T>(collectionName, docId, updates, idKey);
  },

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    if (isFirebaseConfigured && firestore) {
      await deleteDoc(doc(firestore, collectionName, docId));
      return;
    }
    const items = mockStorage.getCollection<any>(collectionName);
    const filtered = items.filter(
      (item: any) =>
        item.id !== docId &&
        item.uid !== docId &&
        item.hospitalId !== docId &&
        item.patientId !== docId &&
        item.appointmentId !== docId
    );
    mockStorage.setCollection(collectionName, filtered);
  },

  resetAllData(): void {
    mockStorage.clearAll();
  },

  subscribeCollection<T>(
    collectionName: string,
    callback: (items: T[]) => void
  ): Unsubscribe {
    if (isFirebaseConfigured) {
      if (!firestore) {
        console.error(`Firestore uninitialized for subscription on ${collectionName}`);
        return () => {};
      }
      return onSnapshot(
        collection(firestore, collectionName),
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as T));
          callback(items);
        },
        (error) => {
          console.error(`Firestore subscription error on ${collectionName}:`, error);
        }
      );
    }
    return mockStorage.subscribeCollection<T>(collectionName, callback);
  },

  subscribeDocument<T>(
    collectionName: string,
    docId: string,
    callback: (item: T | null) => void
  ): Unsubscribe {
    if (isFirebaseConfigured) {
      if (!firestore) {
        console.error(`Firestore uninitialized for subscription on ${collectionName}/${docId}`);
        return () => {};
      }
      return onSnapshot(
        doc(firestore, collectionName, docId) as any,
        (snap: any) => {
          callback(snap.exists() ? ({ ...snap.data(), id: snap.id } as T) : null);
        },
        (error) => {
          console.error(`Firestore document subscription error on ${collectionName}/${docId}:`, error);
        }
      );
    }
    return mockStorage.subscribeDocument<T>(collectionName, docId, callback);
  },

  async getRTDB<T>(path: string): Promise<T | null> {
    if (isFirebaseConfigured) {
      if (!realtimeDb) {
        throw new Error(`Firebase is configured but Realtime Database is uninitialized for path ${path}.`);
      }
      try {
        const snap = await get(ref(realtimeDb, path));
        return snap.exists() ? (snap.val() as T) : null;
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] RTDB get failed for ${path}:`, err);
        throw new Error(`Realtime Database read failure for ${path}: ${err.message}`);
      }
    }
    return mockStorage.getRTDB<T>(path);
  },

  async setRTDB<T>(path: string, data: T): Promise<void> {
    if (isFirebaseConfigured) {
      if (!realtimeDb) {
        throw new Error(`Firebase is configured but Realtime Database is uninitialized for path ${path}.`);
      }
      try {
        await set(ref(realtimeDb, path), data);
        return;
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] RTDB set failed for ${path}:`, err);
        throw new Error(`Realtime Database write failure for ${path}: ${err.message}`);
      }
    }
    mockStorage.setRTDB(path, data);
  },

  async updateRTDB<T extends Record<string, any>>(path: string, updates: Partial<T>): Promise<void> {
    if (isFirebaseConfigured) {
      if (!realtimeDb) {
        throw new Error(`Firebase is configured but Realtime Database is uninitialized for path ${path}.`);
      }
      try {
        await update(ref(realtimeDb, path), updates);
        return;
      } catch (err: any) {
        console.error(`[Firebase Cloud Error] RTDB update failed for ${path}:`, err);
        throw new Error(`Realtime Database update failure for ${path}: ${err.message}`);
      }
    }
    mockStorage.updateRTDB(path, updates);
  },

  subscribeRTDB<T>(path: string, callback: (data: T | null) => void): () => void {
    if (isFirebaseConfigured) {
      if (!realtimeDb) {
        console.error(`Realtime Database uninitialized for subscription on ${path}`);
        return () => {};
      }
      const dbRef = ref(realtimeDb, path);
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          callback(snapshot.val());
        },
        (error) => {
          console.error(`RTDB subscription error on ${path}:`, error);
        }
      );
      return () => unsubscribe();
    }
    return mockStorage.subscribeRTDB<T>(path, callback);
  },

  async updateBedStatus(
    hospitalId: string,
    bedId: string,
    status: 'available' | 'occupied' | 'maintenance',
    patientName?: string,
    currentAdmissionId?: string
  ): Promise<void> {
    const updates: Record<string, any> = {
      status,
      patientName: status === 'available' ? '' : patientName || '',
      currentAdmissionId: status === 'available' ? '' : currentAdmissionId || '',
    };
    await this.updateDocument('ipd_beds', bedId, updates, 'bedId');

    const rtdbPath = `liveBeds/${hospitalId}/${bedId}`;
    await this.updateRTDB(rtdbPath, {
      status,
      lastUpdated: new Date().toISOString(),
    });

    const allBeds = await this.getCollection<any>('ipd_beds');
    const hospBeds = allBeds.filter((b: any) => b.hospitalId === hospitalId);
    const updatedBeds = hospBeds.map((b: any) => (b.bedId === bedId ? { ...b, status } : b));

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
