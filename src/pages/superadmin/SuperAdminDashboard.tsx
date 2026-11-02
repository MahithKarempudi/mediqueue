import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '@/services/db';
import { isFirebaseConfigured } from '@/services/firebase';
import { seedDatabase } from '@/services/seed';
import { auditChainService } from '@/services/forensics/auditChainService';
import type { Hospital, User, IpdBed, Patient } from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  ShieldCheck,
  Database,
  Building2,
  Users,
  RefreshCw,
  HardDrive,
  Lock,
  ArrowRight,
  FileSearch,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const loadPlatformStats = async () => {
    const [h, u, b, p] = await Promise.all([
      dbService.getCollection<Hospital>('hospitals'),
      dbService.getCollection<User>('users'),
      dbService.getCollection<IpdBed>('ipd_beds'),
      dbService.getCollection<Patient>('patients'),
    ]);
    setHospitals(h);
    setUsers(u);
    setBeds(b);
    setPatients(p);
  };

  useEffect(() => {
    loadPlatformStats();
  }, []);

  const handleRestoreBaselineDataset = async () => {
    setIsResetting(true);
    dbService.resetAllData();
    const res = await seedDatabase(true);
    await loadPlatformStats();
    setIsResetting(false);
    setStatusBanner(res.message);
  };

  const chainCheck = auditChainService.verifyChainIntegrity();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Platform Infrastructure & Governance Control Plane"
        title="System Administration & Cryptographic Audit Center"
        subtitle="Manage multi-hospital tenant onboarding, institutional RBAC account provisioning, and reactive database persistence."
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              disabled={isResetting}
              icon={<RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />}
              onClick={handleRestoreBaselineDataset}
            >
              {isResetting ? 'Restoring Baseline...' : 'Restore Baseline Dataset'}
            </Button>
            <Link to="/superadmin/hospitals">
              <Button variant="primary" size="md" icon={<Building2 className="w-4 h-4" />}>
                Onboard Hospital Facility
              </Button>
            </Link>
          </>
        }
      />

      {statusBanner && (
        <NoticeBanner variant="success" title="Database Baseline Restored" onDismiss={() => setStatusBanner(null)}>
          {statusBanner}
        </NoticeBanner>
      )}

      {/* Honest Runtime Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Persistence Adapter"
          value={isFirebaseConfigured ? 'Firebase Cloud' : 'Local Reactive DB'}
          subtitle={
            isFirebaseConfigured
              ? 'Firestore + Realtime Database active'
              : 'Indexed localStorage + Cross-Tab Event Bus'
          }
          icon={<HardDrive className="w-5 h-5" />}
          accent="teal"
        />
        <MetricCard
          label="Commissioned Hospitals"
          value={hospitals.length}
          subtitle={`${beds.length} total ward & ICU beds indexed`}
          icon={<Building2 className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Provisioned RBAC Accounts"
          value={users.length}
          subtitle={`${patients.length} master patient UHID records`}
          icon={<Users className="w-5 h-5" />}
          accent="navy"
        />
        <MetricCard
          label="SHA-256 Audit Ledger"
          value={chainCheck.valid ? 'VERIFIED' : 'ALERT'}
          subtitle={`${chainCheck.totalEvents} chained cryptographic events`}
          icon={<Lock className="w-5 h-5" />}
          accent="emerald"
        />
      </div>

      {/* Main Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Onboarded Hospital Tenants"
              subtitle="Facilities registered in the MediQueue multi-hospital directory"
              icon={<Building2 className="w-5 h-5" />}
              action={
                <Link to="/superadmin/hospitals">
                  <Button variant="outline" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Manage Facilities
                  </Button>
                </Link>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Tenant ID</th>
                    <th className="mq-table-th">Facility Name</th>
                    <th className="mq-table-th">District & Sector</th>
                    <th className="mq-table-th">Bed Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((h) => (
                    <tr key={h.hospitalId} className="hover:bg-slate-50">
                      <td className="mq-table-td font-mono font-bold text-mediblue-700">{h.hospitalId}</td>
                      <td className="mq-table-td font-bold text-slate-900">{h.name}</td>
                      <td className="mq-table-td text-xs text-slate-600">
                        {h.district} • {h.type}
                      </td>
                      <td className="mq-table-td font-mono font-bold text-slate-900">
                        {h.totalBeds || 36} Beds
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Platform Governance Modules"
              subtitle="Administrative tools for tenant & security management"
              icon={<Database className="w-5 h-5" />}
            />

            <div className="space-y-3">
              <Link
                to="/superadmin/hospitals"
                className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-mediblue-400 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-mediblue-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Hospital Tenant Onboarding</h4>
                    <p className="text-xs text-slate-500">Register new regional hospitals and initialize RTDB nodes</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-mediblue-600" />
              </Link>

              <Link
                to="/superadmin/accounts"
                className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-mediblue-400 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-mediteal-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">RBAC Account Provisioning</h4>
                    <p className="text-xs text-slate-500">Create and manage clinician, admin, and officer accounts</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-mediblue-600" />
              </Link>

              <Link
                to="/superadmin/logs"
                className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-mediblue-400 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <FileSearch className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cryptographic Forensics Ledger</h4>
                    <p className="text-xs text-slate-500">Verify SHA-256 hash chain integrity across all events</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-mediblue-600" />
              </Link>
            </div>
          </Card>

          <Card padding="lg" className="bg-navy-950 text-white border-navy-800">
            <div className="flex items-center gap-2.5 mb-2">
              <ShieldCheck className="w-5 h-5 text-mediteal-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Storage Engine Telemetry</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFirebaseConfigured
                ? 'Connected to live Firebase Cloud Firestore and Realtime Database.'
                : 'Operating on the deterministic Local Reactive Storage Engine with automatic cross-tab event synchronization.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
