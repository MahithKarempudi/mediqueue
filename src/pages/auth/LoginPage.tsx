import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_PERSONAS } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import {
  Activity,
  ArrowRight,
  ShieldAlert,
  Users,
  Stethoscope,
  Building2,
  Landmark,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  CheckCircle2,
} from 'lucide-react';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  patient: <Users className="h-5 w-5 text-teal-400" />,
  staff: <Stethoscope className="h-5 w-5 text-sky-400" />,
  hospital_admin: <Building2 className="h-5 w-5 text-indigo-400" />,
  government_officer: <Landmark className="h-5 w-5 text-amber-400" />,
  super_admin: <ShieldCheck className="h-5 w-5 text-rose-400" />,
};

const ROLE_REDIRECT: Record<UserRole, string> = {
  patient: '/patient/dashboard',
  staff: '/staff/dashboard',
  hospital_admin: '/admin/dashboard',
  government_officer: '/government/dashboard',
  super_admin: '/superadmin/dashboard',
};

export const LoginPage: React.FC = () => {
  const { login, loginAsPersona, registerPatient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Patient registration form state
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'female' as 'male' | 'female' | 'other',
    bloodGroup: 'B+',
    address: '',
  });

  const handlePersonaSelect = async (role: UserRole) => {
    setIsSubmitting(true);
    await loginAsPersona(role);
    const destination = location.state?.from?.pathname || ROLE_REDIRECT[role];
    navigate(destination, { replace: true });
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      navigate('/patient/dashboard', { replace: true });
    } else {
      setError('Unrecognized credentials. You can click any demo persona card below for immediate 1-click login.');
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.name || !regData.email || !regData.phone) {
      setError('Please complete all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await registerPatient(regData);
      setShowRegisterModal(false);
      navigate('/patient/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-mediblue-950/40 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-mediblue-600 via-sky-500 to-teal-400 shadow-xl shadow-mediblue-600/30">
            <Activity className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Medi<span className="text-mediblue-400">Queue</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Cloud-Native Multi-Role Hospital Resource Management Platform with Real-Time Bed & Queue Synchrony
          </p>
        </div>

        {/* 1-Click Demo Personas Grid */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Select a Demo Role Persona</span>
                <span className="rounded bg-mediblue-500/10 px-2 py-0.5 text-xs font-medium text-mediblue-400 border border-mediblue-500/20">
                  1-Click Instant Login
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Instantly explore any of the 5 roles with fully seeded mock data and RBAC permissions.
              </p>
            </div>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Register Patient</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(Object.keys(DEMO_PERSONAS) as UserRole[]).map((role) => {
              const persona = DEMO_PERSONAS[role];
              return (
                <button
                  key={role}
                  disabled={isSubmitting}
                  onClick={() => handlePersonaSelect(role)}
                  className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left transition duration-200 hover:border-mediblue-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-mediblue-950/50"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700">
                        {ROLE_ICONS[role]}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${persona.badgeColor}`}>
                        {role.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-mediblue-300 transition">
                      {persona.user.name}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400">{persona.label}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500 line-clamp-3">
                      {persona.tagline}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-mediblue-400 group-hover:text-mediblue-300">
                    <span>Enter Portal</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Traditional Credentials Login Seam */}
        <div className="mx-auto max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-slate-200 text-center">
            Or Sign In With Existing Account
          </h3>
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-950/50 border border-rose-800/50 p-2.5 text-xs text-rose-300">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleManualLogin} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400">Email Address</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mediqueue.demo"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-mediblue-500 focus:outline-none focus:ring-1 focus:ring-mediblue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">Password (optional in demo)</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-mediblue-500 focus:outline-none focus:ring-1 focus:ring-mediblue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-mediblue-600 to-sky-600 py-2.5 text-xs font-semibold text-white shadow-md hover:from-mediblue-500 hover:to-sky-500 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>

      {/* Patient Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-400" />
              <span>Register New Patient Account</span>
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Create a synthetic patient profile with health record linkage.
            </p>
            <form onSubmit={handleRegisterPatient} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regData.name}
                    onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                    placeholder="e.g. Amit Verma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                    placeholder="amit@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={regData.phone}
                    onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                    placeholder="+91 98..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    value={regData.dob}
                    onChange={(e) => setRegData({ ...regData, dob: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400">Blood Group</label>
                  <select
                    value={regData.bloodGroup}
                    onChange={(e) => setRegData({ ...regData, bloodGroup: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Gender</label>
                <div className="mt-1 flex gap-4 text-xs text-slate-300">
                  {['female', 'male', 'other'].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={regData.gender === g}
                        onChange={() => setRegData({ ...regData, gender: g as any })}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400">Residential Address</label>
                <input
                  type="text"
                  value={regData.address}
                  onChange={(e) => setRegData({ ...regData, address: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  placeholder="City, District, State"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
