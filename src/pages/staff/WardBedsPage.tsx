import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdBed, LiveBed } from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, SearchInput } from '@/components/ui';
import {
  Bed,
  CheckCircle2,
  Wrench,
  Activity,
  ShieldAlert,
} from 'lucide-react';

export const WardBedsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'ICU' | 'general'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'available' | 'occupied' | 'maintenance'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadBeds = async () => {
      const all = await dbService.getCollection<IpdBed>('ipd_beds');
      setBeds(all.filter((b) => b.hospitalId === hospitalId));
    };
    loadBeds();

    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (all) => {
      setBeds(all.filter((b) => b.hospitalId === hospitalId));
    });
    return () => unsub();
  }, [hospitalId]);

  const handleUpdateBedStatus = async (bed: IpdBed, nextStatus: 'available' | 'occupied' | 'maintenance') => {
    await dbService.updateDocument('ipd_beds', bed.bedId, {
      status: nextStatus,
      lastUpdated: new Date().toISOString(),
    });

    const liveBed: LiveBed = {
      bedId: bed.bedId,
      status: nextStatus,
      wardId: bed.wardId,
      type: bed.type,
      bedNumber: bed.bedNumber,
      lastUpdated: new Date().toISOString(),
    };
    await dbService.setRTDB(`liveBeds/${bed.hospitalId}/${bed.bedId}`, liveBed);
  };

  const filteredBeds = beds.filter((b) => {
    const matchesType = filterType === 'ALL' || b.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchesQuery =
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.wardId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesQuery;
  });

  const availCount = beds.filter((b) => b.status === 'available').length;
  const occCount = beds.filter((b) => b.status === 'occupied').length;
  const maintCount = beds.filter((b) => b.status === 'maintenance').length;
  const icuAvail = beds.filter((b) => b.type === 'ICU' && b.status === 'available').length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Real-Time Ward & ICU Telemetry"
        title="Interactive Inpatient Bed Census"
        subtitle={`Facility ID: ${hospitalId} • Click any bed status control to synchronize Firestore and RTDB liveBeds state.`}
      />

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Available Ward Beds"
          value={availCount}
          subtitle={`Out of ${beds.length} total facility beds`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="emerald"
        />
        <MetricCard
          label="Occupied Inpatient Beds"
          value={occCount}
          subtitle={`${beds.length > 0 ? Math.round((occCount / beds.length) * 100) : 0}% utilization rate`}
          icon={<Bed className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Open ICU Critical Beds"
          value={icuAvail}
          subtitle="Ready for high-acuity trauma intake"
          icon={<ShieldAlert className="w-5 h-5" />}
          accent="teal"
        />
        <MetricCard
          label="Sanitization / Maintenance"
          value={maintCount}
          subtitle="Temporarily offline for terminal cleaning"
          icon={<Wrench className="w-5 h-5" />}
          accent="amber"
        />
      </div>

      {/* Filter Bar */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by bed code (e.g. ICU-01, GEN-12)..."
          />
          <div className="flex gap-1.5">
            {(['ALL', 'ICU', 'general'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                  filterType === t
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Wards' : t === 'ICU' ? 'ICU Wing' : 'General Ward'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(['ALL', 'available', 'occupied', 'maintenance'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold border capitalize cursor-pointer ${
                  filterStatus === s
                    ? 'bg-mediblue-600 text-white border-mediblue-600'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All States' : s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Visual Bed Grid */}
      <Card padding="lg">
        <SectionHeader
          title={`Floor Bed Matrix (${filteredBeds.length} Beds Shown)`}
          subtitle="Instant state transitions update patient directory and emergency routing capacity"
          icon={<Activity className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredBeds.map((bed) => (
            <div
              key={bed.bedId}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                bed.status === 'available'
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : bed.status === 'occupied'
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold font-mono text-slate-900">
                    {bed.bedNumber}
                  </span>
                  <Badge variant={bed.type === 'ICU' ? 'danger' : 'info'}>
                    {bed.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Ward: {bed.wardId}</p>
                <div className="mt-2.5">
                  <Badge
                    variant={
                      bed.status === 'available'
                        ? 'success'
                        : bed.status === 'occupied'
                        ? 'warning'
                        : 'neutral'
                    }
                    dot
                  >
                    {bed.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-slate-200/70">
                {(['available', 'occupied', 'maintenance'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={bed.status === st}
                    onClick={() => handleUpdateBedStatus(bed, st)}
                    className={`py-1 px-1.5 rounded text-[11px] font-semibold capitalize border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      bed.status === st
                        ? 'bg-slate-200 text-slate-600 border-slate-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st === 'maintenance' ? 'Clean' : st === 'available' ? 'Free' : 'Occupy'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
