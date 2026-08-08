import { useEffect, useState } from 'react';
import api from '../services/api';
import Table from '../components/Table';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function UsersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'dispatcher',
    phone: '',
  });
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { limit: 50 } });
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

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post('/users', form);
      toast.success('User created');
      setOpen(false);
      setForm({ name: '', email: '', password: '', role: 'dispatcher', phone: '' });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function toggleActive(user) {
    try {
      await api.patch(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success('User updated');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <Badge tone="teal">{row.role}</Badge>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.isActive ? 'success' : 'danger'}>{row.isActive ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => toggleActive(row)}>
          {row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Users</h2>
          <p className="text-sm text-steel-500">Admin-only account management</p>
        </div>
        <Button onClick={() => setOpen(true)}>Create user</Button>
      </div>

      {loading ? <LoadingSpinner /> : <Table columns={columns} rows={items} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create user"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="create-user" type="submit">
              Save
            </Button>
          </>
        }
      >
        <form id="create-user" className="space-y-3" onSubmit={createUser}>
          {['name', 'email', 'phone', 'password'].map((field) => (
            <label key={field} className="block text-sm capitalize">
              {field}
              <input
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                required={field !== 'phone'}
                minLength={field === 'password' ? 6 : undefined}
              />
            </label>
          ))}
          <label className="block text-sm">
            Role
            <select
              className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="driver">Driver</option>
            </select>
          </label>
        </form>
      </Modal>
    </div>
  );
}
