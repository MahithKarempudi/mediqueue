import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { isFirebaseConfigured } from '@/services/firebase';
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
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  group?: string;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'patient':
        return [
          { group: 'Care Navigation', label: 'Patient Overview', path: '/patient/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { group: 'Care Navigation', label: 'AI Booking Assistant', path: '/patient/ai-booking', icon: <Bot className="h-4 w-4 text-teal-400" />, badge: 'AI Agent' },
          { group: 'Care Navigation', label: 'Book OPD Consultation', path: '/patient/book', icon: <Calendar className="h-4 w-4" /> },
          { group: 'Care Navigation', label: 'Live Queue Tracker', path: '/patient/queue', icon: <Users className="h-4 w-4" />, badge: 'Live' },
          { group: 'Care Navigation', label: 'Hospital & Bed Directory', path: '/patient/hospitals', icon: <Building2 className="h-4 w-4" /> },
          { group: 'Clinical Records', label: 'Diagnostic Reports', path: '/patient/reports', icon: <Microscope className="h-4 w-4" /> },
          { group: 'Clinical Records', label: 'Medical Timeline (EHR)', path: '/patient/timeline', icon: <History className="h-4 w-4" /> },
          { group: 'Clinical Records', label: 'Bills & Invoices', path: '/patient/billing', icon: <CreditCard className="h-4 w-4" /> },
          { group: 'Urgent Care', label: 'Emergency Routing', path: '/patient/emergency', icon: <AlertTriangle className="h-4 w-4 text-rose-400" />, badge: 'Urgent' },
        ];
      case 'staff':
        return [
          { group: 'Clinical Operations', label: 'Clinical Workspace', path: '/staff/dashboard', icon: <Stethoscope className="h-4 w-4" /> },
          { group: 'Clinical Operations', label: 'OPD Consultation Queue', path: '/staff/opd', icon: <Users className="h-4 w-4" />, badge: 'Live' },
          { group: 'Clinical Operations', label: 'Patient Registration', path: '/staff/patients', icon: <UserPlus className="h-4 w-4" /> },
          { group: 'Clinical Operations', label: 'AI Scheduling Desk', path: '/staff/ai-booking', icon: <Bot className="h-4 w-4 text-teal-400" />, badge: 'AI Agent' },
          { group: 'Inpatient & Diagnostics', label: 'Ward Beds & Census', path: '/staff/beds', icon: <Bed className="h-4 w-4" /> },
          { group: 'Inpatient & Diagnostics', label: 'IPD Admissions', path: '/staff/admissions', icon: <HeartPulse className="h-4 w-4" /> },
          { group: 'Inpatient & Diagnostics', label: 'Diagnostic Orders', path: '/staff/diagnostics', icon: <Microscope className="h-4 w-4" /> },
          { group: 'Inpatient & Diagnostics', label: 'Point-of-Care Billing', path: '/staff/billing', icon: <CreditCard className="h-4 w-4" /> },
        ];
      case 'hospital_admin':
        return [
          { group: 'Executive Intelligence', label: 'Executive Overview', path: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { group: 'Executive Intelligence', label: 'Clinical & Revenue BI', path: '/admin/analytics', icon: <BarChart3 className="h-4 w-4" /> },
          { group: 'Facility Management', label: 'Bed Inventory & Wards', path: '/admin/beds', icon: <Bed className="h-4 w-4" /> },
          { group: 'Facility Management', label: 'Departments & Staff', path: '/admin/departments', icon: <Users className="h-4 w-4" /> },
          { group: 'Facility Management', label: 'Regulatory Reports', path: '/admin/reports', icon: <FileText className="h-4 w-4" /> },
        ];
      case 'government_officer':
        return [
          { group: 'Public Health Command', label: 'District Surveillance', path: '/government/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
          { group: 'Public Health Command', label: 'Hospital Surge Monitor', path: '/government/surge-map', icon: <Building2 className="h-4 w-4" />, badge: 'Alerts' },
          { group: 'Public Health Command', label: 'Epidemiological Reports', path: '/government/reports', icon: <BarChart3 className="h-4 w-4" /> },
        ];
      case 'super_admin':
        return [
          { group: 'Platform Governance', label: 'Infrastructure Console', path: '/superadmin/dashboard', icon: <Shield className="h-4 w-4" /> },
          { group: 'Platform Governance', label: 'Hospital Network Registry', path: '/superadmin/hospitals', icon: <Hospital className="h-4 w-4" /> },
          { group: 'Platform Governance', label: 'Identity & Role Accounts', path: '/superadmin/accounts', icon: <UserCog className="h-4 w-4" /> },
          { group: 'Platform Governance', label: 'Forensic Audit Ledger', path: '/superadmin/logs', icon: <FileText className="h-4 w-4" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const groups = Array.from(new Set(navItems.map((i) => i.group || 'Navigation')));

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col justify-between bg-[#0B172A] text-slate-200 select-none">
      <div className="p-4 space-y-5 overflow-y-auto">
        {/* Portal Context Banner */}
        <div className="rounded-xl border border-slate-800 bg-[#13233D] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              { !collapsed || isMobile ? 'Active Workspace' : 'Role' }
            </span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {isMobile && onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Close navigation menu"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {(!collapsed || isMobile) && (
            <>
              <p className="mt-1 text-sm font-bold capitalize text-white font-display">
                {user.role.replace('_', ' ')} Portal
              </p>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{user.name}</p>
              {user.hospitalId && (
                <p className="text-xs text-teal-300/90 font-mono mt-1">
                  Scope: {user.hospitalId}
                </p>
              )}
            </>
          )}
        </div>

        {/* Grouped Navigation Links */}
        <div className="space-y-5">
          {groups.map((groupName) => {
            const groupItems = navItems.filter((i) => (i.group || 'Navigation') === groupName);
            return (
              <div key={groupName} className="space-y-1">
                {(!collapsed || isMobile) && (
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {groupName}
                  </p>
                )}
                <nav className="space-y-1">
                  {groupItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isMobile && onCloseMobile) onCloseMobile();
                      }}
                      title={collapsed && !isMobile ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-xs font-semibold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0">{item.icon}</span>
                        {(!collapsed || isMobile) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>
                      {(!collapsed || isMobile) && item.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 ${
                            item.badge === 'Live'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.badge === 'Urgent'
                              ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40'
                              : 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Status & Collapse Toggle */}
      <div className="p-4 border-t border-slate-800/90 space-y-3">
        {(!collapsed || isMobile) && (
          <div className="rounded-lg border border-slate-800 bg-[#111E34] p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-white">Data Engine</span>
              <span className="text-teal-400">
                {isFirebaseConfigured ? 'Cloud Live' : 'Local Reactive'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              {isFirebaseConfigured
                ? 'Firestore & RTDB rules active'
                : 'BroadcastChannel sync & SHA-256 audit chain'}
            </p>
          </div>
        )}

        {!isMobile && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } flex-shrink-0 border-r border-slate-800 hidden md:flex md:flex-col transition-all duration-200`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-slide-in">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
