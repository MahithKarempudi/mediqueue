import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { PathologyReport, RadiologyReport, PathologyOrder, RadiologyOrder } from '@/types';
import {
  Microscope,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Calendar,
  UserCheck,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const PatientReportsPage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_demo_01';

  const [pathReports, setPathReports] = useState<PathologyReport[]>([]);
  const [radReports, setRadReports] = useState<RadiologyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const [allPath, allRad] = await Promise.all([
        dbService.getCollection<PathologyReport>('pathology_reports'),
        dbService.getCollection<RadiologyReport>('radiology_reports'),
      ]);

      if (allPath.length === 0) {
        // Seed patient demo reports
        const p1: PathologyReport = {
          reportId: 'rep_path_demo_01',
          orderId: 'ord_path_01',
          patientId,
          testType: 'Complete Blood Count (CBC) with Differential',
          resultData: {
            'Hemoglobin': { value: 13.6, normalRange: '12.0 - 15.5', unit: 'g/dL', flag: 'normal' },
            'Total Leucocyte Count (WBC)': { value: 7800, normalRange: '4,000 - 11,000', unit: '/mcL', flag: 'normal' },
            'Platelet Count': { value: 260000, normalRange: '150,000 - 450,000', unit: '/mcL', flag: 'normal' },
            'Neutrophils': { value: 62, normalRange: '40 - 75', unit: '%', flag: 'normal' },
            'Lymphocytes': { value: 30, normalRange: '20 - 45', unit: '%', flag: 'normal' },
          },
          verifiedBy: 'Dr. Neha Kapoor (MD Pathologist)',
          generatedAt: new Date(Date.now() - 86400000).toISOString(),
        };
        const p2: PathologyReport = {
          reportId: 'rep_path_demo_02',
          orderId: 'ord_path_02',
          patientId,
          testType: 'Lipid Profile & Serum Cholesterol',
          resultData: {
            'Total Cholesterol': { value: 218, normalRange: '< 200', unit: 'mg/dL', flag: 'high' },
            'Triglycerides': { value: 165, normalRange: '< 150', unit: 'mg/dL', flag: 'high' },
            'HDL (Good Cholesterol)': { value: 48, normalRange: '> 40', unit: 'mg/dL', flag: 'normal' },
            'LDL (Bad Cholesterol)': { value: 137, normalRange: '< 100', unit: 'mg/dL', flag: 'high' },
          },
          verifiedBy: 'Dr. Neha Kapoor (MD Pathologist)',
          generatedAt: new Date(Date.now() - 172800000).toISOString(),
        };
        await dbService.setDocument('pathology_reports', p1.reportId, p1);
        await dbService.setDocument('pathology_reports', p2.reportId, p2);
        setPathReports([p1, p2]);
      } else {
        setPathReports(allPath);
      }

      if (allRad.length === 0) {
        const r1: RadiologyReport = {
          reportId: 'rep_rad_demo_01',
          orderId: 'ord_rad_01',
          patientId,
          scanType: 'Chest Digital Radiography (PA View)',
          findings: 'Cardiac size is normal. Both hilar structures appear unremarkable. Lung parenchyma is clear bilaterally without active consolidation, cavitation, or pleural effusion. Bony thoracic cage intact.',
          radiologistId: 'Dr. Arvind Singhal (Consultant Radiologist)',
          generatedAt: new Date(Date.now() - 259200000).toISOString(),
        };
        await dbService.setDocument('radiology_reports', r1.reportId, r1);
        setRadReports([r1]);
      } else {
        setRadReports(allRad);
      }
    };
    load();
  }, [patientId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
            Diagnostic Health Records
          </span>
          <span className="text-xs text-slate-400">Patient: {user?.name || 'Priya Sharma'}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Pathology & Radiology Diagnostic Reports
        </h1>
        <p className="mt-1 text-xs text-slate-400 max-w-xl">
          Inspect clinical laboratory markers, biological reference intervals, and verified radiological imaging findings released by authorized medical specialists.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pathology Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              <span>Laboratory Pathology Reports ({pathReports.length})</span>
            </h2>
          </div>

          {pathReports.map((rep) => (
            <div
              key={rep.reportId}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition hover:border-teal-500/40"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">{rep.testType}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Report #{rep.reportId}</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                  Verified
                </span>
              </div>

              {/* Lab Parameters Table */}
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-950/40">
                    <tr>
                      <th className="py-2 px-2.5">Investigation Parameter</th>
                      <th className="py-2 px-2.5">Observed Value</th>
                      <th className="py-2 px-2.5">Normal Interval</th>
                      <th className="py-2 px-2.5 text-right">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Object.keys(rep.resultData || {}).map((param) => {
                      const item = rep.resultData[param];
                      const isHigh = item.flag === 'high';
                      return (
                        <tr key={param} className="hover:bg-slate-800/30">
                          <td className="py-2 px-2.5 font-medium text-slate-200">{param}</td>
                          <td className="py-2 px-2.5 font-mono font-bold text-white">
                            {item.value} <span className="text-[10px] text-slate-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-400 text-[11px]">{item.normalRange}</td>
                          <td className="py-2 px-2.5 text-right">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                isHigh
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              {item.flag || 'NORMAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Sign-off: {rep.verifiedBy}</span>
                <span>{new Date(rep.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Radiology Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Radiology & Medical Imaging ({radReports.length})</span>
            </h2>
          </div>

          {radReports.map((rep) => (
            <div
              key={rep.reportId}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">{rep.scanType}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Report #{rep.reportId}</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                  Signed-off
                </span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-950/70 p-3.5 border border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">Radiological Impression & Findings:</span>
                <p className="mt-1 text-xs text-slate-200 leading-relaxed font-sans">{rep.findings}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Radiologist: {rep.radiologistId}</span>
                <span>{new Date(rep.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
