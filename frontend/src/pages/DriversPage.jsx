import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge, { statusTone } from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { CITIES, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

const empty = {
  name: '',
  phone: '',
  email: '',
  licenseNumber: '',
  city: 'Bhopal',
};

export default function DriversPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const toast = useToast();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/drivers', { params: { limit: 50 } });
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

  async function createDriver(e) {
    e.preventDefault();
    const city = CITIES.find((c) => c.city === form.city);
    try {
      const { data } = await api.post('/drivers', {
        ...form,
        currentLocation: {
          city: city.city,
          latitude: city.latitude,
          longitude: city.longitude,
        },
      });
      toast.success('Driver added');
      setOpen(false);
      navigate(`/app/drivers/${data.data.driver._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'licenseNumber', label: 'License' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => row.assignedVehicle?.registrationNumber || '—',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Drivers</h2>
          <p className="text-sm text-steel-500">Assignments and delivery history</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add driver</Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No drivers" actionLabel="Add driver" onAction={() => setOpen(true)} />
      ) : (
        <Table columns={columns} rows={items} onRowClick={(row) => navigate(`/app/drivers/${row._id}`)} />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add driver"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="create-driver" type="submit">
              Save
            </Button>
          </>
        }
      >
        <form id="create-driver" className="space-y-3" onSubmit={createDriver}>
          {['name', 'phone', 'email', 'licenseNumber'].map((field) => (
            <label key={field} className="block text-sm capitalize">
              {field.replace(/([A-Z])/g, ' $1')}
              <input
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required
              />
            </label>
          ))}
          <label className="block text-sm">
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
        </form>
      </Modal>
    </div>
  );
}
