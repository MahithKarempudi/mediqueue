import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import { rankEmergencyHospitals, type RankedEmergencyHospital } from '@/services/emergency/routingEngine';
import type { Hospital, EmergencyCapacity } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, NoticeBanner } from '@/components/ui';
import {
  AlertTriangle,
  Navigation,
  PhoneCall,
  MapPin,
  Bed,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

const LOCATION_PRESETS = [
  { label: 'Connaught Place (Central)', lat: 28.6304, lng: 77.2177 },
  { label: 'AIIMS / South Extension', lat: 28.5672, lng: 77.2100 },
  { label: 'Civil Lines (North)', lat: 28.6814, lng: 77.2225 },
  { label: 'Indirapuram (East)', lat: 28.6415, lng: 77.3714 },
];

export const EmergencyRoutingPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [capacities, setCapacities] = useState<Record<string, EmergencyCapacity>>({});
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(LOCATION_PRESETS[0]);
  const [requireIcu, setRequireIcu] = useState<boolean>(true);
  const [rankedList, setRankedList] = useState<RankedEmergencyHospital[]>([]);

  useEffect(() => {
    const loadEmergencyData = async () => {
      const [h, c] = await Promise.all([
        dbService.getCollection<Hospital>('hospitals'),
        dbService.getRTDB<Record<string, EmergencyCapacity>>('emergencyCapacity'),
      ]);
      setHospitals(h);
      if (c) setCapacities(c);
    };
    loadEmergencyData();
  }, []);

  useEffect(() => {
    if (hospitals.length === 0) return;
    const ranked = rankEmergencyHospitals(userCoords, hospitals, capacities, requireIcu);
    setRankedList(ranked);
  }, [userCoords, hospitals, capacities, requireIcu]);

  const topRecommendation = rankedList[0];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Clinical Decision-Support Calculator"
        title="Emergency Trauma & ICU Routing Advisor"
        subtitle="Multi-variable Haversine proximity and real-time ICU bed availability ranking across regional hospitals."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="tel:102"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              Dial 102 Ambulance
            </a>
            <a
              href="tel:112"
              className="px-4 py-2 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs"
            >
              <PhoneCall className="w-4 h-4 text-mediteal-400" />
              Emergency 112
            </a>
          </div>
        }
      />

      {/* Explicit Clinical Safety Limitation Banner */}
      <NoticeBanner
        variant="warning"
        title="Decision-Support Advisory Notice (Not Live Ambulance Dispatch)"
      >
        This module computes proximity and hospital bed capacity rankings using Haversine geodesic distance and reported ward telemetry. It does not dispatch emergency medical vehicles. In a life-threatening medical emergency, dial <strong>102</strong> or <strong>112</strong> immediately.
      </NoticeBanner>

      {/* Patient Location & Criticality Controls */}
      <Card padding="lg">
        <SectionHeader
          title="1. Patient Origin Coordinates & Triage Requirement"
          subtitle="Select a locality preset or enter GPS coordinates to recalculate hospital travel time and ICU readiness"
          icon={<MapPin className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-6">
            <label className="mq-label">Quick Regional Locality Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATION_PRESETS.map((preset) => {
                const isSelected =
                  Math.abs(userCoords.lat - preset.lat) < 0.001 &&
                  Math.abs(userCoords.lng - preset.lng) < 0.001;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setUserCoords({ lat: preset.lat, lng: preset.lng })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="mq-label">GPS Coordinates (Lat, Lng)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.001"
                value={userCoords.lat}
                onChange={(e) => setUserCoords((prev) => ({ ...prev, lat: Number(e.target.value) }))}
                className="mq-input font-mono text-xs"
              />
              <input
                type="number"
                step="0.001"
                value={userCoords.lng}
                onChange={(e) => setUserCoords((prev) => ({ ...prev, lng: Number(e.target.value) }))}
                className="mq-input font-mono text-xs"
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="mq-label">Acuity Level</label>
            <button
              type="button"
              onClick={() => setRequireIcu((r) => !r)}
              className={`w-full px-3.5 py-2 rounded-lg text-xs font-bold border flex items-center justify-between cursor-pointer ${
                requireIcu
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span>Require Open ICU Bed</span>
              <span className="font-mono">{requireIcu ? 'MANDATORY' : 'OPTIONAL'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Primary Recommended Facility Banner */}
      {topRecommendation && (
        <Card padding="lg" className="border-2 border-mediteal-600 bg-mediteal-50/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="teal" dot>OPTIMAL TRAUMA ROUTING TARGET</Badge>
                <span className="text-xs font-mono font-bold text-mediteal-800">
                  Suitability Score: {topRecommendation.suitabilityScore} / 100
                </span>
              </div>
              <h2 className="text-xl font-extrabold font-display text-slate-900 mt-1">
                {topRecommendation.hospital.name}
              </h2>
              <p className="text-xs text-slate-600">
                {topRecommendation.hospital.address} ({topRecommendation.hospital.district} District)
              </p>
              <p className="text-xs font-semibold text-mediteal-800 pt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-mediteal-600" />
                {topRecommendation.recommendationReason}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Est. Transit</span>
                <span className="text-lg font-extrabold font-display text-slate-900">
                  {topRecommendation.estimatedTravelMinutes} mins
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  {topRecommendation.distanceKm} km
                </span>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">ICU Open</span>
                <span className="text-lg font-extrabold font-display text-mediblue-700">
                  {topRecommendation.capacity.icuBedsFree} Beds
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  Gen: {topRecommendation.capacity.generalBedsFree}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Ranked Regional Facilities Table */}
      <Card padding="lg">
        <SectionHeader
          title="2. Comparative Regional Emergency Readiness Matrix"
          subtitle="Ranked by Haversine distance, ICU availability, and diversion status"
          icon={<Navigation className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Rank</th>
                <th className="mq-table-th">Facility & District</th>
                <th className="mq-table-th">Distance & ETA</th>
                <th className="mq-table-th">ICU / General Free</th>
                <th className="mq-table-th">Trauma Status</th>
                <th className="mq-table-th">Routing Score & Rationale</th>
              </tr>
            </thead>
            <tbody>
              {rankedList.map((item, idx) => (
                <tr
                  key={item.hospital.hospitalId}
                  className={idx === 0 ? 'bg-mediteal-50/40' : 'hover:bg-slate-50'}
                >
                  <td className="mq-table-td font-mono font-bold text-slate-900">#{idx + 1}</td>
                  <td className="mq-table-td">
                    <div className="font-bold text-slate-900">{item.hospital.name}</div>
                    <div className="text-xs text-slate-500">{item.hospital.address}</div>
                  </td>
                  <td className="mq-table-td font-mono text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-mediblue-600" />
                      ~{item.estimatedTravelMinutes} mins
                    </div>
                    <div className="text-slate-500">{item.distanceKm} km geodesic</div>
                  </td>
                  <td className="mq-table-td">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-mediblue-50 text-mediblue-800 font-bold border border-mediblue-200">
                        ICU: {item.capacity.icuBedsFree}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        Gen: {item.capacity.generalBedsFree}
                      </span>
                    </div>
                  </td>
                  <td className="mq-table-td">
                    <Badge
                      variant={
                        item.capacity.emergencyStatus === 'Normal'
                          ? 'success'
                          : item.capacity.emergencyStatus === 'Surge'
                          ? 'warning'
                          : 'danger'
                      }
                      dot
                    >
                      {item.capacity.emergencyStatus}
                    </Badge>
                  </td>
                  <td className="mq-table-td">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-900">
                        {item.suitabilityScore} pts
                      </span>
                      <span className="text-xs text-slate-600">— {item.recommendationReason}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
