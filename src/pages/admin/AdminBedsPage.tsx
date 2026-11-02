import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import type { IpdBed, LiveBed } from '@/types';
import { PageHeader, Card, SectionHeader, Badge, Button, NoticeBanner } from '@/components/ui';
import {
  Bed,
  Plus,
  CheckCircle2,
  Wrench,
} from 'lucide-react';

export const AdminBedsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [wardId, setWardId] = useState('ward_icu_north');
  const [bedType, setBedType] = useState<'ICU' | 'general'>('ICU');
  const [bedNumber, setBedNumber] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadBeds = async () => {
      const all = await dbService.getCollection<IpdBed>('ipd_beds');
      setBeds(all.filter((b) => b.hospitalId === hospitalId));
    };
    loadBeds();

    const unsub = dbService.subscribeCollection<IpdBed>('ipd_beds', (all) => {
      setBeds(all.filter((b) => b.hospitalId === hospitalId));
    });
    return () => unsub();
  }, [hospitalId]);

  const handleCommissionBed = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = bedNumber.trim() || `${bedType === 'ICU' ? 'ICU' : 'GEN'}-${beds.length + 1}`;
    const newBedId = `bed_${hospitalId}_${Date.now().toString().slice(-4)}`;
    const newBed: IpdBed = {
      bedId: newBedId,
      hospitalId,
      wardId,
      bedNumber: nextNum,
      type: bedType,
      status: 'available',
      lastUpdated: new Date().toISOString(),
    };

    await dbService.setDocument('ipd_beds', newBedId, newBed);
    const liveBed: LiveBed = {
      bedId: newBedId,
      status: 'available',
      wardId,
      type: bedType,
      bedNumber: nextNum,
      lastUpdated: new Date().toISOString(),
    };
    await dbService.setRTDB(`liveBeds/${hospitalId}/${newBedId}`, liveBed);
    setBedNumber('');
    setStatusMsg(`Commissioned new ${bedType.toUpperCase()} bed [${nextNum}] into ward ${wardId}.`);
  };

  const handleToggleBedState = async (bed: IpdBed, status: 'available' | 'occupied' | 'maintenance') => {
    await dbService.updateDocument('ipd_beds', bed.bedId, {
      status,
      lastUpdated: new Date().toISOString(),
    });
    await dbService.setRTDB(`liveBeds/${hospitalId}/${bed.bedId}`, {
      bedId: bed.bedId,
      status,
      wardId: bed.wardId,
      type: bed.type,
      bedNumber: bed.bedNumber,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Hospital Infrastructure Administration"
        title="Ward & Critical Care Bed Inventory Management"
        subtitle="Commission new inpatient beds, reallocate ICU capacity, and manage ward maintenance status."
      />

      {statusMsg && (
        <NoticeBanner variant="success" title="Bed Commissioned" onDismiss={() => setStatusMsg(null)}>
          {statusMsg}
        </NoticeBanner>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card padding="lg">
            <SectionHeader
              title="Commission New Ward Bed"
              subtitle="Add physical bed capacity to this facility"
              icon={<Plus className="w-5 h-5" />}
            />

            <form onSubmit={handleCommissionBed} className="space-y-4">
              <div>
                <label className="mq-label">Ward Wing Identifier</label>
                <select
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="mq-input"
                >
                  <option value="ward_icu_north">ICU North Wing</option>
                  <option value="ward_icu_trauma">Trauma & Cardiac ICU</option>
                  <option value="ward_gen_east">General Medicine East</option>
                  <option value="ward_gen_surgical">Surgical Recovery Ward</option>
                </select>
              </div>

              <div>
                <label className="mq-label">Care Acuity Classification</label>
                <select
                  value={bedType}
                  onChange={(e) => setBedType(e.target.value as 'ICU' | 'general')}
                  className="mq-input"
                >
                  <option value="ICU">Intensive Care Unit (ICU)</option>
                  <option value="general">General Inpatient Ward</option>
                </select>
              </div>

              <div>
                <label className="mq-label">Bed Code / Label</label>
                <input
                  type="text"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  placeholder="e.g. ICU-38"
                  className="mq-input"
                />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" icon={<CheckCircle2 className="w-4 h-4" />}>
                Commission Bed to Active Census
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card padding="lg">
            <SectionHeader
              title={`Commissioned Bed Registry (${beds.length} Beds)`}
              subtitle="Real-time bed state across ICU and General wards"
              icon={<Bed className="w-5 h-5" />}
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="mq-table-th">Bed Code</th>
                    <th className="mq-table-th">Ward Wing</th>
                    <th className="mq-table-th">Classification</th>
                    <th className="mq-table-th">Current State</th>
                    <th className="mq-table-th text-right">Administrative Override</th>
                  </tr>
                </thead>
                <tbody>
                  {beds.slice(0, 20).map((b) => (
                    <tr key={b.bedId} className="hover:bg-slate-50">
                      <td className="mq-table-td font-mono font-bold text-slate-900">{b.bedNumber}</td>
                      <td className="mq-table-td text-xs text-slate-600">{b.wardId}</td>
                      <td className="mq-table-td">
                        <Badge variant={b.type === 'ICU' ? 'danger' : 'info'}>{b.type.toUpperCase()}</Badge>
                      </td>
                      <td className="mq-table-td">
                        <Badge
                          variant={
                            b.status === 'available'
                              ? 'success'
                              : b.status === 'occupied'
                              ? 'warning'
                              : 'neutral'
                          }
                          dot
                        >
                          {b.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="mq-table-td text-right space-x-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          disabled={b.status === 'available'}
                          onClick={() => handleToggleBedState(b, 'available')}
                        >
                          Set Free
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          disabled={b.status === 'maintenance'}
                          icon={<Wrench className="w-3 h-3" />}
                          onClick={() => handleToggleBedState(b, 'maintenance')}
                        >
                          Maintenance
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
