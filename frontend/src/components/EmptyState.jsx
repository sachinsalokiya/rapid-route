import Button from './Button';

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-steel-300 bg-steel-50 px-6 py-12 text-center">
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-steel-500">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
