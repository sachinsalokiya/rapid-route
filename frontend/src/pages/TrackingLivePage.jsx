import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Badge, { statusTone } from '../components/Badge';
import LogisticsMap from '../components/Map';
import LoadingSpinner from '../components/LoadingSpinner';
import { getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export default function TrackingLivePage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/tracking');
        setItems(data.data.items || []);
        setNote(data.data.note || '');
        if (data.data.items?.[0]) setSelected(data.data.items[0]);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  useEffect(() => {
    const socket = io(SOCKET_URL || window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
    socket.on('tracking:update', (payload) => {
      setItems((prev) =>
        prev.map((item) =>
          item.trackingNumber === payload.trackingNumber
            ? {
                ...item,
                status: payload.status,
                currentLocation: payload.currentLocation,
                estimatedDeliveryTime: payload.estimatedDeliveryTime,
                simulation: { ...(item.simulation || {}), progress: payload.progress },
              }
            : item
        )
      );
      setSelected((prev) =>
        prev && prev.trackingNumber === payload.trackingNumber
          ? {
              ...prev,
              status: payload.status,
              currentLocation: payload.currentLocation,
              estimatedDeliveryTime: payload.estimatedDeliveryTime,
              simulation: { ...(prev.simulation || {}), progress: payload.progress },
            }
          : prev
      );
    });
    return () => socket.disconnect();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Live tracking</h2>
        <p className="text-sm text-steel-500">{note || 'Demo simulation mode'}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Vehicle markers move along OSRM routes using a server-side simulator. This is not real GPS.
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Card title="Active deliveries">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-steel-500">No active deliveries. Start transit on an assigned shipment.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                    selected?._id === item._id
                      ? 'border-signal bg-signal-muted'
                      : 'border-steel-200 hover:bg-steel-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {item.origin?.city} → {item.destination?.city}
                    </span>
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </div>
                  <div className="text-xs text-steel-500">{item.trackingNumber}</div>
                </button>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <LogisticsMap
            origin={selected?.origin}
            destination={selected?.destination}
            vehicleLocation={selected?.currentLocation}
            routeCoordinates={selected?.routeGeometry?.coordinates || []}
            height="480px"
          />
          {selected ? (
            <Card title="Selected shipment">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>{selected.trackingNumber}</span>
                <span>Progress: {Math.round((selected.simulation?.progress || 0) * 100)}%</span>
                <Link className="text-signal" to={`/app/shipments/${selected._id}`}>
                  Open details
                </Link>
                <Link className="text-signal" to={`/track/${selected.trackingNumber}`}>
                  Public track page
                </Link>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
