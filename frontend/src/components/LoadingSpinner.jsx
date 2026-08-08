export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-steel-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-steel-200 border-t-signal" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
