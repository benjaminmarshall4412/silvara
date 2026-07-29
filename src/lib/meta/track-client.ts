"use client";

import { createMetaEventId } from "@/lib/meta/browser";
import type { MetaCustomData, MetaStandardEvent } from "@/lib/meta/types";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

type TrackArgs = {
  eventName: MetaStandardEvent;
  /** Optional stable id for the Pixel event. Generated if omitted. */
  eventId?: string;
  customData?: MetaCustomData;
};

async function waitForFbq(timeoutMs = 8000): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (typeof window.fbq === "function") return true;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100));
    if (typeof window.fbq === "function") return true;
  }
  return typeof window.fbq === "function";
}

/** Fire Meta Pixel standard events in the browser. */
export async function trackMetaEvent({
  eventName,
  eventId: eventIdArg,
  customData,
}: TrackArgs): Promise<string> {
  const eventId = eventIdArg ?? createMetaEventId();
  const ready = await waitForFbq();

  if (ready && typeof window.fbq === "function") {
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

  return eventId;
}
