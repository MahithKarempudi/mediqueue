import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { User, UserRole, Hospital, Staff } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, Modal, NoticeBanner } from '@/components/ui';
import {
  UserPlus,
  Users,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AccountProvisioningPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null);

  // Provisioning form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [hospitalId, setHospitalId] = useState('hosp_metro_01');
  const [designation, setDesignation] = useState('Consultant Physician, MD');

  useEffect(() => {
    const loadAccounts = async () => {
      const [u, h] = await Promise.all([
        dbService.getCollection<User>('users'),
        dbService.getCollection<Hospital>('hospitals'),
      ]);
      setUsers(u);
      setHospitals(h);
    };
    loadAccounts();

    const unsub = dbService.subscribeCollection<User>('users', setUsers);
    return () => unsub();
  }, []);

  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const uid = `usr_${Date.now().toString().slice(-6)}`;
    const newUser: User = {
      uid,
      name: name.trim(),
      email: email.trim(),
      role,
      hospitalId: role === 'staff' || role === 'hospital_admin' ? hospitalId : undefined,
      createdAt: new Date().toISOString(),
    };

    await dbService.setDocument('users', uid, newUser);

    if (role === 'staff') {
      const staffId = `staff_${Date.now().toString().slice(-5)}`;
      const staffDoc: Staff = {
        staffId,
        userId: uid,
        hospitalId,
        departmentId: 'dept_cardio_01',
        roleInHospital: 'doctor',
        designation,
        name: name.trim(),
        email: email.trim(),
      };
      await dbService.setDocument('staff', staffId, staffDoc);
    }

    setName('');
    setEmail('');
    setStatusMsg(`Provisioned RBAC account for ${newUser.name} (${newUser.role}) with UID [${uid}].`);
  };

  const handleConfirmRevoke = async () => {
    if (!userToRevoke) return;
    await dbService.deleteDocument('users', userToRevoke.uid);
    setStatusMsg(`Revoked institutional credentials for ${userToRevoke.name} (${userToRevoke.uid}).`);
    setUserToRevoke(null);
  };

  const filteredUsers =
    roleFilter === 'ALL' ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Identity & Role-Based Access Control (RBAC)"
        title="Institutional Account Provisioning"
        subtitle="Issue role-scoped accounts for hospital clinicians, administrators, and public health officers."
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="IAM Directory Updated" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Card padding="lg">
            <SectionHeader
              title="Provision New Stakeholder Account"
              subtitle="Assign role scope and institutional affiliation"
              icon={<UserPlus className="w-5 h-5" />}
            />

            <form onSubmit={handleProvisionAccount} className="space-y-4">
              <div>
                <label className="mq-label">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Arvind Swaminathan"
                  className="mq-input"
                />
              </div>

              <div>
                <label className="mq-label">Institutional Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arvind.s@mediqueue.org"
                  className="mq-input"
                />
              </div>

              <div>
                <label className="mq-label">RBAC Stakeholder Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mq-input"
                >
                  <option value="staff">Hospital Staff / Physician</option>
                  <option value="hospital_admin">Hospital Administrator</option>
                  <option value="government_officer">Government Health Officer</option>
                  <option value="patient">Patient Portal Account</option>
                  <option value="super_admin">Platform Super Admin</option>
                </select>
              </div>

              {(role === 'staff' || role === 'hospital_admin') && (
                <div>
                  <label className="mq-label">Assigned Hospital Tenant</label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="mq-input"
                  >
                    {hospitals.map((h) => (
                      <option key={h.hospitalId} value={h.hospitalId}>
                        {h.name} ({h.hospitalId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'staff' && (
                <div>
                  <label className="mq-label">Clinical Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="mq-input"
                  />
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                Provision RBAC Account
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <SectionHeader
                title={`Provisioned Accounts (${filteredUsers.length})`}
                subtitle="Active identities in the platform directory"
                icon={<Users className="w-5 h-5" />}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
                className="mq-input max-w-[180px]"
              >
                <option value="ALL">All Roles</option>
                <option value="staff">Staff</option>
                <option value="hospital_admin">Hospital Admin</option>
                <option value="government_officer">Gov Officer</option>
                <option value="patient">Patient</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Name & Email</th>
                    <th className="mq-table-th">RBAC Role</th>
                    <th className="mq-table-th">Hospital Scope</th>
                    <th className="mq-table-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50">
                      <td className="mq-table-td">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="mq-table-td">
                        <Badge variant="info">{u.role}</Badge>
                      </td>
                      <td className="mq-table-td font-mono text-xs text-slate-600">
                        {u.hospitalId || 'Global / Personal'}
                      </td>
                      <td className="mq-table-td text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-600 hover:bg-red-50"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => setUserToRevoke(u)}
                        >
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Account Revocation */}
      <Modal
        open={userToRevoke !== null}
        onClose={() => setUserToRevoke(null)}
        title="Confirm RBAC Credential Revocation"
        subtitle={`Account UID: ${userToRevoke?.uid}`}
        size="sm"
      >
        {userToRevoke && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                Are you sure you want to revoke access for <strong>{userToRevoke.name}</strong> ({userToRevoke.role})?
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setUserToRevoke(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmRevoke}>
                Confirm Revocation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
