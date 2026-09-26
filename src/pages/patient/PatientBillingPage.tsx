import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Billing } from '@/types';
import {
  CreditCard,
  CheckCircle2,
  DollarSign,
  Printer,
  X,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const PatientBillingPage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_demo_01';

  const [bills, setBills] = useState<Billing[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const allBills = await dbService.getCollection<Billing>('billing');
      const userBills = allBills.filter((b) => b.patientId === patientId);

      if (userBills.length === 0) {
        // Seed default demo bills for Priya Sharma
        const b1: Billing = {
          billId: 'bill_demo_01',
          patientId,
          hospitalId: 'hosp_metro_01',
          sourceType: 'OPD',
          lineItems: [
            { id: 'li_1', description: 'Comprehensive Cardiology Clinical Consultation', category: 'OPD', quantity: 1, unitPrice: 800, totalPrice: 800 },
            { id: 'li_2', description: 'Digital Electrocardiogram (ECG 12-Lead)', category: 'OPD', quantity: 1, unitPrice: 400, totalPrice: 400 },
          ],
          subtotal: 1200,
          discount: 100,
          total: 1100,
          status: 'paid',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        };
        const b2: Billing = {
          billId: 'bill_demo_02',
          patientId,
          hospitalId: 'hosp_metro_01',
          sourceType: 'PATH',
          lineItems: [
            { id: 'li_3', description: 'Lipid Profile & Serum Cholesterol Assay', category: 'PATH', quantity: 1, unitPrice: 650, totalPrice: 650 },
            { id: 'li_4', description: 'Complete Blood Count (Automated Hematology)', category: 'PATH', quantity: 1, unitPrice: 450, totalPrice: 450 },
          ],
          subtotal: 1100,
          discount: 0,
          total: 1100,
          status: 'pending',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        };
        await dbService.setDocument('billing', b1.billId, b1);
        await dbService.setDocument('billing', b2.billId, b2);
        setBills([b1, b2]);
      } else {
        setBills(userBills);
      }
    };
    load();
  }, [patientId]);

  const handlePayBill = async (bill: Billing) => {
    setPayingBillId(bill.billId);
    setTimeout(async () => {
      await dbService.updateDocument('billing', bill.billId, { status: 'paid' }, 'billId');
      setBills(bills.map((b) => (b.billId === bill.billId ? { ...b, status: 'paid' } : b)));
      setPayingBillId(null);
      setFeedback(`Payment of ₹${bill.total} for Invoice #${bill.billId} verified successfully via UPI/Card!`);
      setTimeout(() => setFeedback(null), 5000);
    }, 800);
  };

  const totalOutstanding = bills
    .filter((b) => b.status === 'pending')
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
              Patient Account Statement
            </span>
            <span className="text-xs text-slate-400">UHID: {patientId}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            My Medical Bills & Invoices
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            View unified charges across consultations, hospital ward days, and lab investigations. Pay balances online with instant receipt generation.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding</span>
          <p className="text-2xl font-mono font-bold text-amber-400">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 animate-fade-in shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Bills Cards */}
      <div className="space-y-4">
        {bills.map((b) => {
          const isPaid = b.status === 'paid';
          const isPaying = payingBillId === b.billId;

          return (
            <div
              key={b.billId}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl transition hover:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">#{b.billId}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                    {b.sourceType}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      isPaid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  {b.lineItems.map((item, idx) => (
                    <p key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                      <span>{item.description}</span>
                      <span className="font-mono text-slate-400 font-semibold">(₹{item.totalPrice})</span>
                    </p>
                  ))}
                </div>

                <p className="mt-2 text-[11px] text-slate-500">
                  Issued on: {new Date(b.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col md:items-end gap-2">
                <span className="text-xs text-slate-400">Net Payable:</span>
                <span className="text-2xl font-mono font-bold text-white">
                  ₹{b.total.toLocaleString('en-IN')}
                </span>

                <div className="flex gap-2 mt-1">
                  {!isPaid && (
                    <button
                      onClick={() => handlePayBill(b)}
                      disabled={isPaying}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-lg shadow-emerald-950/60"
                    >
                      {isPaying ? 'Processing...' : 'Pay Online (UPI / Card)'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedInvoice(b)}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition"
                  >
                    View / Print Invoice
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-fade-in text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xl font-bold tracking-tight text-white">Medi<span className="text-mediblue-400">Queue</span></span>
                <p className="text-[11px] text-slate-400">Patient Billing & Discharge Receipt</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Billed To</p>
                <p className="font-bold text-white text-sm">{user?.name || 'Priya Sharma'}</p>
                <p className="text-slate-400 font-mono">UHID: {selectedInvoice.patientId}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Invoice Details</p>
                <p className="font-mono font-bold text-amber-400 text-sm">#{selectedInvoice.billId}</p>
                <p className="text-slate-400">Status: <span className="uppercase font-bold text-emerald-400">{selectedInvoice.status}</span></p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-3 py-2">Service Description</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedInvoice.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium text-white">{item.description}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-white">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs pt-3 border-t border-slate-800">
              <span className="text-slate-400 font-medium">Payment Verified Online</span>
              <span className="text-lg font-bold font-mono text-emerald-400">Total: ₹{selectedInvoice.total}</span>
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
