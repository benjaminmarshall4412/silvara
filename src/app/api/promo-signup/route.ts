import { NextResponse } from "next/server";

import {
  markPromoAutomationSent,
  upsertPromoSignup,
} from "@/lib/email-signup-db";
import { getPostHogClient } from "@/lib/posthog-server";
import {
  SILVARA_PROMO_COOKIE_NAME,
  mintPromoEligibleToken,
} from "@/lib/promo-cookie";
import { SILVARA_RESEND_EVENTS } from "@/lib/resend-automation-events";
import { syncPromoSignupToResend } from "@/lib/resend-sync-promo-contact";
import { sendResendAutomationEvent } from "@/lib/send-resend-automation-event";
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

  let shouldSendPromoAutomation = false;
  let isReturningEmail = false;

  if (signupRegion) {
    const pathname = sanitizeSignupPathname(pathRaw, signupRegion);
    const signup = await upsertPromoSignup({
      email: raw,
      region: signupRegion,
      pathname,
    });
    shouldSendPromoAutomation = signup.shouldSendPromoAutomation;
    isReturningEmail = signup.isReturningEmail;
  }

  await syncPromoSignupToResend({ email: raw });

  if (shouldSendPromoAutomation) {
    await sendResendAutomationEvent({
      event: SILVARA_RESEND_EVENTS.PROMO_SIGNUP,
      email: raw,
      payload:
        signupRegion != null
          ? {
              region: signupRegion,
              pathname: sanitizeSignupPathname(pathRaw, signupRegion),
            }
          : {},
    });
    if (signupRegion) {
      await markPromoAutomationSent(raw);
    }
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
    properties: {
      email: raw,
      source: "silvara-email-promo",
      returning_email: isReturningEmail,
      welcome_automation_sent: shouldSendPromoAutomation,
    },
  });
  posthog.identify({ distinctId: raw, properties: { email: raw } });
  await posthog.shutdown();

  const token = mintPromoEligibleToken();
  const res = NextResponse.json({
    ok: true,
    /** False when this email already received the welcome automation once. */
    welcomeAutomationSent: shouldSendPromoAutomation,
    returningEmail: isReturningEmail,
  });
  res.cookies.set(SILVARA_PROMO_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
