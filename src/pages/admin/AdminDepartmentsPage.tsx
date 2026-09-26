import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Department, Staff, Hospital } from '@/types';
import {
  Users,
  Building2,
  Plus,
  Stethoscope,
  UserPlus,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    user?.hospitalId || 'hosp_metro_01'
  );
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  const [newDeptName, setNewDeptName] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    departmentId: '',
    designation: 'Senior Resident Specialist',
  });

  useEffect(() => {
    const load = async () => {
      const [hosps, depts, allStaff] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
      ]);
      setHospitals(hosps);
      setDepartments(depts);
      setStaff(allStaff);
    };
    load();
  }, []);

  const hospDepts = departments.filter((d) => d.hospitalId === selectedHospitalId);
  const hospStaff = staff.filter((s) => s.hospitalId === selectedHospitalId);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;

    const deptId = `dept_${newDeptName.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString().slice(-4)}`;
    const dept: Department = {
      departmentId: deptId,
      hospitalId: selectedHospitalId,
      name: newDeptName,
      doctorIds: [],
    };

    await dbService.setDocument('departments', deptId, dept);
    setDepartments([...departments, dept]);
    setNewDeptName('');
    setShowAddDeptModal(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email || !newStaff.departmentId) return;

    const staffId = `staff_${Date.now().toString().slice(-4)}`;
    const userId = `user_${staffId}`;

    const staffMember: Staff = {
      staffId,
      userId,
      hospitalId: selectedHospitalId,
      departmentId: newStaff.departmentId,
      designation: newStaff.designation,
      name: newStaff.name,
      email: newStaff.email,
    };

    await dbService.setDocument('staff', staffId, staffMember);
    await dbService.setDocument('users', userId, {
      uid: userId,
      role: 'staff',
      name: newStaff.name,
      email: newStaff.email,
      hospitalId: selectedHospitalId,
      departmentId: newStaff.departmentId,
      createdAt: new Date().toISOString(),
    });

    setStaff([...staff, staffMember]);
    setShowAddStaffModal(false);
    setNewStaff({ name: '', email: '', departmentId: '', designation: 'Senior Resident Specialist' });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
              Department & Physician Roster
            </span>
            <span className="text-xs text-slate-400 font-mono">Hospital: {selectedHospitalId}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Clinical Units & Medical Staff
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Configure clinical specialty wings and provision medical practitioner assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            <Plus className="h-4 w-4 text-sky-400" />
            <span>Add Department</span>
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-950/50"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign Physician</span>
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hospDepts.map((dept) => {
          const deptPhysicians = hospStaff.filter((s) => s.departmentId === dept.departmentId);
          return (
            <div
              key={dept.departmentId}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500 uppercase">
                    ID: {dept.departmentId}
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-500/20">
                    {deptPhysicians.length} Active Staff
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-white">{dept.name}</h3>

                <div className="mt-4 space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Physician Roster:</p>
                  {deptPhysicians.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No physicians currently assigned.</p>
                  ) : (
                    deptPhysicians.map((doc) => (
                      <div
                        key={doc.staffId}
                        className="flex items-center justify-between rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-3.5 w-3.5 text-sky-400" />
                          <div>
                            <p className="font-semibold text-white">{doc.name || 'Doctor'}</p>
                            <p className="text-[10px] text-slate-400">{doc.designation}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{doc.staffId}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-sky-400" />
              <span>Create Specialty Department</span>
            </h3>
            <form onSubmit={handleCreateDept} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400">Department Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neurology or Oncology"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-400" />
              <span>Assign Medical Officer</span>
            </h3>
            <form onSubmit={handleAddStaff} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Smita Bannerjee"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="smita.b@mediqueue.demo"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Specialty Wing *</label>
                <select
                  required
                  value={newStaff.departmentId}
                  onChange={(e) => setNewStaff({ ...newStaff, departmentId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="">Select Department</option>
                  {hospDepts.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Designation</label>
                <input
                  type="text"
                  value={newStaff.designation}
                  onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                >
                  Provision Physician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
