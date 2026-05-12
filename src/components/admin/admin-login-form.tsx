"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Props = {
  configured: boolean;
};

export function AdminLoginForm({ configured }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-16">
      <div className="w-full max-w-md border-4 border-foreground bg-background p-6 md:p-8">
        <p className="font-mono-label text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          SILVARA · internal
        </p>
        <h1 className="font-heading mt-2 text-2xl font-extrabold uppercase tracking-tight">
          Analytics admin
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Sign in with the same value you set as{" "}
          <code className="font-mono text-xs text-foreground">SILVARA_ADMIN_SECRET</code> in your
          environment (12+ characters). PostHog data is fetched server-side; your PostHog personal
          key is never sent to the browser.
        </p>

        {!configured ? (
          <p className="mt-4 border-2 border-destructive bg-destructive/10 p-3 font-mono text-xs text-destructive">
            Server is missing <code>SILVARA_ADMIN_SECRET</code>. Add it to <code>.env</code> and
            restart the app.
          </p>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="font-mono-label text-xs font-bold uppercase tracking-wide text-foreground">
              Admin secret
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-border mt-2 w-full border-2 bg-background px-3 py-2.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="••••••••••••"
              required
              disabled={!configured}
            />
          </label>
          {error ? (
            <p className="font-mono text-xs uppercase tracking-wide text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={loading || !configured}
            className="h-12 w-full rounded-none border-2 border-transparent font-heading text-sm font-extrabold uppercase tracking-wide"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
