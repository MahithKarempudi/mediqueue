import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { Billing, Patient } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, Modal, NoticeBanner } from '@/components/ui';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Receipt,
} from 'lucide-react';

export const StaffBillingPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [bills, setBills] = useState<Billing[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'pending' | 'paid'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // New invoice form
  const [selectedPatientId, setSelectedPatientId] = useState('pat_0001');
  const [item1Desc, setItem1Desc] = useState('Specialist OPD Consultation & ECG Evaluation');
  const [item1Amount, setItem1Amount] = useState<number>(850);
  const [item2Desc, setItem2Desc] = useState('Comprehensive Metabolic & Lipid Panel');
  const [item2Amount, setItem2Amount] = useState<number>(1200);

  useEffect(() => {
    const loadBilling = async () => {
      const [allBills, allPats] = await Promise.all([
        dbService.getCollection<Billing>('billing'),
        dbService.getCollection<Patient>('patients'),
      ]);
      setBills(allBills.filter((b) => b.hospitalId === hospitalId));
      setPatients(allPats);
    };
    loadBilling();

    const unsub = dbService.subscribeCollection<Billing>('billing', (all) => {
      setBills(all.filter((b) => b.hospitalId === hospitalId));
    });
    return () => unsub();
  }, [hospitalId]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const billId = `BILL-${Date.now().toString().slice(-6)}`;
    const items = [{ description: item1Desc, amount: Number(item1Amount) }];
    if (item2Desc.trim() && item2Amount > 0) {
      items.push({ description: item2Desc, amount: Number(item2Amount) });
    }
    const totalAmount = items.reduce((s, i) => s + i.amount, 0);

    const newBill: Billing = {
      billId,
      patientId: selectedPatientId,
      hospitalId,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await dbService.setDocument('billing', billId, newBill);
    setShowCreateModal(false);
    setStatusMsg(`Invoice ${billId} (₹${totalAmount.toLocaleString('en-IN')}) issued to patient ${selectedPatientId.toUpperCase()}.`);
  };

  const handleMarkPaid = async (billId: string) => {
    await dbService.updateDocument('billing', billId, { status: 'paid' });
    setStatusMsg(`Invoice ${billId} marked as PAID at the hospital cashier desk.`);
  };

  const filteredBills =
    filterStatus === 'ALL' ? bills : bills.filter((b) => b.status === filterStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Hospital Revenue Cycle Desk"
        title="Point-of-Care Billing & Cashier Settlement"
        subtitle="Issue itemized outpatient, diagnostic, and inpatient invoices and record counter settlements."
        actions={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create New Patient Invoice
          </Button>
        }
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="Hospital Billing Ledger Updated" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <Card padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <SectionHeader
            title={`Facility Billing Ledger (${filteredBills.length} Invoices)`}
            subtitle={`Hospital ID: ${hospitalId}`}
            icon={<Receipt className="w-5 h-5" />}
          />
          <div className="flex gap-1.5">
            {(['ALL', 'pending', 'paid'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase border cursor-pointer ${
                  filterStatus === st
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Invoice ID</th>
                <th className="mq-table-th">Patient UHID</th>
                <th className="mq-table-th">Tariff Description</th>
                <th className="mq-table-th">Total (INR)</th>
                <th className="mq-table-th">Status</th>
                <th className="mq-table-th text-right">Cashier Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.billId} className="hover:bg-slate-50">
                  <td className="mq-table-td font-mono font-bold text-slate-900">{bill.billId}</td>
                  <td className="mq-table-td font-mono text-xs text-mediblue-700 font-bold">
                    {bill.patientId.toUpperCase()}
                  </td>
                  <td className="mq-table-td text-xs text-slate-700">
                    {bill.items.map((i) => `${i.description} (₹${i.amount})`).join(' + ')}
                  </td>
                  <td className="mq-table-td font-mono font-bold text-slate-900">
                    ₹{bill.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="mq-table-td">
                    <Badge variant={bill.status === 'paid' ? 'success' : 'warning'} dot>
                      {bill.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="mq-table-td text-right">
                    {bill.status === 'pending' ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={<CheckCircle2 className="w-3.5 h-3.5 text-mediteal-400" />}
                        onClick={() => handleMarkPaid(bill.billId)}
                      >
                        Record Settlement
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate Itemized Patient Invoice"
        subtitle="Creates a real-time billing statement visible in the Patient Billing Portal"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div>
            <label className="mq-label">Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="mq-input"
            >
              {patients.slice(0, 20).map((p) => (
                <option key={p.patientId} value={p.patientId}>
                  {p.name} ({p.patientId.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mq-label">Line Item 1 Description</label>
              <input
                type="text"
                required
                value={item1Desc}
                onChange={(e) => setItem1Desc(e.target.value)}
                className="mq-input"
              />
            </div>
            <div>
              <label className="mq-label">Amount (₹)</label>
              <input
                type="number"
                required
                value={item1Amount}
                onChange={(e) => setItem1Amount(Number(e.target.value))}
                className="mq-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="mq-label">Line Item 2 Description (Optional)</label>
              <input
                type="text"
                value={item2Desc}
                onChange={(e) => setItem2Desc(e.target.value)}
                className="mq-input"
              />
            </div>
            <div>
              <label className="mq-label">Amount (₹)</label>
              <input
                type="number"
                value={item2Amount}
                onChange={(e) => setItem2Amount(Number(e.target.value))}
                className="mq-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<CreditCard className="w-4 h-4" />}>
              Issue Hospital Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
