"use client";

import Link from "next/link";
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
  visitorsByDay: HogQLRow[];
  conversionByDay: HogQLRow[];
  topEvents: HogQLRow[];
  topPaths: HogQLRow[];
  topBrowsers: HogQLRow[];
  utmSources: HogQLRow[];
  scrollDepthBuckets: HogQLRow[];
  funnelTotalsLast7d: HogQLRow[];
  purchasesByDay: HogQLRow[];
  exceptionsByDay: HogQLRow[];
  timeOnPageByDay: HogQLRow[];
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

const FUNNEL_ORDER = [
  "product_viewed",
  "product_added_to_cart",
  "cart_viewed",
  "checkout_started",
  "checkout_session_created",
  "order_confirmed",
  "order_completed",
] as const;

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

function mergeTraffic(
  pageviews: HogQLRow[],
  visitors: HogQLRow[],
): { dayLabel: string; pageviews: number; visitors: number }[] {
  const map = new Map<string, { dayLabel: string; pageviews: number; visitors: number }>();
  for (const r of pageviews) {
    const day = String(r.day ?? "");
    map.set(day, {
      dayLabel: formatDayLabel(day),
      pageviews: Number(r.c ?? 0),
      visitors: 0,
    });
  }
  for (const r of visitors) {
    const day = String(r.day ?? "");
    const v = Number(r.visitors ?? 0);
    const prev = map.get(day);
    if (prev) prev.visitors = v;
    else map.set(day, { dayLabel: formatDayLabel(day), pageviews: 0, visitors: v });
  }
  return [...map.keys()].sort().map((k) => map.get(k)!);
}

const chartTooltip = {
  contentStyle: {
    border: "2px solid #292524",
    borderRadius: 0,
    fontSize: 12,
  },
};

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

  const trafficSeries = useMemo(
    () => mergeTraffic(data?.pageviewsByDay ?? [], data?.visitorsByDay ?? []),
    [data?.pageviewsByDay, data?.visitorsByDay],
  );

  const topEventNames = useMemo(
    () => topEventsByVolume(data?.conversionByDay ?? [], 10),
    [data?.conversionByDay],
  );

  const conversionSeries = useMemo(
    () => buildMultiSeries(data?.conversionByDay ?? [], topEventNames),
    [data?.conversionByDay, topEventNames],
  );

  const topBarData = useMemo(() => {
    const rows = data?.topEvents ?? [];
    return rows.slice(0, 16).map((r) => ({
      event: String(r.event ?? ""),
      count: Number(r.c ?? 0),
    }));
  }, [data?.topEvents]);

  const pathBarData = useMemo(
    () =>
      (data?.topPaths ?? []).map((r) => ({
        path: String(r.path ?? "").slice(0, 42) + (String(r.path ?? "").length > 42 ? "…" : ""),
        count: Number(r.c ?? 0),
      })),
    [data?.topPaths],
  );

  const browserBarData = useMemo(
    () =>
      (data?.topBrowsers ?? []).map((r) => ({
        browser: String(r.browser ?? ""),
        count: Number(r.c ?? 0),
      })),
    [data?.topBrowsers],
  );

  const utmBarData = useMemo(
    () =>
      (data?.utmSources ?? []).map((r) => ({
        source: String(r.utm_source ?? ""),
        count: Number(r.c ?? 0),
      })),
    [data?.utmSources],
  );

  const scrollBarData = useMemo(
    () =>
      (data?.scrollDepthBuckets ?? []).map((r) => {
        const raw = String(r.depth_percent ?? "");
        const depth = raw === "(unknown)" ? raw : `${raw}%`;
        return { depth, count: Number(r.c ?? 0) };
      }),
    [data?.scrollDepthBuckets],
  );

  const funnelBarData = useMemo(() => {
    const map = new Map(
      (data?.funnelTotalsLast7d ?? []).map((r) => [String(r.event ?? ""), Number(r.c ?? 0)]),
    );
    return FUNNEL_ORDER.map((ev) => ({
      step: ev.replace(/_/g, " "),
      event: ev,
      count: map.get(ev) ?? 0,
    }));
  }, [data?.funnelTotalsLast7d]);

  const purchaseSeries = useMemo(() => {
    return (data?.purchasesByDay ?? []).map((r) => ({
      dayLabel: formatDayLabel(String(r.day ?? "")),
      orders: Number(r.orders ?? 0),
      revenue: Math.round(Number(r.revenue_cents ?? 0)) / 100,
    }));
  }, [data?.purchasesByDay]);

  const purchaseTotals = useMemo(() => {
    const rows = data?.purchasesByDay ?? [];
    let orders = 0;
    let cents = 0;
    for (const r of rows) {
      orders += Number(r.orders ?? 0);
      cents += Number(r.revenue_cents ?? 0);
    }
    return { orders, revenue: Math.round(cents) / 100 };
  }, [data?.purchasesByDay]);

  const exceptionSeries = useMemo(() => {
    return (data?.exceptionsByDay ?? []).map((r) => ({
      dayLabel: formatDayLabel(String(r.day ?? "")),
      exceptions: Number(r.c ?? 0),
    }));
  }, [data?.exceptionsByDay]);

  const timeOnPageSeries = useMemo(() => {
    return (data?.timeOnPageByDay ?? []).map((r) => ({
      dayLabel: formatDayLabel(String(r.day ?? "")),
      sessions: Number(r.sessions ?? 0),
      avgVisibleSec: Number(r.avg_visible_sec ?? 0),
    }));
  }, [data?.timeOnPageByDay]);

  const hasAnyChart =
    trafficSeries.length > 0 ||
    conversionSeries.length > 0 ||
    topBarData.length > 0 ||
    pathBarData.length > 0 ||
    browserBarData.length > 0 ||
    utmBarData.length > 0 ||
    scrollBarData.length > 0 ||
    funnelBarData.some((d) => d.count > 0) ||
    purchaseSeries.length > 0 ||
    exceptionSeries.length > 0 ||
    timeOnPageSeries.length > 0;

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
            <Link
              href="/admin/orders"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-none border-2 border-foreground no-underline",
              )}
            >
              Orders
            </Link>
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

        {!loading && data && !hasAnyChart ? (
          <p className="border-4 border-foreground bg-background p-6 text-muted-foreground">
            No events in the selected windows yet. Send traffic or check PostHog ingestion.
          </p>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="border-4 border-foreground bg-background p-5 md:p-6">
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
              Traffic · last 14 days
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-foreground">Rust</span> = pageviews ·{" "}
              <span className="text-foreground">Navy</span> = unique visitors (distinct_id)
            </p>
            <div className="mt-4 h-[260px] w-full min-w-0">
              {trafficSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                    <Tooltip {...chartTooltip} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="pageviews"
                      name="Pageviews"
                      stroke={PALETTE[0]}
                      strokeWidth={2}
                      dot={{ r: 2, fill: PALETTE[0] }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      name="Unique visitors"
                      stroke={PALETTE[1]}
                      strokeWidth={2}
                      dot={{ r: 2, fill: PALETTE[1] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No traffic data in range.</p>
              )}
            </div>
          </section>

          <section className="border-4 border-foreground bg-background p-5 md:p-6">
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
              Checkout funnel · last 7 days (counts)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ordered steps; same user can appear in multiple steps.
            </p>
            <div className="mt-4 h-[260px] w-full min-w-0">
              {funnelBarData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelBarData} margin={{ top: 8, right: 8, left: 4, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                    <XAxis
                      dataKey="step"
                      tick={{ fontSize: 9 }}
                      stroke="#57534e"
                      interval={0}
                      angle={-28}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="count" name="Events" fill={PALETTE[2]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No funnel events in the last 7 days.</p>
              )}
            </div>
          </section>
        </div>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            SILVARA events · last 14 days (top 10 by volume)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Includes PostHog auto events you care about ($pageview, $pageleave, $exception) plus
            custom captures. Extend the list in{" "}
            <code className="font-mono text-xs">api/admin/analytics/route.ts</code> (
            <code className="font-mono text-xs">SILVARA_TRACKED_EVENTS</code>).
          </p>
          <div className="mt-4 h-[340px] w-full min-w-0">
            {conversionSeries.length && topEventNames.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
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
              <p className="text-sm text-muted-foreground">No series data in range.</p>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="border-4 border-foreground bg-background p-5 md:p-6">
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
              Top paths · last 7 days ($pageview)
            </h2>
            <div className="mt-4 h-[min(360px,50vh)] w-full min-w-0">
              {pathBarData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={pathBarData}
                    margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="path"
                      width={168}
                      tick={{ fontSize: 9 }}
                      stroke="#57534e"
                    />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="count" fill={PALETTE[1]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No path property on pageviews yet.</p>
              )}
            </div>
          </section>

          <section className="border-4 border-foreground bg-background p-5 md:p-6">
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
              Browsers · last 7 days
            </h2>
            <div className="mt-4 h-[min(360px,50vh)] w-full min-w-0">
              {browserBarData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={browserBarData}
                    margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="browser"
                      width={120}
                      tick={{ fontSize: 10 }}
                      stroke="#57534e"
                    />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="count" fill={PALETTE[3]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No browser breakdown.</p>
              )}
            </div>
          </section>
        </div>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            UTM sources · last 14 days ($pageview)
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            “(direct / none)” when <code className="font-mono text-xs">utm_source</code> was not on
            the URL.
          </p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {utmBarData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utmBarData} margin={{ top: 8, right: 8, left: 4, bottom: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                  <XAxis
                    dataKey="source"
                    tick={{ fontSize: 10 }}
                    stroke="#57534e"
                    interval={0}
                    angle={-22}
                    textAnchor="end"
                    height={68}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="count" fill={PALETTE[4]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No UTM-tagged pageviews in range.</p>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="border-4 border-foreground bg-background p-5 md:p-6">
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
              Scroll depth · last 7 days
            </h2>
            <div className="mt-4 h-[220px] w-full min-w-0">
              {scrollBarData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scrollBarData} margin={{ top: 8, right: 8, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                    <XAxis dataKey="depth" tick={{ fontSize: 11 }} stroke="#57534e" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                    <Tooltip {...chartTooltip} />
                    <Bar dataKey="count" fill={PALETTE[0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No scroll_depth events.</p>
              )}
            </div>
          </section>

          <section className="border-4 border-foreground bg-background p-5 md:p-6">
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
              Exceptions · last 14 days
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">PostHog <code className="font-mono text-xs">$exception</code> when error tracking fires.</p>
            <div className="mt-4 h-[220px] w-full min-w-0">
              {exceptionSeries.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exceptionSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                    <Tooltip {...chartTooltip} />
                    <Line
                      type="monotone"
                      dataKey="exceptions"
                      name="Exceptions"
                      stroke={PALETTE[7]}
                      strokeWidth={2}
                      dot={{ r: 2, fill: PALETTE[7] }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No captured exceptions in range.</p>
              )}
            </div>
          </section>
        </div>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            Purchases (server) · last 14 days
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From <code className="font-mono text-xs">order_completed</code> webhook. Revenue uses{" "}
            <code className="font-mono text-xs">amount_total</code> (Stripe minor units, shown as
            major here).
          </p>
          <p className="mt-2 font-mono-label text-xs uppercase tracking-wide text-foreground">
            Last 14d totals: {purchaseTotals.orders} orders · revenue ≈ {purchaseTotals.revenue}{" "}
            (currency mixed if US+UK)
          </p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {purchaseSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={purchaseSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    stroke="#57534e"
                  />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke={PALETTE[0]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: PALETTE[0] }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue (major units)"
                    stroke={PALETTE[5]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: PALETTE[5] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No completed orders in range.</p>
            )}
          </div>
        </section>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            Time on page · last 14 days
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sessions = <code className="font-mono text-xs">time_on_page</code> events; avg = mean{" "}
            <code className="font-mono text-xs">visible_seconds</code>.
          </p>
          <div className="mt-4 h-[280px] w-full min-w-0">
            {timeOnPageSeries.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeOnPageSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4cfc4" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} stroke="#57534e" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#57534e" allowDecimals={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    stroke="#57534e"
                  />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions ended"
                    stroke={PALETTE[2]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: PALETTE[2] }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgVisibleSec"
                    name="Avg visible sec"
                    stroke={PALETTE[6]}
                    strokeWidth={2}
                    dot={{ r: 2, fill: PALETTE[6] }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No time_on_page events in range.</p>
            )}
          </div>
        </section>

        <section className="border-4 border-foreground bg-background p-5 md:p-6">
          <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight">
            Top events · last 7 days (all types)
          </h2>
          <div className="mt-4 h-[min(520px,65vh)] w-full min-w-0">
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
                    width={168}
                    tick={{ fontSize: 9 }}
                    stroke="#57534e"
                  />
                  <Tooltip {...chartTooltip} />
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
