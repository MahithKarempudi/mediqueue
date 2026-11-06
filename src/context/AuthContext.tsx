import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Patient } from '@/types';
import { dbService } from '@/services/db';
import { isFirebaseConfigured, auth as firebaseAuth } from '@/services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

export interface RoleProfile {
  user: User;
  patientData?: Partial<Patient>;
  label: string;
  tagline: string;
  badgeColor: string;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
  patient: {
    user: {
      uid: 'usr_patient_01',
      name: 'Priya Sharma',
      email: 'priya.sharma@mediqueue.org',
      role: 'patient',
      patientId: 'pat_001',
      phone: '+91 98201 12345',
      createdAt: new Date().toISOString(),
    },
    patientData: {
      patientId: 'pat_001',
      userId: 'usr_patient_01',
      name: 'Priya Sharma',
      dob: '1992-04-14',
      gender: 'female',
      phone: '+91 98201 12345',
      address: 'Flat 402, Lotus Enclave, Sector 14, New Delhi',
      bloodGroup: 'B+',
    },
    label: 'Patient',
    tagline: 'Book OPD, track live token queue, check bed availability, view records & bills',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  staff: {
    user: {
      uid: 'usr_staff_01',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@mediqueue.org',
      role: 'staff',
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      phone: '+91 98111 22334',
      createdAt: new Date().toISOString(),
    },
    label: 'Hospital Staff (Doctor)',
    tagline: 'Call OPD tokens, write prescriptions, order labs, update live bed statuses',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  hospital_admin: {
    user: {
      uid: 'usr_admin_01',
      name: 'Sunita Rao',
      email: 'sunita.rao@mediqueue.org',
      role: 'hospital_admin',
      hospitalId: 'hosp_metro_01',
      phone: '+91 98333 44556',
      createdAt: new Date().toISOString(),
    },
    label: 'Hospital Admin',
    tagline: 'Manage hospital beds, department staffing, real-time census & revenue analytics',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  government_officer: {
    user: {
      uid: 'usr_officer_01',
      name: 'Vikramaditya Sen',
      email: 'vikramaditya.sen@mediqueue.org',
      role: 'government_officer',
      phone: '+91 98555 66778',
      createdAt: new Date().toISOString(),
    },
    label: 'Government Officer',
    tagline: 'District-wide hospital surveillance, bed surge indicators, aggregate epidemiology',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  super_admin: {
    user: {
      uid: 'usr_superadmin_01',
      name: 'Dev Anand',
      email: 'dev.anand@mediqueue.org',
      role: 'super_admin',
      phone: '+91 98777 88990',
      createdAt: new Date().toISOString(),
    },
    label: 'Super Admin',
    tagline: 'System-wide infrastructure configuration, hospital onboarding, global audit logs',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
};

export type AuthMode = 'cloud_identity' | 'role_persona';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authMode: AuthMode;
  sessionExpiresAt: string | null;
  switchRole: (role: UserRole) => Promise<void>;
  registerPatient: (details: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    gender: 'male' | 'female' | 'other';
    bloodGroup: string;
    address: string;
  }) => Promise<User>;
  loginWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerAccount: (details: {
    name: string;
    email: string;
    pass: string;
    role: UserRole;
    hospitalId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  reseedData: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessHospital: (hospitalId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'mediqueue_current_session_user';
const AUTH_MODE_KEY = 'mediqueue_session_auth_mode';
const AUTH_EXPIRY_KEY = 'mediqueue_session_expires_at';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<AuthMode>('role_persona');
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    const initAuthAndData = async () => {
      try {
        // Auto-seed initial dataset if not already populated
        const { seedDatabase } = await import('@/services/seed');
        await seedDatabase(false);

        // Check for Firebase Auth listener if Firebase is configured
        if (isFirebaseConfigured && firebaseAuth) {
          onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            if (firebaseUser) {
              const cloudUsers = await dbService.getCollection<User>('users');
              const matched = cloudUsers.find((u) => u.uid === firebaseUser.uid || u.email === firebaseUser.email);
              if (matched) {
                setUser(matched);
                setAuthMode('cloud_identity');
                const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
                setSessionExpiresAt(exp);
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
                localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
                localStorage.setItem(AUTH_EXPIRY_KEY, exp);
                setLoading(false);
                return;
              }
            }
          });
        }

        // Restore saved session if any
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        const savedMode = (localStorage.getItem(AUTH_MODE_KEY) as AuthMode) || 'role_persona';
        const savedExp = localStorage.getItem(AUTH_EXPIRY_KEY);

        // Check session expiration
        if (savedExp && new Date(savedExp).getTime() < Date.now()) {
          console.warn('Session expired, refreshing workspace session.');
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_EXPIRY_KEY);
        } else if (savedExp) {
          setSessionExpiresAt(savedExp);
        }

        if (saved) {
          const parsed: User = JSON.parse(saved);
          const roleProfile = ROLE_PROFILES[parsed.role] || ROLE_PROFILES.patient;
          if (!parsed.uid?.startsWith('usr_') && !parsed.uid?.startsWith('user_')) {
            setUser(roleProfile.user);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(roleProfile.user));
          } else {
            setUser(parsed);
          }
          setAuthMode(savedMode);
        } else {
          const defaultProfile = ROLE_PROFILES.patient.user;
          setUser(defaultProfile);
          setAuthMode('role_persona');
          const exp = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
          setSessionExpiresAt(exp);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultProfile));
          localStorage.setItem(AUTH_MODE_KEY, 'role_persona');
          localStorage.setItem(AUTH_EXPIRY_KEY, exp);
        }
      } catch (e) {
        console.error('Failed to load session or seed:', e);
      } finally {
        setLoading(false);
      }
    };

    initAuthAndData();
  }, []);

  const reseedData = async () => {
    setLoading(true);
    const { seedDatabase } = await import('@/services/seed');
    await seedDatabase(true);
    setLoading(false);
  };

  const switchRole = async (role: UserRole) => {
    setLoading(true);
    const profile = ROLE_PROFILES[role];
    if (profile) {
      setUser(profile.user);
      setAuthMode('role_persona');
      const exp = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
      setSessionExpiresAt(exp);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile.user));
      localStorage.setItem(AUTH_MODE_KEY, 'role_persona');
      localStorage.setItem(AUTH_EXPIRY_KEY, exp);

      // Save user to users collection in db
      await dbService.setDocument('users', profile.user.uid, profile.user);

      // If patient, also save to patients collection
      if (profile.patientData) {
        await dbService.setDocument('patients', profile.patientData.patientId!, {
          ...profile.patientData,
          userId: profile.user.uid,
        });
      }
    }
    setLoading(false);
  };

  const loginWithEmailPassword = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && firebaseAuth) {
        const userCred = await signInWithEmailAndPassword(firebaseAuth, email, pass);
        const cloudUsers = await dbService.getCollection<User>('users');
        const matched = cloudUsers.find((u) => u.uid === userCred.user.uid || u.email === email);
        if (matched) {
          setUser(matched);
          setAuthMode('cloud_identity');
          const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
          setSessionExpiresAt(exp);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
          localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
          localStorage.setItem(AUTH_EXPIRY_KEY, exp);
          setLoading(false);
          return { success: true };
        }
      }

      // Check registered users in persistence engine
      const allUsers = await dbService.getCollection<User>('users');
      const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (found) {
        setUser(found);
        setAuthMode('cloud_identity');
        const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
        setSessionExpiresAt(exp);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
        localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
        localStorage.setItem(AUTH_EXPIRY_KEY, exp);
        setLoading(false);
        return { success: true };
      }

      // If matching predefined role email
      for (const r of Object.values(ROLE_PROFILES)) {
        if (r.user.email.toLowerCase() === email.toLowerCase()) {
          setUser(r.user);
          setAuthMode('cloud_identity');
          const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
          setSessionExpiresAt(exp);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(r.user));
          localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
          localStorage.setItem(AUTH_EXPIRY_KEY, exp);
          setLoading(false);
          return { success: true };
        }
      }

      setLoading(false);
      return { success: false, error: 'Invalid credentials. User not found in institutional directory.' };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Authentication failed.' };
    }
  };

  const registerAccount = async (details: {
    name: string;
    email: string;
    pass: string;
    role: UserRole;
    hospitalId?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      let uid = `user_${Date.now()}`;

      if (isFirebaseConfigured && firebaseAuth) {
        const userCred = await createUserWithEmailAndPassword(firebaseAuth, details.email, details.pass);
        uid = userCred.user.uid;
      }

      const newUser: User = {
        uid,
        role: details.role,
        name: details.name,
        email: details.email,
        hospitalId: details.hospitalId,
        patientId: details.role === 'patient' ? `pat_${Date.now().toString().slice(-4)}` : undefined,
        createdAt: new Date().toISOString(),
      };

      await dbService.setDocument('users', uid, newUser);
      setUser(newUser);
      setAuthMode('cloud_identity');
      const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
      setSessionExpiresAt(exp);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
      localStorage.setItem(AUTH_EXPIRY_KEY, exp);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Account registration failed.' };
    }
  };

  const logout = async () => {
    setLoading(true);
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        await signOut(firebaseAuth);
      } catch (e) {
        console.warn('Firebase signout warning:', e);
      }
    }
    const defaultProfile = ROLE_PROFILES.patient.user;
    setUser(defaultProfile);
    setAuthMode('role_persona');
    const exp = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
    setSessionExpiresAt(exp);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultProfile));
    localStorage.setItem(AUTH_MODE_KEY, 'role_persona');
    localStorage.setItem(AUTH_EXPIRY_KEY, exp);
    setLoading(false);
  };

  const registerPatient = async (details: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    gender: 'male' | 'female' | 'other';
    bloodGroup: string;
    address: string;
  }): Promise<User> => {
    setLoading(true);
    const uid = `user_${Date.now()}`;
    const patientId = `pat_${Date.now()}`;

    const newUser: User = {
      uid,
      role: 'patient',
      name: details.name,
      email: details.email,
      phone: details.phone,
      patientId,
      createdAt: new Date().toISOString(),
    };

    const newPatient: Patient = {
      patientId,
      userId: uid,
      name: details.name,
      dob: details.dob,
      gender: details.gender,
      phone: details.phone,
      address: details.address,
      bloodGroup: details.bloodGroup,
      createdAt: new Date().toISOString(),
    };

    await dbService.setDocument('users', uid, newUser);
    await dbService.setDocument('patients', patientId, newPatient);

    setUser(newUser);
    setAuthMode('cloud_identity');
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setLoading(false);
    return newUser;
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const canAccessHospital = (hospitalId?: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'government_officer') return true;
    if (!hospitalId) return true;
    return user.hospitalId === hospitalId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authMode,
        sessionExpiresAt,
        switchRole,
        registerPatient,
        loginWithEmailPassword,
        registerAccount,
        logout,
        reseedData,
        hasRole,
        canAccessHospital,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
