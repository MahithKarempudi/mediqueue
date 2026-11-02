const memoryStore = new Map<string, string>();

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return memoryStore.get(key) || null;
      }
    }
    return memoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Fallback
      }
    }
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fallback
      }
    }
    memoryStore.delete(key);
  },
  getKeys: (): string[] => {
    if (typeof localStorage !== 'undefined') {
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) keys.push(k);
        }
        return keys;
      } catch {
        return Array.from(memoryStore.keys());
      }
    }
    return Array.from(memoryStore.keys());
  }
};

type ListenerCallback<T> = (data: T) => void;

class MockStorageEngine {
  private channel: BroadcastChannel | null = null;
  private collectionListeners: Map<string, Set<ListenerCallback<any>>> = new Map();
  private docListeners: Map<string, Set<ListenerCallback<any>>> = new Map();
  private rtdbListeners: Map<string, Set<ListenerCallback<any>>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('mediqueue_live_bus');
      this.channel.onmessage = (event) => {
        const { type, target, data } = event.data;
        if (type === 'COLLECTION_CHANGED') {
          this.notifyCollection(target);
        } else if (type === 'DOC_CHANGED') {
          this.notifyDoc(target, data);
          const colName = target.split('/')[0];
          this.notifyCollection(colName);
        } else if (type === 'RTDB_CHANGED') {
          this.notifyRTDB(target, data);
        }
      };
    }
  }

  private broadcast(payload: { type: string; target: string; data?: any }) {
    if (this.channel) {
      this.channel.postMessage(payload);
    }
  }

  // --- Firestore Emulation ---

  private getCollectionKey(col: string) {
    return `mq_col_${col}`;
  }

  public getCollection<T>(col: string): T[] {
    try {
      const raw = safeStorage.getItem(this.getCollectionKey(col));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public setCollection<T>(col: string, items: T[]) {
    safeStorage.setItem(this.getCollectionKey(col), JSON.stringify(items));
    this.notifyCollection(col);
    this.broadcast({ type: 'COLLECTION_CHANGED', target: col });
  }

  private matchesDoc(item: any, docId: string, idKey?: string): boolean {
    if (!item) return false;
    if (idKey && item[idKey] === docId) return true;
    return (
      item.id === docId ||
      item.appointmentId === docId ||
      item.uid === docId ||
      item.patientId === docId ||
      item.hospitalId === docId ||
      item.bedId === docId ||
      item.departmentId === docId ||
      item.staffId === docId ||
      item.visitId === docId ||
      item.orderId === docId ||
      item.reportId === docId ||
      item.billId === docId
    );
  }

  public getDocument<T>(col: string, docId: string, idKey?: string): T | null {
    const items = this.getCollection<any>(col);
    return items.find(item => this.matchesDoc(item, docId, idKey)) || null;
  }

  public setDocument<T extends Record<string, any>>(col: string, docId: string, data: T, idKey?: string): T {
    const items = this.getCollection<any>(col);
    const index = items.findIndex(item => this.matchesDoc(item, docId, idKey));

    const docToSave = { ...data, id: (data as any).id || docId };
    if (index >= 0) {
      items[index] = { ...items[index], ...docToSave };
    } else {
      items.push(docToSave);
    }
    this.setCollection(col, items);
    this.notifyDoc(`${col}/${docId}`, docToSave);
    this.broadcast({ type: 'DOC_CHANGED', target: `${col}/${docId}`, data: docToSave });
    return docToSave;
  }

  public updateDocument<T extends Record<string, any>>(col: string, docId: string, updates: Partial<T>, idKey?: string): T | null {
    const items = this.getCollection<any>(col);
    const index = items.findIndex(item => this.matchesDoc(item, docId, idKey));

    if (index === -1) return null;
    const updated = { ...items[index], ...updates };
    items[index] = updated;
    this.setCollection(col, items);
    this.notifyDoc(`${col}/${docId}`, updated);
    this.broadcast({ type: 'DOC_CHANGED', target: `${col}/${docId}`, data: updated });
    return updated;
  }

  public subscribeCollection<T>(col: string, callback: ListenerCallback<T[]>): () => void {
    if (!this.collectionListeners.has(col)) {
      this.collectionListeners.set(col, new Set());
    }
    this.collectionListeners.get(col)!.add(callback);
    callback(this.getCollection<T>(col));

    return () => {
      this.collectionListeners.get(col)?.delete(callback);
    };
  }

  public subscribeDocument<T>(col: string, docId: string, callback: ListenerCallback<T | null>): () => void {
    const key = `${col}/${docId}`;
    if (!this.docListeners.has(key)) {
      this.docListeners.set(key, new Set());
    }
    this.docListeners.get(key)!.add(callback);
    callback(this.getDocument<T>(col, docId));

    return () => {
      this.docListeners.get(key)?.delete(callback);
    };
  }

  private notifyCollection(col: string) {
    const listeners = this.collectionListeners.get(col);
    if (listeners) {
      const data = this.getCollection(col);
      listeners.forEach(cb => cb(data));
    }
  }

  private notifyDoc(key: string, data: any) {
    const listeners = this.docListeners.get(key);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }

  // --- Realtime Database (RTDB) Emulation ---

  private getRTDBKey(path: string) {
    return `mq_rtdb_${path.replace(/\//g, '_')}`;
  }

  public getRTDB<T>(path: string): T | null {
    try {
      const raw = safeStorage.getItem(this.getRTDBKey(path));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setRTDB<T>(path: string, value: T) {
    safeStorage.setItem(this.getRTDBKey(path), JSON.stringify(value));
    this.notifyRTDB(path, value);
    this.broadcast({ type: 'RTDB_CHANGED', target: path, data: value });
  }

  public updateRTDB<T extends Record<string, any>>(path: string, partial: Partial<T>) {
    const current = this.getRTDB<T>(path) || ({} as T);
    const merged = { ...current, ...partial };
    this.setRTDB(path, merged);
  }

  public subscribeRTDB<T>(path: string, callback: ListenerCallback<T | null>): () => void {
    if (!this.rtdbListeners.has(path)) {
      this.rtdbListeners.set(path, new Set());
    }
    this.rtdbListeners.get(path)!.add(callback);
    callback(this.getRTDB<T>(path));

    return () => {
      this.rtdbListeners.get(path)?.delete(callback);
    };
  }

  private notifyRTDB(path: string, data: any) {
    // Notify exact path
    const exactListeners = this.rtdbListeners.get(path);
    if (exactListeners) {
      exactListeners.forEach(cb => cb(data));
    }

    // Also check prefix listeners (e.g. liveBeds/hosp1 listening when liveBeds/hosp1/bed1 changed)
    this.rtdbListeners.forEach((listeners, registeredPath) => {
      if (path.startsWith(registeredPath) && path !== registeredPath) {
        listeners.forEach(cb => cb(this.getRTDB(registeredPath)));
      }
    });
  }

  // Clear or reset local mock store
  public clearAll() {
    const keys = safeStorage.getKeys();
    const keysToRemove = keys.filter(k => k.startsWith('mq_col_') || k.startsWith('mq_rtdb_'));
    keysToRemove.forEach(k => safeStorage.removeItem(k));
  }
}

export const mockStorage = new MockStorageEngine();
