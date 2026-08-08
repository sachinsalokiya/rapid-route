import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Badge, { statusTone } from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import LogisticsMap from '../components/Map';
import { getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [activeShipments, setActiveShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = ['admin', 'dispatcher'].includes(user?.role);

  async function load() {
    setLoading(true);
    try {
      const [{ data }, driversRes] = await Promise.all([
        api.get(`/vehicles/${id}`),
        api.get('/drivers', { params: { limit: 50 } }).catch(() => ({ data: { data: { items: [] } } })),
      ]);
      setVehicle(data.data.vehicle);
      setActiveShipments(data.data.activeShipments || []);
      setDrivers(driversRes.data.data.items || []);
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

  async function assignDriver() {
    try {
      await api.post(`/vehicles/${id}/assign-driver`, { driverId });
      toast.success('Driver assigned');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function setMaintenance() {
    try {
      await api.patch(`/vehicles/${id}`, { status: 'Maintenance' });
      toast.info('Vehicle marked for maintenance');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!vehicle) return null;

  const util = vehicle.capacityKg
    ? Math.round(((vehicle.currentLoadKg || 0) / vehicle.capacityKg) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/app/vehicles" className="text-sm text-signal">
          ← Vehicles
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-semibold">{vehicle.registrationNumber}</h2>
          <Badge tone={statusTone(vehicle.status)}>{vehicle.status}</Badge>
        </div>
        <p className="text-sm text-steel-500">
          {vehicle.vehicleId} · {vehicle.vehicleType} · {vehicle.fuelType}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Capacity">
          <p className="text-sm text-steel-500">
            {vehicle.currentLoadKg || 0} / {vehicle.capacityKg} kg ({util}%)
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-steel-100">
            <div className="h-full bg-signal" style={{ width: `${Math.min(util, 100)}%` }} />
          </div>
          <p className="mt-3 text-sm">Driver: {vehicle.driver?.name || 'Unassigned'}</p>
          {canEdit ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <select
                className="rounded-lg border border-steel-300 px-3 py-2 text-sm"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <Button disabled={!driverId} onClick={assignDriver}>
                Assign driver
              </Button>
              <Button variant="outline" onClick={setMaintenance}>
                Mark maintenance
              </Button>
            </div>
          ) : null}
        </Card>
        <LogisticsMap
          vehicleLocation={vehicle.currentLocation}
          height="280px"
        />
      </div>

      <Card title="Active shipments">
        {activeShipments.length === 0 ? (
          <p className="text-sm text-steel-500">No active shipments on this vehicle.</p>
        ) : (
          <ul className="space-y-2">
            {activeShipments.map((s) => (
              <li key={s._id}>
                <Link className="text-signal" to={`/app/shipments/${s._id}`}>
                  {s.trackingNumber} · {s.origin?.city} → {s.destination?.city} · {s.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
