import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/helpers';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@rapidroute.in');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back');
      const dest = location.state?.from?.pathname || '/app/dashboard';
      navigate(dest);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0B1220_0%,#134E4A_55%,#F4F7FB_55%)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-steel-200 bg-white p-6 shadow-soft"
      >
        <p className="font-display text-2xl font-bold">Rapid Route</p>
        <h1 className="mt-2 text-lg font-semibold text-ink-900">Sign in to operations</h1>
        <p className="mt-1 text-sm text-steel-500">Demo admin is prefilled — change after seed.</p>

        <label className="mt-5 block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mt-3 block text-sm font-medium">
          Password
          <input
            className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <Button type="submit" className="mt-5 w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        <p className="mt-4 text-center text-sm text-steel-500">
          No account? <Link className="text-signal" to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
