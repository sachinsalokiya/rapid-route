import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Package, Truck, Clock, Route } from 'lucide-react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge, { statusTone } from '../components/Badge';
import { formatNumber, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

const COLORS = ['#0F766E', '#D97706', '#0EA5E9', '#64748B', '#DC2626', '#7C3AED'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/dashboard');
        setData(res.data.data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (!data) return null;

  const { kpis, charts, recentShipments } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900">Operations dashboard</h2>
        <p className="text-sm text-steel-500">Live KPIs from MongoDB — chart data updates with seed/demo traffic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total shipments" value={kpis.totalShipments} icon={Package} />
        <StatCard label="Active shipments" value={kpis.activeShipments} icon={Route} />
        <StatCard label="Delivered" value={kpis.deliveredShipments} hint={`${kpis.delayedShipments} delayed`} />
        <StatCard label="Active vehicles" value={kpis.activeVehicles} icon={Truck} />
        <StatCard
          label="Available capacity"
          value={`${formatNumber(kpis.availableCapacityKg, 0)} kg`}
          hint={`of ${formatNumber(kpis.totalCapacityKg, 0)} kg`}
        />
        <StatCard label="Average ETA" value={`${kpis.averageEtaHours} h`} icon={Clock} />
        <StatCard label="Total distance" value={`${formatNumber(kpis.totalDistanceKm, 0)} km`} />
        <StatCard label="Delivery performance" value={`${kpis.deliveryPerformancePct}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Shipments by status">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.shipmentsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF7" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Shipments over time">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.shipmentsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#D97706" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Transport mode distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.modeDistribution} dataKey="count" nameKey="mode" outerRadius={90} label>
                  {charts.modeDistribution.map((entry, index) => (
                    <Cell key={entry.mode} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Vehicle utilization">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.vehicleUtilization}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF7" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis unit="%" />
                <Tooltip />
                <Bar dataKey="utilizationPct" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Recent shipments" action={<Link className="text-sm text-signal" to="/app/shipments">View all</Link>}>
        <div className="space-y-3">
          {recentShipments.map((s) => (
            <Link
              key={s._id}
              to={`/app/shipments/${s._id}`}
              className="flex items-center justify-between rounded-xl border border-steel-100 px-3 py-3 hover:bg-steel-50"
            >
              <div>
                <p className="font-medium text-ink-900">
                  {s.origin?.city} → {s.destination?.city}
                </p>
                <p className="text-xs text-steel-500">{s.trackingNumber}</p>
              </div>
              <Badge tone={statusTone(s.status)}>{s.status}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
