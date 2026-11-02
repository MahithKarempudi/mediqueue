import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import { estimatePatientWaitTime } from '@/services/analytics/waitTimeEngine';
import type { Hospital, Department, LiveQueue } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, MetricCard } from '@/components/ui';
import {
  Clock,
  Activity,
  Users,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Info,
  Sparkles,
  Building2,
} from 'lucide-react';

export const LiveQueueTrackerPage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_0001';

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp_metro_01');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept_cardio_01');
  const [liveQueue, setLiveQueue] = useState<LiveQueue | null>(null);

  // What-If Wait-Time Simulator Controls
  const [activeDoctors, setActiveDoctors] = useState<number>(2);
  const [avgConsultMins, setAvgConsultMins] = useState<number>(8);
  const [emergencyDelays, setEmergencyDelays] = useState<number>(0);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  useEffect(() => {
    const loadMeta = async () => {
      const [h, d] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<Department>('departments'),
      ]);
      setHospitals(h);
      setDepartments(d);
    };
    loadMeta();
  }, []);

  const hospitalDepts = departments.filter((d) => d.hospitalId === selectedHospitalId);

  useEffect(() => {
    if (hospitalDepts.length > 0 && !hospitalDepts.some((d) => d.departmentId === selectedDeptId)) {
      setSelectedDeptId(hospitalDepts[0].departmentId);
    }
  }, [selectedHospitalId, hospitalDepts, selectedDeptId]);

  useEffect(() => {
    const path = `liveQueues/${selectedHospitalId}/${selectedDeptId}`;
    const unsub = dbService.subscribeRTDB<LiveQueue>(path, (data) => {
      if (data) {
        setLiveQueue(data);
      } else {
        setLiveQueue({
          currentToken: 15,
          lastUpdated: new Date().toISOString(),
          tokenList: [
            { tokenNo: 15, patientId: 'pat_0003', patientName: 'Rohan Patel', status: 'in_progress', joinedAt: new Date().toISOString() },
            { tokenNo: 16, patientId: 'pat_0004', patientName: 'Sneha Gupta', status: 'waiting', joinedAt: new Date().toISOString() },
            { tokenNo: 17, patientId: 'pat_0005', patientName: 'Vikram Singh', status: 'waiting', joinedAt: new Date().toISOString() },
            { tokenNo: 18, patientId: 'pat_0001', patientName: user?.name || 'Aarav Sharma', status: 'waiting', joinedAt: new Date().toISOString() },
          ],
        });
      }
    });
    return () => unsub();
  }, [selectedHospitalId, selectedDeptId, user?.name]);

  const currentServing = liveQueue?.currentToken || 15;
  const myTokenObj =
    liveQueue?.tokenList?.find((t) => t.patientId === patientId && t.status !== 'completed') ||
    liveQueue?.tokenList?.find((t) => t.tokenNo === 18) ||
    { tokenNo: 18, patientName: user?.name || 'Aarav Sharma', status: 'waiting' as const };

  const waitTelemetry = estimatePatientWaitTime({
    currentServingToken: currentServing,
    userTokenNumber: myTokenObj.tokenNo,
    activeDoctorsCount: activeDoctors,
    avgConsultationMinutes: avgConsultMins,
    emergencyInterruptionsCount: emergencyDelays,
  });

  const currentHosp = hospitals.find((h) => h.hospitalId === selectedHospitalId);
  const currentDept = departments.find((d) => d.departmentId === selectedDeptId);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Real-Time OPD Token Telemetry"
        title="Live Outpatient Queue Tracker"
        subtitle="Track active consultation progress in real time. Wait-time predictions are computed via MediQueue's deterministic clinical queue regression formula."
        actions={
          <button
            type="button"
            onClick={() => setShowSimulator((s) => !s)}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-mediteal-600" />
            {showSimulator ? 'Hide Wait-Time Simulator' : 'What-If Wait Simulator'}
          </button>
        }
      />

      {/* Facility & Department Selector Bar */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mq-label">Hospital Facility</label>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="mq-input"
            >
              {hospitals.map((h) => (
                <option key={h.hospitalId} value={h.hospitalId}>
                  {h.name} ({h.district})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mq-label">Outpatient Department Queue</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="mq-input"
            >
              {hospitalDepts.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name} OPD Clinic
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Top Queue Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Currently Serving Token"
          value={`#${currentServing}`}
          subtitle={`${currentDept?.name || 'Cardiology'} Consultation Room`}
          icon={<Activity className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="Your Assigned Token"
          value={`#${myTokenObj.tokenNo}`}
          subtitle={`Patient: ${myTokenObj.patientName}`}
          icon={<Users className="w-5 h-5" />}
          accent="teal"
        />
        <MetricCard
          label="Patients Ahead of You"
          value={waitTelemetry.tokensAhead}
          subtitle={`Queue Load Status: ${waitTelemetry.queueLoadStatus}`}
          icon={<ArrowRight className="w-5 h-5" />}
          accent="navy"
        />
        <MetricCard
          label="Estimated Wait Time"
          value={`${waitTelemetry.estimatedMinutes} mins`}
          subtitle={`Confidence Interval: ${Math.round(waitTelemetry.confidenceScore * 100)}%`}
          icon={<Clock className="w-5 h-5" />}
          accent={waitTelemetry.estimatedMinutes > 25 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Collapsible What-If Simulator */}
      {showSimulator && (
        <Card padding="lg" className="bg-slate-50 border-mediteal-200">
          <SectionHeader
            title="Heuristic Queue Load Simulator (What-If Analysis)"
            subtitle="Adjust clinic staffing or emergency trauma interruptions to see how the deterministic wait-time formula responds"
            icon={<Sparkles className="w-5 h-5" />}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Active Consulting Doctors</span>
                <span className="font-mono font-bold text-mediblue-700">{activeDoctors} Doctors</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={activeDoctors}
                onChange={(e) => setActiveDoctors(Number(e.target.value))}
                className="w-full accent-mediteal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Avg. Consultation Duration</span>
                <span className="font-mono font-bold text-mediblue-700">{avgConsultMins} mins</span>
              </div>
              <input
                type="range"
                min={5}
                max={20}
                value={avgConsultMins}
                onChange={(e) => setAvgConsultMins(Number(e.target.value))}
                className="w-full accent-mediteal-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Emergency Priority Interruptions</span>
                <span className="font-mono font-bold text-amber-700">{emergencyDelays} Cases</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                value={emergencyDelays}
                onChange={(e) => setEmergencyDelays(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-mediblue-600 shrink-0" />
            <span>
              <strong>Transparent Formula:</strong>{' '}
              <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                Wait = ceil((TokensAhead / ActiveDoctors) × AvgConsultMins + (EmergencyCases × 12m))
              </code>
            </span>
          </div>
        </Card>
      )}

      {/* Visual Token Progression Line */}
      <Card padding="lg">
        <SectionHeader
          title={`Live Queue Roster — ${currentHosp?.name || 'Metro General Hospital'}`}
          subtitle={`${currentDept?.name || 'Cardiology'} Outpatient Wing • Synchronized via Reactive Storage Engine`}
          icon={<Building2 className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Token #</th>
                <th className="mq-table-th">Patient Name</th>
                <th className="mq-table-th">Appointment Ref</th>
                <th className="mq-table-th">Queue Status</th>
                <th className="mq-table-th">Estimated Turn</th>
              </tr>
            </thead>
            <tbody>
              {(liveQueue?.tokenList || []).map((token) => {
                const isMe = token.patientId === patientId || token.tokenNo === myTokenObj.tokenNo;
                const tokenEst = estimatePatientWaitTime({
                  currentServingToken: currentServing,
                  userTokenNumber: token.tokenNo,
                  activeDoctorsCount: activeDoctors,
                  avgConsultationMinutes: avgConsultMins,
                  emergencyInterruptionsCount: emergencyDelays,
                });

                return (
                  <tr
                    key={token.tokenNo}
                    className={isMe ? 'bg-mediteal-50/70 font-semibold' : 'hover:bg-slate-50'}
                  >
                    <td className="mq-table-td font-mono font-bold text-slate-900">
                      #{token.tokenNo}
                      {isMe && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] bg-mediteal-600 text-white font-sans">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="mq-table-td font-medium text-slate-900">{token.patientName}</td>
                    <td className="mq-table-td font-mono text-xs text-slate-500">
                      {token.appointmentId || 'OPD-WALKIN'}
                    </td>
                    <td className="mq-table-td">
                      {token.status === 'completed' ? (
                        <Badge variant="success" dot>Completed</Badge>
                      ) : token.status === 'in_progress' || token.tokenNo === currentServing ? (
                        <Badge variant="info" dot>In Consultation</Badge>
                      ) : token.status === 'skipped' ? (
                        <Badge variant="warning" dot>Recalled / Skipped</Badge>
                      ) : (
                        <Badge variant="neutral" dot>Waiting in Lounge</Badge>
                      )}
                    </td>
                    <td className="mq-table-td font-mono text-xs text-slate-700">
                      {token.status === 'completed' ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-sans font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Served
                        </span>
                      ) : token.tokenNo === currentServing ? (
                        <span className="text-mediblue-700 font-sans font-bold">Active Now</span>
                      ) : (
                        `~${tokenEst.estimatedMinutes} mins`
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
