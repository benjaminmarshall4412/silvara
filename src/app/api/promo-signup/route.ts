import { NextResponse } from "next/server";

import { persistEmailSignup } from "@/lib/persist-email-signup";
import { getPostHogClient } from "@/lib/posthog-server";
import {
  SILVARA_PROMO_COOKIE_NAME,
  mintPromoEligibleToken,
} from "@/lib/promo-cookie";
import { parseSignupRegion, sanitizeSignupPathname } from "@/lib/signup-pathname";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const raw =
    body &&
    typeof body === "object" &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!EMAIL_RE.test(raw)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const bodyObj = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const signupRegion = bodyObj ? parseSignupRegion(bodyObj.region) : null;
  const pathRaw =
    bodyObj && typeof bodyObj.pathname === "string"
      ? bodyObj.pathname
      : bodyObj && typeof bodyObj.path === "string"
        ? bodyObj.path
        : undefined;
  if (signupRegion) {
    const pathname = sanitizeSignupPathname(pathRaw, signupRegion);
    await persistEmailSignup({
      email: raw,
      region: signupRegion,
      pathname,
    });
  }

  const webhook = process.env.PROMO_SIGNUP_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: raw,
          source: "silvara-email-promo",
          ts: new Date().toISOString(),
        }),
      });
    } catch {
      // Optional integration — still acknowledge signup for shopper UX.
    }
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: raw,
    event: "promo_signup_completed",
    properties: { email: raw, source: "silvara-email-promo" },
  });
  posthog.identify({ distinctId: raw, properties: { email: raw } });
  await posthog.shutdown();

  const token = mintPromoEligibleToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SILVARA_PROMO_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
