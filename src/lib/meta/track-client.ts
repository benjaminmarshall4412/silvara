"use client";

import {
  createMetaEventId,
  getMetaFbc,
  getMetaFbp,
} from "@/lib/meta/browser";
import type { MetaCustomData, MetaStandardEvent } from "@/lib/meta/types";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

type TrackArgs = {
  eventName: MetaStandardEvent;
  /** Stable id for Pixel + CAPI dedupe. Generated if omitted. */
  eventId?: string;
  customData?: MetaCustomData;
  email?: string | null;
};

/**
 * Fire Meta Pixel (browser) + Conversions API (server) with the same event_id.
 */
export async function trackMetaEvent({
  eventName,
  eventId: eventIdArg,
  customData,
  email,
}: TrackArgs): Promise<string> {
  const eventId = eventIdArg ?? createMetaEventId();
  const eventSourceUrl =
    typeof window !== "undefined" ? window.location.href : undefined;

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    const pixelPayload: Record<string, unknown> = {};
    if (customData?.value != null) pixelPayload.value = customData.value;
    if (customData?.currency) pixelPayload.currency = customData.currency;
    if (customData?.content_ids) pixelPayload.content_ids = customData.content_ids;
    if (customData?.content_type) pixelPayload.content_type = customData.content_type;
    if (customData?.content_name) pixelPayload.content_name = customData.content_name;
    if (customData?.num_items != null) pixelPayload.num_items = customData.num_items;
    if (customData?.order_id) pixelPayload.order_id = customData.order_id;

    window.fbq("track", eventName, pixelPayload, { eventID: eventId });
  }

  try {
    await fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl,
        customData,
        email: email ?? undefined,
        fbp: getMetaFbp() ?? undefined,
        fbc: getMetaFbc() ?? undefined,
      }),
      keepalive: true,
    });
  } catch {
    // Non-blocking — ads still work if CAPI is down
  }

  return eventId;
}
