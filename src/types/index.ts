// Canonical Data Models and RBAC Types for MediQueue

export type UserRole =
  | 'patient'
  | 'staff'
  | 'hospital_admin'
  | 'government_officer'
  | 'super_admin';

export interface User {
  uid: string;
  role: UserRole;
  name: string;
  email: string;
  hospitalId?: string;
  departmentId?: string;
  phone?: string;
  patientId?: string;
  createdAt: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface Hospital {
  hospitalId: string;
  name: string;
  address: string;
  geo: GeoLocation;
  districtId: string;
  totalBeds: number;
  departments: string[]; // List of departmentIds or department names
  phone?: string;
  emergencyAvailable?: boolean;
}

export interface Department {
  departmentId: string;
  hospitalId: string;
  name: string;
  doctorIds: string[];
}

export interface Staff {
  staffId: string;
  userId: string;
  hospitalId: string;
  departmentId: string;
  designation: string;
  name?: string;
  email?: string;
}

export interface Patient {
  patientId: string;
  userId: string;
  name: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  bloodGroup: string;
}

export type AppointmentStatus = 'scheduled' | 'checked_in' | 'completed' | 'cancelled';

export interface OpdAppointment {
  appointmentId: string;
  patientId: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  slotTime: string;
  status: AppointmentStatus;
}

export interface QueueToken {
  tokenNo: number;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  visitId?: string;
  status: 'waiting' | 'in_consultation' | 'completed' | 'skipped';
  joinedAt: string;
}

export interface OpdQueue {
  queueId: string;
  hospitalId: string;
  departmentId: string;
  date: string;
  tokenList: QueueToken[];
}

export type VisitStatus = 'waiting' | 'in_consultation' | 'completed' | 'cancelled';

export interface OpdVisit {
  visitId: string;
  patientId: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  tokenNo: number;
  checkInTime: string;
  consultationNotes?: string;
  status: VisitStatus;
}

export type AdmissionStatus = 'admitted' | 'discharged' | 'transferred';

export interface IpdAdmission {
  admissionId: string;
  patientId: string;
  hospitalId: string;
  departmentId: string;
  doctorId: string;
  bedId: string;
  admitDate: string;
  dischargeDate?: string;
  diagnosis: string;
  status: AdmissionStatus;
  dailyCharge?: number;
}

export type BedType = 'ICU' | 'general' | 'emergency' | 'pediatric' | 'maternity';
export type BedStatus = 'available' | 'occupied' | 'maintenance';

export interface IpdBed {
  bedId: string;
  hospitalId: string;
  wardId: string;
  bedNumber: string;
  type: BedType;
  status: BedStatus;
  currentAdmissionId?: string;
  patientName?: string;
}

export type TestOrderStatus = 'ordered' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';

export interface PathologyOrder {
  orderId: string;
  patientId: string;
  visitId?: string;
  admissionId?: string;
  testType: string;
  status: TestOrderStatus;
  orderedAt: string;
}

export interface PathologyReport {
  reportId: string;
  orderId: string;
  patientId?: string;
  testType?: string;
  resultData: Record<string, { value: string | number; normalRange: string; unit: string; flag?: 'normal' | 'high' | 'low' }>;
  verifiedBy: string;
  generatedAt: string;
}

export interface RadiologyOrder {
  orderId: string;
  patientId: string;
  visitId?: string;
  admissionId?: string;
  scanType: string;
  status: TestOrderStatus;
  orderedAt: string;
}

export interface RadiologyReport {
  reportId: string;
  orderId: string;
  patientId?: string;
  scanType?: string;
  findings: string;
  radiologistId: string;
  generatedAt: string;
}

export type BillSourceType = 'OPD' | 'IPD' | 'PATH' | 'RAD';
export type BillStatus = 'pending' | 'partial' | 'paid' | 'cancelled' | 'refunded';

export interface LineItem {
  id: string;
  description: string;
  category: BillSourceType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Billing {
  billId: string;
  patientId: string;
  hospitalId: string;
  sourceType: BillSourceType;
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: BillStatus;
  createdAt?: string;
}

export interface Payment {
  paymentId: string;
  billId: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'insurance';
  paidAt: string;
  transactionRef?: string;
}

export interface MedicineItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  prescriptionId: string;
  visitId: string;
  patientId: string;
  medicines: MedicineItem[];
  notes: string;
  prescribedAt?: string;
  doctorName?: string;
}

export interface PatientRecord {
  patientId: string;
  opdVisitIds: string[];
  admissionIds: string[];
  pathologyReportIds: string[];
  radiologyReportIds: string[];
  billIds: string[];
}

export interface DailyReport {
  reportId: string;
  hospitalId: string;
  date: string;
  opdCount: number;
  admissions: number;
  discharges: number;
  emergencyCases: number;
  bedUtilization: number; // percentage (0-100)
  revenueByType: Record<BillSourceType, number>;
}

export interface MonthlyReport {
  reportId: string;
  hospitalId: string;
  month: string; // YYYY-MM
  aggregates: {
    totalOpd: number;
    totalAdmissions: number;
    totalDischarges: number;
    averageBedUtilization: number;
    totalRevenue: number;
  };
}

export interface Notification {
  notificationId: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ==========================================
// Realtime Database Operational Models
// ==========================================

export interface LiveBed {
  bedId: string;
  status: BedStatus;
  wardId: string;
  type: BedType;
  lastUpdated: string;
  bedNumber?: string;
}

export interface LiveQueue {
  currentToken: number;
  tokenList: QueueToken[];
  lastUpdated: string;
  departmentId?: string;
}

export interface HospitalStatus {
  operational: boolean;
  emergencyOpen: boolean;
  surgeAlert?: boolean;
}

export interface EmergencyCapacity {
  icuBedsFree: number;
  generalBedsFree: number;
  emergencyStatus: 'Normal' | 'Surge' | 'Critical' | 'Diverting';
  lastUpdated?: string;
}
