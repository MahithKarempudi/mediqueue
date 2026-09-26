import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital } from '@/types';
import {
  Hospital as HospitalIcon,
  Plus,
  MapPin,
  CheckCircle2,
  Building2,
  Phone,
  Bed,
} from 'lucide-react';

export const HospitalOnboardingPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHosp, setNewHosp] = useState({
    name: '',
    address: '',
    districtId: 'dist_south_delhi',
    lat: 28.55,
    lng: 77.25,
    totalBeds: 100,
    phone: '+91 11 2000 0000',
  });

  useEffect(() => {
    dbService.getCollection<Hospital>('hospitals').then(setHospitals);
  }, []);

  const handleOnboardHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHosp.name || !newHosp.address) return;

    const hospitalId = `hosp_${newHosp.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 10)}_${Date.now().toString().slice(-4)}`;
    const hosp: Hospital = {
      hospitalId,
      name: newHosp.name,
      address: newHosp.address,
      geo: { lat: Number(newHosp.lat), lng: Number(newHosp.lng) },
      districtId: newHosp.districtId,
      totalBeds: Number(newHosp.totalBeds),
      departments: ['dept_genmed_01', 'dept_emerg_01'],
      phone: newHosp.phone,
      emergencyAvailable: true,
    };

    await dbService.setDocument('hospitals', hospitalId, hosp);
    await dbService.setRTDB(`hospitalStatus/${hospitalId}`, {
      operational: true,
      emergencyOpen: true,
      surgeAlert: false,
    });

    setHospitals([...hospitals, hosp]);
    setShowAddModal(false);
    setNewHosp({
      name: '',
      address: '',
      districtId: 'dist_south_delhi',
      lat: 28.55,
      lng: 77.25,
      totalBeds: 100,
      phone: '+91 11 2000 0000',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
              National Infrastructure Registry
            </span>
            <span className="text-xs text-slate-400">{hospitals.length} Accredited Facilities</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Hospital Network Onboarding
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Register new hospital establishments, calibrate geographic coordinates for emergency routing, and provision default wards.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-950/50"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard Hospital</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hospitals.map((hosp) => (
          <div
            key={hosp.hospitalId}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-500 uppercase">
                  ID: {hosp.hospitalId}
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
                  Accredited
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-white">{hosp.name}</h3>
              <p className="mt-1 text-xs text-slate-400 flex items-start gap-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 mt-0.5" />
                <span>{hosp.address}</span>
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">District</span>
                  <p className="font-medium text-slate-200">{hosp.districtId}</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Capacity</span>
                  <p className="font-bold text-emerald-400">{hosp.totalBeds} Beds</p>
                </div>
              </div>

              <div className="mt-3 text-[11px] font-mono text-slate-500">
                Geo: [{hosp.geo.lat.toFixed(4)}, {hosp.geo.lng.toFixed(4)}]
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Onboard Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-rose-400" />
              <span>Onboard New Healthcare Facility</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Registers facility in Firestore and provisions initial RTDB telemetry node.
            </p>

            <form onSubmit={handleOnboardHospital} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400">Hospital Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajiv Gandhi Super Speciality Hospital"
                  value={newHosp.name}
                  onChange={(e) => setNewHosp({ ...newHosp, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Facility Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Street, Sector, City, PIN"
                  value={newHosp.address}
                  onChange={(e) => setNewHosp({ ...newHosp, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400">District ID</label>
                  <select
                    value={newHosp.districtId}
                    onChange={(e) => setNewHosp({ ...newHosp, districtId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="dist_south_delhi">South Delhi District</option>
                    <option value="dist_central_delhi">Central Delhi District</option>
                    <option value="dist_east_delhi">East Delhi District</option>
                    <option value="dist_north_delhi">North Delhi District</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Total Sanctioned Beds</label>
                  <input
                    type="number"
                    min="10"
                    value={newHosp.totalBeds}
                    onChange={(e) => setNewHosp({ ...newHosp, totalBeds: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400">Latitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newHosp.lat}
                    onChange={(e) => setNewHosp({ ...newHosp, lat: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Longitude (GPS)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newHosp.lng}
                    onChange={(e) => setNewHosp({ ...newHosp, lng: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Emergency Desk Phone</label>
                <input
                  type="text"
                  value={newHosp.phone}
                  onChange={(e) => setNewHosp({ ...newHosp, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
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
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
