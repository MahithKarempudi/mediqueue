import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '@/services/db';
import type { Hospital, IpdBed, OpdVisit, EmergencyCapacity } from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Globe,
  Building2,
  Bed,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Download,
} from 'lucide-react';

export const GovernmentDashboard: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [capacities, setCapacities] = useState<Record<string, EmergencyCapacity>>({});
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');

  useEffect(() => {
    const loadGovData = async () => {
      const [h, b, v, c] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getCollection<OpdVisit>('opd_visits'),
        dbService.getRTDB<Record<string, EmergencyCapacity>>('emergencyCapacity'),
      ]);
      setHospitals(h);
      setBeds(b);
      setVisits(v);
      if (c) setCapacities(c);
    };
    loadGovData();
  }, []);

  const districts = ['ALL', ...Array.from(new Set(hospitals.map((h) => h.district)))];
  const filteredHospitals =
    selectedDistrict === 'ALL'
      ? hospitals
      : hospitals.filter((h) => h.district === selectedDistrict);

  const filteredHospIds = new Set(filteredHospitals.map((h) => h.hospitalId));
  const filteredBeds = beds.filter((b) => filteredHospIds.has(b.hospitalId));
  const occupiedCount = filteredBeds.filter((b) => b.status === 'occupied').length;
  const regionalOccupancyPct =
    filteredBeds.length > 0 ? Math.round((occupiedCount / filteredBeds.length) * 100) : 0;

  const icuAvailable = filteredBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
  const surgeFacilities = filteredHospitals.filter((h) => {
    const hb = beds.filter((b) => b.hospitalId === h.hospitalId);
    const occ = hb.filter((b) => b.status === 'occupied').length;
    return hb.length > 0 && occ / hb.length >= 0.85;
  });

  const chartData = filteredHospitals.map((h) => {
    const hb = beds.filter((b) => b.hospitalId === h.hospitalId);
    return {
      name: h.name.split(' ').slice(0, 2).join(' '),
      Occupied: hb.filter((b) => b.status === 'occupied').length,
      Available: hb.filter((b) => b.status === 'available').length,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge="State Directorate of Health Services • Aggregate Surveillance"
        title="Regional Healthcare Capacity & Surge Command"
        subtitle="Macro-level hospital bed utilization, ICU reserve readiness, and outpatient throughput across regional districts."
        actions={
          <>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="mq-input min-w-[180px]"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'All Regional Districts' : `${d} District`}
                </option>
              ))}
            </select>
            <Link to="/government/reports">
              <Button variant="primary" size="md" icon={<Download className="w-4 h-4" />}>
                Export Regional Audit
              </Button>
            </Link>
          </>
        }
      />

      {/* Privacy & Data Governance Notice */}
      <NoticeBanner variant="info" title="Privacy-Preserving Aggregate Telemetry Scope">
        In accordance with public health data governance, the Government Officer workspace displays anonymized facility-level census and epidemiological volume metrics. Individual patient identities (PII/UHID) and clinical notes are restricted.
      </NoticeBanner>

      {/* Top Regional KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Accredited Regional Facilities"
          value={filteredHospitals.length}
          subtitle={`${filteredBeds.length} total commissioned beds`}
          icon={<Building2 className="w-5 h-5" />}
          accent="navy"
        />
        <MetricCard
          label="Regional Bed Occupancy"
          value={`${regionalOccupancyPct}%`}
          subtitle={`${occupiedCount} occupied / ${filteredBeds.length - occupiedCount} free`}
          icon={<Bed className="w-5 h-5" />}
          accent={regionalOccupancyPct >= 85 ? 'red' : 'teal'}
        />
        <MetricCard
          label="Open Regional ICU Reserve"
          value={`${icuAvailable} Beds`}
          subtitle="Critical care trauma readiness"
          icon={<Activity className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Active Surge Alerts (>85%)"
          value={surgeFacilities.length}
          subtitle={surgeFacilities.length > 0 ? 'Facilities near capacity ceiling' : 'All facilities within normal limits'}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent={surgeFacilities.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Comparative Regional Chart + Facility Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <Card padding="lg">
            <SectionHeader
              title="Comparative Hospital Bed Utilization"
              subtitle="Occupied vs. Available inpatient beds by facility"
              icon={<Globe className="w-5 h-5" />}
            />

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Legend />
                  <Bar dataKey="Occupied" stackId="a" fill="#0B172A" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Available" stackId="a" fill="#0D9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Regional Surge Alert Threshold: <strong className="text-slate-800">85% Bed Utilization</strong></span>
              <Link to="/government/surge-map" className="font-semibold text-mediblue-600 hover:text-mediblue-700">
                Open District Surge Command →
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card padding="lg">
            <SectionHeader
              title="Regional Hospital Surveillance Matrix"
              subtitle={`Total Regional OPD Volume: ${visits.length} Encounters`}
              icon={<ShieldCheck className="w-5 h-5" />}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Hospital</th>
                    <th className="mq-table-th">District</th>
                    <th className="mq-table-th">Occupancy</th>
                    <th className="mq-table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHospitals.map((h) => {
                    const hb = beds.filter((b) => b.hospitalId === h.hospitalId);
                    const occ = hb.filter((b) => b.status === 'occupied').length;
                    const pct = hb.length > 0 ? Math.round((occ / hb.length) * 100) : 0;
                    const cap = capacities[h.hospitalId];

                    return (
                      <tr key={h.hospitalId} className="hover:bg-slate-50">
                        <td className="mq-table-td">
                          <div className="font-bold text-slate-900">{h.name}</div>
                          <div className="text-xs text-slate-500">{h.type} Sector</div>
                        </td>
                        <td className="mq-table-td text-xs font-semibold text-slate-700">{h.district}</td>
                        <td className="mq-table-td font-mono font-bold text-slate-900">
                          {pct}% ({occ}/{hb.length})
                        </td>
                        <td className="mq-table-td">
                          <Badge
                            variant={
                              pct >= 85
                                ? 'danger'
                                : cap?.emergencyStatus === 'Diverting'
                                ? 'warning'
                                : 'success'
                            }
                            dot
                          >
                            {pct >= 85 ? 'SURGE' : cap?.emergencyStatus || 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
