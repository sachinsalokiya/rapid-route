import { useState } from 'react';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import LogisticsMap from '../components/Map';
import { CITIES, cityToLocation, formatNumber, getErrorMessage } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function OptimizePage() {
  const [form, setForm] = useState({
    originCity: 'Bhopal',
    destinationCity: 'Mumbai',
    stopCity: '',
    shipmentWeightKg: 120,
    urgency: 'High',
    packageType: 'Electronics',
    preferredMode: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const origin = cityToLocation(form.originCity);
      const destination = cityToLocation(form.destinationCity);
      const waypoints = form.stopCity ? [cityToLocation(form.stopCity)] : [];
      const { data } = await api.post('/routes/optimize', {
        origin,
        destination,
        waypoints,
        shipmentWeightKg: Number(form.shipmentWeightKg),
        urgency: form.urgency,
        packageType: form.packageType,
        preferredMode: form.preferredMode || undefined,
      });
      setResult(data.data);
      toast.success('Optimization complete');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">Route optimization</h2>
        <p className="text-sm text-steel-500">
          OSRM calculates the path. A scoring layer recommends mode/vehicle using weight, urgency, and
          capacity — not a full VRP solver.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card title="Inputs">
          <form className="space-y-3" onSubmit={onSubmit}>
            {['originCity', 'destinationCity'].map((field) => (
              <label key={field} className="block text-sm capitalize">
                {field.replace('City', '')}
                <select
                  className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                >
                  {CITIES.map((c) => (
                    <option key={c.city}>{c.city}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="block text-sm">
              Intermediate stop (optional)
              <select
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.stopCity}
                onChange={(e) => setForm({ ...form, stopCity: e.target.value })}
              >
                <option value="">None</option>
                {CITIES.map((c) => (
                  <option key={c.city}>{c.city}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Weight (kg)
              <input
                type="number"
                min="0.1"
                className="mt-1 w-full rounded-lg border border-steel-300 px-3 py-2"
                value={form.shipmentWeightKg}
                onChange={(e) => setForm({ ...form, shipmentWeightKg: e.target.value })}
              />
            </label>
            <label className="block text-sm">
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
            <label className="block text-sm">
              Package type
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Optimizing...' : 'Optimize route'}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <LogisticsMap
            origin={cityToLocation(form.originCity)}
            destination={cityToLocation(form.destinationCity)}
            routeCoordinates={result?.recommendedRoute?.geometry?.coordinates || []}
            height="420px"
          />
          {result ? (
            <Card title="Recommendation">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-steel-500">Distance</dt>
                  <dd className="font-medium">{formatNumber(result.totalDistanceKm)} km</dd>
                </div>
                <div>
                  <dt className="text-steel-500">OSRM duration</dt>
                  <dd className="font-medium">{formatNumber(result.estimatedDurationHours)} h</dd>
                </div>
                <div>
                  <dt className="text-steel-500">Predicted logistics ETA</dt>
                  <dd className="font-medium">{formatNumber(result.predictedLogisticsEtaHours)} h</dd>
                </div>
                <div>
                  <dt className="text-steel-500">Transport mode</dt>
                  <dd className="font-medium">{result.transportationRecommendation}</dd>
                </div>
                <div>
                  <dt className="text-steel-500">Vehicle type</dt>
                  <dd className="font-medium">{result.vehicleRecommendation?.preferredType}</dd>
                </div>
                <div>
                  <dt className="text-steel-500">Capacity fit</dt>
                  <dd className="font-medium">{result.vehicleRecommendation?.capacityFit}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-steel-500">{result.explanation}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
