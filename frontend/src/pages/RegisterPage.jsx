import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/helpers';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'dispatcher',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-steel-200 bg-white p-6 shadow-soft"
      >
        <p className="font-display text-2xl font-bold">Rapid Route</p>
        <h1 className="mt-2 text-lg font-semibold">Create an account</h1>
        {['name', 'email', 'phone', 'password'].map((field) => (
          <label key={field} className="mt-3 block text-sm font-medium capitalize">
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
        <label className="mt-3 block text-sm font-medium">
          Role
          <select
            className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="dispatcher">Dispatcher</option>
            <option value="driver">Driver</option>
          </select>
        </label>
        <Button type="submit" className="mt-5 w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>
        <p className="mt-4 text-center text-sm text-steel-500">
          Already registered? <Link className="text-signal" to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
