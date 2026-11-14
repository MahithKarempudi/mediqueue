import { createContext, useContext } from 'react';
import type { User, UserRole } from '@/types';

export type AuthMode = 'cloud_identity' | 'role_persona';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  authMode: AuthMode;
  sessionExpiresAt: string | null;
  isSessionExpired: boolean;
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
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    bloodGroup?: string;
    dob?: string;
    address?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  reseedData: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccessHospital: (hospitalId?: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
