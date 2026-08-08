import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge, { statusTone } from '../components/Badge';
import LogisticsMap from '../components/Map';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatNumber, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export default function TrackPage() {
  const { trackingNumber: paramTn } = useParams();
  const [input, setInput] = useState(paramTn || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(paramTn));
  const toast = useToast();
  const navigate = useNavigate();

  async function load(tn) {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/tracking/${tn}`);
      setData(res.data);
    } catch (err) {
      setData(null);
      toast.error(getErrorMessage(err, 'Tracking number not found'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (paramTn) load(paramTn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramTn]);

  useEffect(() => {
    if (!data?.shipment?.trackingNumber) return undefined;
    const socket = io(SOCKET_URL || window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socket.emit('subscribe:tracking', data.shipment.trackingNumber);
    socket.on('tracking:update', (payload) => {
      if (payload.trackingNumber !== data.shipment.trackingNumber) return;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          shipment: {
            ...prev.shipment,
            status: payload.status,
            currentLocation: payload.currentLocation,
            estimatedDeliveryTime: payload.estimatedDeliveryTime,
            simulation: {
              ...prev.shipment.simulation,
              progress: payload.progress,
              enabled: !payload.completed,
            },
          },
        };
      });
    });
    return () => socket.disconnect();
  }, [data?.shipment?.trackingNumber]);

  function onSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;
    navigate(`/track/${input.trim().toUpperCase()}`);
  }

  const shipment = data?.shipment;

  return (
    <div className="min-h-screen bg-steel-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-display text-2xl font-bold">Rapid Route</p>
            <h1 className="text-lg font-semibold text-ink-900">Shipment tracking</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-wrap gap-2 rounded-2xl border border-steel-200 bg-white p-4">
          <input
            className="min-w-[240px] flex-1 rounded-lg border border-steel-300 px-3 py-2"
            placeholder="Enter tracking number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit">Track</Button>
        </form>

        {loading ? <LoadingSpinner label="Fetching shipment..." /> : null}

        {shipment ? (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span>
                Demo / simulation mode — vehicle movement is simulated, not live GPS hardware.
              </span>
              <Badge tone={statusTone(shipment.status)}>{shipment.status}</Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
              <LogisticsMap
                origin={shipment.origin}
                destination={shipment.destination}
                vehicleLocation={shipment.currentLocation}
                routeCoordinates={shipment.routeGeometry?.coordinates || []}
                height="420px"
              />
              <Card title="Shipment summary">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-steel-500">Tracking</dt>
                    <dd className="font-medium">{shipment.trackingNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-steel-500">Lane</dt>
                    <dd className="font-medium">
                      {shipment.origin.city} → {shipment.destination.city}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-steel-500">Mode</dt>
                    <dd className="font-medium">{shipment.transportationMode || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-steel-500">Route duration</dt>
                    <dd className="font-medium">{formatNumber(shipment.routeDurationHours)} h</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-steel-500">Predicted ETA</dt>
                    <dd className="font-medium">{formatNumber(shipment.predictedEtaHours)} h</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-steel-500">Est. delivery</dt>
                    <dd className="font-medium">{formatDate(shipment.estimatedDeliveryTime)}</dd>
                  </div>
                </dl>
              </Card>
            </div>

            <Card title="Timeline">
              <ol className="space-y-3">
                {(data.timeline || []).map((ev) => (
                  <li key={ev._id} className="rounded-xl border border-steel-100 px-3 py-3">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">{ev.eventType}</p>
                      <p className="text-xs text-steel-500">{formatDate(ev.createdAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-steel-500">{ev.description}</p>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
