import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  Bed,
  Users,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [feedback, setFeedback] = useState<string | null>(null);

  const dailyReports = [
    { date: '2026-09-17', opdCount: 142, admissions: 14, discharges: 11, emergencyCases: 19, bedUtilization: 76.4, revenue: 384000 },
    { date: '2026-09-16', opdCount: 155, admissions: 16, discharges: 12, emergencyCases: 22, bedUtilization: 78.1, revenue: 412000 },
    { date: '2026-09-15', opdCount: 138, admissions: 11, discharges: 14, emergencyCases: 17, bedUtilization: 74.5, revenue: 365000 },
    { date: '2026-09-14', opdCount: 160, admissions: 18, discharges: 15, emergencyCases: 24, bedUtilization: 81.2, revenue: 440000 },
    { date: '2026-09-13', opdCount: 125, admissions: 9, discharges: 8, emergencyCases: 15, bedUtilization: 72.0, revenue: 310000 },
    { date: '2026-09-12', opdCount: 148, admissions: 15, discharges: 13, emergencyCases: 20, bedUtilization: 77.0, revenue: 395000 },
  ];

  const monthlyReports = [
    { month: '2026-08', totalOpd: 4120, totalAdmissions: 410, totalDischarges: 395, avgUtilization: 76.8, totalRevenue: 9850000 },
    { month: '2026-07', totalOpd: 3980, totalAdmissions: 385, totalDischarges: 380, avgUtilization: 74.2, totalRevenue: 9240000 },
    { month: '2026-06', totalOpd: 4250, totalAdmissions: 430, totalDischarges: 415, avgUtilization: 79.5, totalRevenue: 10420000 },
  ];

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (reportType === 'daily') {
      csvContent += 'Date,OPD Visits,Admissions,Discharges,Emergency Cases,Bed Utilization (%),Revenue (INR)\n';
      dailyReports.forEach((r) => {
        csvContent += `${r.date},${r.opdCount},${r.admissions},${r.discharges},${r.emergencyCases},${r.bedUtilization},${r.revenue}\n`;
      });
    } else {
      csvContent += 'Month,Total OPD Visits,Total Admissions,Total Discharges,Avg Bed Utilization (%),Total Revenue (INR)\n';
      monthlyReports.forEach((r) => {
        csvContent += `${r.month},${r.totalOpd},${r.totalAdmissions},${r.totalDischarges},${r.avgUtilization},${r.totalRevenue}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediqueue_${reportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setFeedback(`CSV Export for ${reportType.toUpperCase()} reports generated and downloaded successfully!`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Regulatory Reporting & Audits
            </span>
            <span className="text-xs text-slate-400 font-mono">Automated Cloud Aggregator</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Hospital Operational Reports
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Consolidated daily throughput and monthly summaries. Directly downloadable in standard CSV format for clinical governance and district submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setReportType('daily')}
              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                reportType === 'daily' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Reports
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                reportType === 'monthly' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Aggregates
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 text-xs transition shadow-lg shadow-emerald-950/50"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span>{reportType === 'daily' ? 'Daily Clinical Census Reports' : 'Monthly Performance Aggregates'}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'daily' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Reporting Date</th>
                  <th className="px-4 py-3">OPD Visits</th>
                  <th className="px-4 py-3">Inpatient Admissions</th>
                  <th className="px-4 py-3">Discharges</th>
                  <th className="px-4 py-3">Emergency Cases</th>
                  <th className="px-4 py-3">Bed Utilization</th>
                  <th className="px-4 py-3 text-right">Daily Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {dailyReports.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-sky-400">{r.opdCount}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">{r.admissions}</td>
                    <td className="px-4 py-3 text-slate-400">{r.discharges}</td>
                    <td className="px-4 py-3 text-rose-400">{r.emergencyCases}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">{r.bedUtilization}%</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ₹ {r.revenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Month</th>
                  <th className="px-4 py-3">Total OPD Footfall</th>
                  <th className="px-4 py-3">Total Admissions</th>
                  <th className="px-4 py-3">Total Discharges</th>
                  <th className="px-4 py-3">Mean Bed Utilization</th>
                  <th className="px-4 py-3 text-right">Consolidated Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {monthlyReports.map((r) => (
                  <tr key={r.month} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{r.month}</td>
                    <td className="px-4 py-3 font-semibold text-sky-400">{r.totalOpd.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">{r.totalAdmissions}</td>
                    <td className="px-4 py-3 text-slate-400">{r.totalDischarges}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">{r.avgUtilization}%</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      ₹ {r.totalRevenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
