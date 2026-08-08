import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import VehicleCard from '../components/VehicleCard';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { CITIES, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const empty = {
  registrationNumber: '',
  vehicleType: 'Van',
  capacityKg: 800,
  fuelType: 'Diesel',
  city: 'Bhopal',
};

export default function VehiclesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['admin', 'dispatcher'].includes(user?.role);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/vehicles', { params: { limit: 50 } });
      setItems(data.data.items);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createVehicle(e) {
    e.preventDefault();
    const city = CITIES.find((c) => c.city === form.city);
    try {
      const { data } = await api.post('/vehicles', {
        registrationNumber: form.registrationNumber,
        vehicleType: form.vehicleType,
        capacityKg: Number(form.capacityKg),
        fuelType: form.fuelType,
        currentLocation: {
          city: city.city,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      });
      toast.success('Vehicle added');
      setOpen(false);
      setForm(empty);
      navigate(`/app/vehicles/${data.data.vehicle._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Vehicles</h2>
          <p className="text-sm text-steel-500">Fleet capacity and assignment status</p>
        </div>
        {canEdit ? <Button onClick={() => setOpen(true)}>Add vehicle</Button> : null}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No vehicles" actionLabel="Add vehicle" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((v) => (
            <VehicleCard key={v._id} vehicle={v} />
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add vehicle"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="create-vehicle" type="submit">
              Save
            </Button>
          </>
        }
      >
        <form id="create-vehicle" className="space-y-3" onSubmit={createVehicle}>
          <label className="block text-sm">
            Registration number
            <input
              className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              >
                {['Bike', 'Van', 'Truck', 'Train', 'Air', 'Other'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Capacity (kg)
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.capacityKg}
                onChange={(e) => setForm({ ...form, capacityKg: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Fuel
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              >
                {['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'Aviation Fuel', 'Other'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Base city
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c.city}>{c.city}</option>
                ))}
              </select>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
