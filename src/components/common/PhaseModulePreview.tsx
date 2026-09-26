import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

interface PhaseModulePreviewProps {
  title: string;
  targetPhase: number;
  phaseName: string;
  description: string;
  backPath: string;
}

export const PhaseModulePreview: React.FC<PhaseModulePreviewProps> = ({
  title,
  targetPhase,
  phaseName,
  description,
  backPath,
}) => {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center animate-fade-in">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mediblue-500/10 border border-mediblue-500/20 text-mediblue-400">
          <Clock className="h-7 w-7" />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-mediblue-300">
          <span>Scheduled for Phase {targetPhase}: {phaseName}</span>
        </div>

        <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Phase 1 Foundation Complete</span>
          </div>
          <p>
            The data schema, RBAC permissions, and protected routing for this module are active and verified. The full transactional logic and user interface will be implemented in Phase {targetPhase} per Section 9 build order.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to={backPath}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
