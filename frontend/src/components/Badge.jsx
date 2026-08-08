export default function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-steel-100 text-ink-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-sky-100 text-sky-800',
    teal: 'bg-signal-muted text-signal',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function statusTone(status) {
  const map = {
    Pending: 'neutral',
    Assigned: 'info',
    'In Transit': 'teal',
    Delivered: 'success',
    Delayed: 'warning',
    Cancelled: 'danger',
    Available: 'success',
    Maintenance: 'warning',
    Offline: 'danger',
    'On Delivery': 'teal',
    'Off Duty': 'neutral',
    'On Leave': 'warning',
  };
  return map[status] || 'neutral';
}
