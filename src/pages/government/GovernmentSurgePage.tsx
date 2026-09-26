import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital, IpdBed, EmergencyCapacity } from '@/types';
import {
  AlertTriangle,
  Building2,
  Radio,
  Activity,
  Bed,
  CheckCircle2,
  Search,
  Users,
  ShieldAlert,
} from 'lucide-react';

export const GovernmentSurgePage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dbService.getCollection<Hospital>('hospitals').then(setHospitals);
    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (items) => {
      setBeds(items);
    });
    return () => unsub();
  }, []);

  const getStats = (hospitalId: string) => {
    const hospBeds = beds.filter((b) => b.hospitalId === hospitalId);
    const total = hospBeds.length;
    const occupied = hospBeds.filter((b) => b.status === 'occupied').length;
    const available = hospBeds.filter((b) => b.status === 'available').length;
    const icuAvailable = hospBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
    const icuTotal = hospBeds.filter((b) => b.type === 'ICU').length;
    const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const isSurge = rate >= 85;

    return { total, occupied, available, icuAvailable, icuTotal, rate, isSurge };
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.districtId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              District Epidemiological Surveillance
            </span>
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <Radio className="h-3 w-3 animate-ping" />
              <span>Surge Threshold Monitor (&gt;85% Red Flag)</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Hospital Bed Capacity & Surge Monitor
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Live surveillance across accredited regional hospitals. Facilities exceeding 85% bed utilization are highlighted in RED alert to trigger district patient diversion protocols.
          </p>
        </div>
      </div>

      {/* Surge Alert Summary Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>District Bed Saturation Status: Level 2 Surge Alert</span>
              <span className="rounded-full bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                Critical Surveillance Active
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              AIIMS Apex Trauma Center has reached 90% bed saturation (&gt;85% red threshold). Recommended action: Divert non-critical emergency arrivals to Apollo Indraprastha or Fortis Escorts.
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Surveillance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredHospitals.map((hosp) => {
          const stats = getStats(hosp.hospitalId);

          return (
            <div
              key={hosp.hospitalId}
              className={`rounded-2xl border p-5 shadow-xl transition-all duration-300 ${
                stats.isSurge
                  ? 'border-rose-500/60 bg-rose-950/30 ring-1 ring-rose-500/30 shadow-rose-950/40'
                  : stats.rate >= 70
                  ? 'border-amber-500/40 bg-slate-900/90'
                  : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="font-mono text-[10px] text-slate-400 uppercase">
                  {hosp.districtId.replace('dist_', '').replace('_', ' ')}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase flex items-center gap-1 ${
                    stats.isSurge
                      ? 'bg-rose-600 text-white shadow-md animate-pulse'
                      : stats.rate >= 70
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {stats.isSurge && <AlertTriangle className="h-3 w-3" />}
                  {stats.isSurge ? 'SURGE ALERT (>85%)' : stats.rate >= 70 ? 'Moderate Load' : 'Normal Capacity'}
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-white">{hosp.name}</h3>
              <p className="mt-0.5 text-xs text-slate-400 truncate">{hosp.address}</p>

              {/* Progress Bar */}
              <div className="mt-4 rounded-xl bg-slate-950/70 p-3 border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Bed Occupancy:</span>
                  <span className={`font-mono font-bold ${stats.isSurge ? 'text-rose-400' : 'text-white'}`}>
                    {stats.rate}%
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.isSurge ? 'bg-rose-500' : stats.rate >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(stats.rate, 100)}%` }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Free Beds</p>
                    <p className="text-sm font-bold text-emerald-400">{stats.available}</p>
                  </div>
                  <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">ICU Free</p>
                    <p className={`text-sm font-bold ${stats.icuAvailable <= 1 ? 'text-rose-400' : 'text-sky-400'}`}>
                      {stats.icuAvailable} of {stats.icuTotal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
