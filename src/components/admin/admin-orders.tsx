"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import type { AdminOrder, AdminOrderAddress } from "@/lib/admin-orders-types";
import { formatMoney } from "@/lib/products";
import { cn } from "@/lib/utils";

type OrdersPayload = {
  orders: AdminOrder[];
  shippingLabelsConfigured?: boolean;
  warnings?: string[];
  error?: string;
};

function formatWhen(unixSec: number): string {
  try {
    return new Date(unixSec * 1000).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(unixSec);
  }
}

function formatAddress(addr: AdminOrderAddress | null | undefined): string[] {
  if (!addr) return [];
  const lines: string[] = [];
  if (addr.line1) lines.push(addr.line1);
  if (addr.line2) lines.push(addr.line2);
  const cityLine = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (addr.country) lines.push(addr.country);
  return lines;
}

export function AdminOrders() {
  const router = useRouter();
  const [data, setData] = useState<OrdersPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [labelBusyId, setLabelBusyId] = useState<string | null>(null);
  const [labelMsg, setLabelMsg] = useState<string | null>(null);

  const labelsReady = data?.shippingLabelsConfigured === true;

  const load = useCallback(async () => {
    setLoading(true);
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
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.refresh();
  };

  const printUspsLabel = async (order: AdminOrder) => {
    if (!labelsReady) return;
    setLabelBusyId(order.id);
    setLabelMsg(null);
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
        setLabelMsg(json.message ?? json.error ?? "Label failed");
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
      const bits = [
        "4×6 label downloaded",
        json.service ?? null,
        json.trackingNumber ? `Tracking ${json.trackingNumber}` : null,
        json.postage != null ? `Postage $${json.postage.toFixed(2)}` : null,
      ].filter(Boolean);
      setLabelMsg(bits.join(" · "));
    } catch {
      setLabelMsg("Network error creating label.");
    } finally {
      setLabelBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-4 border-foreground bg-background p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono-label text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              SILVARA · internal
            </p>
            <h1 className="font-heading mt-1 text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
              Orders
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-snug text-muted-foreground">
              Paid Checkout sessions from Stripe (US + UK). USPS 4×6 via EasyPost
              unlocks when your account is approved and env is set.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-none border-2 border-foreground no-underline",
              )}
            >
              Analytics
            </Link>
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

        {!loading && data && !labelsReady ? (
          <div className="border-4 border-dashed border-foreground/40 bg-background p-4 text-sm text-muted-foreground">
            <p className="font-mono-label text-xs font-bold uppercase tracking-wide text-foreground/70">
              EasyPost labels — waiting
            </p>
            <p className="mt-2">
              Print USPS 4×6 stays disabled until EasyPost approves you and you set{" "}
              <span className="font-mono text-xs">EASYPOST_API_KEY</span> + from-address
              env vars.
            </p>
          </div>
        ) : null}

        {labelMsg ? (
          <div className="border-4 border-foreground bg-background p-4 text-sm" role="status">
            {labelMsg}
          </div>
        ) : null}

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
            Loading orders from Stripe…
          </p>
        ) : null}

        {!loading && data && data.orders.length === 0 ? (
          <p className="border-4 border-foreground bg-background p-6 text-muted-foreground">
            No paid checkout sessions found yet.
          </p>
        ) : null}

        {data?.orders.map((order) => {
          const currency = order.currency ?? "usd";
          const shipLines = formatAddress(order.shippingAddress);
          const billLines = formatAddress(order.billingAddress);
          const addressLines = shipLines.length ? shipLines : billLines;
          const addressKind = shipLines.length ? "Shipping" : billLines.length ? "Billing" : null;

          return (
            <article
              key={`${order.region}-${order.id}`}
              className="border-4 border-foreground bg-background p-5 md:p-6"
            >
              <div className="flex flex-col gap-3 border-b-2 border-foreground pb-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono-label text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {order.region.toUpperCase()} · {order.mode} · {order.paymentStatus}
                  </p>
                  <h2 className="font-heading mt-1 text-xl font-extrabold uppercase tracking-tight">
                    {order.customerName?.trim() || "Unnamed customer"}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{order.id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatWhen(order.createdAt)}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-heading text-2xl font-extrabold tracking-tight">
                    {order.amountTotal != null
                      ? formatMoney(order.amountTotal, currency)
                      : "—"}
                  </p>
                  {order.amountDiscount != null && order.amountDiscount > 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Discount −{formatMoney(order.amountDiscount, currency)}
                    </p>
                  ) : null}
                  {order.amountShipping != null && order.amountShipping > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Shipping {formatMoney(order.amountShipping, currency)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-6 md:grid-cols-2">
                <section>
                  <h3 className="font-mono-label text-xs font-bold uppercase tracking-wide">
                    Customer
                  </h3>
                  <dl className="mt-2 space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{order.customerName?.trim() || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium break-all">
                        {order.customerEmail ? (
                          <a
                            href={`mailto:${order.customerEmail}`}
                            className="underline underline-offset-2"
                          >
                            {order.customerEmail}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="font-medium">
                        {order.customerPhone ? (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="underline underline-offset-2"
                          >
                            {order.customerPhone}
                          </a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section>
                  <h3 className="font-mono-label text-xs font-bold uppercase tracking-wide">
                    {addressKind ? `${addressKind} address` : "Address"}
                  </h3>
                  {order.shippingName && shipLines.length ? (
                    <p className="mt-2 text-sm font-medium">{order.shippingName}</p>
                  ) : null}
                  {addressLines.length ? (
                    <address className="mt-2 not-italic text-sm leading-relaxed">
                      {addressLines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </address>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No address on session.</p>
                  )}
                  {order.region === "us" && addressLines.length ? (
                    <div className="mt-4">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                          "rounded-none border-2 uppercase",
                          labelsReady
                            ? "border-foreground"
                            : "cursor-not-allowed border-foreground/30 text-muted-foreground opacity-50",
                        )}
                        disabled={!labelsReady || labelBusyId === order.id}
                        onClick={() => void printUspsLabel(order)}
                        title={
                          labelsReady
                            ? "Buy cheapest USPS rate via EasyPost (4×6 PDF)"
                            : "EasyPost not configured yet — waiting on account approval"
                        }
                      >
                        {labelBusyId === order.id
                          ? "Creating label…"
                          : "Print USPS 4×6"}
                      </Button>
                    </div>
                  ) : null}
                </section>
              </div>

              <section className="mt-6">
                <h3 className="font-mono-label text-xs font-bold uppercase tracking-wide">
                  Items
                </h3>
                {order.lines.length > 0 ? (
                  <ul className="mt-3 divide-y-2 divide-foreground border-2 border-foreground">
                    {order.lines.map((line, idx) => (
                      <li
                        key={`${line.bundleId}-${line.sockColor}-${idx}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-heading font-bold uppercase tracking-tight">
                            {line.name}
                          </p>
                          <p className="text-muted-foreground">
                            {line.sockColorLabel} ·{" "}
                            {line.sockSize === "OS" ? "One size" : line.sockSize}
                          </p>
                        </div>
                        <p className="font-mono text-xs uppercase tracking-wide">
                          Qty {line.quantity}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : order.stripeLineItems.length > 0 ? (
                  <ul className="mt-3 divide-y-2 divide-foreground border-2 border-foreground">
                    {order.stripeLineItems.map((li, idx) => (
                      <li
                        key={`${li.description}-${idx}`}
                        className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-3 text-sm"
                      >
                        <p className="font-medium">{li.description ?? "Line item"}</p>
                        <div className="text-right">
                          <p className="font-mono text-xs uppercase tracking-wide">
                            Qty {li.quantity ?? "—"}
                          </p>
                          {li.amountTotal != null ? (
                            <p className="font-medium">
                              {formatMoney(li.amountTotal, currency)}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No cart metadata on this session.
                  </p>
                )}
              </section>
            </article>
          );
        })}
      </div>
    </div>
  );
}
