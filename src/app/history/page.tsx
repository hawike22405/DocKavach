export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-lg font-semibold text-slate-100">History</h1>
      <p className="mt-2 text-sm text-slate-400">
        Audit trail of past screenings will appear here, backed by the immutable log described in
        AppFlow.md. Wire this up to the backend's transaction log endpoint.
      </p>
    </div>
  );
}
