import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import { useAuth } from '@/context/AuthContext';
import type { User, UserRole, Hospital } from '@/types';
import {
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const AccountProvisioningPage: React.FC = () => {
  const { reseedData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'staff' as UserRole,
    hospitalId: 'hosp_metro_01',
    phone: '',
  });

  useEffect(() => {
    const load = async () => {
      const [uList, hList] = await Promise.all([
        dbService.getCollection<User>('users'),
        dbService.getCollection<Hospital>('hospitals'),
      ]);
      setUsers(uList);
      setHospitals(hList);
    };
    load();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const uid = `user_${Date.now().toString().slice(-6)}`;
    const userToSave: User = {
      uid,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      hospitalId: newUser.role === 'staff' || newUser.role === 'hospital_admin' ? newUser.hospitalId : undefined,
      phone: newUser.phone,
      createdAt: new Date().toISOString(),
    };

    await dbService.setDocument('users', uid, userToSave);
    setUsers([userToSave, ...users]);
    setShowAddModal(false);
    setFeedback(`Account provisioned successfully for ${newUser.name} (${newUser.role.toUpperCase()})`);
    setNewUser({ name: '', email: '', role: 'staff', hospitalId: 'hosp_metro_01', phone: '' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleTriggerReseed = async () => {
    if (!confirm('Are you sure you want to reset all data and re-seed the canonical synthetic dataset? This will repopulate 5 hospitals, 180 beds, and 55 patients.')) {
      return;
    }
    setIsReseeding(true);
    await reseedData();
    const updatedUsers = await dbService.getCollection<User>('users');
    setUsers(updatedUsers);
    setIsReseeding(false);
    setFeedback('All Firestore collections and RTDB trees have been refreshed with synthetic data!');
    setTimeout(() => setFeedback(null), 5000);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
              Identity & Access Management (IAM)
            </span>
            <span className="text-xs text-slate-400">{users.length} Active System Accounts</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            System Accounts & Role Assignments
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Provision staff, clinical admin, and surveillance officer roles with cryptographic boundary enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerReseed}
            disabled={isReseeding}
            className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-semibold text-amber-300 hover:bg-slate-700 hover:text-amber-200 transition"
            title="Reset and re-populate the entire synthetic dataset"
          >
            <RefreshCw className={`h-4 w-4 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'Re-seeding...' : 'Reset / Re-seed Data'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-950/50"
          >
            <Plus className="h-4 w-4" />
            <span>Provision Account</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3 text-xs text-emerald-300 animate-fade-in shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Account Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Facility Association</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 font-bold uppercase text-[10px] ${
                        u.role === 'super_admin'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : u.role === 'government_officer'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : u.role === 'hospital_admin'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : u.role === 'staff'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {u.hospitalId || '— Regional / National —'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCog className="h-5 w-5 text-rose-400" />
              <span>Provision User Account</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Creates authenticated credentials and configures RBAC scope.
            </p>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Anil Verma"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="anil.v@mediqueue.demo"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">System Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="staff">Hospital Staff / Medical Officer</option>
                  <option value="hospital_admin">Hospital Operations Administrator</option>
                  <option value="government_officer">Government Surveillance Officer</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              {(newUser.role === 'staff' || newUser.role === 'hospital_admin') && (
                <div>
                  <label className="block text-xs font-medium text-slate-400">Assigned Facility</label>
                  <select
                    value={newUser.hospitalId}
                    onChange={(e) => setNewUser({ ...newUser, hospitalId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    {hospitals.map((h) => (
                      <option key={h.hospitalId} value={h.hospitalId}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 98..."
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
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
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
