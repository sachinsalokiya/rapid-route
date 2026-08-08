import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Badge, { statusTone } from '../components/Badge';
import Button from '../components/Button';
import LogisticsMap from '../components/Map';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatNumber, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();
  const canOperate = ['admin', 'dispatcher'].includes(user?.role);

  async function load() {
    setLoading(true);
    try {
      const [{ data }, vehiclesRes, driversRes] = await Promise.all([
        api.get(`/shipments/${id}`),
        api.get('/vehicles', { params: { limit: 50 } }),
        api.get('/drivers', { params: { limit: 50 } }).catch(() => ({ data: { data: { items: [] } } })),
      ]);
      setShipment(data.data.shipment);
      setEvents(data.data.events || []);
      setVehicles(vehiclesRes.data.data.items || []);
      setDrivers(driversRes.data.data.items || []);
      try {
        const w = await api.get(`/weather/shipment/${id}`);
        setWeather(w.data.data);
      } catch {
        setWeather(null);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function assign() {
    try {
      await api.post(`/shipments/${id}/assign`, { vehicleId, driverId: driverId || undefined });
      toast.success('Shipment assigned');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function startTransit() {
    try {
      await api.post(`/shipments/${id}/start-transit`);
      toast.success('Transit started (simulation mode)');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function markDelayed() {
    try {
      await api.patch(`/shipments/${id}`, { status: 'Delayed' });
      toast.info('Marked delayed');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!shipment) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/app/shipments" className="text-sm text-signal">
            ← Shipments
          </Link>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {shipment.origin.city} → {shipment.destination.city}
          </h2>
          <p className="text-sm text-steel-500">{shipment.trackingNumber}</p>
        </div>
        <Badge tone={statusTone(shipment.status)}>{shipment.status}</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <LogisticsMap
          origin={shipment.origin}
          destination={shipment.destination}
          vehicleLocation={shipment.currentLocation}
          routeCoordinates={shipment.routeGeometry?.coordinates || []}
          height="460px"
        />
        <div className="space-y-4">
          <Card title="ETA breakdown">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-steel-500">Route duration (OSRM)</dt>
                <dd className="font-medium">{formatNumber(shipment.routeDurationHours)} h</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-steel-500">Predicted logistics ETA (ML)</dt>
                <dd className="font-medium">{formatNumber(shipment.predictedEtaHours)} h</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-steel-500">Distance</dt>
                <dd className="font-medium">{formatNumber(shipment.routeDistanceKm)} km</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-steel-500">Est. delivery</dt>
                <dd className="font-medium">{formatDate(shipment.estimatedDeliveryTime)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-steel-500">Mode</dt>
                <dd className="font-medium">{shipment.transportationMode || '—'}</dd>
              </div>
            </dl>
          </Card>

          {canOperate && shipment.status === 'Pending' ? (
            <Card title="Assign vehicle">
              <div className="space-y-3">
                <select
                  className="w-full rounded-lg border border-steel-300 px-3 py-2 text-sm"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} · {v.vehicleType} · avail{' '}
                      {v.capacityKg - (v.currentLoadKg || 0)} kg
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-lg border border-steel-300 px-3 py-2 text-sm"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                >
                  <option value="">Driver (optional)</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} · {d.status}
                    </option>
                  ))}
                </select>
                <Button className="w-full" disabled={!vehicleId} onClick={assign}>
                  Assign
                </Button>
              </div>
            </Card>
          ) : null}

          {canOperate && ['Assigned', 'Delayed'].includes(shipment.status) ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={startTransit}>Start transit (simulation)</Button>
              {shipment.status !== 'Delayed' ? (
                <Button variant="outline" onClick={markDelayed}>
                  Mark delayed
                </Button>
              ) : null}
            </div>
          ) : null}

          <Card title="Weather">
            {!weather ? (
              <p className="text-sm text-steel-500">Weather data unavailable</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  Origin: {weather.origin?.available ? weather.origin.description : weather.origin?.message}
                </p>
                <p>
                  Destination:{' '}
                  {weather.destination?.available
                    ? weather.destination.description
                    : weather.destination?.message}
                </p>
                <p className="text-steel-500">Overall risk: {weather.overallRisk}</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card title="Timeline">
        <ol className="space-y-3">
          {events.map((ev) => (
            <li key={ev._id} className="rounded-xl border border-steel-100 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{ev.eventType}</p>
                <p className="text-xs text-steel-500">{formatDate(ev.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm text-steel-500">
                {ev.description}
                {ev.simulated ? ' · simulated' : ''}
              </p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
