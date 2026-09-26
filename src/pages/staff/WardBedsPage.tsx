import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdBed, BedStatus, BedType, Hospital } from '@/types';
import {
  Bed,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Search,
  Filter,
  Users,
  Activity,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react';

export const WardBedsPage: React.FC = () => {
  const { user } = useAuth();
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    user?.hospitalId || 'hosp_metro_01'
  );
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingBedId, setUpdatingBedId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Load hospitals for facility switcher
    dbService.getCollection<Hospital>('hospitals').then(setHospitals);

    // Subscribe to beds for real-time multi-tab reflection
    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (items) => {
      setBeds(items);
    });

    return () => unsub();
  }, []);

  const hospBeds = beds.filter((b) => b.hospitalId === selectedHospitalId);

  const filteredBeds = hospBeds.filter((b) => {
    const matchesType = selectedType === 'all' || b.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;
    const matchesSearch =
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.wardId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const totalBeds = hospBeds.length;
  const occupiedCount = hospBeds.filter((b) => b.status === 'occupied').length;
  const availableCount = hospBeds.filter((b) => b.status === 'available').length;
  const maintenanceCount = hospBeds.filter((b) => b.status === 'maintenance').length;
  const icuAvailable = hospBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
  const icuTotal = hospBeds.filter((b) => b.type === 'ICU').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  const handleToggleBedStatus = async (bed: IpdBed, newStatus: BedStatus) => {
    setUpdatingBedId(bed.bedId);
    try {
      const patientName = newStatus === 'occupied' ? 'Walk-in Admission (Dr. Kumar)' : undefined;
      await dbService.updateBedStatus(bed.hospitalId, bed.bedId, newStatus, patientName);
      
      setSyncFeedback(`Bed ${bed.bedNumber} transitioned to ${newStatus.toUpperCase()}. RTDB liveBeds & emergencyCapacity mirrored!`);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      console.error('Failed to update bed status:', err);
    } finally {
      setUpdatingBedId(null);
    }
  };

  const currentHospital = hospitals.find((h) => h.hospitalId === selectedHospitalId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
              Ward Management Console
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Radio className="h-3 w-3 animate-ping" />
              <span>Real-Time RTDB Sync Active</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Live Ward Beds & Census
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Click any bed status to instantly toggle it. Changes write atomically to Firestore and mirror to Firebase Realtime Database (`liveBeds` & `emergencyCapacity`), updating patient, admin, and government screens in real-time.
          </p>
        </div>

        {/* Hospital Facility Selector (Admins/SuperAdmins or multi-hospital testing) */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-500" />
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white focus:border-sky-500 focus:outline-none"
          >
            {hospitals.map((h) => (
              <option key={h.hospitalId} value={h.hospitalId}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sync Alert Banner */}
      {syncFeedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs text-emerald-300 animate-fade-in shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{syncFeedback}</span>
        </div>
      )}

      {/* Real-time Metric Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Beds</span>
          <p className="mt-1 text-2xl font-extrabold text-white">{totalBeds}</p>
          <span className="text-[10px] text-slate-500">{currentHospital?.districtId}</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
          <span className="text-[11px] text-emerald-400 uppercase font-semibold">Available</span>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">{availableCount}</p>
          <span className="text-[10px] text-emerald-400/70">Ready for intake</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Occupied</span>
          <p className="mt-1 text-2xl font-extrabold text-white">{occupiedCount}</p>
          <span className="text-[10px] text-slate-500">{occupancyRate}% Utilization</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
          <span className="text-[11px] text-sky-400 uppercase font-semibold">ICU Free</span>
          <p className={`mt-1 text-2xl font-extrabold ${icuAvailable <= 1 ? 'text-rose-400' : 'text-sky-400'}`}>
            {icuAvailable} <span className="text-xs text-slate-500 font-normal">/ {icuTotal}</span>
          </p>
          <span className="text-[10px] text-slate-500">Critical care units</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md">
          <span className="text-[11px] text-amber-400 uppercase font-semibold">Maintenance</span>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">{maintenanceCount}</p>
          <span className="text-[10px] text-slate-500">Sanitization/Repairs</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bed number (e.g. ICU-01) or patient name..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Bed Type Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {['all', 'ICU', 'general', 'emergency', 'pediatric'].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                selectedType === t
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {['all', 'available', 'occupied', 'maintenance'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                selectedStatus === s
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bed Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isUpdating = updatingBedId === bed.bedId;
          const isIcu = bed.type === 'ICU';
          const isOccupied = bed.status === 'occupied';
          const isAvailable = bed.status === 'available';
          const isMaintenance = bed.status === 'maintenance';

          return (
            <div
              key={bed.bedId}
              className={`relative rounded-2xl border p-4 transition-all duration-200 ${
                isAvailable
                  ? 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/60'
                  : isOccupied
                  ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                  : 'border-amber-500/30 bg-amber-950/20'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white tracking-wide">
                    {bed.bedNumber}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      isIcu
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {bed.type}
                  </span>
                </div>

                {/* Live Status Pill */}
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                    isAvailable
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isOccupied
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isAvailable ? 'bg-emerald-400' : isOccupied ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                  />
                  {bed.status}
                </span>
              </div>

              {/* Patient / Ward Info */}
              <div className="mt-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Ward:</span>
                  <span className="font-mono text-slate-300">{bed.wardId}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Occupant:</span>
                  <span className="font-medium text-white truncate max-w-[140px]">
                    {bed.patientName || (isAvailable ? '— Empty —' : 'Maintenance')}
                  </span>
                </div>
              </div>

              {/* Instant Status Toggle Control Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                  Update Status (Live RTDB):
                </p>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    disabled={isUpdating || isAvailable}
                    onClick={() => handleToggleBedStatus(bed, 'available')}
                    className={`rounded-lg py-1 text-[10px] font-bold transition ${
                      isAvailable
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-emerald-900/50 hover:text-emerald-300'
                    }`}
                  >
                    Available
                  </button>

                  <button
                    disabled={isUpdating || isOccupied}
                    onClick={() => handleToggleBedStatus(bed, 'occupied')}
                    className={`rounded-lg py-1 text-[10px] font-bold transition ${
                      isOccupied
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-rose-900/50 hover:text-rose-300'
                    }`}
                  >
                    Occupied
                  </button>

                  <button
                    disabled={isUpdating || isMaintenance}
                    onClick={() => handleToggleBedStatus(bed, 'maintenance')}
                    className={`rounded-lg py-1 text-[10px] font-bold transition ${
                      isMaintenance
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:bg-amber-900/50 hover:text-amber-300'
                    }`}
                  >
                    Service
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
