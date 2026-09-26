import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const GovernmentReportsPage: React.FC = () => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const districtSummaries = [
    { district: 'South Delhi District', hospitals: 3, totalBeds: 370, occupiedBeds: 268, utilizationRate: 72.4, icuCapacity: 60, icuFree: 16 },
    { district: 'Central Delhi District', hospitals: 1, totalBeds: 160, occupiedBeds: 144, utilizationRate: 90.0, icuCapacity: 28, icuFree: 2 },
    { district: 'East Delhi District', hospitals: 1, totalBeds: 70, occupiedBeds: 42, utilizationRate: 60.0, icuCapacity: 12, icuFree: 5 },
  ];

  const handleExportCSV = () => {
    let csv = 'data:text/csv;charset=utf-8,District,Accredited Hospitals,Total Beds,Occupied Beds,Utilization Rate (%),ICU Capacity,ICU Beds Free\n';
    districtSummaries.forEach((d) => {
      csv += `${d.district},${d.hospitals},${d.totalBeds},${d.occupiedBeds},${d.utilizationRate},${d.icuCapacity},${d.icuFree}\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `district_health_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback('District healthcare epidemiological report downloaded in CSV format.');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              Aggregated Public Health Records
            </span>
            <span className="text-xs text-slate-400 font-mono">Strict Privacy Compliant</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            District Epidemiological & Utilization Reports
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Jurisdictional summaries aggregated across regional hospitals without exposing identifiable patient health records. Exportable for policy planning.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 text-xs transition shadow-lg shadow-amber-950/50"
        >
          <Download className="h-4 w-4" />
          <span>Export District CSV</span>
        </button>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* District Summaries Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <span>District Health Authority Summary Overview</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Jurisdiction / District</th>
                <th className="px-4 py-3">Hospitals Monitored</th>
                <th className="px-4 py-3">Bed Census (Total)</th>
                <th className="px-4 py-3">Current Occupancy</th>
                <th className="px-4 py-3">Utilization Rate</th>
                <th className="px-4 py-3">ICU Available</th>
                <th className="px-4 py-3 text-right">District Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {districtSummaries.map((d) => (
                <tr key={d.district} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-white">{d.district}</td>
                  <td className="px-4 py-3 text-slate-300">{d.hospitals} Facilities</td>
                  <td className="px-4 py-3 text-slate-400">{d.totalBeds} Beds</td>
                  <td className="px-4 py-3 text-slate-400">{d.occupiedBeds} Inpatients</td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-400">{d.utilizationRate}%</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 font-bold">{d.icuFree} of {d.icuCapacity}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        d.utilizationRate >= 85
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {d.utilizationRate >= 85 ? 'Surge Active' : 'Normal Load'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
