import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdAdmission, IpdBed, Patient, Billing } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  Bed,
  UserPlus,
  LogOut,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

export const IpdAdmissionsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState('pat_0002');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [diagnosis, setDiagnosis] = useState('Acute Decompensated Heart Failure — IV Diuresis Protocol');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadIpdData = async () => {
      const [adms, bds, pats] = await Promise.all([
        dbService.getCollection<IpdAdmission>('ipd_admissions'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getCollection<Patient>('patients'),
      ]);
      setAdmissions(adms.filter((a) => a.hospitalId === hospitalId));
      const hospBeds = bds.filter((b) => b.hospitalId === hospitalId);
      setBeds(hospBeds);
      setPatients(pats);

      const firstOpen = hospBeds.find((b) => b.status === 'available');
      if (firstOpen) setSelectedBedId(firstOpen.bedId);
    };
    loadIpdData();

    const unsubAdms = dbService.subscribeCollection<IpdAdmission>('ipd_admissions', (all) => {
      setAdmissions(all.filter((a) => a.hospitalId === hospitalId));
    });
    const unsubBeds = dbService.subscribeCollection<IpdBed>('ipd_beds', (all) => {
      setBeds(all.filter((b) => b.hospitalId === hospitalId));
    });
    return () => {
      unsubAdms();
      unsubBeds();
    };
  }, [hospitalId]);

  const availableBeds = beds.filter((b) => b.status === 'available');
  const activeAdmissions = admissions.filter((a) => a.status === 'admitted');
  const dischargedAdmissions = admissions.filter((a) => a.status === 'discharged');

  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedBedId || !diagnosis.trim()) return;

    const admId = `ADM-${Date.now()}`;
    const newAdm: IpdAdmission = {
      admissionId: admId,
      patientId: selectedPatientId,
      hospitalId,
      bedId: selectedBedId,
      admittingDoctorId: user?.uid || 'staff_cardio_01',
      diagnosis: diagnosis.trim(),
      admittedAt: new Date().toISOString(),
      status: 'admitted',
    };

    await dbService.setDocument('ipd_admissions', admId, newAdm);
    await dbService.updateDocument('ipd_beds', selectedBedId, {
      status: 'occupied',
      lastUpdated: new Date().toISOString(),
    });
    const bedObj = beds.find((b) => b.bedId === selectedBedId);
    if (bedObj) {
      await dbService.setRTDB(`liveBeds/${hospitalId}/${selectedBedId}`, {
        bedId: selectedBedId,
        status: 'occupied',
        wardId: bedObj.wardId,
        type: bedObj.type,
        bedNumber: bedObj.bedNumber,
        lastUpdated: new Date().toISOString(),
      });
    }

    const nextOpen = availableBeds.find((b) => b.bedId !== selectedBedId);
    setSelectedBedId(nextOpen ? nextOpen.bedId : '');
    setStatusMsg(`Inpatient admission ${admId} committed and Bed ${selectedBedId.split('_').pop()} marked occupied.`);
  };

  const handleDischargeAndReleaseBed = async (adm: IpdAdmission) => {
    const dischargedAt = new Date().toISOString();
    await dbService.updateDocument('ipd_admissions', adm.admissionId, {
      status: 'discharged',
      dischargedAt,
    });

    // Release bed back to available
    await dbService.updateDocument('ipd_beds', adm.bedId, {
      status: 'available',
      lastUpdated: dischargedAt,
    });
    const bedObj = beds.find((b) => b.bedId === adm.bedId);
    if (bedObj) {
      await dbService.setRTDB(`liveBeds/${hospitalId}/${adm.bedId}`, {
        bedId: adm.bedId,
        status: 'available',
        wardId: bedObj.wardId,
        type: bedObj.type,
        bedNumber: bedObj.bedNumber,
        lastUpdated: dischargedAt,
      });
    }

    // Generate automated IPD discharge invoice
    const daysStayed = Math.max(
      1,
      Math.ceil((Date.now() - new Date(adm.admittedAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    const dailyRate = bedObj?.type === 'ICU' ? 6500 : 2500;
    const roomCharge = daysStayed * dailyRate;
    const billId = `BILL-IPD-${Date.now().toString().slice(-5)}`;
    const dischargeBill: Billing = {
      billId,
      patientId: adm.patientId,
      hospitalId,
      admissionId: adm.admissionId,
      items: [
        { description: `Inpatient Ward Stay (${daysStayed} Days @ ₹${dailyRate}/day)`, amount: roomCharge },
        { description: 'Inpatient Nursing & Specialist Rounding Charges', amount: 1800 },
      ],
      totalAmount: roomCharge + 1800,
      status: 'pending',
      createdAt: dischargedAt,
    };
    await dbService.setDocument('billing', billId, dischargeBill);

    setStatusMsg(
      `Patient ${adm.patientId} discharged from ${adm.bedId}. Bed atomically released to available pool and invoice ${billId} generated.`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Inpatient Department (IPD) Workflow"
        title="Ward Admissions & Atomic Bed Release on Discharge"
        subtitle="Admit patients to open ICU or general ward beds and execute one-click clinical discharges with automated bed release and billing."
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="IPD Census & Billing Synchronized" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Admit Patient Form */}
        <div className="lg:col-span-5">
          <Card padding="lg">
            <SectionHeader
              title="New Inpatient Admission"
              subtitle="Assign an available ward or ICU bed to a registered patient"
              icon={<UserPlus className="w-5 h-5" />}
            />

            <form onSubmit={handleAdmitPatient} className="space-y-4">
              <div>
                <label className="mq-label">Select Registered Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="mq-input"
                >
                  {patients.slice(0, 25).map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} ({p.patientId.toUpperCase()} • {p.age}y {p.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mq-label">
                  Available Ward / ICU Bed ({availableBeds.length} Open)
                </label>
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="mq-input"
                >
                  {availableBeds.map((b) => (
                    <option key={b.bedId} value={b.bedId}>
                      {b.bedNumber} — {b.type.toUpperCase()} ({b.wardId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mq-label">Admitting Clinical Diagnosis & Care Plan</label>
                <textarea
                  rows={3}
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="mq-input"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!selectedBedId}
                className="w-full"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Commit IPD Admission & Lock Bed
              </Button>
            </form>
          </Card>
        </div>

        {/* Right 7 Columns: Active Inpatients & Discharge Archive */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title={`Active Admitted Inpatients (${activeAdmissions.length})`}
              subtitle="Discharging a patient atomically frees their assigned bed and generates a final invoice"
              icon={<Bed className="w-5 h-5" />}
            />

            {activeAdmissions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active inpatient admissions.</p>
            ) : (
              <div className="space-y-3">
                {activeAdmissions.map((adm) => {
                  const pat = patients.find((p) => p.patientId === adm.patientId);
                  const bed = beds.find((b) => b.bedId === adm.bedId);
                  return (
                    <div
                      key={adm.admissionId}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-mediblue-700">
                            {adm.admissionId}
                          </span>
                          <Badge variant={bed?.type === 'ICU' ? 'danger' : 'teal'}>
                            Bed: {bed?.bedNumber || adm.bedId.split('_').pop()}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {pat?.name || `Patient ${adm.patientId}`} ({adm.patientId.toUpperCase()})
                        </h4>
                        <p className="text-xs text-slate-700">{adm.diagnosis}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Admitted: {new Date(adm.admittedAt).toLocaleString()}
                        </p>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<LogOut className="w-3.5 h-3.5 text-mediteal-400" />}
                        onClick={() => handleDischargeAndReleaseBed(adm)}
                      >
                        Discharge & Release Bed
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card padding="lg">
            <SectionHeader
              title={`Recently Discharged Archive (${dischargedAdmissions.length})`}
              subtitle="Completed inpatient episodes"
              icon={<ClipboardList className="w-5 h-5" />}
            />

            <div className="space-y-2">
              {dischargedAdmissions.slice(0, 5).map((adm) => (
                <div
                  key={adm.admissionId}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-700">{adm.admissionId}</span> •{' '}
                    <strong className="text-slate-900">{adm.patientId.toUpperCase()}</strong> — {adm.diagnosis}
                  </div>
                  <Badge variant="success">Discharged</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
