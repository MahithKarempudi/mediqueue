import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth, ROLE_PROFILES } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  AlertTriangle,
  Stethoscope,
  Bed,
  HeartPulse,
  BarChart3,
  FileText,
  Shield,
  Hospital,
  UserCog,
  ChevronRight,
  Home,
} from 'lucide-react';

const ROUTE_TITLES: Record<string, string> = {
  dashboard: 'Operational Overview',
  hospitals: 'Hospital & Bed Directory',
  book: 'OPD Consultation Booking',
  'ai-booking': 'AI Scheduling Concierge',
  'ai-assistant': 'AI Scheduling Concierge',
  queue: 'Live OPD Queue Tracker',
  reports: 'Clinical & Statutory Reports',
  billing: 'Invoices & Financial Ledger',
  timeline: 'Longitudinal Medical Timeline (EHR)',
  emergency: 'Emergency Trauma Routing',
  patients: 'Walk-In Patient Registration',
  registration: 'Walk-In Patient Registration',
  opd: 'Doctor OPD Consultation Console',
  'opd-queue': 'Doctor OPD Consultation Console',
  beds: 'Ward & ICU Bed Census',
  admissions: 'Inpatient (IPD) Admissions',
  diagnostics: 'LIS & RIS Diagnostic Orders',
  departments: 'Departments & Specialist Roster',
  analytics: 'Executive BI & Demand Forecasting',
  'surge-map': 'Regional Surge & Capacity Watch',
  surge: 'Regional Surge & Capacity Watch',
  accounts: 'RBAC Account Provisioning',
  logs: 'SHA-256 Forensics Audit Ledger',
};

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const portalSegment = pathSegments[0] || 'patient';
  const viewSegment = pathSegments[1] || 'dashboard';
  const viewTitle = ROUTE_TITLES[viewSegment] || viewSegment.replace('-', ' ');
  const portalLabel = user ? ROLE_PROFILES[user.role].label : 'Clinical Workspace';

  const getMobileQuickLinks = () => {
    if (!user) return [];
    switch (user.role) {
      case 'patient':
        return [
          { label: 'Home', path: '/patient/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Book', path: '/patient/book', icon: <Calendar className="h-4 w-4" /> },
          { label: 'Queue', path: '/patient/queue', icon: <Users className="h-4 w-4" /> },
          { label: 'Hospitals', path: '/patient/hospitals', icon: <Building2 className="h-4 w-4" /> },
          { label: 'Urgent', path: '/patient/emergency', icon: <AlertTriangle className="h-4 w-4" /> },
        ];
      case 'staff':
        return [
          { label: 'Desk', path: '/staff/dashboard', icon: <Stethoscope className="h-4 w-4" /> },
          { label: 'OPD Queue', path: '/staff/opd', icon: <Users className="h-4 w-4" /> },
          { label: 'Beds', path: '/staff/beds', icon: <Bed className="h-4 w-4" /> },
          { label: 'IPD', path: '/staff/admissions', icon: <HeartPulse className="h-4 w-4" /> },
        ];
      case 'hospital_admin':
        return [
          { label: 'Executive', path: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Beds', path: '/admin/beds', icon: <Bed className="h-4 w-4" /> },
          { label: 'Staff', path: '/admin/departments', icon: <Users className="h-4 w-4" /> },
          { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
        ];
      case 'government_officer':
        return [
          { label: 'Command', path: '/government/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { label: 'Surge', path: '/government/surge-map', icon: <Building2 className="h-4 w-4" /> },
          { label: 'Reports', path: '/government/reports', icon: <FileText className="h-4 w-4" /> },
        ];
      case 'super_admin':
        return [
          { label: 'Console', path: '/superadmin/dashboard', icon: <Shield className="h-4 w-4" /> },
          { label: 'Hospitals', path: '/superadmin/hospitals', icon: <Hospital className="h-4 w-4" /> },
          { label: 'Accounts', path: '/superadmin/accounts', icon: <UserCog className="h-4 w-4" /> },
          { label: 'Ledger', path: '/superadmin/logs', icon: <FileText className="h-4 w-4" /> },
        ];
      default:
        return [];
    }
  };

  const quickLinks = getMobileQuickLinks();

  return (
    <div className="flex h-screen flex-col bg-[#F4F6F9] text-slate-900 overflow-hidden">
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-10">
          {/* Contextual Breadcrumb Subheader */}
          <div className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5">
            <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500">
                <Link
                  to={`/${portalSegment}/dashboard`}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-teal-700 transition-colors"
                >
                  <Home className="h-3.5 w-3.5 text-slate-400" />
                  <span>{portalLabel}</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-900 capitalize">{viewTitle}</span>
              </nav>

              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                {user?.hospitalId && (
                  <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    Facility: {user.hospitalId}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Clinical Telemetry Active
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Container */}
          <div
            key={location.pathname}
            className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in"
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {quickLinks.length > 0 && (
        <nav
          aria-label="Mobile quick navigation"
          className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 py-1.5 shadow-clinical-lg"
        >
          {quickLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
};
