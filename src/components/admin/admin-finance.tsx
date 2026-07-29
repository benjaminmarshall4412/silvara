"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  FINANCE_CATEGORIES,
  type FinanceCategory,
  type FinanceEntryRow,
  type RevenueByCurrency,
} from "@/lib/admin-finance-types";
import {
  adminBtn,
  adminBtnGhost,
  adminBtnPrimary,
  adminInput,
  adminLink,
  adminSelect,
} from "@/lib/admin-ui";
import { formatMoney } from "@/lib/products";
import { cn } from "@/lib/utils";

type Snapshot = {
  from: string;
  to: string;
  revenue: RevenueByCurrency[];
  entries: FinanceEntryRow[];
  costsByCategory: Record<string, number>;
  costsTotalCents: number;
  revenueUsdCents: number;
  profitUsdCents: number;
  warnings?: string[];
  error?: string;
};

const CATEGORY_LABEL: Record<FinanceCategory, string> = {
  ads: "Ads",
  shipping: "Shipping",
  socks: "Socks / COGS",
  other: "Other",
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

export function AdminFinance() {
  const router = useRouter();
  const [from, setFrom] = useState(() => daysAgoStr(29));
  const [to, setTo] = useState(() => todayStr());
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const [draftDate, setDraftDate] = useState(() => todayStr());
  const [draftCategory, setDraftCategory] = useState<FinanceCategory>("ads");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const load = useCallback(async (range?: { from: string; to: string }) => {
    const f = range?.from ?? from;
    const t = range?.to ?? to;
    if (hasDataRef.current) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ from: f, to: t });
      const res = await fetch(`/api/admin/finance?${qs}`, {
        credentials: "include",
      });
      const json = (await res.json()) as Snapshot;
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Refresh and sign in again.");
          return;
        }
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }
      setData(json);
      hasDataRef.current = true;
    } catch {
      setError("Network error loading financials.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.refresh();
  };

  const addRow = async () => {
    const dollars = Number(draftAmount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setToast("Enter a positive amount");
      return;
    }
    setSaving(true);
    setToast(null);
    const optimistic: FinanceEntryRow = {
      id: `tmp_${Date.now()}`,
      date: draftDate,
      category: draftCategory,
      amountCents: Math.round(dollars * 100),
      currency: "usd",
      note: draftNote.trim() || null,
    };
    setData((prev) =>
      prev
        ? {
            ...prev,
            entries: [optimistic, ...prev.entries],
            costsByCategory: {
              ...prev.costsByCategory,
              [optimistic.category]:
                (prev.costsByCategory[optimistic.category] ?? 0) +
                optimistic.amountCents,
            },
            costsTotalCents: prev.costsTotalCents + optimistic.amountCents,
            profitUsdCents: prev.profitUsdCents - optimistic.amountCents,
          }
        : prev,
    );
    setDraftAmount("");
    setDraftNote("");
    try {
      const res = await fetch("/api/admin/finance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: draftDate,
          category: draftCategory,
          amountDollars: dollars,
          note: optimistic.note,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setToast(json.error ?? "Could not add row");
        await load();
        return;
      }
      await load();
    } catch {
      setToast("Network error adding row");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const removeRow = async (id: string) => {
    if (!confirm("Delete this cost row?")) return;
    const removed = data?.entries.find((e) => e.id === id);
    setSaving(true);
    if (removed) {
      setData((prev) => {
        if (!prev) return prev;
        const usd = removed.currency === "usd";
        return {
          ...prev,
          entries: prev.entries.filter((e) => e.id !== id),
          costsByCategory: usd
            ? {
                ...prev.costsByCategory,
                [removed.category]: Math.max(
                  0,
                  (prev.costsByCategory[removed.category] ?? 0) -
                    removed.amountCents,
                ),
              }
            : prev.costsByCategory,
          costsTotalCents: usd
            ? Math.max(0, prev.costsTotalCents - removed.amountCents)
            : prev.costsTotalCents,
          profitUsdCents: usd
            ? prev.profitUsdCents + removed.amountCents
            : prev.profitUsdCents,
        };
      });
    }
    try {
      const res = await fetch(
        `/api/admin/finance?id=${encodeURIComponent(id)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setToast(json.error ?? "Delete failed");
        await load();
        return;
      }
    } catch {
      setToast("Network error deleting row");
      await load();
    } finally {
      setSaving(false);
    }
  };

  const nonUsdRevenue = useMemo(
    () => (data?.revenue ?? []).filter((r) => r.currency !== "usd"),
    [data?.revenue],
  );

  const usdOrderCount =
    data?.revenue.find((r) => r.currency === "usd")?.orderCount ?? 0;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              SILVARA admin
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Financials</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Revenue from Stripe. Costs you enter like a spreadsheet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/orders" className={adminLink}>
              Orders
            </Link>
            <Link href="/admin" className={adminLink}>
              Analytics
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || refreshing}
              className={adminBtn}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" onClick={() => void logout()} className={adminBtnGhost}>
              Sign out
            </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3">
          <label className="cursor-pointer text-sm">
            <span className="mb-1 block text-xs text-zinc-500">From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={cn(adminInput, "cursor-pointer")}
            />
          </label>
          <label className="cursor-pointer text-sm">
            <span className="mb-1 block text-xs text-zinc-500">To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={cn(adminInput, "cursor-pointer")}
            />
          </label>
          <button
            type="button"
            onClick={() => void load({ from, to })}
            className={adminBtnPrimary}
          >
            Apply
          </button>
        </div>

        {toast ? (
          <div className="mb-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm">
            {toast}
          </div>
        ) : null}
        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {data?.warnings?.length ? (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {data.warnings.join(" · ")}
          </div>
        ) : null}

        {loading && !data ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : null}

        {data ? (
          <div
            className={cn(
              "transition-opacity",
              refreshing && "opacity-70",
            )}
          >
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard
                label="Revenue (USD)"
                value={formatMoney(data.revenueUsdCents, "usd")}
                sub={`${usdOrderCount} orders`}
              />
              <SummaryCard
                label="Ads"
                value={formatMoney(data.costsByCategory.ads ?? 0, "usd")}
              />
              <SummaryCard
                label="Shipping"
                value={formatMoney(data.costsByCategory.shipping ?? 0, "usd")}
              />
              <SummaryCard
                label="Socks / COGS"
                value={formatMoney(data.costsByCategory.socks ?? 0, "usd")}
              />
              <SummaryCard
                label="Profit (USD)"
                value={formatMoney(data.profitUsdCents, "usd")}
                emphasize={data.profitUsdCents >= 0 ? "good" : "bad"}
                sub={`Rev − costs (${formatMoney(data.costsTotalCents, "usd")})`}
              />
            </div>

            {nonUsdRevenue.length > 0 ? (
              <p className="mb-4 text-xs text-zinc-500">
                Also in range:{" "}
                {nonUsdRevenue
                  .map(
                    (r) =>
                      `${formatMoney(r.amountCents, r.currency)} (${r.orderCount} ${r.currency.toUpperCase()} orders)`,
                  )
                  .join(" · ")}
                . Profit rollup uses USD revenue and USD cost rows only.
              </p>
            ) : null}

            <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-3 py-2">
                <h2 className="text-sm font-semibold">Cost spreadsheet</h2>
                <p className="text-xs text-zinc-500">
                  Add ad spend, shipping labels, sock inventory, etc.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2 md:grid-cols-[8rem_9rem_7rem_minmax(0,1fr)_5rem] md:items-end">
                <label className="cursor-pointer text-xs">
                  <span className="mb-1 block text-zinc-500">Date</span>
                  <input
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className={cn(adminInput, "cursor-pointer")}
                  />
                </label>
                <label className="cursor-pointer text-xs">
                  <span className="mb-1 block text-zinc-500">Category</span>
                  <select
                    value={draftCategory}
                    onChange={(e) =>
                      setDraftCategory(e.target.value as FinanceCategory)
                    }
                    className={adminSelect}
                  >
                    {FINANCE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-zinc-500">Amount ($)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={draftAmount}
                    onChange={(e) => setDraftAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void addRow();
                    }}
                    className={adminInput}
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-zinc-500">Note</span>
                  <input
                    type="text"
                    placeholder="Meta Jul 28, USPS label…"
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void addRow();
                    }}
                    className={adminInput}
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void addRow()}
                  className={adminBtnPrimary}
                >
                  Add
                </button>
              </div>

              <div className="hidden grid-cols-[7rem_8rem_6rem_minmax(0,1fr)_3rem] gap-2 border-b border-zinc-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 md:grid">
                <span>Date</span>
                <span>Category</span>
                <span className="text-right">Amount</span>
                <span>Note</span>
                <span />
              </div>

              {data.entries.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-zinc-500">
                  No cost rows in this range yet. Add ads, shipping, or sock costs above.
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {data.entries.map((row) => (
                    <li
                      key={row.id}
                      className="grid grid-cols-1 gap-1 px-3 py-2.5 text-sm md:grid-cols-[7rem_8rem_6rem_minmax(0,1fr)_3rem] md:items-center md:gap-2"
                    >
                      <span className="tabular-nums text-zinc-700">{row.date}</span>
                      <span>
                        {CATEGORY_LABEL[row.category] ?? row.category}
                        {row.currency !== "usd" ? (
                          <span className="ml-1 text-xs text-zinc-400">
                            {row.currency.toUpperCase()}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-medium tabular-nums md:text-right">
                        {formatMoney(row.amountCents, row.currency)}
                      </span>
                      <span className="truncate text-zinc-600">
                        {row.note || "—"}
                      </span>
                      <button
                        type="button"
                        disabled={saving || row.id.startsWith("tmp_")}
                        onClick={() => void removeRow(row.id)}
                        className="cursor-pointer justify-self-start text-xs text-red-600 transition-colors hover:text-red-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40 md:justify-self-end"
                      >
                        Del
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  emphasize,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasize?: "good" | "bad";
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          emphasize === "good" && "text-emerald-700",
          emphasize === "bad" && "text-red-700",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  );
}
