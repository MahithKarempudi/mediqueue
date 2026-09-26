import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdBed, BedType, BedStatus, Hospital } from '@/types';
import {
  Bed,
  Plus,
  Search,
  Filter,
  Radio,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  BarChart2,
} from 'lucide-react';

export const AdminBedsPage: React.FC = () => {
  const { user } = useAuth();
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    user?.hospitalId || 'hosp_metro_01'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBed, setNewBed] = useState({
    wardId: 'ward_icu_01',
    bedNumber: '',
    type: 'ICU' as BedType,
  });

  useEffect(() => {
    dbService.getCollection<Hospital>('hospitals').then(setHospitals);
    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (items) => {
      setBeds(items);
    });
    return () => unsub();
  }, []);

  const hospBeds = beds.filter((b) => b.hospitalId === selectedHospitalId);
  const filteredBeds = hospBeds.filter(
    (b) =>
      b.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.wardId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.patientName && b.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const total = hospBeds.length;
  const occupied = hospBeds.filter((b) => b.status === 'occupied').length;
  const available = hospBeds.filter((b) => b.status === 'available').length;
  const icuAvailable = hospBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
  const icuTotal = hospBeds.filter((b) => b.type === 'ICU').length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBed.bedNumber) return;

    const bedId = `bed_${selectedHospitalId}_${Date.now()}`;
    const bedToCreate: IpdBed = {
      bedId,
      hospitalId: selectedHospitalId,
      wardId: newBed.wardId,
      bedNumber: newBed.bedNumber,
      type: newBed.type,
      status: 'available',
    };

    await dbService.setDocument('ipd_beds', bedId, bedToCreate);
    await dbService.setRTDB(`liveBeds/${selectedHospitalId}/${bedId}`, {
      bedId,
      status: 'available',
      wardId: newBed.wardId,
      type: newBed.type,
      lastUpdated: new Date().toISOString(),
      bedNumber: newBed.bedNumber,
    });

    setShowAddModal(false);
    setNewBed({ wardId: 'ward_icu_01', bedNumber: '', type: 'ICU' });
  };

  const currentHospital = hospitals.find((h) => h.hospitalId === selectedHospitalId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Institutional Asset Management
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital: {selectedHospitalId}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bed Inventory & Ward Configuration
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Audit ward capacity, provision new patient units, and inspect real-time occupancy distribution across ICU and general wings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-950/50"
          >
            <Plus className="h-4 w-4" />
            <span>Add Inpatient Bed</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Total Asset Count</span>
          <p className="mt-1 text-2xl font-bold text-white">{total} Beds</p>
          <span className="text-[10px] text-slate-500">Configured in Firestore</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-emerald-400">Available Units</span>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{available}</p>
          <span className="text-[10px] text-slate-500">Ready for admissions</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-indigo-400">Occupancy Ratio</span>
          <p className="mt-1 text-2xl font-bold text-indigo-400">{occupancyRate}%</p>
          <span className="text-[10px] text-slate-500">{occupied} currently admitted</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-sky-400">ICU Bed Reserve</span>
          <p className="mt-1 text-2xl font-bold text-sky-400">{icuAvailable} / {icuTotal}</p>
          <span className="text-[10px] text-slate-500">Intensive care free</span>
        </div>
      </div>

      {/* Table & Search */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by bed number, ward, or patient..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredBeds.length} of {hospBeds.length} units
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Bed Identifier</th>
                <th className="px-4 py-3">Ward Code</th>
                <th className="px-4 py-3">Specialty Classification</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Occupant / Case</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredBeds.map((b) => (
                <tr key={b.bedId} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-white">{b.bedNumber}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.wardId}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-semibold text-slate-300 capitalize">
                      {b.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                        b.status === 'available'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.status === 'occupied'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{b.patientName || '— Available —'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        dbService.updateBedStatus(
                          b.hospitalId,
                          b.bedId,
                          b.status === 'maintenance' ? 'available' : 'maintenance'
                        )
                      }
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {b.status === 'maintenance' ? 'Mark Operational' : 'Mark Service'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bed Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-400" />
              <span>Provision Inpatient Bed Unit</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Allocates a physical bed into Firestore and mirrors immediately to RTDB.
            </p>

            <form onSubmit={handleAddBed} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400">Bed Number / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU-25 or GEN-41"
                  value={newBed.bedNumber}
                  onChange={(e) => setNewBed({ ...newBed, bedNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Ward Identifier *</label>
                <select
                  value={newBed.wardId}
                  onChange={(e) => setNewBed({ ...newBed, wardId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="ward_icu_01">Intensive Care Unit (Ward ICU 1)</option>
                  <option value="ward_gen_01">General Medical Ward 1</option>
                  <option value="ward_emerg_01">Emergency & Trauma Wing</option>
                  <option value="ward_pedia_01">Pediatric Care Ward</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Classification Type</label>
                <select
                  value={newBed.type}
                  onChange={(e) => setNewBed({ ...newBed, type: e.target.value as BedType })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="ICU">ICU</option>
                  <option value="general">General</option>
                  <option value="emergency">Emergency</option>
                  <option value="pediatric">Pediatric</option>
                  <option value="maternity">Maternity</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  Provision Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
