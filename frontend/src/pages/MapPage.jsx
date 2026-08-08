import { useEffect, useState } from 'react';
import api from '../services/api';
import LogisticsMap from '../components/Map';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatNumber, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

export default function MapPage() {
  const [shipments, setShipments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/shipments', {
          params: { limit: 50, status: undefined },
        });
        const items = data.data.items || [];
        setShipments(items);
        if (items[0]) setSelected(items[0]);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  useEffect(() => {
    async function fetchRoute() {
      if (!selected?.origin || !selected?.destination) return;
      try {
        const { data } = await api.get('/routes', {
          params: {
            origin: `${selected.origin.longitude},${selected.origin.latitude}`,
            destination: `${selected.destination.longitude},${selected.destination.latitude}`,
          },
        });
        setRouteInfo(data.data);
      } catch (err) {
        setRouteInfo(null);
        toast.error(getErrorMessage(err, 'Could not fetch route'));
      }
    }
    fetchRoute();
  }, [selected, toast]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Logistics map</h2>
        <p className="text-sm text-steel-500">
          Select a shipment to request OSRM routing through the backend (`lng,lat`).
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <Card title="Shipments">
          <div className="max-h-[480px] space-y-2 overflow-y-auto">
            {shipments.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => setSelected(s)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  selected?._id === s._id
                    ? 'border-signal bg-signal-muted'
                    : 'border-steel-200 hover:bg-steel-50'
                }`}
              >
                <div className="font-medium">
                  {s.origin?.city} → {s.destination?.city}
                </div>
                <div className="text-xs text-steel-500">{s.trackingNumber}</div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <LogisticsMap
            origin={selected?.origin}
            destination={selected?.destination}
            vehicleLocation={selected?.currentLocation}
            routeCoordinates={
              routeInfo?.geometry?.coordinates || selected?.routeGeometry?.coordinates || []
            }
            height="520px"
          />
          {selected ? (
            <Card title="Route status">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span>Distance: {formatNumber(routeInfo?.distanceKm ?? selected.routeDistanceKm)} km</span>
                <span>
                  Duration: {formatNumber(routeInfo?.durationHours ?? selected.routeDurationHours)} h
                </span>
                <span>Status: {selected.status}</span>
                <Link to={`/app/shipments/${selected._id}`}>
                  <Button size="sm" variant="outline">
                    Open shipment
                  </Button>
                </Link>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
