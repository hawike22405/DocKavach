"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getSettings, hasToken, updateSettings, type Settings } from "@/lib/api";

const DEFAULT_SETTINGS: Settings = {
  stationName: "",
  checkpointId: "",
  autoFlagThreshold: 60,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!hasToken()) throw new Error("Please sign in before opening settings.");
        setSettings(await getSettings());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateSettings(settings);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-100">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Station configuration and screening preferences.</p>
      </div>

      {loading ? (
        <Card><p className="text-sm text-slate-500">Loading settings…</p></Card>
      ) : (
        <Card>
          <CardHeading title="Checkpoint configuration" description="These values are stored per officer account." />
          <form onSubmit={save} className="space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">Station name</span>
              <input value={settings.stationName} onChange={(e) => setSettings({ ...settings, stationName: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Checkpoint ID</span>
              <input value={settings.checkpointId} onChange={(e) => setSettings({ ...settings, checkpointId: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            <label className="block">
              <span className="text-sm text-slate-300">Auto-flag threshold</span>
              <input type="number" min={0} max={100} value={settings.autoFlagThreshold} onChange={(e) => setSettings({ ...settings, autoFlagThreshold: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" />
            </label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
