// ==============================================================================
// MediQueue Synthetic Seed Dataset v1
//
// DESIGN DECISION NOTICE:
// EXPLICITLY NO REAL PATIENT OR HOSPITAL CONFIDENTIAL DATA IS CONTAINED HEREIN.
// ALL PATIENT IDENTITIES, CLINICAL NOTES, DEMOGRAPHICS, CONTACT NUMBERS,
// AND METRICS ARE ENTIRELY SYNTHETIC AND GENERATED STRICTLY FOR DEVELOPMENT,
// TESTING, AND MACHINE LEARNING TRAINING PURPOSES.
// ==============================================================================

import type {
  Hospital,
  Department,
  Staff,
  Patient,
  IpdBed,
  OpdVisit,
  IpdAdmission,
  Billing,
  LiveBed,
  EmergencyCapacity,
  HospitalStatus,
  User,
} from '@/types';

export const SEED_HOSPITALS: Hospital[] = [
  {
    hospitalId: 'hosp_metro_01',
    name: 'Apollo Indraprastha Healthcare',
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi, 110076',
    geo: { lat: 28.5355, lng: 77.2882 },
    districtId: 'dist_south_delhi',
    totalBeds: 120,
    departments: ['dept_cardio_01', 'dept_ortho_01', 'dept_genmed_01', 'dept_pedia_01', 'dept_emerg_01'],
    phone: '+91 11 2692 5858',
    emergencyAvailable: true,
  },
  {
    hospitalId: 'hosp_metro_02',
    name: 'Max Super Speciality Hospital',
    address: '1, 2 Press Enclave Marg, Saket, New Delhi, 110017',
    geo: { lat: 28.5273, lng: 77.2159 },
    districtId: 'dist_south_delhi',
    totalBeds: 140,
    departments: ['dept_cardio_02', 'dept_ortho_02', 'dept_genmed_02', 'dept_emerg_02'],
    phone: '+91 11 2651 5050',
    emergencyAvailable: true,
  },
  {
    hospitalId: 'hosp_metro_03',
    name: 'Fortis Escorts Heart & Trauma Institute',
    address: 'Okhla Road, Sukhdev Vihar Metro Station, New Delhi, 110025',
    geo: { lat: 28.5603, lng: 77.2758 },
    districtId: 'dist_south_delhi',
    totalBeds: 110,
    departments: ['dept_cardio_03', 'dept_genmed_03', 'dept_emerg_03'],
    phone: '+91 11 4713 5000',
    emergencyAvailable: true,
  },
  {
    hospitalId: 'hosp_metro_04',
    name: 'AIIMS Apex Trauma & Medical Center',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, 110029',
    geo: { lat: 28.5672, lng: 77.2100 },
    districtId: 'dist_central_delhi',
    totalBeds: 160,
    departments: ['dept_cardio_04', 'dept_ortho_04', 'dept_genmed_04', 'dept_pedia_04', 'dept_emerg_04'],
    phone: '+91 11 2658 8500',
    emergencyAvailable: true,
  },
  {
    hospitalId: 'hosp_metro_05',
    name: 'St. Jude Regional Community Hospital',
    address: 'Vikas Marg, Preet Vihar, East Delhi, 110092',
    geo: { lat: 28.6369, lng: 77.2946 },
    districtId: 'dist_east_delhi',
    totalBeds: 70,
    departments: ['dept_genmed_05', 'dept_pedia_05', 'dept_emerg_05'],
    phone: '+91 11 2250 1234',
    emergencyAvailable: false, // temporarily diverted
  },
];

export const SEED_DEPARTMENTS: Department[] = [
  // Apollo (hosp_metro_01)
  { departmentId: 'dept_cardio_01', hospitalId: 'hosp_metro_01', name: 'Cardiology', doctorIds: ['doc_cardio_01', 'doc_cardio_02'] },
  { departmentId: 'dept_ortho_01', hospitalId: 'hosp_metro_01', name: 'Orthopedics', doctorIds: ['doc_ortho_01'] },
  { departmentId: 'dept_genmed_01', hospitalId: 'hosp_metro_01', name: 'General Medicine', doctorIds: ['doc_genmed_01', 'doc_genmed_02'] },
  { departmentId: 'dept_pedia_01', hospitalId: 'hosp_metro_01', name: 'Pediatrics', doctorIds: ['doc_pedia_01'] },
  { departmentId: 'dept_emerg_01', hospitalId: 'hosp_metro_01', name: 'Emergency & Trauma', doctorIds: ['doc_emerg_01'] },

  // Max (hosp_metro_02)
  { departmentId: 'dept_cardio_02', hospitalId: 'hosp_metro_02', name: 'Cardiology', doctorIds: ['doc_cardio_03'] },
  { departmentId: 'dept_ortho_02', hospitalId: 'hosp_metro_02', name: 'Orthopedics', doctorIds: ['doc_ortho_02'] },
  { departmentId: 'dept_genmed_02', hospitalId: 'hosp_metro_02', name: 'General Medicine', doctorIds: ['doc_genmed_03'] },
  { departmentId: 'dept_emerg_02', hospitalId: 'hosp_metro_02', name: 'Emergency & Trauma', doctorIds: ['doc_emerg_02'] },

  // Fortis (hosp_metro_03)
  { departmentId: 'dept_cardio_03', hospitalId: 'hosp_metro_03', name: 'Cardiology', doctorIds: ['doc_cardio_04'] },
  { departmentId: 'dept_genmed_03', hospitalId: 'hosp_metro_03', name: 'General Medicine', doctorIds: ['doc_genmed_04'] },
  { departmentId: 'dept_emerg_03', hospitalId: 'hosp_metro_03', name: 'Emergency & Trauma', doctorIds: ['doc_emerg_03'] },

  // AIIMS (hosp_metro_04)
  { departmentId: 'dept_cardio_04', hospitalId: 'hosp_metro_04', name: 'Cardiology', doctorIds: ['doc_cardio_05'] },
  { departmentId: 'dept_ortho_04', hospitalId: 'hosp_metro_04', name: 'Orthopedics', doctorIds: ['doc_ortho_03'] },
  { departmentId: 'dept_genmed_04', hospitalId: 'hosp_metro_04', name: 'General Medicine', doctorIds: ['doc_genmed_05'] },
  { departmentId: 'dept_pedia_04', hospitalId: 'hosp_metro_04', name: 'Pediatrics', doctorIds: ['doc_pedia_02'] },
  { departmentId: 'dept_emerg_04', hospitalId: 'hosp_metro_04', name: 'Emergency & Trauma', doctorIds: ['doc_emerg_04'] },

  // St Jude (hosp_metro_05)
  { departmentId: 'dept_genmed_05', hospitalId: 'hosp_metro_05', name: 'General Medicine', doctorIds: ['doc_genmed_06'] },
  { departmentId: 'dept_pedia_05', hospitalId: 'hosp_metro_05', name: 'Pediatrics', doctorIds: ['doc_pedia_03'] },
  { departmentId: 'dept_emerg_05', hospitalId: 'hosp_metro_05', name: 'Emergency & Trauma', doctorIds: ['doc_emerg_05'] },
];

export const SEED_STAFF: Staff[] = [
  // Apollo
  { staffId: 'staff_01', userId: 'user_doc_01', hospitalId: 'hosp_metro_01', departmentId: 'dept_cardio_01', designation: 'Senior Consultant Cardiologist', name: 'Dr. Rajesh Kumar', email: 'staff@mediqueue.demo' },
  { staffId: 'staff_02', userId: 'user_doc_02', hospitalId: 'hosp_metro_01', departmentId: 'dept_cardio_01', designation: 'Assistant Cardiologist', name: 'Dr. Neha Kapoor', email: 'neha.kapoor@apollo.demo' },
  { staffId: 'staff_03', userId: 'user_doc_03', hospitalId: 'hosp_metro_01', departmentId: 'dept_ortho_01', designation: 'Head of Orthopedic Surgery', name: 'Dr. Alok Verma', email: 'alok.verma@apollo.demo' },
  { staffId: 'staff_04', userId: 'user_doc_04', hospitalId: 'hosp_metro_01', departmentId: 'dept_genmed_01', designation: 'Physician In-Charge', name: 'Dr. S. K. Gupta', email: 'sk.gupta@apollo.demo' },
  { staffId: 'staff_05', userId: 'user_doc_05', hospitalId: 'hosp_metro_01', departmentId: 'dept_pedia_01', designation: 'Pediatric Specialist', name: 'Dr. Ananya Roy', email: 'ananya.roy@apollo.demo' },
  { staffId: 'staff_06', userId: 'user_doc_06', hospitalId: 'hosp_metro_01', departmentId: 'dept_emerg_01', designation: 'Chief Emergency Officer', name: 'Dr. Tariq Ahmed', email: 'tariq.ahmed@apollo.demo' },

  // Max
  { staffId: 'staff_07', userId: 'user_doc_07', hospitalId: 'hosp_metro_02', departmentId: 'dept_cardio_02', designation: 'Lead Interventional Cardiologist', name: 'Dr. Meera Iyer', email: 'meera.iyer@max.demo' },
  { staffId: 'staff_08', userId: 'user_doc_08', hospitalId: 'hosp_metro_02', departmentId: 'dept_ortho_02', designation: 'Joint Replacement Surgeon', name: 'Dr. Rohan Mehra', email: 'rohan.mehra@max.demo' },
  { staffId: 'staff_09', userId: 'user_doc_09', hospitalId: 'hosp_metro_02', departmentId: 'dept_genmed_02', designation: 'Internal Medicine Consultant', name: 'Dr. Pooja Nair', email: 'pooja.nair@max.demo' },

  // Fortis
  { staffId: 'staff_10', userId: 'user_doc_10', hospitalId: 'hosp_metro_03', departmentId: 'dept_cardio_03', designation: 'Director of Cardiology', name: 'Dr. K. N. Rao', email: 'kn.rao@fortis.demo' },
  { staffId: 'staff_11', userId: 'user_doc_11', hospitalId: 'hosp_metro_03', departmentId: 'dept_genmed_03', designation: 'Critical Care Physician', name: 'Dr. Vandana Seth', email: 'vandana.seth@fortis.demo' },

  // AIIMS
  { staffId: 'staff_12', userId: 'user_doc_12', hospitalId: 'hosp_metro_04', departmentId: 'dept_cardio_04', designation: 'Professor & Head of Cardiology', name: 'Dr. H. C. Joshi', email: 'hc.joshi@aiims.demo' },
  { staffId: 'staff_13', userId: 'user_doc_13', hospitalId: 'hosp_metro_04', departmentId: 'dept_ortho_04', designation: 'Trauma & Ortho Surgeon', name: 'Dr. Vivek Saxena', email: 'vivek.saxena@aiims.demo' },
  { staffId: 'staff_14', userId: 'user_doc_14', hospitalId: 'hosp_metro_04', departmentId: 'dept_genmed_04', designation: 'Professor of Medicine', name: 'Dr. Deepa Malhotra', email: 'deepa.m@aiims.demo' },
  { staffId: 'staff_15', userId: 'user_doc_15', hospitalId: 'hosp_metro_04', departmentId: 'dept_emerg_04', designation: 'Director Trauma Services', name: 'Dr. Arvind Singhal', email: 'arvind.s@aiims.demo' },

  // St Jude
  { staffId: 'staff_16', userId: 'user_doc_16', hospitalId: 'hosp_metro_05', departmentId: 'dept_genmed_05', designation: 'Senior Medical Officer', name: 'Dr. Shalini George', email: 'shalini.g@stjude.demo' },
  { staffId: 'staff_17', userId: 'user_doc_17', hospitalId: 'hosp_metro_05', departmentId: 'dept_pedia_05', designation: 'Child Health Officer', name: 'Dr. Gautam Paul', email: 'gautam.p@stjude.demo' },
  { staffId: 'staff_18', userId: 'user_doc_18', hospitalId: 'hosp_metro_05', departmentId: 'dept_emerg_05', designation: 'Emergency Physician', name: 'Dr. Rekha Bhatt', email: 'rekha.b@stjude.demo' },
];

export const SEED_PATIENTS: Patient[] = [
  { patientId: 'pat_demo_01', userId: 'demo_user_patient_01', name: 'Priya Sharma', dob: '1992-04-14', gender: 'female', phone: '+91 98201 12345', address: 'Flat 402, Lotus Enclave, Sector 14, New Delhi', bloodGroup: 'B+' },
  { patientId: 'pat_002', userId: 'user_pat_002', name: 'Aarav Patel', dob: '1985-09-22', gender: 'male', phone: '+91 98201 22334', address: 'Block C, Vasant Vihar, New Delhi', bloodGroup: 'O+' },
  { patientId: 'pat_003', userId: 'user_pat_003', name: 'Sunita Mehra', dob: '1978-11-05', gender: 'female', phone: '+91 98201 33445', address: 'H-12, Greater Kailash I, New Delhi', bloodGroup: 'A+' },
  { patientId: 'pat_004', userId: 'user_pat_004', name: 'Rohan Deshmukh', dob: '1998-02-18', gender: 'male', phone: '+91 98201 44556', address: 'D-44, Hauz Khas Enclave, New Delhi', bloodGroup: 'AB+' },
  { patientId: 'pat_005', userId: 'user_pat_005', name: 'Fatima Sheikh', dob: '1990-07-30', gender: 'female', phone: '+91 98201 55667', address: 'Nizamuddin West, New Delhi', bloodGroup: 'O-' },
  { patientId: 'pat_006', userId: 'user_pat_006', name: 'Vikram Chawla', dob: '1965-01-12', gender: 'male', phone: '+91 98201 66778', address: 'Panchsheel Park, New Delhi', bloodGroup: 'B-' },
  { patientId: 'pat_007', userId: 'user_pat_007', name: 'Kavita Nambiar', dob: '2001-05-24', gender: 'female', phone: '+91 98201 77889', address: 'Chittaranjan Park, New Delhi', bloodGroup: 'A-' },
  { patientId: 'pat_008', userId: 'user_pat_008', name: 'Harpreet Singh', dob: '1988-12-08', gender: 'male', phone: '+91 98201 88990', address: 'Lajpat Nagar IV, New Delhi', bloodGroup: 'B+' },
  { patientId: 'pat_009', userId: 'user_pat_009', name: 'Ananya Sen', dob: '1995-03-17', gender: 'female', phone: '+91 98201 99001', address: 'Defence Colony, New Delhi', bloodGroup: 'O+' },
  { patientId: 'pat_010', userId: 'user_pat_010', name: 'Devendra Yadav', dob: '1972-08-19', gender: 'male', phone: '+91 98202 00112', address: 'Malviya Nagar, New Delhi', bloodGroup: 'AB-' },
  // Generate additional 45 patients programmatically for 55 total
  ...Array.from({ length: 45 }, (_, i) => {
    const idx = i + 11;
    const isFemale = idx % 2 === 0;
    const namesFemale = ['Meenakshi', 'Deepika', 'Pooja', 'Shreya', 'Divya', 'Swati', 'Preeti', 'Ritu', 'Geeta', 'Lakshmi'];
    const namesMale = ['Suresh', 'Manish', 'Nitin', 'Gaurav', 'Tarun', 'Kunal', 'Ashok', 'Mohan', 'Ramesh', 'Satish'];
    const surnames = ['Gupta', 'Verma', 'Sharma', 'Mishra', 'Pandey', 'Chopra', 'Malhotra', 'Bose', 'Nair', 'Reddy'];
    const bloods = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const first = isFemale ? namesFemale[idx % namesFemale.length] : namesMale[idx % namesMale.length];
    const last = surnames[(idx * 3) % surnames.length];
    const yr = 1960 + (idx * 7) % 45;
    const mm = String((idx % 12) + 1).padStart(2, '0');
    const dd = String((idx % 28) + 1).padStart(2, '0');
    return {
      patientId: `pat_${String(idx).padStart(3, '0')}`,
      userId: `user_pat_${String(idx).padStart(3, '0')}`,
      name: `${first} ${last}`,
      dob: `${yr}-${mm}-${dd}`,
      gender: isFemale ? 'female' : 'male',
      phone: `+91 98202 ${String(1000 + idx)}`,
      address: `Sector ${(idx % 18) + 1}, NCR Urban Area`,
      bloodGroup: bloods[idx % bloods.length],
    } as Patient;
  }),
];

// Generate Beds across all 5 hospitals with controlled occupancy
// AIIMS (hosp_metro_04) will be set to near-full (>88% occupancy) to trigger the Government Surge Alert!
export const generateSeedBeds = (): IpdBed[] => {
  const beds: IpdBed[] = [];
  const hospitalConfigs = [
    { hospitalId: 'hosp_metro_01', total: 40, icuCount: 8, occupiedRate: 0.70 }, // 70% occupied
    { hospitalId: 'hosp_metro_02', total: 35, icuCount: 6, occupiedRate: 0.65 },
    { hospitalId: 'hosp_metro_03', total: 30, icuCount: 6, occupiedRate: 0.75 },
    { hospitalId: 'hosp_metro_04', total: 50, icuCount: 12, occupiedRate: 0.90 }, // 90% occupied -> SURGE TRIGGER!
    { hospitalId: 'hosp_metro_05', total: 25, icuCount: 4, occupiedRate: 0.60 },
  ];

  hospitalConfigs.forEach(hosp => {
    for (let i = 1; i <= hosp.total; i++) {
      const isIcu = i <= hosp.icuCount;
      const isEmerg = !isIcu && i <= hosp.icuCount + 4;
      const isPedia = !isIcu && !isEmerg && i <= hosp.icuCount + 8;
      const bedType = isIcu ? 'ICU' : isEmerg ? 'emergency' : isPedia ? 'pediatric' : 'general';
      const wardId = isIcu ? 'ward_icu_01' : isEmerg ? 'ward_emerg_01' : isPedia ? 'ward_pedia_01' : 'ward_gen_01';
      
      const shouldOccupy = (i / hosp.total) <= hosp.occupiedRate;
      const bedId = `bed_${hosp.hospitalId}_${String(i).padStart(3, '0')}`;
      const patIndex = (i * 3) % SEED_PATIENTS.length;

      beds.push({
        bedId,
        hospitalId: hosp.hospitalId,
        wardId,
        bedNumber: `${isIcu ? 'ICU' : isEmerg ? 'EMG' : isPedia ? 'PED' : 'GEN'}-${String(i).padStart(2, '0')}`,
        type: bedType as any,
        status: shouldOccupy ? 'occupied' : 'available',
        currentAdmissionId: shouldOccupy ? `adm_seed_${hosp.hospitalId}_${i}` : undefined,
        patientName: shouldOccupy ? SEED_PATIENTS[patIndex].name : undefined,
      });
    }
  });

  return beds;
};

// Generate historical OPD visits (400+ entries across past 21 days) to feed the wait-time prediction model
export const generateHistoricalOpdVisits = (): OpdVisit[] => {
  const visits: OpdVisit[] = [];
  const departments = ['dept_cardio_01', 'dept_ortho_01', 'dept_genmed_01', 'dept_pedia_01'];
  let count = 1;

  for (let dayOffset = 21; dayOffset >= 0; dayOffset--) {
    const visitDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    const dayOfWeek = visitDate.getDay(); // 0 = Sun
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const visitsToday = isWeekend ? 10 : 25; // 25 visits/day on weekdays

    for (let t = 1; t <= visitsToday; t++) {
      const dept = departments[t % departments.length];
      const hour = 9 + Math.floor(t / 4); // 9 AM to 3 PM
      const minute = (t * 12) % 60;
      const timeStr = `${visitDate.toISOString().split('T')[0]}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      const pat = SEED_PATIENTS[count % SEED_PATIENTS.length];

      visits.push({
        visitId: `vis_hist_${String(count).padStart(4, '0')}`,
        patientId: pat.patientId,
        hospitalId: 'hosp_metro_01',
        departmentId: dept,
        doctorId: 'staff_01',
        tokenNo: t,
        checkInTime: timeStr,
        consultationNotes: `Routine checkup and clinical symptom assessment. Patient evaluated for vital indicators.`,
        status: dayOffset === 0 && t > 18 ? 'waiting' : 'completed',
      });
      count++;
    }
  }

  return visits;
};

// Generate Admissions and associated Bills
export const generateSeedAdmissionsAndBills = (): { admissions: IpdAdmission[]; bills: Billing[] } => {
  const admissions: IpdAdmission[] = [];
  const bills: Billing[] = [];
  const diagnosisList = [
    'Acute Myocardial Infarction - post Angioplasty',
    'Bilateral Knee Osteoarthritis - Knee Replacement',
    'Severe Bronchopneumonia with Respiratory Distress',
    'Acute Appendicitis - Laparoscopic Appendectomy',
    'Hypertensive Crisis with Microalbuminuria',
  ];

  // Completed admissions with settled bills
  for (let i = 1; i <= 6; i++) {
    const pat = SEED_PATIENTS[i];
    const admId = `adm_comp_${String(i).padStart(3, '0')}`;
    const billId = `bill_adm_${String(i).padStart(3, '0')}`;
    const admitDate = new Date(Date.now() - (12 + i) * 24 * 60 * 60 * 1000).toISOString();
    const dischargeDate = new Date(Date.now() - (4 + i) * 24 * 60 * 60 * 1000).toISOString();
    const dailyRate = 4500;
    const days = 8;
    const roomCharge = days * dailyRate;
    const subtotal = roomCharge + 15000 + 4200; // room + surgery/care + meds
    const discount = 2000;
    const total = subtotal - discount;

    admissions.push({
      admissionId: admId,
      patientId: pat.patientId,
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_01',
      bedId: `bed_hosp_metro_01_${String(i).padStart(3, '0')}`,
      admitDate,
      dischargeDate,
      diagnosis: diagnosisList[i % diagnosisList.length],
      status: 'discharged',
      dailyCharge: dailyRate,
    });

    bills.push({
      billId,
      patientId: pat.patientId,
      hospitalId: 'hosp_metro_01',
      sourceType: 'IPD',
      lineItems: [
        { id: `li_${admId}_1`, description: `Inpatient Ward Bed Charges (${days} Days)`, category: 'IPD', quantity: days, unitPrice: dailyRate, totalPrice: roomCharge },
        { id: `li_${admId}_2`, description: 'Attending Physician & Nursing Care', category: 'IPD', quantity: 1, unitPrice: 15000, totalPrice: 15000 },
        { id: `li_${admId}_3`, description: 'Pharmacy & Infusion Medication', category: 'IPD', quantity: 1, unitPrice: 4200, totalPrice: 4200 },
      ],
      subtotal,
      discount,
      total,
      status: 'paid',
      createdAt: dischargeDate,
    });
  }

  // Active admissions currently occupying beds
  for (let i = 1; i <= 4; i++) {
    const pat = SEED_PATIENTS[i + 7];
    const admId = `adm_active_${String(i).padStart(3, '0')}`;
    admissions.push({
      admissionId: admId,
      patientId: pat.patientId,
      hospitalId: 'hosp_metro_01',
      departmentId: 'dept_cardio_01',
      doctorId: 'staff_01',
      bedId: `bed_hosp_metro_01_${String(i + 10).padStart(3, '0')}`,
      admitDate: new Date(Date.now() - (2 + i) * 24 * 60 * 60 * 1000).toISOString(),
      diagnosis: diagnosisList[(i + 2) % diagnosisList.length],
      status: 'admitted',
      dailyCharge: 4500,
    });
  }

  return { admissions, bills };
};
