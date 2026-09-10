"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      // Force a full window hard-navigation to bypass Next.js router race conditions
      // and ensure localStorage token is picked up cleanly on initial hydration.
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-8">
      <Card className="w-full">
        <CardHeading title="Officer sign in" description="Use your DocKavach officer account." />
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-slate-300">Email</span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" />
          </label>
          <label className="block">
            <span className="text-sm text-slate-300">Password</span>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400" />
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          No officer account? <Link href="/register" className="text-cyan-300 hover:text-cyan-200">Create one</Link>
        </p>
      </Card>
    </div>
  );
}