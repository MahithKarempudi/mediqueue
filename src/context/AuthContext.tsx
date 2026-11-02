import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Patient } from '@/types';
import { dbService } from '@/services/db';

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

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  reseedData: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessHospital: (hospitalId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'mediqueue_current_session_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuthAndData = async () => {
      try {
        // Auto-seed initial dataset if not already populated
        const { seedDatabase } = await import('@/services/seed');
        await seedDatabase(false);

        // Restore saved session if any, migrating legacy session keys if needed
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          const parsed: User = JSON.parse(saved);
          const roleProfile = ROLE_PROFILES[parsed.role] || ROLE_PROFILES.patient;
          if (!parsed.uid?.startsWith('usr_') && !parsed.uid?.startsWith('user_')) {
            setUser(roleProfile.user);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(roleProfile.user));
          } else {
            setUser(parsed);
          }
        } else {
          const defaultProfile = ROLE_PROFILES.patient.user;
          setUser(defaultProfile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultProfile));
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
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile.user));

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
        switchRole,
        registerPatient,
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
