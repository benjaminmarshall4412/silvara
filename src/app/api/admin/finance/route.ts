import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createFinanceEntry,
  deleteFinanceEntry,
  getFinanceSnapshot,
  isFinanceCategory,
  updateFinanceEntry,
} from "@/lib/admin-finance";
import { SILVARA_ADMIN_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";

function requireAdmin() {
  return cookies().then((store) =>
    verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value),
  );
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const snapshot = await getFinanceSnapshot(
    searchParams.get("from"),
    searchParams.get("to"),
  );
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const date = typeof o.date === "string" ? o.date : "";
  const category = o.category;
  const amountCents =
    typeof o.amountCents === "number"
      ? o.amountCents
      : typeof o.amountDollars === "number"
        ? Math.round(o.amountDollars * 100)
        : NaN;
  if (!isFinanceCategory(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  try {
    const entry = await createFinanceEntry({
      date,
      category,
      amountCents,
      currency: typeof o.currency === "string" ? o.currency : "usd",
      note: typeof o.note === "string" ? o.note : null,
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    const entry = await updateFinanceEntry({
      id,
      date: typeof o.date === "string" ? o.date : undefined,
      category: isFinanceCategory(o.category) ? o.category : undefined,
      amountCents:
        typeof o.amountCents === "number"
          ? o.amountCents
          : typeof o.amountDollars === "number"
            ? Math.round(o.amountDollars * 100)
            : undefined,
      currency: typeof o.currency === "string" ? o.currency : undefined,
      note: o.note === null || typeof o.note === "string" ? (o.note as string | null) : undefined,
    });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    await deleteFinanceEntry(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 400 },
    );
  }
}
