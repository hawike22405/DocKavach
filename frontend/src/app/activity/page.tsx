"use client";

import { useEffect, useState } from "react";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getActivityLogs, hasToken, type ActivityLog } from "@/lib/api";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Logged in",
  LOGIN_FAILED: "Failed login attempt",
  REGISTER: "New officer registered",
  SCREENING: "Ran a screening",
  DECISION: "Recorded a decision",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "text-success",
  LOGIN_FAILED: "text-danger",
  REGISTER: "text-cyan-300",
  SCREENING: "text-slate-200",
  DECISION: "text-amber-300",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const loadLogs = async (action?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!hasToken()) throw new Error("Please sign in before viewing activity.");
      const data = await getActivityLogs({ page: 1, limit: 100, action: action || undefined });
      setLogs(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  const applyFilter = (action: string) => {
    setFilter(action);
    void loadLogs(action);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Activity</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live feed of every login, registration, screening, and decision across all officers.
          </p>
        </div>
        <Button variant="ghost" onClick={() => loadLogs(filter)} disabled={loading}>Refresh</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["", "LOGIN", "LOGIN_FAILED", "REGISTER", "SCREENING", "DECISION"].map((a) => (
          <button
            key={a || "ALL"}
            onClick={() => applyFilter(a)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === a
                ? "border-cyan-400 text-cyan-300"
                : "border-border text-slate-400 hover:border-slate-500"
            }`}
          >
            {a ? ACTION_LABELS[a] : "All"}
          </button>
        ))}
      </div>

      {error && <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      <Card>
        <CardHeading title="Recent activity" description={loading ? "Loading…" : `${logs.length} event${logs.length === 1 ? "" : "s"} shown`} />
        {loading ? (
          <p className="text-sm text-slate-500">Loading activity…</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Event</th>
                  <th className="px-3 py-3">Officer</th>
                  <th className="px-3 py-3">Details</th>
                  <th className="px-3 py-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className={`px-3 py-3 font-medium ${ACTION_COLORS[log.action] ?? "text-slate-300"}`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="px-3 py-3 text-slate-300">{log.name ?? log.email ?? "—"}</td>
                    <td className="px-3 py-3 text-slate-400 font-mono text-xs">
                      {log.transactionId ? `${log.transactionId} · ${log.recommendation ?? ""}` : log.decision ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-500 font-mono text-xs">{log.ip ?? "—"}</td>
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
