import { NextResponse } from "next/server";

import { emailHasPurchased } from "@/lib/email-signup-db";
import { SILVARA_RESEND_EVENTS } from "@/lib/resend-automation-events";
import { sendResendAutomationEvent } from "@/lib/send-resend-automation-event";
import { parseSignupRegion } from "@/lib/signup-pathname";
import { isBundleId } from "@/lib/products";

const TRACK_KINDS = ["product_viewed", "cart_abandoned"] as const;
type TrackKind = (typeof TRACK_KINDS)[number];

function isTrackKind(v: unknown): v is TrackKind {
  return typeof v === "string" && (TRACK_KINDS as readonly string[]).includes(v);
}

/**
 * Client-side marketing signals for Resend Automations (browse / cart abandon).
 * Requires a known shopper email (we use `silvara_marketing_email` from the promo modal).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const kind = o.kind;
  const email = typeof o.email === "string" ? o.email.trim() : "";
  const region = parseSignupRegion(o.region);
  const pathname = typeof o.pathname === "string" ? o.pathname.trim().slice(0, 1024) : "";
  const bundleId = typeof o.bundleId === "string" ? o.bundleId.trim() : "";

  if (!isTrackKind(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (!region) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (await emailHasPurchased(email)) {
    return NextResponse.json({ ok: true, skipped: "already_purchased" });
  }

  if (kind === "product_viewed") {
    if (!bundleId || !isBundleId(bundleId)) {
      return NextResponse.json({ error: "Invalid bundleId" }, { status: 400 });
    }
    await sendResendAutomationEvent({
      event: SILVARA_RESEND_EVENTS.PRODUCT_VIEWED,
      email,
      payload: {
        region,
        pathname: pathname || null,
        bundle_id: bundleId,
      },
    });
    return NextResponse.json({ ok: true });
  }

  await sendResendAutomationEvent({
    event: SILVARA_RESEND_EVENTS.CART_ABANDONED,
    email,
    payload: {
      region,
      pathname: pathname || null,
    },
  });
  return NextResponse.json({ ok: true });
}
