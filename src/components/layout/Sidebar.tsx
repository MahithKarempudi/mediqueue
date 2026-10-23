import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  Bed,
  FileText,
  CreditCard,
  History,
  AlertTriangle,
  Stethoscope,
  Microscope,
  BarChart3,
  Shield,
  Hospital,
  UserCog,
  HeartPulse,
  UserPlus,
  Bot,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'patient':
        return [
          { label: 'Overview', path: '/patient/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'AI Booking Agent', path: '/patient/ai-booking', icon: <Bot className="h-4 w-4 text-sky-400" />, badge: 'AI Agent' },
          { label: 'Hospitals & Beds', path: '/patient/hospitals', icon: <Building2 className="h-4 w-4" /> },
          { label: 'Book OPD Slot', path: '/patient/book', icon: <Calendar className="h-4 w-4" /> },
          { label: 'Live Queue Tracker', path: '/patient/queue', icon: <Users className="h-4 w-4" />, badge: 'Live' },
          { label: 'Lab & Radiology', path: '/patient/reports', icon: <Microscope className="h-4 w-4" /> },
          { label: 'Bills & Invoices', path: '/patient/billing', icon: <CreditCard className="h-4 w-4" /> },
          { label: 'Medical Timeline', path: '/patient/timeline', icon: <History className="h-4 w-4" /> },
          { label: 'Emergency Routing', path: '/patient/emergency', icon: <AlertTriangle className="h-4 w-4 text-rose-400" />, badge: 'Urgent' },
        ];
      case 'staff':
        return [
          { label: 'Doctor Desk & OPD', path: '/staff/dashboard', icon: <Stethoscope className="h-4 w-4" /> },
          { label: 'AI Patient Booking', path: '/staff/ai-booking', icon: <Bot className="h-4 w-4 text-sky-400" />, badge: 'AI Agent' },
          { label: 'Patient Registration', path: '/staff/patients', icon: <UserPlus className="h-4 w-4" /> },
          { label: 'Live OPD Queue', path: '/staff/opd', icon: <Users className="h-4 w-4" />, badge: 'Live' },
          { label: 'Ward Beds & Census', path: '/staff/beds', icon: <Bed className="h-4 w-4" /> },
          { label: 'IPD Admissions', path: '/staff/admissions', icon: <HeartPulse className="h-4 w-4" /> },
          { label: 'Diagnostic Orders', path: '/staff/diagnostics', icon: <Microscope className="h-4 w-4" /> },
          { label: 'Point-of-Care Billing', path: '/staff/billing', icon: <CreditCard className="h-4 w-4" /> },
        ];
      case 'hospital_admin':
        return [
          { label: 'Hospital Executive', path: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Bed Inventory & Status', path: '/admin/beds', icon: <Bed className="h-4 w-4" /> },
          { label: 'Departments & Staff', path: '/admin/departments', icon: <Users className="h-4 w-4" /> },
          { label: 'Clinical Analytics', path: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
          { label: 'Daily & Monthly Reports', path: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
        ];
      case 'government_officer':
        return [
          { label: 'District Surveillance', path: '/government/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Hospital Surge Monitor', path: '/government/surge-map', icon: <Building2 className="h-4 w-4" />, badge: 'Alerts' },
          { label: 'Bed Utilization Trends', path: '/government/reports', icon: <BarChart3 className="h-4 w-4" /> },
        ];
      case 'super_admin':
        return [
          { label: 'System Overview', path: '/superadmin/dashboard', icon: <Shield className="h-4 w-4" /> },
          { label: 'Manage Hospitals', path: '/superadmin/hospitals', icon: <Hospital className="h-4 w-4" /> },
          { label: 'User & Staff Accounts', path: '/superadmin/accounts', icon: <UserCog className="h-4 w-4" /> },
          { label: 'Audit Logs & Config', path: '/superadmin/logs', icon: <FileText className="h-4 w-4" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-4 backdrop-blur-md hidden md:flex md:flex-col justify-between">
      <div className="space-y-6">
        {/* Role Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Portal
            </span>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-100">
            {user.role.replace('_', ' ')}
          </p>
          {user.hospitalId && (
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Hosp: {user.hospitalId}
            </p>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-mediblue-600/20 text-mediblue-300 border border-mediblue-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  item.badge === 'Live' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse' :
                  item.badge === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer info */}
      <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-500">
        <div className="flex items-center justify-between font-medium">
          <span>MediQueue Cloud</span>
          <span className="text-mediblue-400">Phase 1 Done</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-600">Strict RBAC & Real-time Seam</p>
      </div>
    </aside>
  );
};
