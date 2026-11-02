import type { Hospital, EmergencyCapacity, GeoLocation } from '@/types';

export interface RankedEmergencyHospital {
  hospital: Hospital;
  capacity: EmergencyCapacity;
  distanceKm: number;
  estimatedTravelMinutes: number;
  suitabilityScore: number;
  recommendationReason: string;
}

function computeHaversineKm(a: GeoLocation, b: GeoLocation): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Number((R * c).toFixed(1));
}

export function rankEmergencyHospitals(
  origin: GeoLocation,
  hospitals: Hospital[],
  capacities: Record<string, EmergencyCapacity>,
  requireIcu: boolean = true
): RankedEmergencyHospital[] {
  const list: RankedEmergencyHospital[] = hospitals.map((hospital) => {
    const coords = hospital.geo || hospital.location || { lat: 28.5672, lng: 77.21 };
    const distanceKm = computeHaversineKm(origin, coords);
    const estimatedTravelMinutes = Math.max(4, Math.round(distanceKm * 2.4));

    const capacity: EmergencyCapacity = capacities[hospital.hospitalId] || {
      icuBedsFree: hospital.emergencyAvailable === false ? 0 : 4,
      generalBedsFree: 12,
      emergencyStatus: hospital.emergencyAvailable === false ? 'Diverting' : 'Normal',
    };

    let score = 100 - distanceKm * 3.2;
    if (capacity.emergencyStatus === 'Diverting' || hospital.emergencyAvailable === false) {
      score -= 55;
    } else if (capacity.emergencyStatus === 'Surge') {
      score -= 18;
    } else if (capacity.emergencyStatus === 'Critical') {
      score -= 28;
    }

    if (requireIcu) {
      if (capacity.icuBedsFree <= 0) score -= 40;
      else score += Math.min(18, capacity.icuBedsFree * 3);
    } else {
      score += Math.min(12, capacity.generalBedsFree);
    }

    const suitabilityScore = Math.max(5, Math.min(99, Math.round(score)));

    let recommendationReason = 'Balanced geodesic proximity and open trauma capacity';
    if (capacity.emergencyStatus === 'Diverting' || hospital.emergencyAvailable === false) {
      recommendationReason = 'Trauma unit currently diverting ambulances';
    } else if (requireIcu && capacity.icuBedsFree >= 4) {
      recommendationReason = `High ICU readiness (${capacity.icuBedsFree} critical care beds open)`;
    } else if (distanceKm < 5) {
      recommendationReason = 'Fastest emergency transit corridor from origin';
    }

    return {
      hospital,
      capacity,
      distanceKm,
      estimatedTravelMinutes,
      suitabilityScore,
      recommendationReason,
    };
  });

  return list.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
