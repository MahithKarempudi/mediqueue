import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Patient } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, SearchInput, NoticeBanner, Pagination } from '@/components/ui';
import {
  UserPlus,
  Users,
  CheckCircle2,
  Phone,
  MapPin,
  Heart,
} from 'lucide-react';

export const PatientRegistrationPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(34);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [registeredBanner, setRegisteredBanner] = useState<string | null>(null);

  useEffect(() => {
    const loadPatients = async () => {
      const list = await dbService.getCollection<Patient>('patients');
      setPatients(list);
    };
    loadPatients();

    const unsub = dbService.subscribeCollection<Patient>('patients', (list) => {
      setPatients(list);
    });
    return () => unsub();
  }, []);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newPatientId = `pat_${String(patients.length + 1).padStart(4, '0')}`;
    const newPatient: Patient = {
      patientId: newPatientId,
      userId: `usr_${newPatientId}`,
      name: name.trim(),
      age: Number(age),
      gender,
      bloodGroup,
      phone: phone.trim(),
      address: address.trim() || 'Sector 14, New Delhi',
      emergencyContact: emergencyContact.trim() || '+91-9810000000',
      createdAt: new Date().toISOString(),
    };

    await dbService.setDocument('patients', newPatientId, newPatient);
    setRegisteredBanner(
      `Patient ${newPatient.name} enrolled successfully with Unified Health ID [${newPatientId.toUpperCase()}].`
    );
    setName('');
    setPhone('');
    setAddress('');
    setEmergencyContact('');
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedPatients = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Front-Desk Clinical Intake"
        title="Walk-In Patient Registration & Master UHID Index"
        subtitle="Enroll walk-in patients into the central clinical repository and search the unified patient registry."
      />

      {registeredBanner && (
        <NoticeBanner variant="success" title="UHID Enrollment Complete" onDismiss={() => setRegisteredBanner(null)}>
          {registeredBanner}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Walk-In Enrollment Form */}
        <div className="lg:col-span-5">
          <Card padding="lg">
            <SectionHeader
              title="New Patient Intake Form"
              subtitle="Assign a permanent Unified Health Identifier (UHID)"
              icon={<UserPlus className="w-5 h-5" />}
            />

            <form onSubmit={handleRegisterPatient} className="space-y-4">
              <div>
                <label className="mq-label">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Siddharth Malhotra"
                  className="mq-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mq-label">Age (Yrs) *</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="mq-input"
                  />
                </div>
                <div>
                  <label className="mq-label">Sex *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="mq-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mq-label">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="mq-input"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mq-label">Primary Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98110 24500"
                  className="mq-input"
                />
              </div>

              <div>
                <label className="mq-label">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House / Street / Locality / City"
                  className="mq-input"
                />
              </div>

              <div>
                <label className="mq-label">Emergency Next-of-Kin Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91 98110 99999"
                  className="mq-input"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Enroll Patient & Issue UHID
              </Button>
            </form>
          </Card>
        </div>

        {/* Right 7 Columns: Master Patient Index */}
        <div className="lg:col-span-7">
          <Card padding="lg">
            <SectionHeader
              title={`Master Patient Registry (${filtered.length} Records)`}
              subtitle="Verified patients indexed across the MediQueue network"
              icon={<Users className="w-5 h-5" />}
            />

            <div className="mb-4">
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setPage(1);
                }}
                placeholder="Filter by UHID (e.g. pat_0001), patient name, or phone..."
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">UHID</th>
                    <th className="mq-table-th">Patient Identity</th>
                    <th className="mq-table-th">Vital Attributes</th>
                    <th className="mq-table-th">Contact & Locality</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPatients.map((pat) => (
                    <tr key={pat.patientId} className="hover:bg-slate-50">
                      <td className="mq-table-td font-mono font-bold text-mediblue-700">
                        {pat.patientId.toUpperCase()}
                      </td>
                      <td className="mq-table-td">
                        <div className="font-bold text-slate-900">{pat.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Enrolled: {new Date(pat.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="mq-table-td">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="neutral">
                            {pat.age}y • {pat.gender}
                          </Badge>
                          <Badge variant="danger">
                            <Heart className="w-3 h-3 mr-1" />
                            {pat.bloodGroup}
                          </Badge>
                        </div>
                      </td>
                      <td className="mq-table-td text-xs text-slate-600">
                        <div className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {pat.phone}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {pat.address}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
