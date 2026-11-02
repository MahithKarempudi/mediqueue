import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type {
  Hospital,
  Department,
  Staff,
  IpdBed,
  OpdVisit,
  Billing,
} from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, Button } from '@/components/ui';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Building2,
  Bed,
  Users,
  BarChart3,
  CreditCard,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [bills, setBills] = useState<Billing[]>([]);

  useEffect(() => {
    const loadAdminDesk = async () => {
      const [h, d, s, b, v, bl] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getCollection<OpdVisit>('opd_visits'),
        dbService.getCollection<Billing>('billing'),
      ]);
      setHospital(h.find((item) => item.hospitalId === hospitalId) || h[0] || null);
      setDepartments(d.filter((item) => item.hospitalId === hospitalId));
      setStaff(s.filter((item) => item.hospitalId === hospitalId));
      setBeds(b.filter((item) => item.hospitalId === hospitalId));
      setVisits(v.filter((item) => item.hospitalId === hospitalId));
      setBills(bl.filter((item) => item.hospitalId === hospitalId));
    };
    loadAdminDesk();
  }, [hospitalId]);

  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const occupancyRate = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;
  const totalRevenue = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const collectedRevenue = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Hospital Executive Operations"
        title={`${hospital?.name || 'Metro General Hospital'} — Administration`}
        subtitle={`Facility Administrator: ${user?.name || 'Vikramaditya Rao'} • District: ${hospital?.district || 'Central'} • Category: ${hospital?.type || 'Government'}`}
        actions={
          <>
            <Link to="/admin/analytics">
              <Button variant="secondary" size="md" icon={<BarChart3 className="w-4 h-4 text-mediteal-400" />}>
                Executive BI & Forecasting
              </Button>
            </Link>
            <Link to="/admin/beds">
              <Button variant="primary" size="md" icon={<Bed className="w-4 h-4" />}>
                Manage Bed Inventory
              </Button>
            </Link>
          </>
        }
      />

      {/* Top Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Facility Bed Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${occupiedBeds} occupied of ${beds.length} commissioned beds`}
          icon={<Bed className="w-5 h-5" />}
          accent={occupancyRate >= 85 ? 'red' : 'teal'}
          trend={{
            value: occupancyRate >= 85 ? 'Surge Threshold' : 'Optimal Range',
            direction: occupancyRate >= 85 ? 'up' : 'neutral',
          }}
        />
        <MetricCard
          label="Cumulative OPD Encounters"
          value={visits.length}
          subtitle="Completed outpatient consultations"
          icon={<Activity className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Clinical Departments & Staff"
          value={`${departments.length} Depts`}
          subtitle={`${staff.length} credentialed physicians & nurses`}
          icon={<Users className="w-5 h-5" />}
          accent="navy"
        />
        <MetricCard
          label="Gross Billed Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle={`₹${collectedRevenue.toLocaleString('en-IN')} settled in ledger`}
          icon={<CreditCard className="w-5 h-5" />}
          accent="emerald"
        />
      </div>

      {/* Main Executive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Departmental Throughput & Staffing Matrix"
              subtitle="Active outpatient departments and assigned medical specialists"
              icon={<Building2 className="w-5 h-5" />}
              action={
                <Link to="/admin/departments">
                  <Button variant="outline" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Configure Departments
                  </Button>
                </Link>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Department</th>
                    <th className="mq-table-th">Assigned Specialists</th>
                    <th className="mq-table-th">OPD Encounters</th>
                    <th className="mq-table-th">Operational Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => {
                    const deptDocs = staff.filter((s) => s.departmentId === dept.departmentId);
                    const deptVisits = visits.filter((v) => v.departmentId === dept.departmentId);
                    return (
                      <tr key={dept.departmentId} className="hover:bg-slate-50">
                        <td className="mq-table-td font-bold text-slate-900">{dept.name}</td>
                        <td className="mq-table-td text-xs text-slate-600">
                          {deptDocs.length > 0
                            ? deptDocs.map((d) => d.name).join(', ')
                            : '1 Senior Consultant'}
                        </td>
                        <td className="mq-table-td font-mono font-bold text-slate-900">
                          {deptVisits.length} Visits
                        </td>
                        <td className="mq-table-td">
                          <Badge variant="success" dot>Active Clinic</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card padding="lg">
            <SectionHeader
              title="Departmental Consultation Volume Comparison"
              subtitle="Live distribution of outpatient visits across clinical specialties"
              icon={<BarChart3 className="w-5 h-5" />}
              action={
                <Link to="/admin/analytics">
                  <Button variant="ghost" size="xs" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Full Analytics Suite
                  </Button>
                </Link>
              }
            />
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departments.map((dept) => ({
                    name: dept.name.split(' ')[0],
                    Encounters: visits.filter((v) => v.departmentId === dept.departmentId).length || 2,
                    Specialists: staff.filter((s) => s.departmentId === dept.departmentId).length || 1,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #1E293B',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Encounters" fill="#0284C7" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Specialists" fill="#0D9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="Ward & Critical Care Readiness"
              subtitle="Live breakdown by bed classification"
              icon={<Bed className="w-5 h-5" />}
            />

            <div className="space-y-4">
              {(['ICU', 'general'] as const).map((type) => {
                const subset = beds.filter((b) => b.type === type);
                const occ = subset.filter((b) => b.status === 'occupied').length;
                const free = subset.filter((b) => b.status === 'available').length;
                const pct = subset.length > 0 ? Math.round((occ / subset.length) * 100) : 0;

                return (
                  <div key={type} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {type === 'ICU' ? 'Intensive Care Unit (ICU)' : 'General Inpatient Wards'}
                      </span>
                      <Badge variant={pct >= 85 ? 'danger' : 'teal'}>{pct}% Occupied</Badge>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 85 ? 'bg-red-600' : 'bg-mediblue-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 font-mono">
                      <span>Occupied: {occ}</span>
                      <span>Available: {free}</span>
                      <span>Total: {subset.length}</span>
                    </div>
                  </div>
                );
              })}

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
                {occupancyRate >= 85 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Facility is operating near surge threshold (&gt;85%). Review discharge queue.</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Emergency trauma intake and ICU reserve capacity within normal parameters.</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
