import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital, Department, EmergencyCapacity, HospitalStatus } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  Building2,
  Plus,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

export const HospitalOnboardingPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Central');
  const [type, setType] = useState<'Government' | 'Private'>('Government');
  const [address, setAddress] = useState('');
  const [totalBeds, setTotalBeds] = useState<number>(40);
  const [emergencyAvailable, setEmergencyAvailable] = useState<boolean>(true);
  const [lat, setLat] = useState<number>(28.625);
  const [lng, setLng] = useState<number>(77.215);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadHospitals = async () => {
      const list = await dbService.getCollection<Hospital>('hospitals');
      setHospitals(list);
    };
    loadHospitals();

    const unsub = dbService.subscribeCollection<Hospital>('hospitals', setHospitals);
    return () => unsub();
  }, []);

  const handleOnboardHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const hospitalId = `hosp_${Date.now().toString().slice(-5)}`;
    const newHospital: Hospital = {
      hospitalId,
      name: name.trim(),
      district,
      type,
      address: address.trim(),
      totalBeds: Number(totalBeds),
      emergencyAvailable,
      location: { lat: Number(lat), lng: Number(lng) },
    };

    await dbService.setDocument('hospitals', hospitalId, newHospital);

    // Seed default Cardiology & General Medicine departments for this tenant
    const defaultDepts: Department[] = [
      { departmentId: `dept_cardio_${hospitalId}`, hospitalId, name: 'Cardiology' },
      { departmentId: `dept_gen_${hospitalId}`, hospitalId, name: 'General Medicine' },
    ];
    for (const d of defaultDepts) {
      await dbService.setDocument('departments', d.departmentId, d);
    }

    // Initialize RTDB Emergency Capacity & Status nodes
    const cap: EmergencyCapacity = {
      icuBedsFree: Math.max(2, Math.floor(Number(totalBeds) * 0.15)),
      generalBedsFree: Math.max(8, Math.floor(Number(totalBeds) * 0.5)),
      emergencyStatus: emergencyAvailable ? 'Normal' : 'Diverting',
      lastUpdated: new Date().toISOString(),
    };
    await dbService.setRTDB(`emergencyCapacity/${hospitalId}`, cap);

    const hospStatus: HospitalStatus = {
      operational: true,
      emergencyOpen: emergencyAvailable,
      surgeAlert: false,
    };
    await dbService.setRTDB(`hospitalStatus/${hospitalId}`, hospStatus);

    setName('');
    setAddress('');
    setStatusMsg(
      `Onboarded "${newHospital.name}" (${hospitalId}) with default clinical departments and live RTDB emergency telemetry.`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Multi-Hospital Tenant Registry"
        title="Institutional Hospital Onboarding"
        subtitle="Commission new public or private hospital tenants into the regional MediQueue network with automatic RTDB telemetry initialization."
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="Hospital Tenant Commissioned" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card padding="lg">
            <SectionHeader
              title="Commission New Facility"
              subtitle="Initializes Firestore collections and RTDB capacity nodes"
              icon={<Plus className="w-5 h-5" />}
            />

            <form onSubmit={handleOnboardHospital} className="space-y-4">
              <div>
                <label className="mq-label">Official Institution Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Indraprastha Heart & Trauma Institute"
                  className="mq-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mq-label">Regional District</label>
                  <select value={district} onChange={(e) => setDistrict(e.target.value)} className="mq-input">
                    {['Central', 'South', 'North', 'East', 'West'].map((d) => (
                      <option key={d} value={d}>
                        {d} District
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mq-label">Governance Sector</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'Government' | 'Private')}
                    className="mq-input"
                  >
                    <option value="Government">Government / Public</option>
                    <option value="Private">Accredited Private</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mq-label">Street Address & Locality *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Ring Road, Lajpat Nagar, New Delhi"
                  className="mq-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mq-label">Total Beds</label>
                  <input
                    type="number"
                    min={10}
                    max={1500}
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="mq-input"
                  />
                </div>
                <div>
                  <label className="mq-label">Latitude</label>
                  <input
                    type="number"
                    step="0.001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="mq-input font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="mq-label">Longitude</label>
                  <input
                    type="number"
                    step="0.001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="mq-input font-mono text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={emergencyAvailable}
                  onChange={(e) => setEmergencyAvailable(e.target.checked)}
                  className="rounded text-mediteal-600"
                />
                <span>24×7 Emergency Trauma & ICU Intake Enabled</span>
              </label>

              <Button type="submit" variant="primary" size="lg" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                Onboard Hospital Facility
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card padding="lg">
            <SectionHeader
              title={`Commissioned Network Facilities (${hospitals.length})`}
              subtitle="Active hospital tenants in the regional directory"
              icon={<Building2 className="w-5 h-5" />}
            />

            <div className="space-y-3">
              {hospitals.map((h) => (
                <div
                  key={h.hospitalId}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-mediblue-700">{h.hospitalId}</span>
                      <Badge variant={h.type === 'Government' ? 'info' : 'teal'}>{h.type}</Badge>
                      <Badge variant={h.emergencyAvailable ? 'success' : 'warning'} dot>
                        {h.emergencyAvailable ? '24×7 Emergency' : 'OPD Only'}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{h.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {h.address} ({h.district} District)
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs text-slate-400 block">Capacity</span>
                    <span className="text-sm font-bold text-slate-900">{h.totalBeds || 36} Beds</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
