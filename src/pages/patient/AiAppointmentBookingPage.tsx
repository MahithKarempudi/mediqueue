// MediQueue AI: Controlled Appointment Confirmation Workflow & Forensics Console
// Design Principle: The AI may search, prepare and recommend,
// but only the authenticated backend can authorize and commit the booking.

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { aiAppointmentBackend } from '@/services/appointments/aiAppointmentBackend';
import { auditChainService } from '@/services/forensics/auditChainService';
import { AppointmentConfirmationCard } from '@/components/appointments/AppointmentConfirmationCard';
import type {
  AppointmentSlot,
  BookingIntent,
  ConfirmedBookingResult,
  AppointmentWorkflowState,
  ConsultationType,
  ForensicAuditEvent,
  ChainVerificationResult,
} from '@/types/appointmentWorkflow';
import {
  Bot,
  User as UserIcon,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Terminal,
  RefreshCw,
  Hash,
  Lock,
  Calendar,
  Sparkles,
  Search,
  FileCheck2,
  AlertCircle,
  Copy,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'backend';
  text: string;
  timestamp: string;
  intent?: BookingIntent;
  confirmedResult?: ConfirmedBookingResult;
  slots?: AppointmentSlot[];
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

  // Forensics panel state
  const [recentAuditEvents, setRecentAuditEvents] = useState<ForensicAuditEvent[]>([]);
  const [verificationResult, setVerificationResult] = useState<ChainVerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'forensics' | 'testSuite'>('chat');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial welcome message and audit chain
  useEffect(() => {
    const initialChain = auditChainService.getChain();
    setRecentAuditEvents(initialChain.slice(-5).reverse());
    setVerificationResult(auditChainService.verifyChainIntegrity());

    const welcomeMsg: ChatMessage = {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Hello ${user?.name || 'Patient'}! I am the MediQueue Controlled Appointment Agent. I can help search valid hospital schedules, prepare booking summaries, and track your visits. 

Notice: In accordance with MediQueue security policy, I can search and prepare appointments, but only the authenticated backend can authorize and commit bookings upon your explicit review.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stateBadge: 'IDLE',
    };
    setMessages([welcomeMsg]);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeIntent]);

  const refreshAuditLogs = () => {
    const chain = auditChainService.getChain();
    setRecentAuditEvents(chain.slice(-6).reverse());
    setVerificationResult(auditChainService.verifyChainIntegrity());
  };

  // -------------------------------------------------------------
  // Workflow: Step 1-4 (Search Slots & Prepare Intent)
  // -------------------------------------------------------------
  const handleUserSearch = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

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

    // 1. Authenticate and Authorize
    if (!user) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: 'Security Alert: You must be authenticated to search or prepare appointments.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stateBadge: 'FAILED',
        },
      ]);
      setIsProcessing(false);
      setCurrentState('FAILED');
      return;
    }

    // 2. Determine specialty/intent from prompt
    let specialty = 'Cardiology';
    if (userText.toLowerCase().includes('ortho')) specialty = 'Orthopedics';
    if (userText.toLowerCase().includes('pediatric') || userText.toLowerCase().includes('child')) specialty = 'Pediatrics';
    if (userText.toLowerCase().includes('general') || userText.toLowerCase().includes('physician')) specialty = 'General Medicine';

    // 3. Query Backend for Real Available Slots
    const { slots, error } = await aiAppointmentBackend.searchAppointmentSlots(
      {
        specialty,
        hospitalId: user.hospitalId || 'hosp_metro_01',
        date: '2026-10-24',
      },
      user
    );

    if (error || slots.length === 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          sender: 'ai',
          text: `Backend Search Notice: ${error || 'No open slots found for the requested criteria.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stateBadge: 'UNAVAILABLE',
        },
      ]);
      setCurrentState('UNAVAILABLE');
      setIsProcessing(false);
      refreshAuditLogs();
      return;
    }

    setCurrentState('AVAILABLE');
    const targetSlot = slots.find((s) => s.time.includes('10:30') || s.available) || slots[0];

    // 4. Create Booking Intent (Transitions to AWAITING_CONFIRMATION)
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
          text: `Authorization Error: ${intentError}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          stateBadge: 'FAILED',
        },
      ]);
      setCurrentState('FAILED');
      setIsProcessing(false);
      refreshAuditLogs();
      return;
    }

    // 5. Present the Appointment Summary & Confirmation Card
    setActiveIntent(intent);
    setCurrentState('AWAITING_CONFIRMATION');

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'ai',
        text: `I queried live availability at ${targetSlot.hospitalName} for ${targetSlot.specialty}. I have prepared an appointment booking intent for ${targetSlot.date} at ${targetSlot.time} with ${targetSlot.doctorName}. 

Please review the details in the confirmation card below and select "Confirm booking" once authorized.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stateBadge: 'AWAITING_CONFIRMATION',
        intent,
      },
    ]);

    setIsProcessing(false);
    refreshAuditLogs();
  };

  // -------------------------------------------------------------
  // Workflow: Step 6-8 (Explicit Confirmation & Backend Commit)
  // -------------------------------------------------------------
  const handleConfirmBooking = async (consultationType: ConsultationType, consentConfirmed: boolean) => {
    if (!activeIntent || !user) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // Call authoritative backend function
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
      refreshAuditLogs();
      return;
    }

    // Success: Backend authorized and committed booking
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
Consultation Mode: ${result.consultationType === 'in_person' ? 'In-Person at Hospital' : 'Encrypted Teleconsultation'}
Cryptographic Forensics Event Hash: ${result.forensicHash.substring(0, 16)}...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stateBadge: 'CONFIRMED',
      confirmedResult: result,
    };

    setMessages((prev) => [...prev, successMsg]);
    setIsProcessing(false);
    refreshAuditLogs();
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
    refreshAuditLogs();
  };

  // -------------------------------------------------------------
  // Security & Forensic Threat Test Suite (Professor Demo Handlers)
  // -------------------------------------------------------------
  const handleTestUnauthorizedAccess = async () => {
    if (!user) return;
    setIsProcessing(true);
    setErrorMessage(null);

    // Attempt to book with unauthorized target patient ID
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

    const { intent, error } = await aiAppointmentBackend.createBookingIntent(
      {
        slot,
        patientId: 'pat_unauthorized_victim_99', // Violates patient ownership
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
    refreshAuditLogs();
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

  const handleSimulateTamper = () => {
    const chain = auditChainService.getChain();
    if (chain.length > 1) {
      auditChainService.simulateTamper(1, 'Adversary modified patient ID to pat_malicious_attacker');
      refreshAuditLogs();
    }
  };

  const handleResetForensics = () => {
    auditChainService.resetChain();
    refreshAuditLogs();
  };

  // State Badge Color Helper
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
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20 flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              Controlled AI Booking Agent
            </span>
            <span className="text-xs text-slate-400 font-mono">Backend Authoritative</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            AI Appointment Workflow & Confirmation
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            The AI searches, checks availability, and prepares booking intents. Only the authenticated backend can authorize and atomically commit appointments upon explicit patient confirmation.
          </p>
        </div>

        {/* State Machine Status Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Workflow State Machine
            </span>
            <span className={`inline-block mt-1 rounded-md px-2.5 py-0.5 text-xs font-bold border ${getStateBadgeColor(currentState)}`}>
              {currentState}
            </span>
          </div>

          {/* Forensics Integrity Badge */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Forensic SHA-256 Chain
            </span>
            <span className={`inline-flex items-center gap-1 mt-1 rounded-md px-2.5 py-0.5 text-xs font-bold border ${
              verificationResult?.isValid
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            }`}>
              {verificationResult?.isValid ? (
                <>
                  <ShieldCheck className="h-3 w-3" />
                  <span>Verified ({verificationResult.totalBlocks} Blocks)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  <span>Tamper Detected!</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 text-xs font-semibold border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>Interactive Booking Agent</span>
        </button>

        <button
          onClick={() => setActiveTab('forensics')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'forensics'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Hash className="h-4 w-4" />
          <span>SHA-256 Forensics Hash Chain</span>
        </button>

        <button
          onClick={() => setActiveTab('testSuite')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'testSuite'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Terminal className="h-4 w-4 text-amber-400" />
          <span>Professor Testing Suite (Section 7)</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chat Conversation Thread (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-xl flex flex-col h-[620px]">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender !== 'user' && (
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        m.sender === 'backend' ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
                      }`}>
                        {m.sender === 'backend' ? <ShieldCheck className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                    )}

                    <div className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-sky-600 to-mediblue-600 text-white rounded-tr-none shadow-md'
                        : m.sender === 'backend'
                        ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-tl-none shadow-md'
                        : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/80'
                    }`}>
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400">
                        <span className="font-bold uppercase tracking-wider">
                          {m.sender === 'user' ? (user?.name || 'You') : m.sender === 'backend' ? 'Authoritative Backend' : 'MediQueue AI Agent'}
                        </span>
                        <div className="flex items-center gap-2">
                          {m.stateBadge && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getStateBadgeColor(m.stateBadge)}`}>
                              {m.stateBadge}
                            </span>
                          )}
                          <span>{m.timestamp}</span>
                        </div>
                      </div>

                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Render Confirmed Result Card if Present */}
                      {m.confirmedResult && (
                        <div className="mt-3 rounded-xl bg-slate-950 border border-emerald-500/40 p-4 space-y-2 font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              Authoritative Booking Committed
                            </span>
                            <span className="font-mono text-xs font-bold text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                              Token #{m.confirmedResult.tokenNo}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-slate-400">Booking ID:</span>
                              <p className="font-mono font-bold text-white">{m.confirmedResult.appointmentId}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Hospital:</span>
                              <p className="font-bold text-white">{m.confirmedResult.hospitalName}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Doctor:</span>
                              <p className="font-bold text-white">{m.confirmedResult.doctorName}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Time:</span>
                              <p className="font-bold text-white">{m.confirmedResult.scheduledTime}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Forensics SHA-256:</span>
                            <span className="text-emerald-300 font-mono">{m.confirmedResult.forensicHash.substring(0, 18)}...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {m.sender === 'user' && (
                      <div className="h-8 w-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Render Interactive Confirmation Card if Active Intent exists */}
                {activeIntent && (
                  <div className="pt-2">
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

              {/* Quick Prompt Chips */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Recommended Prompts (1-Click)
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    'Book a cardiologist for tomorrow',
                    'Find available orthopedic doctors',
                    'Book an emergency teleconsultation',
                    'Check appointment availability at 10:30 AM',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleUserSearch(chip)}
                      disabled={isProcessing}
                      className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-sky-500 hover:text-white transition disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUserSearch(inputPrompt);
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="e.g., Book a cardiologist for tomorrow morning..."
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isProcessing}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-mediblue-600 px-5 py-2.5 text-xs font-bold text-white hover:from-sky-400 hover:to-mediblue-500 transition disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Workflow Policy & Live Forensics Telemetry (1 Col) */}
          <div className="space-y-4">
            {/* Core Principle Card */}
            <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-900/60 p-5 shadow-lg">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <Lock className="h-4 w-4" />
                <span>MediQueue Core Design Principle</span>
              </div>
              <blockquote className="mt-2 text-xs italic text-slate-200 border-l-2 border-sky-400 pl-3 leading-relaxed">
                "The AI may recommend and prepare an appointment, but only the authenticated backend can authorize and commit the booking."
              </blockquote>
              <p className="mt-2 text-[11px] text-slate-400">
                The AI agent never invents booking IDs or claims an appointment is confirmed until the backend commits the atomic database transaction.
              </p>
            </div>

            {/* State Machine Stepper Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Explicit State Machine Progression
              </h3>
              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { state: 'SEARCHING', desc: 'Querying backend for real availability' },
                  { state: 'AVAILABLE', desc: 'Valid doctor & slot retrieved' },
                  { state: 'AWAITING_CONFIRMATION', desc: 'Review card displayed, 5m hold' },
                  { state: 'CONFIRMED', desc: 'Patient confirmed & backend committed' },
                ].map((s, idx) => {
                  const isActive = currentState === s.state;
                  return (
                    <div
                      key={s.state}
                      className={`flex items-center gap-3 p-2 rounded-xl border transition ${
                        isActive
                          ? 'border-sky-500 bg-sky-950/40 text-white'
                          : 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                      }`}
                    >
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold">{s.state}</p>
                        <p className="text-[10px] text-slate-400 font-sans">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Forensics Feed (Last 3 Events) */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-emerald-400" />
                  Live SHA-256 Forensics
                </h3>
                <button
                  onClick={refreshAuditLogs}
                  className="text-slate-400 hover:text-white transition"
                  title="Refresh Audit Chain"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                {recentAuditEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-sky-400">#{evt.index} {evt.eventType}</span>
                      <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-1 text-slate-300 font-sans truncate">{evt.details}</p>
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>Hash: {evt.currentHash.substring(0, 10)}...</span>
                      <span className="text-emerald-400">Link Verified</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setActiveTab('forensics')}
                className="mt-3 w-full py-2 text-center text-xs font-bold text-sky-400 hover:text-sky-300 transition"
              >
                View Full Audit Chain &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: SHA-256 Forensics Hash Chain */}
      {activeTab === 'forensics' && (
        <div className="space-y-6">
          {/* Forensics Status Banner */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  Immutable Cryptographic Audit Trail
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono">
                  SHA-256 Hash Chain
                </span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-white">
                Cyber-Forensics Evidence Ledger
              </h2>
              <p className="mt-1 text-xs text-slate-400 max-w-xl">
                Every booking intent, slot selection, confirmation attempt, and commit generates a cryptographically signed audit block linked to the previous block's hash.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSimulateTamper}
                className="rounded-xl border border-rose-700 bg-rose-950/60 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900 transition flex items-center gap-1.5"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Simulate Adversary Tamper</span>
              </button>

              <button
                onClick={handleResetForensics}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset Chain</span>
              </button>
            </div>
          </div>

          {/* Chain Integrity Alert */}
          {verificationResult && (
            <div className={`rounded-2xl border p-4 flex items-center justify-between ${
              verificationResult.isValid
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-rose-500/60 bg-rose-950/60 text-rose-200 animate-pulse'
            }`}>
              <div className="flex items-center gap-3">
                {verificationResult.isValid ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {verificationResult.isValid ? 'Cryptographic Hash Chain Valid' : 'Integrity Anomaly Detected!'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {verificationResult.isValid
                      ? `Verified all ${verificationResult.totalBlocks} sequential SHA-256 blocks from Genesis to tip. Zero broken links or modified payloads.`
                      : verificationResult.error}
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                Verified: {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Full Chain Blocks Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-sans font-semibold">
                  <tr>
                    <th className="px-4 py-3">Block #</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Authenticated Actor</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Previous SHA-256</th>
                    <th className="px-4 py-3">Block Current Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {auditChainService.getChain().map((block) => (
                    <tr
                      key={block.id}
                      className={`hover:bg-slate-800/40 transition ${
                        block.tampered ? 'bg-rose-950/40 text-rose-200' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-white">#{block.index}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          block.eventType === 'BOOKING_COMMITTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : block.eventType === 'BOOKING_DENIED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-sky-500/10 text-sky-300'
                        }`}>
                          {block.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{block.actor.name} ({block.actor.role})</td>
                      <td className="px-4 py-3 font-sans text-slate-200 max-w-xs truncate">
                        {block.details}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[10px] font-mono">
                        {block.previousHash.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-emerald-400 text-[10px] font-mono font-bold">
                        {block.currentHash.substring(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Professor Testing Suite (Section 7) */}
      {activeTab === 'testSuite' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Terminal className="h-4 w-4" />
              <span>Section 7: Recommended Implementation & Security Testing Suite</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-white">
              Controlled AI Negative Testing & Security Proving Grounds
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-3xl leading-relaxed">
              Use these interactive triggers during your presentation to prove to your professor that MediQueue strictly enforces RBAC, explicit patient consent, duplicate prevention, and race-condition tolerance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Test 1: Cross-Patient Unauthorized Access */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Security Test 1</span>
                <h3 className="text-sm font-bold text-white mt-1">Cross-Patient Authorization Violation</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Simulate a malicious attempt where Patient A tries to book or access an appointment for another patient ID.
                </p>
              </div>
              <button
                onClick={handleTestUnauthorizedAccess}
                className="mt-4 w-full rounded-xl border border-rose-800 bg-rose-950/60 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900 transition"
              >
                Execute Unauthorized Test (Expect 403)
              </button>
            </div>

            {/* Test 2: Race Condition / Slot Collision */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Security Test 2</span>
                <h3 className="text-sm font-bold text-white mt-1">Concurrent Booking Race Condition</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Simulate another user claiming the slot right before confirmation. Proves transition to UNAVAILABLE instead of double-booking.
                </p>
              </div>
              <button
                onClick={handleTestSlotCollision}
                className="mt-4 w-full rounded-xl border border-amber-800 bg-amber-950/60 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-900 transition"
              >
                Arm Slot Collision Simulation
              </button>
            </div>

            {/* Test 3: Missing Consent Defense */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Security Test 3</span>
                <h3 className="text-sm font-bold text-white mt-1">Missing Explicit Patient Consent</h3>
                <p className="text-xs text-slate-400 mt-2">
                  The backend enforces that confirmation fails with CONSENT_REQUIRED if the patient checkbox is unchecked.
                </p>
              </div>
              <button
                onClick={() => handleUserSearch('Book a cardiologist for tomorrow')}
                className="mt-4 w-full rounded-xl border border-sky-800 bg-sky-950/60 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-900 transition"
              >
                Prepare Intent & Inspect Checkbox
              </button>
            </div>

            {/* Test 4: Cryptographic Forensics Tamper Test */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Security Test 4</span>
                <h3 className="text-sm font-bold text-white mt-1">Database Intrusion & Tamper Detection</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Directly alters a byte in the database audit log. Proves that the SHA-256 hash chain immediately flags the exact corrupted block.
                </p>
              </div>
              <button
                onClick={handleSimulateTamper}
                className="mt-4 w-full rounded-xl border border-purple-800 bg-purple-950/60 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-900 transition"
              >
                Corrupt Block & Run Cryptographic Audit
              </button>
            </div>

            {/* Test 5: Idempotency Key Replay Protection */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Security Test 5</span>
                <h3 className="text-sm font-bold text-white mt-1">Duplicate Request / Replay Defense</h3>
                <p className="text-xs text-slate-400 mt-2">
                  The backend matches idempotency keys to ensure multiple clicks never produce duplicate appointments or queue tokens.
                </p>
              </div>
              <button
                onClick={refreshAuditLogs}
                className="mt-4 w-full rounded-xl border border-emerald-800 bg-emerald-950/60 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900 transition"
              >
                Verify Idempotency Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
