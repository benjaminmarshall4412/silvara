import "server-only";

import type {
  FinanceCategory,
  FinanceEntryRow,
  RevenueByCurrency,
} from "@/lib/admin-finance-types";
import {
  FINANCE_CATEGORIES,
  isFinanceCategory,
} from "@/lib/admin-finance-types";
import { getPrisma } from "@/lib/prisma";
import { getStripeForRegion } from "@/lib/stripe/server";
import type { SiteRegion } from "@/lib/site-region";

export type { FinanceCategory, FinanceEntryRow, RevenueByCurrency };
export { FINANCE_CATEGORIES, isFinanceCategory };

/**
 * Estimated Stripe standard online card fee per successful charge.
 * US: 2.9% + 30¢ · UK: 1.5% + 20p (Stripe published standard rates).
 * Approximation — Klarna/international may differ.
 */
export function estimateStripeFeeCents(
  amountCents: number,
  currency: string,
): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  const c = currency.toLowerCase();
  if (c === "gbp") {
    return Math.round(amountCents * 0.015) + 20;
  }
  return Math.round(amountCents * 0.029) + 30;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseDay(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(y, mo - 1, day));
  if (
    d.getUTCFullYear() !== y ||
    d.getUTCMonth() !== mo - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return d;
}

/** Default range: last 30 UTC days inclusive through today. */
export function resolveFinanceRange(fromRaw?: string | null, toRaw?: string | null): {
  from: Date;
  to: Date;
  fromStr: string;
  toStr: string;
} {
  const today = startOfUtcDay(new Date());
  const to = toRaw ? parseDay(toRaw) ?? today : today;
  const defaultFrom = new Date(to);
  defaultFrom.setUTCDate(defaultFrom.getUTCDate() - 29);
  const from = fromRaw ? parseDay(fromRaw) ?? defaultFrom : defaultFrom;
  const fromClamped = from <= to ? from : to;
  const toExclusive = new Date(to);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  return {
    from: fromClamped,
    to: toExclusive,
    fromStr: fromClamped.toISOString().slice(0, 10),
    toStr: to.toISOString().slice(0, 10),
  };
}

async function revenueForRegion(
  region: SiteRegion,
  fromUnix: number,
  toUnix: number,
): Promise<RevenueByCurrency[]> {
  const stripe = getStripeForRegion(region);
  const totals = new Map<
    string,
    { amountCents: number; feeCents: number; orderCount: number }
  >();
  let startingAfter: string | undefined;

  // Paginate recent complete sessions; stop once created is before range.
  for (let page = 0; page < 20; page++) {
    const listed = await stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    if (listed.data.length === 0) break;

    for (const s of listed.data) {
      if (s.created >= toUnix) continue;
      if (s.created < fromUnix) {
        return [...totals.entries()].map(([currency, v]) => ({
          currency,
          amountCents: v.amountCents,
          feeCents: v.feeCents,
          orderCount: v.orderCount,
        }));
      }
      if (
        s.payment_status !== "paid" &&
        s.payment_status !== "no_payment_required"
      ) {
        continue;
      }
      const currency = (s.currency ?? "usd").toLowerCase();
      const amount = s.amount_total ?? 0;
      const fee = estimateStripeFeeCents(amount, currency);
      const prev = totals.get(currency) ?? {
        amountCents: 0,
        feeCents: 0,
        orderCount: 0,
      };
      prev.amountCents += amount;
      prev.feeCents += fee;
      prev.orderCount += 1;
      totals.set(currency, prev);
    }

    if (!listed.has_more) break;
    startingAfter = listed.data[listed.data.length - 1]?.id;
    const oldest = listed.data[listed.data.length - 1]?.created ?? 0;
    if (oldest < fromUnix) break;
  }

  return [...totals.entries()].map(([currency, v]) => ({
    currency,
    amountCents: v.amountCents,
    feeCents: v.feeCents,
    orderCount: v.orderCount,
  }));
}

function mergeRevenue(parts: RevenueByCurrency[][]): RevenueByCurrency[] {
  const map = new Map<
    string,
    { amountCents: number; feeCents: number; orderCount: number }
  >();
  for (const list of parts) {
    for (const row of list) {
      const prev = map.get(row.currency) ?? {
        amountCents: 0,
        feeCents: 0,
        orderCount: 0,
      };
      prev.amountCents += row.amountCents;
      prev.feeCents += row.feeCents;
      prev.orderCount += row.orderCount;
      map.set(row.currency, prev);
    }
  }
  return [...map.entries()]
    .map(([currency, v]) => ({
      currency,
      amountCents: v.amountCents,
      feeCents: v.feeCents,
      orderCount: v.orderCount,
    }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

export async function listFinanceEntries(from: Date, toExclusive: Date): Promise<{
  entries: FinanceEntryRow[];
  error?: string;
}> {
  const prisma = getPrisma();
  if (!prisma) return { entries: [], error: "Database not configured" };
  try {
    const rows = await prisma.financeEntry.findMany({
      where: {
        date: { gte: from, lt: toExclusive },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return {
      entries: rows.map((r) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        category: r.category as FinanceCategory,
        amountCents: r.amountCents,
        currency: r.currency,
        note: r.note,
      })),
    };
  } catch (error) {
    console.error("[finance] list entries", error);
    return {
      entries: [],
      error: error instanceof Error ? error.message : "Failed to load entries",
    };
  }
}

export async function createFinanceEntry(input: {
  date: string;
  category: FinanceCategory;
  amountCents: number;
  currency?: string;
  note?: string | null;
}): Promise<FinanceEntryRow> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database not configured");
  const day = parseDay(input.date);
  if (!day) throw new Error("Invalid date (use YYYY-MM-DD)");
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    throw new Error("Amount must be a positive number of cents");
  }
  const row = await prisma.financeEntry.create({
    data: {
      date: day,
      category: input.category,
      amountCents: Math.round(input.amountCents),
      currency: (input.currency ?? "usd").toLowerCase().slice(0, 3),
      note: input.note?.trim().slice(0, 500) || null,
    },
  });
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    category: row.category as FinanceCategory,
    amountCents: row.amountCents,
    currency: row.currency,
    note: row.note,
  };
}

export async function updateFinanceEntry(input: {
  id: string;
  date?: string;
  category?: FinanceCategory;
  amountCents?: number;
  currency?: string;
  note?: string | null;
}): Promise<FinanceEntryRow> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database not configured");
  const data: {
    date?: Date;
    category?: string;
    amountCents?: number;
    currency?: string;
    note?: string | null;
  } = {};
  if (input.date != null) {
    const day = parseDay(input.date);
    if (!day) throw new Error("Invalid date (use YYYY-MM-DD)");
    data.date = day;
  }
  if (input.category != null) data.category = input.category;
  if (input.amountCents != null) {
    if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
      throw new Error("Amount must be a positive number of cents");
    }
    data.amountCents = Math.round(input.amountCents);
  }
  if (input.currency != null) {
    data.currency = input.currency.toLowerCase().slice(0, 3);
  }
  if (input.note !== undefined) {
    data.note = input.note?.trim().slice(0, 500) || null;
  }
  const row = await prisma.financeEntry.update({
    where: { id: input.id },
    data,
  });
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    category: row.category as FinanceCategory,
    amountCents: row.amountCents,
    currency: row.currency,
    note: row.note,
  };
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) throw new Error("Database not configured");
  await prisma.financeEntry.delete({ where: { id } });
}

export async function getFinanceSnapshot(fromRaw?: string | null, toRaw?: string | null) {
  const range = resolveFinanceRange(fromRaw, toRaw);
  const fromUnix = Math.floor(range.from.getTime() / 1000);
  const toUnix = Math.floor(range.to.getTime() / 1000);

  const [usRev, ukRev, entriesResult] = await Promise.all([
    revenueForRegion("us", fromUnix, toUnix).catch((e) => {
      console.error("[finance] US revenue", e);
      return [] as RevenueByCurrency[];
    }),
    revenueForRegion("uk", fromUnix, toUnix).catch((e) => {
      console.error("[finance] UK revenue", e);
      return [] as RevenueByCurrency[];
    }),
    listFinanceEntries(range.from, range.to),
  ]);

  const revenue = mergeRevenue([usRev, ukRev]);
  const warnings: string[] = [];
  if (entriesResult.error) warnings.push(entriesResult.error);

  const costsByCategory: Record<string, number> = {
    ads: 0,
    shipping: 0,
    socks: 0,
    other: 0,
  };
  let costsTotalCents = 0;
  for (const e of entriesResult.entries) {
    // Manual costs assumed USD for P&L rollup; non-USD still listed in the sheet.
    if (e.currency.toLowerCase() !== "usd") continue;
    costsByCategory[e.category] =
      (costsByCategory[e.category] ?? 0) + e.amountCents;
    costsTotalCents += e.amountCents;
  }

  const revenueUsdGross =
    revenue.find((r) => r.currency === "usd")?.amountCents ?? 0;
  const stripeFeesUsdCents =
    revenue.find((r) => r.currency === "usd")?.feeCents ?? 0;
  const revenueUsdNetCents = Math.max(0, revenueUsdGross - stripeFeesUsdCents);
  const profitUsdCents = revenueUsdNetCents - costsTotalCents;

  return {
    from: range.fromStr,
    to: range.toStr,
    revenue,
    entries: entriesResult.entries,
    costsByCategory,
    costsTotalCents,
    revenueUsdCents: revenueUsdGross,
    revenueUsdGrossCents: revenueUsdGross,
    stripeFeesUsdCents,
    revenueUsdNetCents,
    profitUsdCents,
    warnings: warnings.length ? warnings : undefined,
  };
}
