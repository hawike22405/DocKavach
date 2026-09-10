"use client";

import { useEffect, useState } from "react";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getHistory, hasToken, type HistoryRecord } from "@/lib/api";

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!hasToken()) throw new Error("Please sign in before viewing screening history.");
      const data = await getHistory({ page: 1, limit: 50 });
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">History</h1>
          <p className="mt-2 text-sm text-slate-400">Audit trail of completed document screenings.</p>
        </div>
        <Button variant="ghost" onClick={loadHistory} disabled={loading}>Refresh</Button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      <Card>
        <CardHeading title="Screenings" description={loading ? "Loading…" : `${records.length} record${records.length === 1 ? "" : "s"} loaded`} />
        {loading ? (
          <p className="text-sm text-slate-500">Loading screening history…</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-500">No screenings have been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Transaction</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Document</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Recommendation</th>
                  <th className="px-3 py-3">Decision</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.transactionId} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-3 font-mono text-xs text-slate-300">{record.transactionId}</td>
                    <td className="px-3 py-3 text-slate-400">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-3 text-slate-400">{record.documentType}</td>
                    <td className="px-3 py-3 font-mono text-slate-200">{record.overallRiskScore}</td>
                    <td className="px-3 py-3 text-slate-300">{record.recommendation}</td>
                    <td className="px-3 py-3 text-slate-400">{record.officerDecision ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
