"use client";

// Shown in the dashboard when a page fails to load (for example, the database is briefly unreachable).
export default function DashboardError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="card flex max-w-xl flex-col items-start gap-4">
      <h1 className="page-title">Something went wrong</h1>
      <p className="m-0 text-[15px] leading-relaxed text-ink-muted">This page couldn&rsquo;t load. Try again; if it keeps happening, sign out and back in.</p>
      <button type="button" onClick={() => retry()} className="btn btn-solid border-none">
        Try again
      </button>
    </div>
  );
}
