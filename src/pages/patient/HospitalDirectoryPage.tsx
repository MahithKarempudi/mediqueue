import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dbService } from '@/services/db';
import type { Hospital, Department, EmergencyCapacity } from '@/types';
import { PageHeader, Card, Badge, Button, SearchInput } from '@/components/ui';
import {
  Building2,
  MapPin,
  Bed,
  Activity,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const HospitalDirectoryPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [capacities, setCapacities] = useState<Record<string, EmergencyCapacity>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  useEffect(() => {
    const loadDirectory = async () => {
      const [h, d, c] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getRTDB<Record<string, EmergencyCapacity>>('emergencyCapacity'),
      ]);
      setHospitals(h);
      setDepartments(d);
      if (c) setCapacities(c);
    };
    loadDirectory();
  }, []);

  const districts = ['ALL', ...Array.from(new Set(hospitals.map((h) => h.district)))];

  const filteredHospitals = hospitals.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.district.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'ALL' || h.district === selectedDistrict;
    const matchesType = selectedType === 'ALL' || h.type === selectedType;
    return matchesSearch && matchesDistrict && matchesType;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Regional Healthcare Network"
        title="Accredited Hospital Directory & Live Census"
        subtitle="Inspect real-time ICU and general bed availability, specialty departments, and emergency trauma status across participating regional facilities."
        actions={
          <Link to="/patient/book">
            <Button variant="primary" size="md" icon={<Calendar className="w-4 h-4" />}>
              Schedule OPD Visit
            </Button>
          </Link>
        }
      />

      {/* Search & Filter Controls */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="mq-label">Search Hospital or Locality</label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by hospital name, street address, or district..."
            />
          </div>
          <div>
            <label className="mq-label">Regional District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="mq-input"
            >
              {districts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist === 'ALL' ? 'All Regional Districts' : `${dist} District`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mq-label">Institution Category</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="mq-input"
            >
              <option value="ALL">All Categories (Gov & Private)</option>
              <option value="Government">Public / Government</option>
              <option value="Private">Accredited Private</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHospitals.map((hosp) => {
          const hospDepts = departments.filter((d) => d.hospitalId === hosp.hospitalId);
          const cap = capacities[hosp.hospitalId] || {
            icuBedsFree: 3,
            generalBedsFree: 14,
            emergencyStatus: hosp.emergencyAvailable ? 'Normal' : 'Diverting',
          };

          const totalBeds = hosp.totalBeds || 36;
          const totalFree = cap.icuBedsFree + cap.generalBedsFree;
          const occupiedCount = Math.max(0, totalBeds - totalFree);
          const occupancyPct = Math.min(100, Math.round((occupiedCount / totalBeds) * 100));

          return (
            <Card key={hosp.hospitalId} padding="lg" className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-navy-900 text-mediteal-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900">{hosp.name}</h3>
                        <Badge variant={hosp.type === 'Government' ? 'info' : 'teal'}>
                          {hosp.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {hosp.address} • {hosp.district} District
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      cap.emergencyStatus === 'Normal'
                        ? 'success'
                        : cap.emergencyStatus === 'Surge'
                        ? 'warning'
                        : 'danger'
                    }
                    dot
                  >
                    {cap.emergencyStatus}
                  </Badge>
                </div>

                {/* Live Bed Telemetry */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-mediblue-600" />
                      Overall Ward Occupancy ({occupiedCount} / {totalBeds} Beds)
                    </span>
                    <span className="font-mono font-bold text-slate-900">{occupancyPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occupancyPct >= 85
                          ? 'bg-red-600'
                          : occupancyPct >= 70
                          ? 'bg-amber-500'
                          : 'bg-mediteal-600'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                        ICU Beds Open
                      </span>
                      <span className="text-base font-extrabold font-display text-mediblue-700">
                        {cap.icuBedsFree}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                        General Open
                      </span>
                      <span className="text-base font-extrabold font-display text-mediteal-700">
                        {cap.generalBedsFree}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                        Trauma Unit
                      </span>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-1">
                        {hosp.emergencyAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 24×7 Active
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Diverting
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clinical Specialties */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Clinical Departments ({hospDepts.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hospDepts.map((dept) => (
                      <span
                        key={dept.departmentId}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        {dept.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-400">
                  Facility ID: {hosp.hospitalId}
                </span>
                <div className="flex items-center gap-2">
                  <Link to="/patient/queue">
                    <Button variant="outline" size="sm" icon={<Activity className="w-3.5 h-3.5" />}>
                      Live OPD Queue
                    </Button>
                  </Link>
                  <Link to="/patient/book">
                    <Button variant="primary" size="sm" icon={<Calendar className="w-3.5 h-3.5" />}>
                      Book Slot
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
