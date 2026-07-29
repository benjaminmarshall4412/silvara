"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import type { AdminOrder, AdminOrderAddress } from "@/lib/admin-orders-types";
import {
  adminBtn,
  adminBtnGhost,
  adminCheck,
  adminChip,
  adminChipOff,
  adminChipOn,
  adminLink,
  adminRowBtn,
} from "@/lib/admin-ui";
import { formatMoney } from "@/lib/products";
import { cn } from "@/lib/utils";

type OrdersPayload = {
  orders: AdminOrder[];
  shippingLabelsConfigured?: boolean;
  warnings?: string[];
  error?: string;
};

type Filter = "unpacked" | "packed" | "all";

function formatWhen(unixSec: number): string {
  try {
    return new Date(unixSec * 1000).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(unixSec);
  }
}

function formatAddressOneLine(addr: AdminOrderAddress | null | undefined): string {
  if (!addr) return "—";
  return [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function itemsSummary(order: AdminOrder): string {
  if (order.lines.length > 0) {
    return order.lines
      .map((l) => `${l.quantity}× ${l.name} · ${l.sockColorLabel}`)
      .join("; ");
  }
  if (order.stripeLineItems.length > 0) {
    return order.stripeLineItems
      .map((l) => `${l.quantity ?? "?"}× ${l.description ?? "item"}`)
      .join("; ");
  }
  return "—";
}

export function AdminOrders() {
  const router = useRouter();
  const [data, setData] = useState<OrdersPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("unpacked");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [labelBusyId, setLabelBusyId] = useState<string | null>(null);
  const [packedBusyId, setPackedBusyId] = useState<string | null>(null);
  const [confirmHideId, setConfirmHideId] = useState<string | null>(null);
  const [hideBusyId, setHideBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, startFilterTransition] = useTransition();

  const labelsReady = data?.shippingLabelsConfigured === true;

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = Boolean(opts?.soft);
    if (soft) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      const json = (await res.json()) as OrdersPayload;
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Refresh and sign in again.");
          return;
        }
        setError(json.error ?? `Request failed (${res.status})`);
        return;
      }
      setData(json);
    } catch {
      setError("Network error loading orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.refresh();
  };

  const filtered = useMemo(() => {
    const orders = data?.orders ?? [];
    if (filter === "packed") return orders.filter((o) => o.packedAt);
    if (filter === "unpacked") return orders.filter((o) => !o.packedAt);
    return orders;
  }, [data?.orders, filter]);

  const counts = useMemo(() => {
    const orders = data?.orders ?? [];
    let packed = 0;
    for (const o of orders) if (o.packedAt) packed += 1;
    return {
      all: orders.length,
      packed,
      unpacked: orders.length - packed,
    };
  }, [data?.orders]);

  const setPacked = async (order: AdminOrder, packed: boolean) => {
    const prevPackedAt = order.packedAt;
    // Optimistic UI — feels instant
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === order.id
            ? { ...o, packedAt: packed ? new Date().toISOString() : null }
            : o,
        ),
      };
    });
    setPackedBusyId(order.id);
    setToast(null);
    try {
      const res = await fetch("/api/admin/orders/packed", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: order.id,
          region: order.region,
          packed,
        }),
      });
      const json = (await res.json()) as {
        packedAt?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            orders: prev.orders.map((o) =>
              o.id === order.id ? { ...o, packedAt: prevPackedAt } : o,
            ),
          };
        });
        setToast(json.error ?? "Could not update packed status");
        return;
      }
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === order.id ? { ...o, packedAt: json.packedAt ?? null } : o,
          ),
        };
      });
    } catch {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orders: prev.orders.map((o) =>
            o.id === order.id ? { ...o, packedAt: prevPackedAt } : o,
          ),
        };
      });
      setToast("Network error updating packed status");
    } finally {
      setPackedBusyId(null);
    }
  };

  const printUspsLabel = async (order: AdminOrder) => {
    if (!labelsReady) return;
    setLabelBusyId(order.id);
    setToast(null);
    try {
      const res = await fetch("/api/admin/orders/label", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: order.id, region: order.region }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        pdfBase64?: string;
        trackingNumber?: string | null;
        postage?: number | null;
        service?: string | null;
      };
      if (!res.ok || !json.pdfBase64) {
        setToast(json.message ?? json.error ?? "Label failed");
        return;
      }
      const bytes = Uint8Array.from(atob(json.pdfBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `silvara-${order.id.slice(-8)}-4x6.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setToast(
        [
          "Label downloaded",
          json.service,
          json.trackingNumber ? `Track ${json.trackingNumber}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    } catch {
      setToast("Network error creating label");
    } finally {
      setLabelBusyId(null);
    }
  };

  const hideOrder = async (order: AdminOrder) => {
    setConfirmHideId(null);
    setHideBusyId(order.id);
    setToast(null);
    setData((prev) =>
      prev
        ? { ...prev, orders: prev.orders.filter((o) => o.id !== order.id) }
        : prev,
    );
    if (expandedId === order.id) setExpandedId(null);
    try {
      const res = await fetch("/api/admin/orders/hide", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: order.id,
          region: order.region,
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setToast(json.error ?? "Could not remove order");
        await load({ soft: true });
        return;
      }
    } catch {
      setToast("Network error removing order");
      await load({ soft: true });
    } finally {
      setHideBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 antialiased">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              SILVARA admin
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/finance" className={adminLink}>
              Financials
            </Link>
            <Link href="/admin" className={adminLink}>
              Analytics
            </Link>
            <button
              type="button"
              onClick={() => void load({ soft: true })}
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

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(
            [
              ["unpacked", `To pack (${counts.unpacked})`],
              ["packed", `Packed (${counts.packed})`],
              ["all", `All (${counts.all})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => startFilterTransition(() => setFilter(key))}
              className={cn(
                adminChip,
                filter === key ? adminChipOn : adminChipOff,
              )}
            >
              {label}
            </button>
          ))}
          {!labelsReady ? (
            <span className="ml-auto text-xs text-zinc-500">
              EasyPost labels locked until API key is set
            </span>
          ) : null}
        </div>

        {toast ? (
          <div className="mb-3 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
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
          <p className="text-sm text-zinc-500">Loading orders…</p>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {filter === "unpacked"
              ? "Nothing left to pack."
              : filter === "packed"
                ? "No packed orders yet."
                : "No orders found."}
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <div
            className={cn(
              "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-opacity",
              refreshing && "opacity-70",
            )}
          >
            <div className="hidden grid-cols-[2.5rem_7rem_minmax(0,1fr)_minmax(0,1.2fr)_5.5rem_8.5rem] gap-3 border-b border-zinc-100 bg-zinc-50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500 md:grid">
              <span>Pack</span>
              <span>When</span>
              <span>Customer</span>
              <span>Items</span>
              <span className="text-right">Total</span>
              <span className="text-right">Actions</span>
            </div>

            <ul className="divide-y divide-zinc-100">
              {filtered.map((order) => {
                const currency = order.currency ?? "usd";
                const ship = order.shippingAddress ?? order.billingAddress;
                const open = expandedId === order.id;
                const packed = Boolean(order.packedAt);
                const confirmingHide = confirmHideId === order.id;

                return (
                  <li
                    key={`${order.region}-${order.id}`}
                    className={cn(
                      "bg-white transition-colors",
                      packed && "bg-emerald-50/40",
                    )}
                  >
                    <div className="grid grid-cols-1 gap-2 px-3 py-2.5 md:grid-cols-[2.5rem_7rem_minmax(0,1fr)_minmax(0,1.2fr)_5.5rem_8.5rem] md:items-center md:gap-3">
                      <div className="flex items-center gap-2 md:block">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            className={adminCheck}
                            checked={packed}
                            disabled={packedBusyId === order.id}
                            onChange={(e) =>
                              void setPacked(order, e.target.checked)
                            }
                            title={packed ? "Mark unpacked" : "Mark packed"}
                            aria-label={packed ? "Mark unpacked" : "Mark packed"}
                          />
                          <span className="text-xs text-zinc-500 md:hidden">
                            {packed ? "Packed" : "Unpacked"}
                          </span>
                        </label>
                      </div>

                      <div className="text-xs text-zinc-600">
                        <div>{formatWhen(order.createdAt)}</div>
                        <div className="uppercase text-zinc-400">
                          {order.region} · {order.paymentStatus}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <button
                          type="button"
                          className="cursor-pointer truncate text-left text-sm font-medium text-zinc-900 hover:underline"
                          onClick={() =>
                            setExpandedId(open ? null : order.id)
                          }
                        >
                          {order.customerName?.trim() || "Unnamed"}
                        </button>
                        <div className="truncate text-xs text-zinc-500">
                          {order.customerEmail ?? "—"}
                        </div>
                      </div>

                      <div className="min-w-0 text-xs leading-snug text-zinc-700">
                        {itemsSummary(order)}
                      </div>

                      <div className="text-sm font-semibold tabular-nums md:text-right">
                        {order.amountTotal != null
                          ? formatMoney(order.amountTotal, currency)
                          : "—"}
                        {order.amountDiscount != null &&
                        order.amountDiscount > 0 ? (
                          <div className="text-[11px] font-normal text-zinc-400">
                            −{formatMoney(order.amountDiscount, currency)}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                        {confirmingHide ? (
                          <>
                            <span className="text-xs text-zinc-500">Sure?</span>
                            <button
                              type="button"
                              disabled={hideBusyId === order.id}
                              onClick={() => void hideOrder(order)}
                              className="cursor-pointer text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmHideId(null)}
                              className="cursor-pointer text-xs text-zinc-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={adminRowBtn}
                              onClick={() =>
                                setExpandedId(open ? null : order.id)
                              }
                            >
                              {open ? "Hide" : "Details"}
                            </button>
                            {order.region === "us" ? (
                              <button
                                type="button"
                                disabled={!labelsReady || labelBusyId === order.id}
                                title={
                                  labelsReady
                                    ? "Print USPS 4×6 via EasyPost"
                                    : "EasyPost not configured"
                                }
                                onClick={() => void printUspsLabel(order)}
                                className={cn(
                                  adminRowBtn,
                                  !labelsReady && "cursor-not-allowed opacity-40",
                                )}
                              >
                                {labelBusyId === order.id ? "…" : "Label"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={hideBusyId === order.id}
                              title="Remove from this list (keeps Stripe payment)"
                              onClick={() => setConfirmHideId(order.id)}
                              className="cursor-pointer text-xs text-red-600 hover:underline disabled:opacity-40"
                            >
                              Del
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {open ? (
                      <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-3 text-sm">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                              Contact
                            </p>
                            <p className="mt-1 text-zinc-800">
                              {order.customerName ?? "—"}
                            </p>
                            {order.customerEmail ? (
                              <a
                                href={`mailto:${order.customerEmail}`}
                                className="cursor-pointer text-zinc-600 underline-offset-2 hover:underline"
                              >
                                {order.customerEmail}
                              </a>
                            ) : (
                              <p className="text-zinc-600">—</p>
                            )}
                            {order.customerPhone ? (
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="mt-0.5 block cursor-pointer text-zinc-600 underline-offset-2 hover:underline"
                              >
                                {order.customerPhone}
                              </a>
                            ) : (
                              <p className="text-zinc-600">No phone</p>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                              Ship to
                            </p>
                            {order.shippingName ? (
                              <p className="mt-1 text-zinc-800">
                                {order.shippingName}
                              </p>
                            ) : null}
                            <p className="mt-1 text-zinc-600">
                              {formatAddressOneLine(ship)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                              Session
                            </p>
                            <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">
                              {order.id}
                            </p>
                            {order.packedAt ? (
                              <p className="mt-2 text-xs text-emerald-700">
                                Packed{" "}
                                {new Date(order.packedAt).toLocaleString()}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-amber-700">
                                Not packed yet
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
