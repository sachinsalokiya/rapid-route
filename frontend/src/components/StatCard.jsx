export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-steel-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-steel-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-steel-500">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-signal-muted p-2 text-signal">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
