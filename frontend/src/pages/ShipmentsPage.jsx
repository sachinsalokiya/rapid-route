import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Button';
import Table from '../components/Table';
import Badge, { statusTone } from '../components/Badge';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { CITIES, cityToLocation, formatDate, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  originCity: 'Bhopal',
  destinationCity: 'Delhi',
  packageType: 'Electronics',
  weightKg: 12,
  urgency: 'High',
  notes: '',
};

export default function ShipmentsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['admin', 'dispatcher'].includes(user?.role);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/shipments', {
        params: { page, limit: 10, q: q || undefined, status: status || undefined },
      });
      setItems(data.data.items);
      setTotal(data.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  async function createShipment(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const origin = cityToLocation(form.originCity);
      const destination = cityToLocation(form.destinationCity);
      const { data } = await api.post('/shipments', {
        origin,
        destination,
        packageType: form.packageType,
        weightKg: Number(form.weightKg),
        urgency: form.urgency,
        notes: form.notes,
      });
      toast.success('Shipment created');
      setOpen(false);
      setForm(emptyForm);
      navigate(`/app/shipments/${data.data.shipment._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeShipment(id) {
    if (!window.confirm('Delete this shipment?')) return;
    try {
      await api.delete(`/shipments/${id}`);
      toast.success('Shipment deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    { key: 'trackingNumber', label: 'Tracking' },
    {
      key: 'lane',
      label: 'Lane',
      render: (row) => `${row.origin?.city} → ${row.destination?.city}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={statusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'transportationMode', label: 'Mode' },
    { key: 'weightKg', label: 'Weight (kg)' },
    {
      key: 'eta',
      label: 'ETA',
      render: (row) => formatDate(row.estimatedDeliveryTime),
    },
    {
      key: 'actions',
      label: '',
      render: (row) =>
        user?.role === 'admin' ? (
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              removeShipment(row._id);
            }}
          >
            Delete
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Shipments</h2>
          <p className="text-sm text-steel-500">{total} total records</p>
        </div>
        {canEdit ? <Button onClick={() => setOpen(true)}>New shipment</Button> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="rounded-lg border border-steel-300 px-3 py-2 text-sm"
          placeholder="Search tracking / city"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border border-steel-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {['Pending', 'Assigned', 'In Transit', 'Delivered', 'Delayed', 'Cancelled'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={() => { setPage(1); load(); }}>
          Search
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No shipments found"
          description="Create a shipment to start routing and tracking."
          actionLabel={canEdit ? 'Create shipment' : undefined}
          onAction={canEdit ? () => setOpen(true) : undefined}
        />
      ) : (
        <>
          <Table columns={columns} rows={items} onRowClick={(row) => navigate(`/app/shipments/${row._id}`)} />
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-steel-500">Page {page}</span>
            <Button
              variant="outline"
              disabled={page * 10 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create shipment"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="create-shipment" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="create-shipment" className="space-y-3" onSubmit={createShipment}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Origin
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.originCity}
                onChange={(e) => setForm({ ...form, originCity: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c.city}>{c.city}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Destination
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.destinationCity}
                onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c.city}>{c.city}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              Package
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.packageType}
                onChange={(e) => setForm({ ...form, packageType: e.target.value })}
              >
                {['Documents', 'Electronics', 'Apparel', 'Food', 'Fragile', 'Industrial', 'Pharmaceutical', 'Other'].map(
                  (p) => (
                    <option key={p}>{p}</option>
                  )
                )}
              </select>
            </label>
            <label className="text-sm">
              Weight (kg)
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                required
              />
            </label>
            <label className="text-sm">
              Urgency
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                {['Low', 'Medium', 'High', 'Critical'].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-sm">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
        </form>
      </Modal>
    </div>
  );
}
