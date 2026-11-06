import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital, IpdBed, EmergencyCapacity } from '@/types';
import { PageHeader, Card, Badge, NoticeBanner } from '@/components/ui';
import {
  AlertTriangle,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export const GovernmentSurgePage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [capacities, setCapacities] = useState<Record<string, EmergencyCapacity>>({});

  useEffect(() => {
    const loadSurge = async () => {
      const [h, b, c] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getCollection<IpdBed>('ipd_beds'),
        dbService.getRTDB<Record<string, EmergencyCapacity>>('emergencyCapacity'),
      ]);
      setHospitals(h);
      setBeds(b);
      if (c) setCapacities(c);
    };
    loadSurge();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Regional Trauma & Surge Escalation Watch"
        title="Hospital Capacity Ceiling & Diversion Monitor"
        subtitle="Real-time monitoring of facilities approaching the 85% inpatient occupancy threshold or critical ICU depletion."
      />

      <NoticeBanner variant="warning" title="Automated Regional Surge Threshold Policy">
        Facilities exceeding <strong>85% total bed utilization</strong> or dropping below <strong>2 open ICU beds</strong> trigger an automatic regional capacity advisory so neighboring district hospitals can prepare for load balancing.
      </NoticeBanner>

      <div className="grid grid-cols-1 gap-4">
        {hospitals.map((h) => {
          const hb = beds.filter((b) => b.hospitalId === h.hospitalId);
          const occ = hb.filter((b) => b.status === 'occupied').length;
          const icuFree = hb.filter((b) => b.type === 'ICU' && b.status === 'available').length;
          const genFree = hb.filter((b) => b.type === 'general' && b.status === 'available').length;
          const pct = hb.length > 0 ? Math.round((occ / hb.length) * 100) : 0;
          const isSurge = pct >= 85 || icuFree <= 1 || !h.emergencyAvailable;
          const cap = capacities[h.hospitalId];

          return (
            <Card
              key={h.hospitalId}
              padding="lg"
              className={isSurge ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isSurge
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isSurge ? <ShieldAlert className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{h.name}</h3>
                      <Badge variant="neutral">{h.district} District</Badge>
                      <Badge variant={isSurge ? 'warning' : 'success'} dot>
                        {cap?.emergencyStatus || (isSurge ? 'Capacity Watch' : 'Normal Readiness')}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{h.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 uppercase block font-sans font-semibold">Occupancy</span>
                    <span className="text-base font-extrabold text-slate-900">{pct}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase block font-sans font-semibold">ICU Free</span>
                    <span className="text-base font-extrabold text-mediblue-700">{icuFree} Beds</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase block font-sans font-semibold">General Free</span>
                    <span className="text-base font-extrabold text-mediteal-700">{genFree} Beds</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  {isSurge ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Advisory: Coordinate non-critical inter-facility transfers to neighboring district centers.
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Adequate ICU and general ward reserve available for regional emergency intake.
                    </>
                  )}
                </span>
                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> {occ} / {hb.length} Beds Occupied
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
