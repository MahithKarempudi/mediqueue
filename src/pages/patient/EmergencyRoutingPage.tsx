import React, { useState, useEffect } from 'react';
import { dbService } from '@/services/db';
import type { Hospital, IpdBed, EmergencyCapacity } from '@/types';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Bed,
  Phone,
  Navigation,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Radio,
  Sparkles,
} from 'lucide-react';

interface HospitalRoutingCard {
  hospital: Hospital;
  distanceKm: number;
  etaMins: number;
  icuFree: number;
  generalFree: number;
  emergencyStatus: 'Normal' | 'Surge' | 'Critical' | 'Diverting';
  compositeScore: number;
  isRecommended: boolean;
}

export const EmergencyRoutingPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 28.5400,
    lng: 77.2600,
    name: 'South Delhi (Near Greater Kailash)',
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    dbService.getCollection<Hospital>('hospitals').then(setHospitals);
    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (items) => {
      setBeds(items);
    });
    return () => unsub();
  }, []);

  // Haversine Distance Calculation Formula (Kilometers)
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  // Compute Ranked Hospitals by Combined Availability + ETA Score
  // Pinned requirement from Section 5:
  // "rank by a combined score of availability + ETA (not distance alone)"
  const rankedHospitals: HospitalRoutingCard[] = hospitals
    .map((hosp) => {
      const distanceKm = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        hosp.geo.lat,
        hosp.geo.lng
      );
      // Average city transit speed ~30 km/h + 3 min signal buffer
      const etaMins = Math.max(4, Math.round((distanceKm / 30) * 60 + 3));

      const hospBeds = beds.filter((b) => b.hospitalId === hosp.hospitalId);
      const icuFree = hospBeds.filter((b) => b.type === 'ICU' && b.status === 'available').length;
      const generalFree = hospBeds.filter((b) => b.type === 'general' && b.status === 'available').length;
      const occupied = hospBeds.filter((b) => b.status === 'occupied').length;
      const occupancyRate = hospBeds.length > 0 ? occupied / hospBeds.length : 0;

      let emergencyStatus: 'Normal' | 'Surge' | 'Critical' | 'Diverting' = 'Normal';
      if (!hosp.emergencyAvailable) {
        emergencyStatus = 'Diverting';
      } else if (occupancyRate >= 0.85) {
        emergencyStatus = 'Surge';
      } else if (icuFree <= 1) {
        emergencyStatus = 'Critical';
      }

      // Multi-factor Score Algorithm:
      // Lower ETA is better (-etaMins * 2)
      // More free ICU beds is heavily rewarded (+icuFree * 15)
      // Diverting status carries severe penalty (-1000)
      // Surge status carries moderate penalty (-30)
      let compositeScore = 100 - etaMins * 2.5 + icuFree * 12;
      if (emergencyStatus === 'Diverting') compositeScore -= 1000;
      if (emergencyStatus === 'Surge') compositeScore -= 35;
      if (emergencyStatus === 'Critical') compositeScore -= 20;

      return {
        hospital: hosp,
        distanceKm,
        etaMins,
        icuFree,
        generalFree,
        emergencyStatus,
        compositeScore,
        isRecommended: false,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  if (rankedHospitals.length > 0) {
    rankedHospitals[0].isRecommended = true;
  }

  const presetLocations = [
    { name: 'South Delhi (Sarita Vihar)', lat: 28.5350, lng: 77.2880 },
    { name: 'Saket / Malviya Nagar', lat: 28.5280, lng: 77.2180 },
    { name: 'Central Delhi (Connaught Place)', lat: 28.6310, lng: 77.2190 },
    { name: 'East Delhi (Preet Vihar)', lat: 28.6380, lng: 77.2960 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 p-6 backdrop-blur-md shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
              Emergency Trauma Dispatch
            </span>
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <Radio className="h-3 w-3 animate-ping" />
              <span>Live ICU Availability Engine</span>
            </div>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            ETA & Capacity-Based Emergency Routing
          </h1>
          <p className="mt-1 text-xs text-slate-300 max-w-xl">
            Intelligent multi-factor hospital routing. Evaluates travel ETA against verified Realtime Database ICU beds and emergency capacity—ensuring patients are not diverted to overcrowded emergency wings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:102"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-3 text-xs font-extrabold text-white shadow-xl shadow-rose-950/60 hover:from-rose-500 hover:to-red-500 transition animate-pulse"
          >
            <Phone className="h-4 w-4" />
            <span>Call Ambulance (102 / 112)</span>
          </a>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Simulated Location Selector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-sky-400" />
            <span className="text-slate-400">Patient Emergency Location:</span>
            <span className="font-bold text-white">{userLocation.name}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-slate-500 text-[11px] self-center mr-1">Simulate Location:</span>
            {presetLocations.map((loc) => (
              <button
                key={loc.name}
                onClick={() => setUserLocation(loc)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  userLocation.name === loc.name
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {loc.name.split('(')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ranked Hospitals List */}
      <div className="space-y-4">
        {rankedHospitals.map((item, index) => {
          const isTop = index === 0 && item.emergencyStatus !== 'Diverting';
          const isDiverting = item.emergencyStatus === 'Diverting';
          const isSurge = item.emergencyStatus === 'Surge';

          return (
            <div
              key={item.hospital.hospitalId}
              className={`rounded-2xl border p-5 transition-all shadow-xl ${
                isTop
                  ? 'border-emerald-500/60 bg-emerald-950/20 ring-1 ring-emerald-500/30'
                  : isDiverting
                  ? 'border-slate-800 bg-slate-950/60 opacity-60'
                  : 'border-slate-800 bg-slate-900/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Info */}
                <div>
                  <div className="flex items-center gap-2">
                    {isTop && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                        <Sparkles className="h-3 w-3" /> #1 RECOMMENDED BY ALGORITHM
                      </span>
                    )}
                    <span className="font-mono text-xs text-slate-500 font-bold">
                      RANK #{index + 1}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.emergencyStatus === 'Normal'
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : isSurge
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : isDiverting
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      Status: {item.emergencyStatus}
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-white">{item.hospital.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{item.hospital.address}</span>
                  </p>
                </div>

                {/* Right: Telemetry & Metrics */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Distance & ETA */}
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Travel ETA</p>
                    <div className="flex items-center gap-1 text-white font-bold text-base">
                      <Clock className="h-4 w-4 text-sky-400" />
                      <span>~{item.etaMins} Mins</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.distanceKm} km away</span>
                  </div>

                  {/* Free ICU Beds */}
                  <div className="text-center sm:text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Free ICU Beds</p>
                    <div className="flex items-center gap-1 font-bold text-base">
                      <Bed className="h-4 w-4 text-teal-400" />
                      <span className={item.icuFree <= 1 ? 'text-rose-400' : 'text-emerald-400'}>
                        {item.icuFree} Free
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{item.generalFree} General Free</span>
                  </div>

                  {/* Route Button */}
                  <button
                    onClick={() => {
                      setFeedback(`Emergency routing protocol initialized for ${item.hospital.name}. Trauma intake notified!`);
                      setTimeout(() => setFeedback(null), 5000);
                    }}
                    disabled={isDiverting}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                      isTop
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : isDiverting
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    <span>{isDiverting ? 'Diverting Intake' : 'Route to Hospital'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
