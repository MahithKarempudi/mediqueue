import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, Patient } from '@/types';
import { dbService } from '@/services/db';

export interface DemoPersona {
  user: User;
  patientData?: Partial<Patient>;
  label: string;
  tagline: string;
  badgeColor: string;
}

export const DEMO_PERSONAS: Record<UserRole, DemoPersona> = {
  patient: {
    user: {
      uid: 'demo_user_patient_01',
      name: 'Priya Sharma',
      email: 'patient@mediqueue.demo',
      role: 'patient',
      patientId: 'pat_demo_01',
      phone: '+91 98201 12345',
      createdAt: new Date().toISOString(),
    },
    patientData: {
      patientId: 'pat_demo_01',
      userId: 'demo_user_patient_01',
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
      uid: 'demo_user_staff_01',
      name: 'Dr. Rajesh Kumar',
      email: 'staff@mediqueue.demo',
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
      uid: 'demo_user_admin_01',
      name: 'Sunita Rao',
      email: 'admin@mediqueue.demo',
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
      uid: 'demo_user_officer_01',
      name: 'Vikramaditya Sen',
      email: 'officer@mediqueue.demo',
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
      uid: 'demo_user_superadmin_01',
      name: 'Dev Anand',
      email: 'superadmin@mediqueue.demo',
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
  login: (email: string, password?: string) => Promise<boolean>;
  loginAsPersona: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
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
        // Auto-seed initial synthetic dataset if not already populated
        const { seedDatabase } = await import('@/services/seed');
        await seedDatabase(false);

        // Restore saved session if any
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          const defaultPersona = DEMO_PERSONAS.patient.user;
          setUser(defaultPersona);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultPersona));
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

  const loginAsPersona = async (role: UserRole) => {
    setLoading(true);
    const persona = DEMO_PERSONAS[role];
    if (persona) {
      setUser(persona.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persona.user));
      
      // Save user to users collection in db
      await dbService.setDocument('users', persona.user.uid, persona.user);

      // If patient, also save to patients collection
      if (persona.patientData) {
        await dbService.setDocument('patients', persona.patientData.patientId!, {
          ...persona.patientData,
          userId: persona.user.uid,
        });
      }
    }
    setLoading(false);
  };

  const login = async (email: string): Promise<boolean> => {
    setLoading(true);
    // Find matching persona or match in user collection
    const matchedPersona = Object.values(DEMO_PERSONAS).find(p => p.user.email.toLowerCase() === email.toLowerCase());
    if (matchedPersona) {
      setUser(matchedPersona.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matchedPersona.user));
      setLoading(false);
      return true;
    }

    // Check registered users in storage
    const users = await dbService.getCollection<User>('users');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      setUser(existing);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(existing));
      setLoading(false);
      return true;
    }

    setLoading(false);
    return false;
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
    };

    await dbService.setDocument('users', uid, newUser);
    await dbService.setDocument('patients', patientId, newPatient);

    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    setLoading(false);
    return newUser;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
        login,
        loginAsPersona,
        logout,
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
