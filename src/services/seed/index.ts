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
import type {
  LiveBed,
  EmergencyCapacity,
  HospitalStatus,
  User,
  OpdAppointment,
  PathologyOrder,
  PathologyReport,
  RadiologyOrder,
  RadiologyReport,
  Prescription,
  LiveQueue,
} from '@/types';
import { ROLE_PROFILES } from '@/context/roleProfiles';

export const seedDatabase = async (force: boolean = false): Promise<{ success: boolean; message: string }> => {
  try {
    const existingHospitals = await dbService.getCollection('hospitals');
    if (existingHospitals.length > 0 && !force) {
      return { success: true, message: 'Database already populated with seed data.' };
    }

    // 1. Seed Users (Role Profiles & Staff)
    for (const roleKey of Object.keys(ROLE_PROFILES)) {
      const profile = (ROLE_PROFILES as any)[roleKey];
      await dbService.setDocument('users', profile.user.uid, profile.user);
    }
    for (const staff of SEED_STAFF) {
      const staffUser: User = {
        uid: staff.userId,
        name: staff.name || 'Hospital Physician',
        email: staff.email || `${staff.staffId}@mediqueue.org`,
        role: 'staff',
        hospitalId: staff.hospitalId,
        departmentId: staff.departmentId,
        createdAt: new Date().toISOString(),
      };
      await dbService.setDocument('users', staff.userId, staffUser);
    }

    // 2. Seed Hospitals (5 facilities)
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

    // 5. Seed Patients (55 patients)
    for (const pat of SEED_PATIENTS) {
      await dbService.setDocument('patients', pat.patientId, pat);
    }

    // 6. Seed Beds (180 beds) & Mirror to RTDB
    const beds = generateSeedBeds();
    for (const bed of beds) {
      await dbService.setDocument('ipd_beds', bed.bedId, bed);

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
      const hospBeds = beds.filter((b) => b.hospitalId === hosp.hospitalId);
      const icuFree = hospBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
      const genFree = hospBeds.filter((b) => b.type === 'general' && b.status === 'available').length;
      const totalOccupied = hospBeds.filter((b) => b.status === 'occupied').length;
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

    // 10. Seed Unified OPD Appointments, Live Queues, Diagnostics & Prescriptions
    const todayDate = new Date().toISOString().split('T')[0];
    const seedAppointments: OpdAppointment[] = [
      {
        appointmentId: 'APT-2026-10412',
        patientId: 'pat_0001',
        hospitalId: 'hosp_metro_01',
        departmentId: 'dept_cardio_01',
        doctorId: 'staff_cardio_01',
        slotTime: `${todayDate} 10:30 AM`,
        status: 'scheduled',
      },
      {
        appointmentId: 'APT-2026-10398',
        patientId: 'pat_0002',
        hospitalId: 'hosp_metro_01',
        departmentId: 'dept_cardio_01',
        doctorId: 'staff_cardio_01',
        slotTime: `${todayDate} 09:30 AM`,
        status: 'scheduled',
      },
      {
        appointmentId: 'APT-2026-10405',
        patientId: 'pat_0003',
        hospitalId: 'hosp_metro_01',
        departmentId: 'dept_cardio_01',
        doctorId: 'staff_cardio_01',
        slotTime: `${todayDate} 10:00 AM`,
        status: 'scheduled',
      },
    ];
    for (const appt of seedAppointments) {
      await dbService.setDocument('opd_appointments', appt.appointmentId, appt);
    }

    // Seed Live OPD Queue in RTDB
    const initialQueue: LiveQueue = {
      currentToken: 15,
      lastUpdated: new Date().toISOString(),
      tokenList: [
        { tokenNo: 14, patientId: 'pat_0002', patientName: 'Priya Verma', appointmentId: 'APT-2026-10390', status: 'completed', joinedAt: new Date(Date.now() - 55 * 60000).toISOString() },
        { tokenNo: 15, patientId: 'pat_0003', patientName: 'Rohan Patel', appointmentId: 'APT-2026-10395', status: 'in_progress', joinedAt: new Date(Date.now() - 40 * 60000).toISOString() },
        { tokenNo: 16, patientId: 'pat_0004', patientName: 'Sneha Gupta', appointmentId: 'APT-2026-10401', status: 'waiting', joinedAt: new Date(Date.now() - 30 * 60000).toISOString() },
        { tokenNo: 17, patientId: 'pat_0005', patientName: 'Vikram Singh', appointmentId: 'APT-2026-10408', status: 'waiting', joinedAt: new Date(Date.now() - 22 * 60000).toISOString() },
        { tokenNo: 18, patientId: 'pat_0001', patientName: 'Aarav Sharma', appointmentId: 'APT-2026-10412', status: 'waiting', joinedAt: new Date(Date.now() - 15 * 60000).toISOString() },
        { tokenNo: 19, patientId: 'pat_0006', patientName: 'Ananya Nair', appointmentId: 'APT-2026-10419', status: 'waiting', joinedAt: new Date(Date.now() - 8 * 60000).toISOString() },
      ],
    };
    await dbService.setRTDB('liveQueues/hosp_metro_01/dept_cardio_01', initialQueue);

    // Seed Pathology & Radiology Orders and Reports
    const seedPathOrders: PathologyOrder[] = [
      {
        orderId: 'PATH-ORD-001',
        patientId: 'pat_0001',
        doctorId: 'staff_cardio_01',
        testName: 'Complete Blood Count (CBC) & Lipid Profile',
        status: 'completed',
        orderedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        orderId: 'PATH-ORD-002',
        patientId: 'pat_0001',
        doctorId: 'staff_cardio_01',
        testName: 'High-Sensitivity Troponin-I & HbA1c',
        status: 'completed',
        orderedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      },
      {
        orderId: 'PATH-ORD-003',
        patientId: 'pat_0002',
        doctorId: 'staff_cardio_01',
        testName: 'Renal Function Panel & Electrolytes',
        status: 'sample_collected',
        orderedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        orderId: 'PATH-ORD-004',
        patientId: 'pat_0003',
        doctorId: 'staff_gen_01',
        testName: 'Thyroid Profile (TSH, Free T3, Free T4)',
        status: 'ordered',
        orderedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ];
    for (const po of seedPathOrders) {
      await dbService.setDocument('pathology_orders', po.orderId, po);
    }

    const seedPathReports: PathologyReport[] = [
      {
        reportId: 'PATH-REP-001',
        orderId: 'PATH-ORD-001',
        patientId: 'pat_0001',
        testName: 'Complete Blood Count (CBC) & Lipid Profile',
        resultData: {
          'Hemoglobin': '14.6 g/dL (Ref: 13.5 - 17.5)',
          'Total WBC Count': '6,800 /mcL (Ref: 4,500 - 11,000)',
          'Platelet Count': '245,000 /mcL (Ref: 150,000 - 450,000)',
          'Total Cholesterol': '184 mg/dL (Desirable: <200)',
          'LDL Cholesterol': '108 mg/dL (Optimal: <110)',
          'HDL Cholesterol': '52 mg/dL (Normal: >40)',
          'Triglycerides': '132 mg/dL (Normal: <150)',
        },
        summary: 'Hematological parameters and fasting lipid profile within normal physiological reference intervals.',
        reportedAt: new Date(Date.now() - 86400000 * 3 + 14400000).toISOString(),
      },
      {
        reportId: 'PATH-REP-002',
        orderId: 'PATH-ORD-002',
        patientId: 'pat_0001',
        testName: 'High-Sensitivity Troponin-I & HbA1c',
        resultData: {
          'hs-Troponin I': '4.2 ng/L (Normal: <19.0 ng/L)',
          'HbA1c (Glycated Hb)': '5.6% (Non-Diabetic: <5.7%)',
          'Fasting Plasma Glucose': '94 mg/dL (Normal: 70 - 99)',
          'NT-proBNP': '68 pg/mL (Normal: <125 pg/mL)',
        },
        summary: 'No biochemical evidence of acute myocardial injury. Glycemic control is optimal.',
        reportedAt: new Date(Date.now() - 86400000 * 1 + 10800000).toISOString(),
      },
    ];
    for (const pr of seedPathReports) {
      await dbService.setDocument('pathology_reports', pr.reportId, pr);
    }

    const seedRadOrders: RadiologyOrder[] = [
      {
        orderId: 'RAD-ORD-001',
        patientId: 'pat_0001',
        doctorId: 'staff_cardio_01',
        modality: 'Echocardiogram',
        bodyPart: '2D Transthoracic Cardiac Doppler',
        status: 'completed',
        orderedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        orderId: 'RAD-ORD-002',
        patientId: 'pat_0004',
        doctorId: 'staff_ortho_01',
        modality: 'MRI',
        bodyPart: 'Right Knee Joint (Multiplanar)',
        status: 'scheduled',
        orderedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
    ];
    for (const ro of seedRadOrders) {
      await dbService.setDocument('radiology_orders', ro.orderId, ro);
    }

    const seedRadReports: RadiologyReport[] = [
      {
        reportId: 'RAD-REP-001',
        orderId: 'RAD-ORD-001',
        patientId: 'pat_0001',
        modality: 'Echocardiogram (2D TTE)',
        findings: 'Left ventricular chamber size is normal with preserved systolic contractility (LVEF 62%). Normal aortic, mitral, and tricuspid valve morphology. No regional wall motion abnormality or pericardial effusion.',
        impression: 'Normal resting 2D Transthoracic Echocardiogram with LVEF 62%.',
        reportedAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
      },
    ];
    for (const rr of seedRadReports) {
      await dbService.setDocument('radiology_reports', rr.reportId, rr);
    }

    // Seed Prescriptions
    const seedPrescriptions: Prescription[] = [
      {
        prescriptionId: 'RX-2026-0901',
        visitId: 'visit_hist_0001',
        patientId: 'pat_0001',
        doctorId: 'staff_cardio_01',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        medications: [
          { name: 'Tab. Telmisartan 40mg', dosage: '1 Tablet', frequency: 'Once Daily (Morning)', duration: '30 Days' },
          { name: 'Tab. Rosuvastatin 10mg', dosage: '1 Tablet', frequency: 'Once Daily (Night)', duration: '30 Days' },
          { name: 'Tab. Pantoprazole 40mg', dosage: '1 Tablet', frequency: 'Before Breakfast', duration: '10 Days' },
        ],
      },
    ];
    for (const rx of seedPrescriptions) {
      await dbService.setDocument('prescriptions', rx.prescriptionId, rx);
    }

    return { success: true, message: 'Database successfully seeded with synthetic healthcare records.' };
  } catch (err: any) {
    console.error('Seeding error:', err);
    return { success: false, message: err.message || 'Failed to seed database' };
  }
};
