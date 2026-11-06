import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type {
  LiveQueue,
  OpdVisit,
  Prescription,
  PathologyOrder,
  RadiologyOrder,
} from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  Play,
  SkipForward,
  CheckCircle2,
  Plus,
  Trash2,
  FlaskConical,
  Pill,
  Users,
  FileText,
} from 'lucide-react';

export const DoctorOpdQueuePage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';
  const deptId = user?.departmentId || 'dept_cardio_01';
  const queuePath = `liveQueues/${hospitalId}/${deptId}`;

  const [liveQueue, setLiveQueue] = useState<LiveQueue | null>(null);
  const [diagnosis, setDiagnosis] = useState('Essential Hypertension & Effort Angina');
  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient presents with mild exertional dyspnea. BP 138/86 mmHg, HR 76 bpm regular. Advised baseline metabolic panel and echocardiography.'
  );
  const [medications, setMedications] = useState([
    { name: 'Tab. Telmisartan 40mg', dosage: '1 Tablet', frequency: 'Once Daily (Morning)', duration: '30 Days' },
    { name: 'Tab. Rosuvastatin 10mg', dosage: '1 Tablet', frequency: 'Once Daily (Night)', duration: '30 Days' },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet');
  const [newMedFreq, setNewMedFreq] = useState('Twice Daily');
  const [newMedDuration, setNewMedDuration] = useState('14 Days');

  const [orderCbc, setOrderCbc] = useState(true);
  const [orderTroponin, setOrderTroponin] = useState(false);
  const [orderEcho, setOrderEcho] = useState(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    const unsub = dbService.subscribeRTDB<LiveQueue>(queuePath, (q) => {
      if (q) setLiveQueue(q);
    });
    return () => unsub();
  }, [queuePath]);

  const tokenList = liveQueue?.tokenList || [];
  const currentServingNo = liveQueue?.currentToken || 15;
  const activeToken =
    tokenList.find((t) => t.tokenNo === currentServingNo) ||
    tokenList.find((t) => t.status === 'in_progress') ||
    tokenList.find((t) => t.status === 'waiting');

  const handleCallNextToken = async () => {
    if (!liveQueue) return;
    const waiting = liveQueue.tokenList.filter((t) => t.status === 'waiting');
    if (waiting.length === 0) {
      setStatusBanner('All waiting patients in the current OPD session have been called.');
      return;
    }
    const nextToken = waiting[0];
    const updatedList = liveQueue.tokenList.map((t) => {
      if (t.tokenNo === liveQueue.currentToken && t.status === 'in_progress') {
        return { ...t, status: 'completed' as const };
      }
      if (t.tokenNo === nextToken.tokenNo) {
        return { ...t, status: 'in_progress' as const };
      }
      return t;
    });

    await dbService.setRTDB(queuePath, {
      currentToken: nextToken.tokenNo,
      tokenList: updatedList,
      lastUpdated: new Date().toISOString(),
    });
    setStatusBanner(`Now serving Token #${nextToken.tokenNo} (${nextToken.patientName}).`);
  };

  const handleSkipCurrentToken = async () => {
    if (!liveQueue || !activeToken) return;
    const waiting = liveQueue.tokenList.filter((t) => t.status === 'waiting' && t.tokenNo !== activeToken.tokenNo);
    const nextNo = waiting.length > 0 ? waiting[0].tokenNo : liveQueue.currentToken;

    const updatedList = liveQueue.tokenList.map((t) => {
      if (t.tokenNo === activeToken.tokenNo) {
        return { ...t, status: 'skipped' as const };
      }
      if (t.tokenNo === nextNo) {
        return { ...t, status: 'in_progress' as const };
      }
      return t;
    });

    await dbService.setRTDB(queuePath, {
      currentToken: nextNo,
      tokenList: updatedList,
      lastUpdated: new Date().toISOString(),
    });
    setStatusBanner(`Token #${activeToken.tokenNo} marked as skipped/recall. Advanced to Token #${nextNo}.`);
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications((prev) => [
      ...prev,
      {
        name: newMedName.trim(),
        dosage: newMedDosage,
        frequency: newMedFreq,
        duration: newMedDuration,
      },
    ]);
    setNewMedName('');
  };

  const handleCompleteConsultation = async () => {
    const targetPatientId = activeToken?.patientId || 'pat_0001';
    const targetPatientName = activeToken?.patientName || 'Aarav Sharma';
    const doctorId = user?.uid || 'staff_cardio_01';
    const visitId = `VIS-${Date.now()}`;

    // 1. Write OPD Visit
    const visitRecord: OpdVisit = {
      visitId,
      appointmentId: activeToken?.appointmentId || `APT-OPD-${Date.now()}`,
      patientId: targetPatientId,
      doctorId,
      hospitalId,
      departmentId: deptId,
      diagnosis,
      notes: clinicalNotes,
      createdAt: new Date().toISOString(),
    };
    await dbService.setDocument('opd_visits', visitId, visitRecord);

    // 2. Write Prescription
    if (medications.length > 0) {
      const rxId = `RX-${Date.now()}`;
      const rxRecord: Prescription = {
        prescriptionId: rxId,
        visitId,
        patientId: targetPatientId,
        doctorId,
        medications,
        createdAt: new Date().toISOString(),
      };
      await dbService.setDocument('prescriptions', rxId, rxRecord);
    }

    // 3. Write Diagnostic Orders if selected
    if (orderCbc) {
      const poId = `PATH-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const po: PathologyOrder = {
        orderId: poId,
        patientId: targetPatientId,
        doctorId,
        testName: 'Complete Blood Count (CBC) & Lipid Profile',
        status: 'ordered',
        orderedAt: new Date().toISOString(),
      };
      await dbService.setDocument('pathology_orders', poId, po);
    }

    if (orderTroponin) {
      const poId = `PATH-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const po: PathologyOrder = {
        orderId: poId,
        patientId: targetPatientId,
        doctorId,
        testName: 'High-Sensitivity Cardiac Troponin-I',
        status: 'ordered',
        orderedAt: new Date().toISOString(),
      };
      await dbService.setDocument('pathology_orders', poId, po);
    }

    if (orderEcho) {
      const roId = `RAD-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const ro: RadiologyOrder = {
        orderId: roId,
        patientId: targetPatientId,
        doctorId,
        modality: 'Echocardiogram',
        bodyPart: '2D Transthoracic Doppler Study',
        status: 'ordered',
        orderedAt: new Date().toISOString(),
      };
      await dbService.setDocument('radiology_orders', roId, ro);
    }

    // 4. Advance Live Queue
    if (liveQueue && activeToken) {
      const waiting = liveQueue.tokenList.filter(
        (t) => t.status === 'waiting' && t.tokenNo !== activeToken.tokenNo
      );
      const nextTokenNo = waiting.length > 0 ? waiting[0].tokenNo : liveQueue.currentToken;

      const updatedList = liveQueue.tokenList.map((t) => {
        if (t.tokenNo === activeToken.tokenNo) {
          return { ...t, status: 'completed' as const };
        }
        if (waiting.length > 0 && t.tokenNo === nextTokenNo) {
          return { ...t, status: 'in_progress' as const };
        }
        return t;
      });

      await dbService.setRTDB(queuePath, {
        currentToken: nextTokenNo,
        tokenList: updatedList,
        lastUpdated: new Date().toISOString(),
      });
    }

    setStatusBanner(
      `Consultation completed for ${targetPatientName} (Token #${activeToken?.tokenNo || currentServingNo}). OPD visit, e-Prescription, and diagnostic orders committed.`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Physician OPD Consultation Console"
        title="Outpatient Queue Control & E-Prescription"
        subtitle="Call waiting OPD tokens, document clinical diagnosis, issue electronic prescriptions, and dispatch laboratory/radiology orders."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              icon={<SkipForward className="w-4 h-4" />}
              onClick={handleSkipCurrentToken}
            >
              Skip / Recall Token
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<Play className="w-4 h-4" />}
              onClick={handleCallNextToken}
            >
              Call Next Patient Token
            </Button>
          </div>
        }
      />

      {statusBanner && (
        <NoticeBanner variant="success" title="Clinical Queue & EHR Updated" onDismiss={() => setStatusBanner(null)}>
          {statusBanner}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Columns: Live Waiting Token Queue */}
        <div className="lg:col-span-4 space-y-6">
          <Card padding="lg" className="bg-navy-950 text-white border-navy-800">
            <span className="text-xs font-bold uppercase tracking-wider text-mediteal-400 block">
              Active Consultation Room
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <h2 className="text-3xl font-extrabold font-display">
                Token #{activeToken?.tokenNo || currentServingNo}
              </h2>
              <Badge variant="teal" dot>IN CONSULTATION</Badge>
            </div>
            <p className="text-sm font-bold text-slate-200 mt-2">
              {activeToken?.patientName || 'Aarav Sharma'}
            </p>
            <p className="text-xs font-mono text-slate-400">
              Patient ID: {activeToken?.patientId || 'pat_0001'} • Ref: {activeToken?.appointmentId || 'APT-2026-10412'}
            </p>
          </Card>

          <Card padding="lg">
            <SectionHeader
              title={`OPD Token Roster (${tokenList.length})`}
              subtitle="Live synchronized department queue"
              icon={<Users className="w-5 h-5" />}
            />

            <div className="space-y-2">
              {tokenList.map((tok) => (
                <div
                  key={tok.tokenNo}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    tok.tokenNo === currentServingNo
                      ? 'bg-mediblue-50/80 border-mediblue-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      Token #{tok.tokenNo}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{tok.patientName}</h4>
                    <span className="text-[11px] font-mono text-slate-500">ID: {tok.patientId}</span>
                  </div>
                  <Badge
                    variant={
                      tok.status === 'completed'
                        ? 'success'
                        : tok.status === 'in_progress' || tok.tokenNo === currentServingNo
                        ? 'info'
                        : tok.status === 'skipped'
                        ? 'danger'
                        : 'warning'
                    }
                    dot
                  >
                    {tok.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 8 Columns: Clinical Consultation & Rx Form */}
        <div className="lg:col-span-8 space-y-6">
          <Card padding="lg">
            <SectionHeader
              title="1. Clinical Assessment & Primary Diagnosis"
              subtitle={`Recording encounter for ${activeToken?.patientName || 'Aarav Sharma'} (${activeToken?.patientId || 'pat_0001'})`}
              icon={<FileText className="w-5 h-5" />}
            />

            <div className="space-y-4">
              <div>
                <label className="mq-label">Primary Clinical Diagnosis (ICD-10 / Clinical Description)</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="mq-input"
                />
              </div>

              <div>
                <label className="mq-label">Examination Findings, Vitals & Clinical Notes</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="mq-input"
                />
              </div>
            </div>
          </Card>

          {/* Electronic Prescription Builder */}
          <Card padding="lg">
            <SectionHeader
              title="2. Electronic Medication Prescription (e-Rx)"
              subtitle="Specify pharmacological agents, dosage regimens, and treatment duration"
              icon={<Pill className="w-5 h-5" />}
            />

            <div className="space-y-3 mb-4">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-sm font-bold text-slate-900">{med.name}</span>
                    <p className="text-xs text-slate-600">
                      Dosage: <strong>{med.dosage}</strong> • Frequency: <strong>{med.frequency}</strong> • Duration:{' '}
                      <strong>{med.duration}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMedications((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <input
                type="text"
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                placeholder="Medication name (e.g. Tab. Metoprolol 25mg)"
                className="mq-input sm:col-span-2"
              />
              <input
                type="text"
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 1 Tab)"
                className="mq-input"
              />
              <input
                type="text"
                value={newMedFreq}
                onChange={(e) => setNewMedFreq(e.target.value)}
                placeholder="Frequency"
                className="mq-input"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMedDuration}
                  onChange={(e) => setNewMedDuration(e.target.value)}
                  placeholder="Duration"
                  className="mq-input flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddMedication}
                >
                  Add
                </Button>
              </div>
            </div>
          </Card>

          {/* Diagnostic Requisitions & Final Commit */}
          <Card padding="lg">
            <SectionHeader
              title="3. Laboratory & Radiology Requisitions"
              subtitle="Checked investigations are automatically dispatched to the hospital LIS/RIS queue"
              icon={<FlaskConical className="w-5 h-5" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderCbc}
                  onChange={(e) => setOrderCbc(e.target.checked)}
                  className="mt-0.5 rounded text-mediteal-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">CBC & Lipid Panel</span>
                  <span className="text-slate-500">Hematology & Biochemistry</span>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderTroponin}
                  onChange={(e) => setOrderTroponin(e.target.checked)}
                  className="mt-0.5 rounded text-mediteal-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">hs-Troponin I & HbA1c</span>
                  <span className="text-slate-500">Cardiac Biomarker Assay</span>
                </div>
              </label>

              <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderEcho}
                  onChange={(e) => setOrderEcho(e.target.checked)}
                  className="mt-0.5 rounded text-mediteal-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">2D Echocardiogram</span>
                  <span className="text-slate-500">Non-Invasive Cardiology</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button
                variant="primary"
                size="lg"
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleCompleteConsultation}
              >
                Complete Consultation & Advance OPD Queue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
