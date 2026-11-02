import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type {
  Hospital,
  IpdBed,
  IpdAdmission,
  PathologyOrder,
  RadiologyOrder,
  LiveQueue,
} from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, Button } from '@/components/ui';
import {
  Stethoscope,
  UserPlus,
  Bed,
  FlaskConical,
  CreditCard,
  Activity,
  Users,
  ArrowRight,
  ClipboardCheck,
  Clock,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [pathOrders, setPathOrders] = useState<PathologyOrder[]>([]);
  const [radOrders, setRadOrders] = useState<RadiologyOrder[]>([]);
  const [liveQueue, setLiveQueue] = useState<LiveQueue | null>(null);

  useEffect(() => {
    const loadStaffDesk = async () => {
      const [hosps, allBeds, allAdms, pOrds, rOrds] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getCollection<IpdAdmission>('ipd_admissions'),
        dbService.getCollection<PathologyOrder>('pathology_orders'),
        dbService.getCollection<RadiologyOrder>('radiology_orders'),
      ]);
      setHospital(hosps.find((h) => h.hospitalId === hospitalId) || hosps[0] || null);
      setBeds(allBeds.filter((b) => b.hospitalId === hospitalId));
      setAdmissions(allAdms.filter((a) => a.hospitalId === hospitalId));
      setPathOrders(pOrds);
      setRadOrders(rOrds);
    };
    loadStaffDesk();

    const unsubQueue = dbService.subscribeRTDB<LiveQueue>(
      `liveQueues/${hospitalId}/dept_cardio_01`,
      (q) => {
        if (q) setLiveQueue(q);
      }
    );
    const unsubBeds = dbService.subscribeCollection<IpdBed>('ipd_beds', (all) => {
      setBeds(all.filter((b) => b.hospitalId === hospitalId));
    });
    const unsubAdms = dbService.subscribeCollection<IpdAdmission>('ipd_admissions', (all) => {
      setAdmissions(all.filter((a) => a.hospitalId === hospitalId));
    });

    return () => {
      unsubQueue();
      unsubBeds();
      unsubAdms();
    };
  }, [hospitalId]);

  const waitingTokens = (liveQueue?.tokenList || []).filter((t) => t.status === 'waiting');
  const availableBeds = beds.filter((b) => b.status === 'available').length;
  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const activeAdmissions = admissions.filter((a) => a.status === 'admitted');
  const pendingDiagnostics =
    pathOrders.filter((o) => o.status !== 'completed').length +
    radOrders.filter((o) => o.status !== 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Clinical Operations Command Desk"
        title={`${hospital?.name || 'Metro General Hospital'} — Staff Workstation`}
        subtitle={`Attending Clinician: ${user?.name || 'Dr. Rajesh Kumar'} • Assigned Facility ID: ${hospitalId}`}
        actions={
          <>
            <Link to="/staff/patients">
              <Button variant="secondary" size="md" icon={<UserPlus className="w-4 h-4 text-mediteal-600" />}>
                Register Walk-In Patient
              </Button>
            </Link>
            <Link to="/staff/opd">
              <Button variant="primary" size="md" icon={<Stethoscope className="w-4 h-4" />}>
                Open Doctor OPD Console
              </Button>
            </Link>
          </>
        }
      />

      {/* Top Clinical KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Waiting OPD Patients"
          value={waitingTokens.length}
          subtitle={`Serving Token #${liveQueue?.currentToken || 15} in Cardiology`}
          icon={<Users className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Open Ward & ICU Beds"
          value={`${availableBeds} / ${beds.length}`}
          subtitle={`${occupiedBeds} currently occupied beds`}
          icon={<Bed className="w-5 h-5" />}
          accent="teal"
        />
        <MetricCard
          label="Active IPD Inpatients"
          value={activeAdmissions.length}
          subtitle="Under continuous ward observation"
          icon={<ClipboardCheck className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          label="Pending Lab & RIS Orders"
          value={pendingDiagnostics}
          subtitle="Awaiting sample processing or report sign-off"
          icon={<FlaskConical className="w-5 h-5" />}
          accent="amber"
        />
      </div>

      {/* Main Clinical Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Live OPD Queue Snapshot */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Active Outpatient Queue Roster"
              subtitle="Patients checked in and waiting for clinical consultation"
              icon={<Clock className="w-5 h-5" />}
              action={
                <Link to="/staff/opd">
                  <Button variant="primary" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Launch Consultation Console
                  </Button>
                </Link>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Token</th>
                    <th className="mq-table-th">Patient Name</th>
                    <th className="mq-table-th">Booking Ref</th>
                    <th className="mq-table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(liveQueue?.tokenList || []).slice(0, 6).map((tok) => (
                    <tr key={tok.tokenNo} className="hover:bg-slate-50">
                      <td className="mq-table-td font-mono font-bold text-slate-900">#{tok.tokenNo}</td>
                      <td className="mq-table-td font-semibold text-slate-900">{tok.patientName}</td>
                      <td className="mq-table-td font-mono text-xs text-slate-500">
                        {tok.appointmentId || 'OPD-WALKIN'}
                      </td>
                      <td className="mq-table-td">
                        <Badge
                          variant={
                            tok.status === 'completed'
                              ? 'success'
                              : tok.status === 'in_progress'
                              ? 'info'
                              : 'warning'
                          }
                          dot
                        >
                          {tok.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Active IPD Admissions Snapshot */}
          <Card padding="lg">
            <SectionHeader
              title="Current Inpatient (IPD) Ward Roster"
              subtitle="Admitted patients assigned to ICU and general ward beds"
              icon={<Bed className="w-5 h-5" />}
              action={
                <Link to="/staff/admissions">
                  <Button variant="outline" size="xs">Manage Discharges & Admissions</Button>
                </Link>
              }
            />

            <div className="space-y-2.5">
              {activeAdmissions.slice(0, 4).map((adm) => (
                <div
                  key={adm.admissionId}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-mediblue-700">{adm.admissionId}</span>
                      <Badge variant="teal">Bed: {adm.bedId.split('_').pop()}</Badge>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">{adm.diagnosis}</p>
                    <p className="text-xs text-slate-500">
                      Patient ID: {adm.patientId} • Admitted: {new Date(adm.admittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to="/staff/admissions">
                    <Button variant="ghost" size="xs">Clinical Chart</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 5 Columns: Departmental Workstations */}
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Clinical Workstation Modules"
              subtitle="Direct access to hospital operational workflows"
              icon={<Activity className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 gap-3">
              {[
                {
                  to: '/staff/opd',
                  title: 'Doctor OPD Queue & E-Prescription',
                  desc: 'Call next patient token, record clinical notes, and issue medications',
                  icon: <Stethoscope className="w-5 h-5 text-mediblue-600" />,
                },
                {
                  to: '/staff/patients',
                  title: 'Walk-In Patient Registration',
                  desc: 'Enroll new patients, assign UHID, and issue immediate OPD tokens',
                  icon: <UserPlus className="w-5 h-5 text-mediteal-600" />,
                },
                {
                  to: '/staff/beds',
                  title: 'Visual Ward & ICU Bed Census',
                  desc: 'Toggle bed availability, maintenance state, and emergency readiness',
                  icon: <Bed className="w-5 h-5 text-emerald-600" />,
                },
                {
                  to: '/staff/diagnostics',
                  title: 'LIS / RIS Diagnostic Order Queue',
                  desc: 'Advance sample collection status and publish verified lab/imaging reports',
                  icon: <FlaskConical className="w-5 h-5 text-amber-600" />,
                },
                {
                  to: '/staff/billing',
                  title: 'Point-of-Care Hospital Billing',
                  desc: 'Generate itemized outpatient/inpatient invoices and record payments',
                  icon: <CreditCard className="w-5 h-5 text-navy-800" />,
                },
              ].map((mod) => (
                <Link
                  key={mod.to}
                  to={mod.to}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-mediblue-400 hover:shadow-xs transition-all flex items-start gap-3.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {mod.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-mediblue-700 flex items-center justify-between">
                      {mod.title}
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-mediblue-600" />
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
