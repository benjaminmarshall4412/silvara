import { Resend } from "resend";

import type { SilvaraResendEventName } from "@/lib/resend-automation-events";

let resendForEvents: Resend | null = null;

function getResendForEvents(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendForEvents) resendForEvents = new Resend(key);
  return resendForEvents;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fires a Resend Automation custom event. Never throws; logs only.
 * Requires `email` (or Resend contactId later) — Resend needs a contact to run a journey.
 */
export async function sendResendAutomationEvent(input: {
  event: SilvaraResendEventName;
  email: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  const resend = getResendForEvents();
  if (!resend) return;

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    console.warn("[sendResendAutomationEvent] invalid email, skip", input.event);
    return;
  }

  try {
    const { error } = await resend.events.send({
      event: input.event,
      email,
      payload: input.payload ?? {},
    });
    if (error) {
      console.error("[sendResendAutomationEvent]", input.event, error);
    }
  } catch (err) {
    console.error("[sendResendAutomationEvent]", input.event, err);
  }
}
