import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Button from '../components/Button';

const features = [
  {
    title: 'Shipment control',
    body: 'Create, assign, and monitor multi-city shipments with searchable operational records.',
  },
  {
    title: 'Vehicle & capacity',
    body: 'Track fleet availability, load utilization, and driver assignments in one console.',
  },
  {
    title: 'OSRM routing',
    body: 'Backend-proxied OpenStreetMap routing with distance, duration, and map polylines.',
  },
  {
    title: 'ML mode & ETA',
    body: 'XGBoost models recommend transport mode and logistics ETA on top of route duration.',
  },
];

const steps = [
  'Book a shipment with origin, destination, weight, and urgency.',
  'Assign a vehicle and driver within capacity constraints.',
  'Calculate the road route via OSRM and enrich ETA with ML.',
  'Monitor simulated live movement and delivery timeline.',
];

export default function LandingPage() {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return undefined;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-ink-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="font-display text-2xl font-bold tracking-tight">Rapid Route</div>
        <div className="flex items-center gap-2">
          <Link to="/track" className="hidden text-sm text-ink-800 hover:text-signal sm:inline">
            Track shipment
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      <section
        ref={heroRef}
        className="relative overflow-hidden border-y border-steel-200"
        style={{
          backgroundImage:
            'radial-gradient(900px circle at var(--mx, 70%) var(--my, 30%), rgba(20,184,166,0.18), transparent 45%), linear-gradient(180deg, #0B1220 0%, #122033 55%, #0B1220 100%)',
        }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div className="animate-[fadeUp_700ms_ease]">
            <p className="font-display text-4xl font-bold leading-none tracking-tight text-white md:text-6xl">
              Rapid Route
            </p>
            <h1 className="mt-5 max-w-xl text-balance text-2xl font-medium text-white/90 md:text-3xl">
              Intelligent multi-modal logistics for Indian delivery operations.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/65 md:text-base">
              Plan shipments, assign fleet capacity, calculate OSRM routes, and estimate logistics ETA
              with a production-style operations console.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg">Open dashboard</Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                  Track a package
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-6 rounded-[2rem] border border-white/10 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-90 shadow-soft" />
            <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold">The logistics problem</h2>
            <p className="mt-3 text-steel-500">
              Dispatch teams juggle capacity, urgency, distance, and mode selection across cities —
              often in spreadsheets and chat threads.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">The Rapid Route approach</h2>
            <p className="mt-3 text-steel-500">
              One console for shipments, fleet, routing, ML-assisted ETA, and tracking — with clear
              separation between road duration and logistics prediction.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-steel-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-semibold">Features</h2>
          <p className="mt-2 max-w-2xl text-steel-500">
            Built as an interview-ready logistics product: working APIs, maps, auth, and ML — not
            placeholder UI.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-steel-200 p-5">
                <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-steel-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">How it works</h2>
        <ol className="mt-6 space-y-4">
          {steps.map((step, idx) => (
            <li key={step} className="flex gap-4 rounded-2xl border border-steel-200 bg-white p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">
                {idx + 1}
              </span>
              <p className="pt-1 text-sm text-ink-800">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-steel-200 bg-ink-950 py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-display text-3xl font-semibold">Technology & AI</h2>
          <p className="mt-3 max-w-3xl text-white/65">
            React + Express + MongoDB. OSRM for road geometry. A Python XGBoost service predicts
            transport mode and logistics ETA from synthetic demo data — metrics are measured, not
            fabricated.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['React / Tailwind / Leaflet', 'Node / JWT / MongoDB', 'OSRM + XGBoost ML API'].map((t) => (
              <div key={t} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/80">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-semibold">Dashboard preview</h2>
        <p className="mt-2 text-steel-500">KPIs, fleet utilization, and delivery performance in one view.</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-steel-200 bg-[linear-gradient(135deg,#0B1220,#134E4A)] p-6 text-white shadow-soft">
          <div className="grid gap-3 sm:grid-cols-4">
            {['Shipments', 'Active fleet', 'Avg ETA', 'On-time %'].map((label) => (
              <div key={label} className="rounded-xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
                <p className="mt-2 font-display text-2xl font-semibold">Live in app</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8">
          <Link to="/login">
            <Button size="lg">Launch Rapid Route</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-steel-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-steel-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-base font-semibold text-ink-900">Rapid Route</p>
          <p>Demo logistics platform · Simulated tracking · Synthetic ML dataset</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
