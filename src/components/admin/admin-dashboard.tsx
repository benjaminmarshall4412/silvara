"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button, buttonVariants } from "@/components/ui/button";
import type { HogQLRow } from "@/lib/posthog-analytics-types";
import { cn } from "@/lib/utils";

type AnalyticsPayload = {
  posthogProjectId: string;
  posthogAppHost?: string;
  pageviewsByDay: HogQLRow[];
  conversionByDay: HogQLRow[];
  topEvents: HogQLRow[];
  warnings?: string[];
};

const PALETTE = [
  "#c2410c",
  "#1e3a5f",
  "#92400e",
  "#0f766e",
  "#6b21a8",
  "#b45309",
  "#115e59",
  "#9f1239",
];

function formatDayLabel(day: string): string {
  try {
    const d = new Date(`${day}T12:00:00Z`);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return day;
  }
}

function topEventsByVolume(rows: HogQLRow[], limit: number): string[] {
  const sums = new Map<string, number>();
  for (const r of rows) {
    const e = String(r.event ?? "");
    sums.set(e, (sums.get(e) ?? 0) + Number(r.c ?? 0));
  }
  return [...sums.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([e]) => e);
}

function buildMultiSeries(
  rows: HogQLRow[],
  eventNames: string[],
): { dayLabel: string; [key: string]: string | number }[] {
  const daySet = new Set<string>();
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const day = String(r.day ?? "");
    const event = String(r.event ?? "");
    const c = Number(r.c ?? 0);
    daySet.add(day);
    if (!map.has(day)) map.set(day, new Map());
    map.get(day)!.set(event, c);
  }
  const days = [...daySet].sort();
  return days.map((day) => {
    const row: { dayLabel: string; [key: string]: string | number } = {
      dayLabel: formatDayLabel(day),
    };
    for (const ev of eventNames) {
      row[ev] = map.get(day)?.get(ev) ?? 0;
    }
    return row;
  });
}

export function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });
      const json = (await res.json()) as AnalyticsPayload & {
        error?: string;
        message?: string;
        messages?: string[];
      };
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Refresh and sign in again.");
          return;
        }
        setError(
          json.message ??
            json.messages?.join(" · ") ??
            json.error ??
            `Request failed (${res.status})`,
        );
        return;
      }
      setData(json);
    } catch {
      setError("Network error loading analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pageviewSeries = useMemo(() => {
    if (!data?.pageviewsByDay?.length) return [];
    return data.pageviewsByDay.map((r) => ({
      dayLabel: formatDayLabel(String(r.day ?? "")),
      pageviews: Number(r.c ?? 0),
    }));
  }, [data?.pageviewsByDay]);

  const topEventNames = useMemo(
    () => topEventsByVolume(data?.conversionByDay ?? [], 7),
    [data?.conversionByDay],
  );

  const conversionSeries = useMemo(
    () => buildMultiSeries(data?.conversionByDay ?? [], topEventNames),
    [data?.conversionByDay, topEventNames],
  );

  const topBarData = useMemo(() => {
    const rows = data?.topEvents ?? [];
    return rows.slice(0, 14).map((r) => ({
      event: String(r.event ?? ""),
      count: Number(r.c ?? 0),
    }));
  }, [data?.topEvents]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.refresh();
  };

  const phUrl = data?.posthogProjectId
    ? `${data.posthogAppHost ?? "https://us.posthog.com"}/project/${data.posthogProjectId}`
    : (data?.posthogAppHost ?? "https://us.posthog.com");

  return (
    <div className="min-h-screen bg-muted px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-4 border-foreground bg-background p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono-label text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              SILVARA · internal
            </p>
            <h1 className="font-heading mt-1 text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
              PostHog overview
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-snug text-muted-foreground">
              Live charts from your PostHog project via the Query API. For full funnels, cohorts, and
              replay, use the PostHog app.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={phUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-none border-2 border-foreground no-underline",
              )}
            >
              Open PostHog
            </a>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none border-2"
              onClick={() => void load()}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none uppercase"
              onClick={() => void logout()}
            >
              Sign out
            </Button>
          </div>
        </header>

        {error ? (
          <div
            className="border-4 border-destructive bg-background p-5 font-mono text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {data?.warnings?.length ? (
          <div className="border-4 border-foreground bg-background p-4 text-sm text-muted-foreground">
            <p className="font-mono-label text-xs font-bold uppercase tracking-wide text-foreground">
              Partial data
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {loading && !data ? (
          <p className="font-mono-label text-sm uppercase tracking-wide text-muted-foreground">
            Loading PostHog…
          </p>
        ) : null}

        {!loading && data && !pageviewSeries.length && !topBarData.length ? (
          <p className="border-4 border-foreground bg-background p-6 text-muted-foreground">
            No events in the selected windows yet. Send traffic or widen the date range in PostHog.
          </p>
        ) : null}

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            Pageviews · last 14 days
          </h2>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {pageviewSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pageviewSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      border: "2px solid #292524",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageviews"
                    name="Pageviews"
                    stroke={PALETTE[0]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: PALETTE[0] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No $pageview data in range.</p>
            )}
          </div>
        </section>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            Storefront events · last 14 days (top 7 by volume)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selected SILVARA events only; add more names in{" "}
            <code className="font-mono text-xs">api/admin/analytics/route.ts</code> if needed.
          </p>
          <div className="mt-4 h-[320px] w-full min-w-0">
            {conversionSeries.length && topEventNames.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      border: "2px solid #292524",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {topEventNames.map((ev, i) => (
                    <Line
                      key={ev}
                      type="monotone"
                      dataKey={ev}
                      name={ev}
                      stroke={PALETTE[i % PALETTE.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No conversion-series data in range.</p>
            )}
          </div>
        </section>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            Top events · last 7 days
          </h2>
          <div className="mt-4 h-[min(480px,60vh)] w-full min-w-0">
            {topBarData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={topBarData}
                  margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="event"
                    width={148}
                    tick={{ fontSize: 10 }}
                    stroke="#57534e"
                  />
                  <Tooltip
                    contentStyle={{
                      border: "2px solid #292524",
                      borderRadius: 0,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" name="Count" fill={PALETTE[0]} radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No event volume in range.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
