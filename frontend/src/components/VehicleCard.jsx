import { Link } from 'react-router-dom';
import Badge, { statusTone } from './Badge';

export default function VehicleCard({ vehicle }) {
  const util =
    vehicle.capacityKg > 0
      ? Math.round(((vehicle.currentLoadKg || 0) / vehicle.capacityKg) * 100)
      : 0;

  return (
    <Link
      to={`/app/vehicles/${vehicle._id}`}
      className="block rounded-2xl border border-steel-200 bg-white p-4 transition hover:border-signal hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-steel-500">{vehicle.vehicleId}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">
            {vehicle.registrationNumber}
          </h3>
        </div>
        <Badge tone={statusTone(vehicle.status)}>{vehicle.status}</Badge>
      </div>
      <div className="mt-3 text-sm text-steel-500">
        {vehicle.vehicleType} · {vehicle.currentLoadKg || 0}/{vehicle.capacityKg} kg ({util}%)
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-steel-100">
        <div className="h-full bg-signal" style={{ width: `${Math.min(util, 100)}%` }} />
      </div>
    </Link>
  );
}
