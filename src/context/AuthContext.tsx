import React, { useState, useEffect } from 'react';
import type { User, UserRole, Patient } from '@/types';
import { dbService } from '@/services/db';
import { isFirebaseConfigured, auth as firebaseAuth } from '@/services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ROLE_PROFILES, type RoleProfile } from './roleProfiles';
import { AuthContext, useAuth, type AuthMode } from './useAuth';
import { seedDatabase } from '@/services/seed';

export { ROLE_PROFILES, type RoleProfile, useAuth, type AuthMode };

const AUTH_STORAGE_KEY = 'mediqueue_current_session_user';
const AUTH_MODE_KEY = 'mediqueue_session_auth_mode';
const AUTH_EXPIRY_KEY = 'mediqueue_session_expires_at';
const EXPLICIT_LOGOUT_KEY = 'mediqueue_explicit_logout';
const LOCAL_CREDENTIALS_KEY = 'mediqueue_local_credentials';

const getLocalCredentials = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(LOCAL_CREDENTIALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalCredential = (email: string, pass: string) => {
  try {
    const creds = getLocalCredentials();
    creds[email.toLowerCase().trim()] = pass;
    localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (e) {
    console.warn('Failed to save local credential:', e);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<AuthMode>('role_persona');
  const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    const initAuthAndData = async () => {
      try {
        // Auto-seed initial dataset if not already populated
        await seedDatabase(false);

        // Check for Firebase Auth listener if Firebase is configured
        if (isFirebaseConfigured && firebaseAuth) {
          onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            if (firebaseUser) {
              const idTokenResult = await firebaseUser.getIdTokenResult();
              const serverClaimRole = idTokenResult.claims.role as UserRole | undefined;
              const serverClaimHospital = idTokenResult.claims.hospitalId as string | undefined;

              const cloudUsers = await dbService.getCollection<User>('users');
              const matched = cloudUsers.find((u) => u.uid === firebaseUser.uid || u.email === firebaseUser.email);
              
              const resolvedUser: User = matched
                ? {
                    ...matched,
                    role: serverClaimRole || matched.role,
                    hospitalId: serverClaimHospital || matched.hospitalId,
                  }
                : {
                    uid: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
                    email: firebaseUser.email || '',
                    role: serverClaimRole || 'patient',
                    hospitalId: serverClaimHospital,
                    createdAt: new Date().toISOString(),
                  };

              setUser(resolvedUser);
              setAuthMode('cloud_identity');
              setIsSessionExpired(false);
              const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
              setSessionExpiresAt(exp);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(resolvedUser));
              localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
              localStorage.setItem(AUTH_EXPIRY_KEY, exp);
              setLoading(false);
              return;
            }
          });
        }

        // Restore saved session if any
        const explicitLogout = localStorage.getItem(EXPLICIT_LOGOUT_KEY);
        const saved = localStorage.getItem(AUTH_STORAGE_KEY);
        const savedMode = (localStorage.getItem(AUTH_MODE_KEY) as AuthMode) || 'role_persona';
        const savedExp = localStorage.getItem(AUTH_EXPIRY_KEY);

        // Check session expiration
        if (savedExp && new Date(savedExp).getTime() < Date.now()) {
          console.warn('Session expired, clearing authenticated state.');
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_EXPIRY_KEY);
          setIsSessionExpired(true);
          setUser(null);
          setLoading(false);
          return;
        } else if (savedExp) {
          setSessionExpiresAt(savedExp);
          setIsSessionExpired(false);
        }

        if (explicitLogout === 'true') {
          setUser(null);
          setLoading(false);
          return;
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
    await seedDatabase(true);
    setLoading(false);
  };

  const switchRole = async (role: UserRole) => {
    setLoading(true);
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    const profile = ROLE_PROFILES[role];
    if (profile) {
      setUser(profile.user);
      setAuthMode('role_persona');
      setIsSessionExpired(false);
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
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !pass) {
      setLoading(false);
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    try {
      if (isFirebaseConfigured && firebaseAuth) {
        try {
          const userCred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
          const idTokenResult = await userCred.user.getIdTokenResult();
          const serverRole = idTokenResult.claims.role as UserRole | undefined;
          const serverHospital = idTokenResult.claims.hospitalId as string | undefined;

          const cloudUsers = await dbService.getCollection<User>('users');
          const matched = cloudUsers.find((u) => u.uid === userCred.user.uid || u.email.toLowerCase() === cleanEmail);
          if (matched) {
            const authUser: User = {
              ...matched,
              role: serverRole || matched.role,
              hospitalId: serverHospital || matched.hospitalId,
            };
            setUser(authUser);
            setAuthMode('cloud_identity');
            setIsSessionExpired(false);
            const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
            setSessionExpiresAt(exp);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
            localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
            localStorage.setItem(AUTH_EXPIRY_KEY, exp);
            setLoading(false);
            return { success: true };
          }
        } catch (fbErr: any) {
          console.warn('Firebase sign-in info (checking local credentials):', fbErr.message);
        }
      }

      // Check registered users in persistence engine
      const allUsers = await dbService.getCollection<User>('users');
      const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      const localCreds = getLocalCredentials();
      const expectedPass = localCreds[cleanEmail];

      if (found) {
        if (expectedPass && expectedPass !== pass) {
          setLoading(false);
          return { success: false, error: 'Incorrect password. Please verify your credentials and try again.' };
        }

        setUser(found);
        setAuthMode('cloud_identity');
        setIsSessionExpired(false);
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
        if (r.user.email.toLowerCase() === cleanEmail) {
          if (expectedPass && expectedPass !== pass) {
            setLoading(false);
            return { success: false, error: 'Incorrect password. Please verify your credentials and try again.' };
          }

          setUser(r.user);
          setAuthMode('cloud_identity');
          setIsSessionExpired(false);
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
      return { success: false, error: 'No account found with this email. Please register as a new user or check your spelling.' };
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
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    bloodGroup?: string;
    dob?: string;
    address?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    const cleanEmail = details.email.toLowerCase().trim();

    if (!details.name || details.name.trim().length < 2) {
      setLoading(false);
      return { success: false, error: 'Please enter your full name (at least 2 characters).' };
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLoading(false);
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!details.pass || details.pass.length < 6) {
      setLoading(false);
      return { success: false, error: 'Password must be at least 6 characters in length.' };
    }

    try {
      const existingUsers = await dbService.getCollection<User>('users');
      if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        setLoading(false);
        return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
      }

      let uid = `user_${Date.now()}`;

      if (isFirebaseConfigured && firebaseAuth) {
        try {
          const userCred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, details.pass);
          uid = userCred.user.uid;
        } catch (fbErr: any) {
          console.warn('Firebase createUser warning (continuing with local registration):', fbErr.message);
        }
      }

      const patientId = details.role === 'patient' ? `pat_${Date.now().toString().slice(-4)}` : undefined;

      const newUser: User = {
        uid,
        role: details.role,
        name: details.name.trim(),
        email: cleanEmail,
        phone: details.phone || '',
        hospitalId: details.role === 'patient' ? undefined : details.hospitalId,
        patientId,
        createdAt: new Date().toISOString(),
      };

      await dbService.setDocument('users', uid, newUser);

      if (details.role === 'patient' && patientId) {
        const newPatient: Patient = {
          patientId,
          userId: uid,
          name: details.name.trim(),
          dob: details.dob || '1995-01-01',
          gender: details.gender || 'other',
          phone: details.phone || '',
          address: details.address || '',
          bloodGroup: details.bloodGroup || 'O+',
          createdAt: new Date().toISOString(),
        };
        await dbService.setDocument('patients', patientId, newPatient);
      }

      saveLocalCredential(cleanEmail, details.pass);

      setUser(newUser);
      setAuthMode('cloud_identity');
      setIsSessionExpired(false);
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
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_MODE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    
    // Truly clear user session for authenticated logout
    setUser(null);
    setIsSessionExpired(false);
    setSessionExpiresAt(null);
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
    setIsSessionExpired(false);
    const exp = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    setSessionExpiresAt(exp);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(AUTH_MODE_KEY, 'cloud_identity');
    localStorage.setItem(AUTH_EXPIRY_KEY, exp);
    setLoading(false);
    return newUser;
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
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
        isSessionExpired,
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
