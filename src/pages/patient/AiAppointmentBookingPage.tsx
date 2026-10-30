// MediQueue AI: Conversational Healthcare Assistant & Controlled Execution Console
// Enforces caller authentication, strict RBAC, explicit confirmation, and activity logging.

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiAssistantService, type AiToolResult } from '@/services/ai/aiAssistantService';
import { aiAppointmentBackend } from '@/services/appointments/aiAppointmentBackend';
import { activityLogService, type SecurityActivityLog } from '@/services/logging/activityLogService';
import { AppointmentConfirmationCard } from '@/components/appointments/AppointmentConfirmationCard';
import type {
  AppointmentSlot,
  BookingIntent,
  ConfirmedBookingResult,
  AppointmentWorkflowState,
  ConsultationType,
} from '@/types/appointmentWorkflow';
import type { UserRole, IpdBed, OpdAppointment, Hospital } from '@/types';
import {
  Bot,
  User,
  Send,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Bed,
  Users,
  Activity,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'backend';
  text: string;
  timestamp: string;
  intent?: BookingIntent;
  slots?: AppointmentSlot[];
  beds?: IpdBed[];
  appointments?: OpdAppointment[];
  hospitals?: Hospital[];
  operationalSummary?: Record<string, any>;
  confirmedResult?: ConfirmedBookingResult;
  stateBadge?: AppointmentWorkflowState;
}

export const AiAppointmentBookingPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [currentState, setCurrentState] = useState<AppointmentWorkflowState>('IDLE');
  const [activeIntent, setActiveIntent] = useState<BookingIntent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<SecurityActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'slotFinder' | 'testSuite'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts based on Active Demo Persona
  const getSuggestedPrompts = (role: UserRole = 'patient'): string[] => {
    switch (role) {
      case 'staff':
        return [
          'Check authorized hospital bed availability',
          'Show hospital operational summary',
          'Update bed status to OCCUPIED',
          'Search cardiology appointment slots',
        ];
      case 'hospital_admin':
        return [
          'Show hospital operational summary',
          'Check authorized hospital bed availability',
          'Show my hospital appointments',
          'Search cardiology appointment slots',
        ];
      case 'government_officer':
        return [
          'Show hospital operational summary',
          'Check authorized hospital bed availability',
        ];
      case 'super_admin':
        return [
          'Show hospital operational summary',
          'Check authorized hospital bed availability',
          'Search hospitals in Delhi',
        ];
      case 'patient':
      default:
        return [
          'Book a cardiologist for tomorrow',
          'Show my existing appointments',
          'Check OPD queue status',
          'Find hospitals in Delhi NCR',
        ];
    }
  };

  const refreshActivityLogs = () => {
    setRecentLogs(activityLogService.getLogs().slice(0, 5));
  };

  useEffect(() => {
    refreshActivityLogs();

    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Hello ${user?.name || 'User'} (${user ? user.role.replace('_', ' ').toUpperCase() : 'DEMO'})! Welcome to MediQueue AI Assistant — Ask, Find & Act.

I am your role-governed healthcare assistant. I can search valid hospital schedules, prepare booking summaries, check authorized bed censuses, and retrieve operational summaries.

Notice: Only the authenticated backend can authorize and commit bookings or status changes upon your explicit review.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stateBadge: 'IDLE',
    };
    setMessages([welcomeMsg]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeIntent]);

  // -------------------------------------------------------------
  // Tool Execution & Message Dispatch
  // -------------------------------------------------------------
  const handleUserMessage = async (userText: string) => {
    if (!userText.trim() || !user) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsProcessing(true);
    setErrorMessage(null);
    setCurrentState('SEARCHING');

    // Run allowlisted tool orchestration
    const result: AiToolResult = await aiAssistantService.processUserMessage(userText, user);

    if (!result.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: result.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stateBadge: 'FAILED',
        },
      ]);
      setCurrentState('FAILED');
      setIsProcessing(false);
      refreshActivityLogs();
      return;
    }

    // Handle Appointment Slot Search -> Prepares Booking Intent
    if (result.toolName === 'searchAppointmentSlots' && result.slots && result.slots.length > 0) {
      setCurrentState('AVAILABLE');
      const targetSlot = result.slots.find((s) => s.available) || result.slots[0];

      const { intent, error: intentError } = await aiAppointmentBackend.createBookingIntent(
        {
          slot: targetSlot,
          patientId: user.patientId || 'pat_demo_01',
          patientName: user.name || 'Priya Sharma',
          consultationType: 'in_person',
        },
        user
      );

      if (intentError || !intent) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            sender: 'ai',
            text: `Authorization Notice: ${intentError}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stateBadge: 'FAILED',
          },
        ]);
        setCurrentState('FAILED');
        setIsProcessing(false);
        refreshActivityLogs();
        return;
      }

      setActiveIntent(intent);
      setCurrentState('AWAITING_CONFIRMATION');

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: `I queried live availability at ${targetSlot.hospitalName} for ${targetSlot.specialty}. I prepared an appointment booking intent for ${targetSlot.date} at ${targetSlot.time} with ${targetSlot.doctorName}.

Please review the details in the confirmation card below and click "Confirm booking" once authorized.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stateBadge: 'AWAITING_CONFIRMATION',
          intent,
        },
      ]);
      setIsProcessing(false);
      refreshActivityLogs();
      return;
    }

    // Handle other tools (beds, operational summary, appointments, hospitals)
    setCurrentState('IDLE');
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'backend',
        text: result.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        beds: result.beds,
        appointments: result.appointments,
        hospitals: result.hospitals,
        operationalSummary: result.operationalSummary,
        stateBadge: 'IDLE',
      },
    ]);

    setIsProcessing(false);
    refreshActivityLogs();
  };

  // Explicit Patient Confirmation & Commit
  const handleConfirmBooking = async (consultationType: ConsultationType, consentConfirmed: boolean) => {
    if (!activeIntent || !user) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { result, error, state } = await aiAppointmentBackend.confirmAppointment(
      {
        intentId: activeIntent.intentId,
        idempotencyKey: activeIntent.idempotencyKey,
        consentConfirmed,
      },
      user
    );

    if (error || !result) {
      setErrorMessage(error || 'Booking could not be committed by backend.');
      if (state) setCurrentState(state);
      setIsProcessing(false);
      refreshActivityLogs();
      return;
    }

    setCurrentState('CONFIRMED');
    setActiveIntent(null);

    const successMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'backend',
      text: `Appointment Successfully Committed & Authorized by Backend!

Authoritative Booking Reference: ${result.appointmentId}
Queue Token Assigned: #${result.tokenNo}
Doctor: ${result.doctorName} (${result.specialty})
Date & Time: ${result.scheduledTime}
Consultation Mode: ${result.consultationType === 'in_person' ? 'In-Person at Hospital' : 'Teleconsultation'}
Security Log: Committed to Enterprise Activity Stream.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stateBadge: 'CONFIRMED',
      confirmedResult: result,
    };

    setMessages((prev) => [...prev, successMsg]);
    setIsProcessing(false);
    refreshActivityLogs();
  };

  const handleCancelIntent = () => {
    setActiveIntent(null);
    setCurrentState('CANCELLED');
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'ai',
        text: 'Appointment booking intent cancelled. No slots were committed or billed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stateBadge: 'CANCELLED',
      },
    ]);
    refreshActivityLogs();
  };

  // Test Suite Triggers
  const handleTestUnauthorizedAccess = async () => {
    if (!user) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const slot: AppointmentSlot = {
      slotId: 'slot_unauth_01',
      hospitalId: 'hosp_metro_01',
      hospitalName: 'Apollo Healthcare',
      departmentId: 'dept_cardio_01',
      specialty: 'Cardiology',
      doctorId: 'staff_01',
      doctorName: 'Dr. Rajesh Kumar',
      doctorQualification: 'MD',
      date: '2026-10-24',
      time: '10:30 AM',
      available: true,
      fee: 500,
    };

    const { error } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        patientId: 'pat_unauthorized_victim_99',
        consultationType: 'in_person',
      },
      user
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'backend',
        text: `Security Enforcement Check: ${error || 'Passed'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stateBadge: 'FAILED',
      },
    ]);

    setIsProcessing(false);
    refreshActivityLogs();
  };

  const handleTestSlotCollision = () => {
    aiAppointmentBackend.triggerSimulatedCollision('simulated_collision_slot');
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'backend',
        text: 'Simulated Slot Collision Armed: The next confirmation attempt will encounter a concurrent booking collision to demonstrate graceful UNAVAILABLE state transition.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stateBadge: 'UNAVAILABLE',
      },
    ]);
  };

  const getStateBadgeColor = (state: AppointmentWorkflowState) => {
    switch (state) {
      case 'CONFIRMED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'AWAITING_CONFIRMATION':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'AVAILABLE':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'SEARCHING':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse';
      case 'UNAVAILABLE':
      case 'EXPIRED':
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-mediblue-500/10 px-2.5 py-0.5 text-xs font-semibold text-mediblue-400 border border-mediblue-500/20 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              MediQueue AI Assistant — Ask, Find & Act
            </span>
            <span className="text-[11px] text-amber-300 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
              Rule-Based Demo Mode
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Healthcare Operations & AI Assistant
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Role-governed conversational engine executing allowlisted backend functions for slot searches, appointment booking intents, bed management, and operational summaries.
          </p>
        </div>

        {/* Workflow State Badge */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Workflow State
            </span>
            <span className={`inline-block mt-1 rounded-md px-2.5 py-0.5 text-xs font-bold border ${getStateBadgeColor(currentState)}`}>
              {currentState}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'chat'
              ? 'border-mediblue-500 text-mediblue-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Conversational Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('testSuite')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeTab === 'testSuite'
              ? 'border-amber-500 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Security & Concurrency Testing</span>
        </button>
      </div>

      {/* Tab 1: Conversational Assistant */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chat Conversation Stream */}
          <div className="lg:col-span-2 flex flex-col h-[700px] rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl">
            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 text-xs leading-relaxed animate-fade-in ${
                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.sender !== 'user' && (
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                        m.sender === 'backend'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                          : 'bg-gradient-to-br from-mediblue-500 to-indigo-700'
                      }`}
                    >
                      {m.sender === 'backend' ? <ShieldCheck className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 shadow-md ${
                      m.sender === 'user'
                        ? 'bg-mediblue-600 text-white rounded-tr-none'
                        : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-800/40 pb-1 mb-2">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                        {m.sender === 'user'
                          ? 'You (Authenticated)'
                          : m.sender === 'backend'
                          ? 'MediQueue Backend Authority'
                          : 'MediQueue AI'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-line text-xs font-sans">{m.text}</p>

                    {/* Operational Summary Card */}
                    {m.operationalSummary && (
                      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] space-y-1">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{m.operationalSummary.hospitalName}</span>
                          <span className="text-emerald-400">{m.operationalSummary.surgeStatus}</span>
                        </div>
                        <p className="text-slate-400">
                          Bed Occupancy: <strong className="text-white">{m.operationalSummary.bedOccupancyRate}</strong> ({m.operationalSummary.occupiedBeds}/{m.operationalSummary.totalBeds} beds)
                        </p>
                        <p className="text-slate-400">
                          Active OPD Visits Scheduled: <strong className="text-white">{m.operationalSummary.activeOpdBookingsToday}</strong>
                        </p>
                      </div>
                    )}

                    {/* Bed List Cards */}
                    {m.beds && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        {m.beds.slice(0, 4).map((bed) => (
                          <div key={bed.bedId} className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                            <span className="font-bold text-white">{bed.bedNumber}</span>
                            <span className="text-slate-400 block text-[10px] capitalize">{bed.type} ward</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 ${
                              bed.status === 'available' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {bed.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confirmed Booking Banner */}
                    {m.confirmedResult && (
                      <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            Booking Reference:
                          </span>
                          <span className="font-mono text-emerald-200 font-bold">{m.confirmedResult.appointmentId}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          Token Assigned: <strong className="text-white">Token #{m.confirmedResult.tokenNo}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* In-Line Appointment Review Card */}
              {activeIntent && (
                <div className="mt-4">
                  <AppointmentConfirmationCard
                    intent={activeIntent}
                    onConfirm={handleConfirmBooking}
                    onCancel={handleCancelIntent}
                    isConfirming={isProcessing}
                    errorMessage={errorMessage}
                  />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts Pill Tray */}
            <div className="border-t border-slate-800/80 bg-slate-950/80 p-3 overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Suggested:
                </span>
                <div className="flex gap-2">
                  {getSuggestedPrompts(user?.role).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUserMessage(prompt)}
                      disabled={isProcessing}
                      className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-300 hover:border-mediblue-500 hover:text-white transition whitespace-nowrap shadow-sm disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-slate-800 bg-slate-950 p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUserMessage(inputPrompt);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask MediQueue AI (e.g., 'Book a cardiologist for tomorrow', 'Check bed availability')..."
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-mediblue-500 focus:outline-none transition disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !inputPrompt.trim()}
                  className="rounded-xl bg-mediblue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-mediblue-500 transition shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Architectural Telemetry & Activity Feed */}
          <div className="space-y-4">
            {/* Active Identity Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <User className="h-4 w-4 text-mediblue-400" />
                Active Identity & Scope
              </h3>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Caller Name:</span>
                  <span className="font-semibold text-white">{user?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Authenticated Role:</span>
                  <span className="font-semibold text-sky-400 capitalize">{user?.role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hospital Assignment:</span>
                  <span className="font-mono text-slate-300">{user?.hospitalId || 'District Scope'}</span>
                </div>
              </div>
            </div>

            {/* Allowed Intents for Active Role */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Authorized AI Tool Capabilities
              </h3>
              <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>searchAppointmentSlots (Validated facility schedules)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>getMyAppointments (Ownership-scoped)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>checkOpdQueueStatus (Real-time live queue)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={user?.role === 'staff' || user?.role === 'hospital_admin' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                    {user?.role === 'staff' || user?.role === 'hospital_admin' ? '✓' : '✗'}
                  </span>
                  <span>updateBedStatus (Staff & Admin exclusive)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className={user?.role !== 'patient' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                    {user?.role !== 'patient' ? '✓' : '✗'}
                  </span>
                  <span>getHospitalOperationalSummary (Admin/Staff only)</span>
                </li>
              </ul>
            </div>

            {/* Recent Activity Log Feed */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-400" />
                  Recent System Activity Stream
                </h3>
                <button onClick={refreshActivityLogs} className="text-slate-500 hover:text-white transition">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {recentLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-500">No activity logged yet.</p>
                ) : (
                  recentLogs.map((log) => (
                    <div key={log.id} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sky-300 font-mono">{log.eventType}</span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 line-clamp-2">{log.actionSummary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clinical Advisory Disclaimer */}
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-[11px] text-amber-300/80 leading-relaxed">
              <strong className="text-amber-200 block mb-0.5">Clinical Safety Notice:</strong>
              AI responses are synthesized operational recommendations. Consequential clinical decisions, medication orders, and triage require verification by certified hospital personnel.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Concurrency Test Console */}
      {activeTab === 'testSuite' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Security & Concurrency Testing Suite
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Trigger real-time edge cases to demonstrate architectural enforcement to your professor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">1. Cross-Patient Access Violation</h3>
              <p className="text-xs text-slate-400">
                Simulates Patient A attempting to create a booking intent specifying another patient's ID. Demonstrates backend ownership validation.
              </p>
              <button
                onClick={handleTestUnauthorizedAccess}
                disabled={isProcessing}
                className="rounded-xl border border-rose-800 bg-rose-950/40 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition"
              >
                Trigger Cross-Patient Test
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">2. Slot Concurrency Collision</h3>
              <p className="text-xs text-slate-400">
                Simulates an alternate patient claiming the same slot milliseconds before confirmation. Demonstrates graceful state transition to UNAVAILABLE.
              </p>
              <button
                onClick={handleTestSlotCollision}
                className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/40 transition"
              >
                Arm Slot Collision Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
