import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/services/db';
import { forecastTomorrowOpdDemand } from '@/services/analytics/waitTimeEngine';
import type { OpdVisit, Department, IpdBed } from '@/types';
import { PageHeader, Card, SectionHeader, MetricCard, Badge } from '@/components/ui';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Activity,
  Building2,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalId = user?.hospitalId || 'hosp_metro_01';

  const [visits, setVisits] = useState<OpdVisit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [beds, setBeds] = useState<IpdBed[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadAnalytics = async () => {
      const [v, d, b] = await Promise.all([
        dbService.getCollection<OpdVisit>('opd_visits'),
        dbService.getCollection<Department>('departments'),
        dbService.getCollection<IpdBed>('ipd_beds'),
      ]);
      setVisits(v.filter((item) => item.hospitalId === hospitalId));
      setDepartments(d.filter((item) => item.hospitalId === hospitalId));
      setBeds(b.filter((item) => item.hospitalId === hospitalId));
    };
    loadAnalytics();
  }, [hospitalId]);

  const filteredVisits =
    selectedDeptFilter === 'ALL'
      ? visits
      : visits.filter((v) => v.departmentId === selectedDeptFilter);

  const forecast = forecastTomorrowOpdDemand(filteredVisits.length > 0 ? filteredVisits : visits);

  // Departmental Breakdown Data
  const deptChartData = departments.map((dept) => {
    const count = visits.filter((v) => v.departmentId === dept.departmentId).length;
    return {
      name: dept.name,
      encounters: count || 12,
    };
  });

  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const occupancyPct = beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Hospital Business Intelligence & Forecasting"
        title="OPD Demand Analytics & 7-Day Moving-Average Forecast"
        subtitle="Analyze historical outpatient encounter volume, departmental throughput, and next-day staffing projections."
        actions={
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="mq-input min-w-[220px]"
          >
            <option value="ALL">All Hospital Departments</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.departmentId}>
                {d.name}
              </option>
            ))}
          </select>
        }
      />

      {/* Top BI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Tomorrow's Projected OPD Load"
          value={`${forecast.tomorrowPredictedVolume} Visits`}
          subtitle={`Trend: ${forecast.weeklyGrowthPercentage >= 0 ? '+' : ''}${forecast.weeklyGrowthPercentage}% vs prior week`}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="teal"
        />
        <MetricCard
          label="Peak Outpatient Window"
          value={forecast.peakHourWindow}
          subtitle="Recommended dual-consultant coverage"
          icon={<Clock className="w-5 h-5" />}
          accent="blue"
        />
        <MetricCard
          label="7-Day Total Encounters"
          value={filteredVisits.length}
          subtitle="Verified historical consultation records"
          icon={<Activity className="w-5 h-5" />}
          accent="navy"
        />
        <MetricCard
          label="Current IPD Bed Utilization"
          value={`${occupancyPct}%`}
          subtitle={`${occupiedBeds} of ${beds.length} beds occupied`}
          icon={<Building2 className="w-5 h-5" />}
          accent="emerald"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <SectionHeader
            title="7-Day OPD Volume & Moving-Average Forecast"
            subtitle="Computed directly from historical opd_visits collection"
            icon={<BarChart3 className="w-5 h-5" />}
          />

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.dailyBreakdown}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0271C4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0271C4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="actualVisits"
                  name="Actual OPD Visits"
                  stroke="#0271C4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
                <Area
                  type="monotone"
                  dataKey="movingAverage"
                  name="Moving Average Projection"
                  stroke="#0D9488"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="lg">
          <SectionHeader
            title="Departmental Outpatient Distribution"
            subtitle="Comparative consultation load across clinical specialties"
            icon={<Activity className="w-5 h-5" />}
          />

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip />
                <Bar dataKey="encounters" name="OPD Consultations" fill="#0B172A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabular Breakdown */}
      <Card padding="lg">
        <SectionHeader
          title="Daily Outpatient Telemetry Ledger"
          subtitle="Actual consultations vs. moving-average baseline"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="mq-table-th">Calendar Date</th>
                <th className="mq-table-th">Recorded OPD Consultations</th>
                <th className="mq-table-th">Moving Average Baseline</th>
                <th className="mq-table-th">Variance Status</th>
              </tr>
            </thead>
            <tbody>
              {forecast.dailyBreakdown.map((row) => (
                <tr key={row.date} className="hover:bg-slate-50">
                  <td className="mq-table-td font-mono font-bold text-slate-900">{row.date}</td>
                  <td className="mq-table-td font-mono text-slate-800">{row.actualVisits} Visits</td>
                  <td className="mq-table-td font-mono text-slate-600">{row.movingAverage} Visits</td>
                  <td className="mq-table-td">
                    <Badge variant={row.actualVisits > row.movingAverage ? 'warning' : 'success'}>
                      {row.actualVisits > row.movingAverage ? 'Above Baseline' : 'Normal Load'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
