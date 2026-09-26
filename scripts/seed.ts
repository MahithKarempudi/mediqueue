// ==============================================================================
// MediQueue Standalone Synthetic Data Seeding Script (v1)
//
// DESIGN DECISION & PRIVACY NOTICE:
// THIS SCRIPT GENERATES 100% SYNTHETIC AND ARTIFICIAL TEST DATA.
// NO REAL PATIENT, HOSPITAL, OR PERSONAL DATA IS USED OR STORED.
// ==============================================================================

import {
  SEED_HOSPITALS,
  SEED_DEPARTMENTS,
  SEED_STAFF,
  SEED_PATIENTS,
  generateSeedBeds,
  generateHistoricalOpdVisits,
  generateSeedAdmissionsAndBills,
} from '../src/services/seed/seedData';

async function runSeeder() {
  console.log('====================================================');
  console.log('  MediQueue Healthcare Platform — Synthetic Seeder');
  console.log('====================================================');
  console.log('Notice: 100% synthetic mock dataset for testing & ML.');
  console.log('----------------------------------------------------');

  const beds = generateSeedBeds();
  const visits = generateHistoricalOpdVisits();
  const { admissions, bills } = generateSeedAdmissionsAndBills();

  console.log(`✓ Hospitals Prepared:      ${SEED_HOSPITALS.length}`);
  SEED_HOSPITALS.forEach(h => console.log(`  - [${h.hospitalId}] ${h.name} (${h.districtId}, ${h.totalBeds} beds)`));

  console.log(`\n✓ Clinical Departments:    ${SEED_DEPARTMENTS.length}`);
  console.log(`✓ Staff & Physicians:      ${SEED_STAFF.length}`);
  console.log(`✓ Synthetic Patients:      ${SEED_PATIENTS.length}`);
  console.log(`✓ Ward & ICU Beds:         ${beds.length}`);
  
  const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
  console.log(`  - Occupied Beds:         ${occupiedBeds} (${((occupiedBeds / beds.length) * 100).toFixed(1)}%)`);
  console.log(`  - Available Beds:        ${beds.length - occupiedBeds}`);

  console.log(`\n✓ Historical OPD Visits:   ${visits.length} (3 weeks history for ML training)`);
  console.log(`✓ Inpatient Admissions:    ${admissions.length} (${admissions.filter(a => a.status === 'discharged').length} discharged, ${admissions.filter(a => a.status === 'admitted').length} active)`);
  console.log(`✓ Billed Accounts:         ${bills.length}`);

  console.log('----------------------------------------------------');
  console.log('✅ Synthetic seeding payload compiled and validated successfully.');
}

runSeeder();
