import { Link } from 'react-router-dom';
import Badge, { statusTone } from './Badge';
import { formatDate } from '../utils/helpers';

export default function ShipmentCard({ shipment }) {
  return (
    <Link
      to={`/app/shipments/${shipment._id}`}
      className="block rounded-2xl border border-steel-200 bg-white p-4 transition hover:border-signal hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-steel-500">{shipment.trackingNumber}</p>
          <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">
            {shipment.origin?.city} → {shipment.destination?.city}
          </h3>
        </div>
        <Badge tone={statusTone(shipment.status)}>{shipment.status}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-steel-500">
        <div>Mode: {shipment.transportationMode || '—'}</div>
        <div>Weight: {shipment.weightKg} kg</div>
        <div>ETA: {formatDate(shipment.estimatedDeliveryTime)}</div>
        <div>Urgency: {shipment.urgency}</div>
      </div>
    </Link>
  );
}
