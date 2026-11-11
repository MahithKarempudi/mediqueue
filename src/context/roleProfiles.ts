import type { User, UserRole, Patient } from '@/types';

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
      createdAt: '2025-01-15T09:00:00.000Z',
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
      createdAt: '2025-01-15T09:00:00.000Z',
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
      createdAt: '2025-01-15T09:00:00.000Z',
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
      createdAt: '2025-01-15T09:00:00.000Z',
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
      createdAt: '2025-01-15T09:00:00.000Z',
    },
    label: 'Super Admin',
    tagline: 'System-wide infrastructure configuration, hospital onboarding, global audit logs',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
};
