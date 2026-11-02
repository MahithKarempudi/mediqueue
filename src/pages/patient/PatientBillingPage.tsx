import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Billing } from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge, Button, Modal, NoticeBanner } from '@/components/ui';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Receipt,
  Printer,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

export const PatientBillingPage: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'pat_0001';

  const [bills, setBills] = useState<Billing[]>([]);
  const [selectedBill, setSelectedBill] = useState<Billing | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI / QR Instant' | 'Corporate Health Insurance' | 'Debit / Credit Card'>('UPI / QR Instant');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadBills = async () => {
      const all = await dbService.getCollection<Billing>('billing');
      const mine = all.filter((b) => b.patientId === patientId);
      setBills(mine.length > 0 ? mine : all.slice(0, 4));
    };
    loadBills();

    const unsub = dbService.subscribeCollection<Billing>('billing', (all) => {
      const mine = all.filter((b) => b.patientId === patientId);
      setBills(mine.length > 0 ? mine : all.slice(0, 4));
    });
    return () => unsub();
  }, [patientId]);

  const handleSettleInvoice = async (bill: Billing) => {
    await dbService.updateDocument('billing', bill.billId, {
      status: 'paid',
    });
    setPaymentSuccessMsg(
      `Invoice ${bill.billId} (₹${bill.totalAmount.toLocaleString('en-IN')}) settled via ${paymentMethod}. Official clinical receipt generated.`
    );
    if (selectedBill?.billId === bill.billId) {
      setSelectedBill({ ...bill, status: 'paid' });
    }
  };

  const pendingTotal = bills
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const paidTotal = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Patient Financial Ledger"
        title="Hospital Invoices, Claims & Receipts"
        subtitle="Review itemized outpatient, diagnostic, and inpatient billing statements and settle outstanding invoices."
      />

      {paymentSuccessMsg && (
        <NoticeBanner variant="success" title="Payment Settlement Confirmed" onDismiss={() => setPaymentSuccessMsg(null)}>
          {paymentSuccessMsg}
        </NoticeBanner>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Outstanding Balance"
          value={`₹${pendingTotal.toLocaleString('en-IN')}`}
          subtitle={`${bills.filter((b) => b.status === 'pending').length} open invoices awaiting settlement`}
          icon={<Clock className="w-5 h-5" />}
          accent={pendingTotal > 0 ? 'amber' : 'emerald'}
        />
        <MetricCard
          label="Total Settled Amount"
          value={`₹${paidTotal.toLocaleString('en-IN')}`}
          subtitle={`${bills.filter((b) => b.status === 'paid').length} paid hospital receipts`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="teal"
        />
        <MetricCard
          label="Default Settlement Mode"
          value={paymentMethod.split(' ')[0]}
          subtitle="Instant hospital ledger reconciliation"
          icon={<Wallet className="w-5 h-5" />}
          accent="blue"
        />
      </div>

      {/* Payment Mode Selector */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Preferred Settlement Instrument:
          </span>
          <div className="flex flex-wrap gap-2">
            {(['UPI / QR Instant', 'Corporate Health Insurance', 'Debit / Credit Card'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  paymentMethod === method
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card padding="lg">
        <SectionHeader
          title="Itemized Hospital Statements"
          subtitle="Click any statement to view itemized charges or settle pending dues"
          icon={<Receipt className="w-5 h-5" />}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Invoice ID</th>
                <th className="mq-table-th">Issued Date</th>
                <th className="mq-table-th">Line Items Summary</th>
                <th className="mq-table-th">Total Amount</th>
                <th className="mq-table-th">Status</th>
                <th className="mq-table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.billId} className="hover:bg-slate-50">
                  <td className="mq-table-td font-mono font-bold text-slate-900">{bill.billId}</td>
                  <td className="mq-table-td text-xs text-slate-600">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </td>
                  <td className="mq-table-td text-xs text-slate-700">
                    {bill.items.map((i) => i.description).join(' • ')}
                  </td>
                  <td className="mq-table-td font-mono font-bold text-slate-900">
                    ₹{bill.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="mq-table-td">
                    <Badge variant={bill.status === 'paid' ? 'success' : 'warning'} dot>
                      {bill.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="mq-table-td text-right space-x-2">
                    <Button variant="outline" size="xs" onClick={() => setSelectedBill(bill)}>
                      Inspect Receipt
                    </Button>
                    {bill.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => handleSettleInvoice(bill)}
                      >
                        Pay Now
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Itemized Receipt Modal */}
      <Modal
        open={selectedBill !== null}
        onClose={() => setSelectedBill(null)}
        title={`Hospital Tax Invoice — ${selectedBill?.billId}`}
        subtitle={`Patient ID: ${selectedBill?.patientId} • Issued: ${
          selectedBill ? new Date(selectedBill.createdAt).toLocaleString() : ''
        }`}
        size="md"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">Settlement Status</span>
                <Badge variant={selectedBill.status === 'paid' ? 'success' : 'warning'} dot>
                  {selectedBill.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Invoice Value</span>
                <span className="text-xl font-extrabold font-display text-slate-900">
                  ₹{selectedBill.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Clinical Service / Tariff Item</th>
                    <th className="mq-table-th text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="mq-table-td text-xs font-medium text-slate-800">{item.description}</td>
                      <td className="mq-table-td text-right font-mono font-semibold text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-mediteal-600" />
                Verified Institutional Billing Ledger
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                {selectedBill.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CreditCard className="w-3.5 h-3.5" />}
                    onClick={() => handleSettleInvoice(selectedBill)}
                  >
                    Authorize Payment (₹{selectedBill.totalAmount.toLocaleString('en-IN')})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
