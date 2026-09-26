import { dbService } from '../db';
import {
  SEED_HOSPITALS,
  SEED_DEPARTMENTS,
  SEED_STAFF,
  SEED_PATIENTS,
  generateSeedBeds,
  generateHistoricalOpdVisits,
  generateSeedAdmissionsAndBills,
} from './seedData';
import type { IpdBed, LiveBed, EmergencyCapacity, HospitalStatus, User } from '@/types';
import { DEMO_PERSONAS } from '@/context/AuthContext';

export const seedDatabase = async (force: boolean = false): Promise<{ success: boolean; message: string }> => {
  try {
    const existingHospitals = await dbService.getCollection('hospitals');
    if (existingHospitals.length > 0 && !force) {
      return { success: true, message: 'Database already populated with seed data.' };
    }

    console.log('Seeding MediQueue synthetic datasets...');

    // 1. Seed Users (Demo Personas & Staff)
    for (const roleKey of Object.keys(DEMO_PERSONAS)) {
      const persona = (DEMO_PERSONAS as any)[roleKey];
      await dbService.setDocument('users', persona.user.uid, persona.user);
    }
    for (const staff of SEED_STAFF) {
      const staffUser: User = {
        uid: staff.userId,
        name: staff.name || 'Hospital Physician',
        email: staff.email || `${staff.staffId}@mediqueue.demo`,
        role: 'staff',
        hospitalId: staff.hospitalId,
        departmentId: staff.departmentId,
        createdAt: new Date().toISOString(),
      };
      await dbService.setDocument('users', staff.userId, staffUser);
    }

    // 2. Seed Hospitals
    for (const hosp of SEED_HOSPITALS) {
      await dbService.setDocument('hospitals', hosp.hospitalId, hosp);
    }

    // 3. Seed Departments
    for (const dept of SEED_DEPARTMENTS) {
      await dbService.setDocument('departments', dept.departmentId, dept);
    }

    // 4. Seed Staff
    for (const staff of SEED_STAFF) {
      await dbService.setDocument('staff', staff.staffId, staff);
    }

    // 5. Seed Patients
    for (const pat of SEED_PATIENTS) {
      await dbService.setDocument('patients', pat.patientId, pat);
    }

    // 6. Seed Beds (Firestore) & Mirror to RTDB
    const beds = generateSeedBeds();
    for (const bed of beds) {
      await dbService.setDocument('ipd_beds', bed.bedId, bed);

      // Mirror to RTDB liveBeds
      const liveBedData: LiveBed = {
        bedId: bed.bedId,
        status: bed.status,
        wardId: bed.wardId,
        type: bed.type,
        lastUpdated: new Date().toISOString(),
        bedNumber: bed.bedNumber,
      };
      await dbService.setRTDB(`liveBeds/${bed.hospitalId}/${bed.bedId}`, liveBedData);
    }

    // 7. Calculate and set initial RTDB Emergency Capacity & Hospital Status per hospital
    for (const hosp of SEED_HOSPITALS) {
      const hospBeds = beds.filter(b => b.hospitalId === hosp.hospitalId);
      const icuFree = hospBeds.filter(b => b.type === 'ICU' && b.status === 'available').length;
      const genFree = hospBeds.filter(b => b.type === 'general' && b.status === 'available').length;
      const totalOccupied = hospBeds.filter(b => b.status === 'occupied').length;
      const occupancyRatio = hospBeds.length > 0 ? totalOccupied / hospBeds.length : 0;

      let emergencyStatus: 'Normal' | 'Surge' | 'Critical' | 'Diverting' = 'Normal';
      if (!hosp.emergencyAvailable) {
        emergencyStatus = 'Diverting';
      } else if (occupancyRatio >= 0.85) {
        emergencyStatus = 'Surge';
      } else if (icuFree <= 1) {
        emergencyStatus = 'Critical';
      }

      const emergencyCap: EmergencyCapacity = {
        icuBedsFree: icuFree,
        generalBedsFree: genFree,
        emergencyStatus,
        lastUpdated: new Date().toISOString(),
      };
      await dbService.setRTDB(`emergencyCapacity/${hosp.hospitalId}`, emergencyCap);

      const status: HospitalStatus = {
        operational: true,
        emergencyOpen: hosp.emergencyAvailable ?? true,
        surgeAlert: occupancyRatio >= 0.85,
      };
      await dbService.setRTDB(`hospitalStatus/${hosp.hospitalId}`, status);
    }

    // 8. Seed Historical OPD Visits
    const opdVisits = generateHistoricalOpdVisits();
    for (const visit of opdVisits) {
      await dbService.setDocument('opd_visits', visit.visitId, visit);
    }

    // 9. Seed Admissions & Bills
    const { admissions, bills } = generateSeedAdmissionsAndBills();
    for (const adm of admissions) {
      await dbService.setDocument('ipd_admissions', adm.admissionId, adm);
    }
    for (const bill of bills) {
      await dbService.setDocument('billing', bill.billId, bill);
    }

    console.log(`Successfully seeded ${SEED_HOSPITALS.length} hospitals, ${beds.length} beds, ${SEED_PATIENTS.length} patients, and ${opdVisits.length} OPD visits.`);
    return { success: true, message: 'Database successfully seeded with synthetic healthcare records.' };
  } catch (err: any) {
    console.error('Seeding error:', err);
    return { success: false, message: err.message || 'Failed to seed database' };
  }
};
