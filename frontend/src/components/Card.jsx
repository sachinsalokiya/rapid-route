export default function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-steel-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3> : <div />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
