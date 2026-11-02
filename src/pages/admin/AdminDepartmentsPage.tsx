import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Department, Staff } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  Building2,
  UserPlus,
  Stethoscope,
  CheckCircle2,
} from 'lucide-react';

export const AdminDepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [docName, setDocName] = useState('');
  const [docDesignation, setDocDesignation] = useState('Senior Consultant Specialist, MD');
  const [selectedDeptId, setSelectedDeptId] = useState('dept_cardio_01');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadDepts = async () => {
      const [d, s] = await Promise.all([
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<Staff>('staff'),
      ]);
      const hospDepts = d.filter((item) => item.hospitalId === hospitalId);
      setDepartments(hospDepts);
      setStaff(s.filter((item) => item.hospitalId === hospitalId));
      if (hospDepts.length > 0) setSelectedDeptId(hospDepts[0].departmentId);
    };
    loadDepts();

    const unsubD = dbService.subscribeCollection<Department>('departments', (all) => {
      setDepartments(all.filter((item) => item.hospitalId === hospitalId));
    });
    const unsubS = dbService.subscribeCollection<Staff>('staff', (all) => {
      setStaff(all.filter((item) => item.hospitalId === hospitalId));
    });
    return () => {
      unsubD();
      unsubS();
    };
  }, [hospitalId]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const deptId = `dept_${Date.now().toString().slice(-5)}`;
    const newDept: Department = {
      departmentId: deptId,
      hospitalId,
      name: newDeptName.trim(),
    };
    await dbService.setDocument('departments', deptId, newDept);
    setNewDeptName('');
    setStatusMsg(`Clinical Department "${newDept.name}" established for ${hospitalId}.`);
  };

  const handleCredentialDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !selectedDeptId) return;
    const staffId = `staff_${Date.now().toString().slice(-5)}`;
    const newStaff: Staff = {
      staffId,
      userId: `usr_${staffId}`,
      hospitalId,
      departmentId: selectedDeptId,
      roleInHospital: 'doctor',
      designation: docDesignation,
      name: docName.trim(),
      email: `${staffId}@mediqueue.org`,
    };
    await dbService.setDocument('staff', staffId, newStaff);
    setDocName('');
    setStatusMsg(`Credentialed ${newStaff.name} into department ${selectedDeptId}. Immediate OPD slot availability enabled.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Clinical Specialty & Medical Staff Governance"
        title="Hospital Departments & Physician Roster"
        subtitle="Establish new outpatient clinical specialties and credential specialist physicians for OPD scheduling."
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="Institutional Roster Updated" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="1. Establish Clinical Department"
              subtitle="Add a specialty wing to this facility"
              icon={<Building2 className="w-5 h-5" />}
            />
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="mq-label">Specialty Department Name</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Pulmonology & Sleep Medicine"
                  className="mq-input"
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                Create Clinical Specialty
              </Button>
            </form>
          </Card>

          <Card padding="lg">
            <SectionHeader
              title="2. Credential Attending Specialist"
              subtitle="Assign a physician to an active department"
              icon={<UserPlus className="w-5 h-5" />}
            />
            <form onSubmit={handleCredentialDoctor} className="space-y-4">
              <div>
                <label className="mq-label">Clinical Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="mq-input"
                >
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mq-label">Physician Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Meera Krishnan"
                  className="mq-input"
                />
              </div>
              <div>
                <label className="mq-label">Academic Qualification & Designation</label>
                <input
                  type="text"
                  required
                  value={docDesignation}
                  onChange={(e) => setDocDesignation(e.target.value)}
                  className="mq-input"
                />
              </div>
              <Button type="submit" variant="secondary" size="md" className="w-full" icon={<Stethoscope className="w-4 h-4 text-mediteal-400" />}>
                Credential Physician
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card padding="lg">
            <SectionHeader
              title={`Active Specialties & Medical Staff (${departments.length} Departments)`}
              subtitle="Physicians listed here are immediately discoverable in Patient & AI Slot Booking"
              icon={<Stethoscope className="w-5 h-5" />}
            />

            <div className="space-y-4">
              {departments.map((dept) => {
                const deptStaff = staff.filter((s) => s.departmentId === dept.departmentId);
                return (
                  <div
                    key={dept.departmentId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                        <span className="text-xs font-mono text-slate-400">ID: {dept.departmentId}</span>
                      </div>
                      <Badge variant="teal">{deptStaff.length} Specialists</Badge>
                    </div>

                    {deptStaff.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
                        {deptStaff.map((doc) => (
                          <div
                            key={doc.staffId}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                          >
                            <div className="font-bold text-slate-900">{doc.name}</div>
                            <div className="text-slate-500">{doc.designation}</div>
                            <div className="text-[11px] font-mono text-mediblue-700 mt-0.5">
                              Ref: {doc.staffId}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
