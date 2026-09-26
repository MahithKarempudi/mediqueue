import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Patient } from '@/types';
import {
  UserPlus,
  Search,
  CheckCircle2,
  Users,
  Phone,
  Droplet,
  MapPin,
  Calendar,
} from 'lucide-react';

export const PatientRegistrationPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'female' as 'male' | 'female' | 'other',
    bloodGroup: 'O+',
    address: '',
  });

  useEffect(() => {
    dbService.getCollection<Patient>('patients').then(setPatients);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    const patientId = `pat_${Date.now().toString().slice(-4)}`;
    const userId = `user_${patientId}`;

    const newPat: Patient = {
      patientId,
      userId,
      name: form.name,
      dob: form.dob || '1990-01-01',
      gender: form.gender,
      phone: form.phone,
      address: form.address || 'NCR Region',
      bloodGroup: form.bloodGroup,
    };

    await dbService.setDocument('patients', patientId, newPat);
    await dbService.setDocument('users', userId, {
      uid: userId,
      role: 'patient',
      name: form.name,
      email: form.email || `${patientId}@mediqueue.demo`,
      patientId,
      phone: form.phone,
      createdAt: new Date().toISOString(),
    });

    setPatients([newPat, ...patients]);
    setSuccessMessage(`Patient ${form.name} successfully registered with ID: ${patientId}`);
    setForm({
      name: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'female',
      bloodGroup: 'O+',
      address: '',
    });
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
              Front Desk & Patient Intake Desk
            </span>
            <span className="text-xs text-slate-400">{patients.length} Registered Patients</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Walk-in Patient Registration
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Enroll new patients, issue system-wide health identifiers, and index records for OPD queue allocation.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-teal-950/80 border border-teal-500/40 p-3 text-xs text-teal-300 animate-fade-in shadow-lg shadow-teal-950/50">
          <CheckCircle2 className="h-4 w-4 text-teal-400 flex-shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-400" />
            <span>Intake Registration Form</span>
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Captures identity, emergency contact, and clinical blood typing.
          </p>

          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Neeraj Chopra"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-400">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Gender</label>
              <div className="mt-1 flex gap-4 text-xs text-slate-300">
                {['female', 'male', 'other'].map((g) => (
                  <label key={g} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input
                      type="radio"
                      name="staff_reg_gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => setForm({ ...form, gender: g as any })}
                    />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400">Residential Address</label>
              <input
                type="text"
                placeholder="Locality, City, PIN"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 transition shadow-md shadow-teal-950/50"
            >
              Enroll Patient & Generate ID
            </button>
          </form>
        </div>

        {/* Patients Roster */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registered patients by name, ID, or phone..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredPatients.length} of {patients.length}
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[520px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold sticky top-0">
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPatients.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-teal-300">{p.patientId}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {p.name}
                      <span className="block text-[10px] font-normal text-slate-400 capitalize">
                        {p.gender}, DOB: {p.dob}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-rose-500/10 px-2 py-0.5 font-bold text-rose-300 border border-rose-500/20">
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{p.phone}</td>
                    <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]">{p.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
