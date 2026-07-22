import "server-only";

import { createHash } from "crypto";

import type { MetaCustomData, MetaStandardEvent } from "@/lib/meta/types";

export type { MetaCustomData, MetaStandardEvent } from "@/lib/meta/types";

const GRAPH_VERSION = "v21.0";

export type MetaUserDataInput = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  /** Do not hash */
  clientIpAddress?: string | null;
  /** Do not hash */
  clientUserAgent?: string | null;
  /** Do not hash */
  fbp?: string | null;
  /** Do not hash */
  fbc?: string | null;
  externalId?: string | null;
};

export type MetaCapiEventInput = {
  eventName: MetaStandardEvent;
  eventId: string;
  eventSourceUrl?: string;
  eventTime?: number;
  userData?: MetaUserDataInput;
  customData?: MetaCustomData;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeAndHash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return sha256(normalized);
}

/** Phone: digits only, then hash (E.164-ish without forcing country code). */
function normalizePhoneAndHash(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  return sha256(digits);
}

function buildUserData(input: MetaUserDataInput = {}) {
  const userData: Record<string, string | string[]> = {};

  const em = normalizeAndHash(input.email);
  if (em) userData.em = [em];

  const ph = normalizePhoneAndHash(input.phone);
  if (ph) userData.ph = [ph];

  const fn = normalizeAndHash(input.firstName);
  if (fn) userData.fn = [fn];

  const ln = normalizeAndHash(input.lastName);
  if (ln) userData.ln = [ln];

  const ct = normalizeAndHash(input.city);
  if (ct) userData.ct = [ct];

  const st = normalizeAndHash(input.state);
  if (st) userData.st = [st];

  const zp = normalizeAndHash(input.zip?.replace(/\s+/g, ""));
  if (zp) userData.zp = [zp];

  const country = normalizeAndHash(input.country);
  if (country) userData.country = [country];

  const externalId = normalizeAndHash(input.externalId);
  if (externalId) userData.external_id = [externalId];

  if (input.clientIpAddress?.trim()) {
    userData.client_ip_address = input.clientIpAddress.trim();
  }
  if (input.clientUserAgent?.trim()) {
    userData.client_user_agent = input.clientUserAgent.trim();
  }
  if (input.fbp?.trim()) {
    userData.fbp = input.fbp.trim();
  }
  if (input.fbc?.trim()) {
    userData.fbc = input.fbc.trim();
  }

  return userData;
}

export function getMetaPixelId(): string | null {
  const id = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return id || null;
}

export function getMetaCapiAccessToken(): string | null {
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  return token || null;
}

export function isMetaCapiConfigured(): boolean {
  return Boolean(getMetaPixelId() && getMetaCapiAccessToken());
}

/**
 * Send one or more website events to Meta Conversions API.
 * No-ops (resolves false) when Pixel ID or access token is missing.
 */
export async function sendMetaCapiEvents(
  events: MetaCapiEventInput[],
): Promise<{ ok: boolean; eventsReceived?: number; error?: string }> {
  const pixelId = getMetaPixelId();
  const accessToken = getMetaCapiAccessToken();
  if (!pixelId || !accessToken || events.length === 0) {
    return { ok: false, error: "Meta CAPI not configured" };
  }

  const now = Math.floor(Date.now() / 1000);
  const data = events.map((event) => {
    const payload: Record<string, unknown> = {
      event_name: event.eventName,
      event_time: event.eventTime ?? now,
      event_id: event.eventId,
      action_source: "website",
      user_data: buildUserData(event.userData),
    };
    if (event.eventSourceUrl) {
      payload.event_source_url = event.eventSourceUrl;
    }
    if (event.customData && Object.keys(event.customData).length > 0) {
      payload.custom_data = event.customData;
    }
    return payload;
  });

  const body: Record<string, unknown> = { data };
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (testCode) {
    body.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string };
    };
    if (!res.ok) {
      const message = json.error?.message ?? `Meta CAPI HTTP ${res.status}`;
      console.error("[meta-capi]", message);
      return { ok: false, error: message };
    }
    return { ok: true, eventsReceived: json.events_received };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta CAPI request failed";
    console.error("[meta-capi]", message);
    return { ok: false, error: message };
  }
}
