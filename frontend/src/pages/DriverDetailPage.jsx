import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import Badge, { statusTone } from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function DriverDetailPage() {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const [{ data }, vehiclesRes] = await Promise.all([
        api.get(`/drivers/${id}`),
        api.get('/vehicles', { params: { limit: 50 } }),
      ]);
      setDriver(data.data.driver);
      setActiveRoute(data.data.activeRoute);
      setVehicles(vehiclesRes.data.data.items || []);
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

  async function assignVehicle() {
    try {
      await api.post(`/drivers/${id}/assign-vehicle`, { vehicleId });
      toast.success('Vehicle assigned');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!driver) return null;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/app/drivers" className="text-sm text-signal">
          ← Drivers
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h2 className="font-display text-2xl font-semibold">{driver.name}</h2>
          <Badge tone={statusTone(driver.status)}>{driver.status}</Badge>
        </div>
        <p className="text-sm text-steel-500">
          {driver.phone} · {driver.email} · {driver.licenseNumber}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Assigned vehicle">
          <p className="text-sm">
            {driver.assignedVehicle
              ? `${driver.assignedVehicle.registrationNumber} (${driver.assignedVehicle.vehicleType})`
              : 'No vehicle assigned'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-steel-300 px-3 py-2 text-sm"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.registrationNumber}
                </option>
              ))}
            </select>
            <Button disabled={!vehicleId} onClick={assignVehicle}>
              Assign vehicle
            </Button>
          </div>
        </Card>
        <Card title="Active route">
          {activeRoute ? (
            <Link className="text-signal" to={`/app/shipments/${activeRoute._id}`}>
              {activeRoute.trackingNumber} · {activeRoute.origin?.city} → {activeRoute.destination?.city}
            </Link>
          ) : (
            <p className="text-sm text-steel-500">No active delivery route</p>
          )}
        </Card>
      </div>

      <Card title="Delivery history">
        {(driver.deliveryHistory || []).length === 0 ? (
          <p className="text-sm text-steel-500">No completed deliveries recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {driver.deliveryHistory.map((h, idx) => (
              <li key={idx}>
                {h.shipment?.trackingNumber || 'Shipment'} · {formatDate(h.completedAt)}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
