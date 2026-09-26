import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Billing, BillStatus, BillSourceType, Patient } from '@/types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  DollarSign,
  Plus,
  FileText,
  Printer,
  X,
  Filter,
} from 'lucide-react';

export const StaffBillingPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [bills, setBills] = useState<Billing[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [allBills, pats] = await Promise.all([
        dbService.getCollection<Billing>('billing'),
        dbService.getCollection<Patient>('patients'),
      ]);
      setBills(allBills.filter((b) => b.hospitalId === hospitalId || !b.hospitalId));
      setPatients(pats);
    };
    load();
  }, [hospitalId]);

  const handleUpdateStatus = async (billId: string, status: BillStatus) => {
    await dbService.updateDocument('billing', billId, { status }, 'billId');
    setBills(bills.map((b) => (b.billId === billId ? { ...b, status } : b)));
    setFeedback(`Invoice #${billId} status updated to ${status.toUpperCase()}`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const filteredBills = bills.filter((b) => {
    const matchesSource = selectedSource === 'all' || b.sourceType === selectedSource;
    const matchesStatus = selectedStatus === 'all' || b.status === selectedStatus;
    const matchesSearch =
      b.billId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesStatus && matchesSearch;
  });

  const totalCollected = bills
    .filter((b) => b.status === 'paid')
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendingAmount = bills
    .filter((b) => b.status === 'pending' || b.status === 'partial')
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              Point-of-Care Revenue Management
            </span>
            <span className="text-xs text-slate-400 font-mono">Unified Billing Console</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Hospital Billing & Invoices
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Unified billing ledger consolidated across OPD consultations, IPD bed days, and Pathology/Radiology diagnostic orders.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Revenue Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Total Invoices Dispatched</span>
          <p className="mt-1 text-2xl font-bold text-white">{bills.length} Invoices</p>
          <span className="text-[10px] text-slate-500">Across all 4 clinical sources</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-emerald-400">Paid Revenue Settled</span>
          <p className="mt-1 text-2xl font-bold text-emerald-400">₹ {totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">Card, UPI, Insurance & Cash</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-amber-400">Receivable / Pending Outstandings</span>
          <p className="mt-1 text-2xl font-bold text-amber-400">₹ {pendingAmount.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">Unsettled or partial claims</span>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice ID or patient ID..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="all">All Sources (OPD/IPD/Lab/Rad)</option>
              <option value="OPD">OPD Consultation</option>
              <option value="IPD">Inpatient Stay</option>
              <option value="PATH">Pathology Lab</option>
              <option value="RAD">Radiology Scans</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Clinical Source</th>
                <th className="px-4 py-3">Itemized Subtotal</th>
                <th className="px-4 py-3">Final Amount</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredBills.map((b) => {
                const pat = patients.find((p) => p.patientId === b.patientId);
                const isPaid = b.status === 'paid';

                return (
                  <tr key={b.billId} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{b.billId}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {pat?.name || b.patientId}
                      <span className="block text-[10px] text-slate-500 font-mono">ID: {b.patientId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                        {b.sourceType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">₹{b.subtotal.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      ₹{b.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          b.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : b.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : b.status === 'partial'
                            ? 'bg-sky-500/20 text-sky-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {!isPaid && (
                        <button
                          onClick={() => handleUpdateStatus(b.billId, 'paid')}
                          className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white px-2.5 py-1 text-[11px] font-semibold transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(b)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 text-[11px] font-semibold transition"
                      >
                        Print Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-fade-in text-slate-200">
            {/* Invoice Top */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xl font-bold tracking-tight text-white">Medi<span className="text-mediblue-400">Queue</span></span>
                <p className="text-[11px] text-slate-400">Official Clinical Billing Statement</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bill Metadata */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Patient Details</p>
                <p className="font-bold text-white text-sm">
                  {patients.find((p) => p.patientId === selectedInvoice.patientId)?.name || selectedInvoice.patientId}
                </p>
                <p className="text-slate-400 font-mono">UHID: {selectedInvoice.patientId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Invoice Details</p>
                <p className="font-mono font-bold text-amber-400 text-sm">#{selectedInvoice.billId}</p>
                <p className="text-slate-400">Date: {new Date(selectedInvoice.createdAt || Date.now()).toLocaleDateString()}</p>
                <p className="text-slate-400 uppercase font-semibold">Source: {selectedInvoice.sourceType}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-3.5 py-2.5">Service Description</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5">Qty</th>
                    <th className="px-3.5 py-2.5">Unit Price</th>
                    <th className="px-3.5 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3.5 py-2.5 font-medium text-white">{item.description}</td>
                      <td className="px-3.5 py-2.5 text-[10px] font-mono uppercase text-slate-400">{item.category}</td>
                      <td className="px-3.5 py-2.5">{item.quantity}</td>
                      <td className="px-3.5 py-2.5 font-mono">₹{item.unitPrice}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-white">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="mt-4 flex justify-end text-xs">
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Institutional Discount:</span>
                    <span className="font-mono">- ₹{selectedInvoice.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
                  <span>Net Amount Due:</span>
                  <span className="font-mono text-emerald-400">₹{selectedInvoice.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl bg-mediblue-600 hover:bg-mediblue-500 px-4 py-2 text-xs font-bold text-white transition"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
