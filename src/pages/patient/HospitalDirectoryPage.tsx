import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital, Department, IpdBed, EmergencyCapacity } from '@/types';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Bed,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  Radio,
  Filter,
} from 'lucide-react';

export const HospitalDirectoryPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const loadData = async () => {
      const [hosps, depts, allBeds] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<IpdBed>('ipd_beds'),
      ]);
      setHospitals(hosps);
      setDepartments(depts);
      setBeds(allBeds);
      setLoading(false);
    };

    loadData();

    // Subscribe to live beds across all hospitals to demonstrate real-time sync
    const unsubBeds = dbService.subscribeCollection<IpdBed>('ipd_beds', (updatedBeds) => {
      setBeds(updatedBeds);
    });

    return () => {
      unsubBeds();
    };
  }, []);

  const getHospitalBedStats = (hospitalId: string) => {
    const hospBeds = beds.filter((b) => b.hospitalId === hospitalId);
    const total = hospBeds.length;
    const occupied = hospBeds.filter((b) => b.status === 'occupied').length;
    const available = hospBeds.filter((b) => b.status === 'available').length;
    const icuAvailable = hospBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
    const icuTotal = hospBeds.filter((b) => b.type === 'ICU').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    let statusType: 'Normal' | 'Surge' | 'Critical' = 'Normal';
    if (occupancyRate >= 85) {
      statusType = 'Surge';
    } else if (icuAvailable <= 1) {
      statusType = 'Critical';
    }

    return { total, occupied, available, icuAvailable, icuTotal, occupancyRate, statusType };
  };

  const filteredHospitals = hospitals.filter((hosp) => {
    const matchesQuery =
      hosp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hosp.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict =
      selectedDistrict === 'all' || hosp.districtId === selectedDistrict;
    const matchesDept =
      selectedDeptFilter === 'all' ||
      departments.some(
        (d) => d.hospitalId === hosp.hospitalId && d.name.toLowerCase().includes(selectedDeptFilter.toLowerCase())
      );
    return matchesQuery && matchesDistrict && matchesDept;
  });

  const districts = Array.from(new Set(hospitals.map((h) => h.districtId)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-mediblue-500/10 px-2.5 py-0.5 text-xs font-semibold text-mediblue-400 border border-mediblue-500/20">
              Live Regional Telemetry
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Radio className="h-3 w-3 animate-ping" />
              <span>Real-Time Bed Sync Active</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Hospital Directory & Bed Availability
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Real-time multi-hospital census. When staff updates a bed status anywhere in the district, this view synchronizes instantly without page refresh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/patient/book"
            className="flex items-center gap-2 rounded-xl bg-mediblue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-mediblue-500 transition shadow-lg shadow-mediblue-950/50"
          >
            <Calendar className="h-4 w-4" />
            <span>Book OPD Appointment</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-1 sm:col-span-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by hospital name or locality..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mediblue-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-white focus:border-mediblue-500 focus:outline-none"
          >
            <option value="all">All Health Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d.replace('dist_', '').replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-white focus:border-mediblue-500 focus:outline-none"
          >
            <option value="all">All Specialty Departments</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="General Medicine">General Medicine</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Emergency">Emergency & Trauma</option>
          </select>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-mediblue-500 border-t-transparent"></div>
          <p className="mt-2 text-xs text-slate-400">Streaming hospital bed telemetry...</p>
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <Building2 className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium">No hospitals matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHospitals.map((hosp) => {
            const stats = getHospitalBedStats(hosp.hospitalId);
            const hospDepts = departments.filter((d) => d.hospitalId === hosp.hospitalId);

            return (
              <div
                key={hosp.hospitalId}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md transition hover:border-mediblue-500/40 hover:shadow-xl hover:shadow-mediblue-950/20"
              >
                <div>
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      ID: {hosp.hospitalId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {stats.statusType === 'Surge' ? (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold animate-pulse">
                          <AlertTriangle className="h-3 w-3" /> Surge ({stats.occupancyRate}%)
                        </span>
                      ) : stats.statusType === 'Critical' ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                          <AlertTriangle className="h-3 w-3" /> ICU Low
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Normal Load
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hospital Name & Locality */}
                  <h3 className="mt-3 text-base font-bold text-white group-hover:text-mediblue-300 transition">
                    {hosp.name}
                  </h3>
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
                    <span className="line-clamp-2">{hosp.address}</span>
                  </div>

                  {/* Real-time Bed Status Meter */}
                  <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Bed Occupancy</span>
                      <span className="font-semibold text-white">{stats.occupancyRate}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          stats.occupancyRate >= 85 ? 'bg-rose-500' : stats.occupancyRate >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(stats.occupancyRate, 100)}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-slate-900 p-1.5 border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 uppercase">Available</p>
                        <p className="text-sm font-bold text-emerald-400">{stats.available} Beds</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-1.5 border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 uppercase">ICU Free</p>
                        <p className={`text-sm font-bold ${stats.icuAvailable <= 1 ? 'text-rose-400' : 'text-sky-400'}`}>
                          {stats.icuAvailable} of {stats.icuTotal}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Departments Chips */}
                  <div className="mt-3">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5">
                      Specialties ({hospDepts.length}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {hospDepts.map((d) => (
                        <span
                          key={d.departmentId}
                          className="rounded bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/50"
                        >
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Phone className="h-3 w-3 text-slate-500" />
                    <span className="truncate max-w-[120px]">{hosp.phone || 'N/A'}</span>
                  </span>
                  <Link
                    to="/patient/book"
                    state={{ hospitalId: hosp.hospitalId }}
                    className="rounded-lg bg-mediblue-600/20 border border-mediblue-500/30 px-3 py-1.5 text-xs font-semibold text-mediblue-300 hover:bg-mediblue-600 hover:text-white transition"
                  >
                    Select Hospital
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
