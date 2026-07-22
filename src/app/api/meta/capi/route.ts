import { NextResponse } from "next/server";

import {
  isMetaCapiConfigured,
  sendMetaCapiEvents,
  type MetaCustomData,
  type MetaStandardEvent,
} from "@/lib/meta/capi";

const ALLOWED: MetaStandardEvent[] = [
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
];

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  if (!isMetaCapiConfigured()) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const eventName = o.eventName;
  const eventId = typeof o.eventId === "string" ? o.eventId.trim() : "";
  if (
    typeof eventName !== "string" ||
    !ALLOWED.includes(eventName as MetaStandardEvent) ||
    !eventId
  ) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const customData =
    o.customData && typeof o.customData === "object"
      ? (o.customData as MetaCustomData)
      : undefined;

  const result = await sendMetaCapiEvents([
    {
      eventName: eventName as MetaStandardEvent,
      eventId,
      eventSourceUrl:
        typeof o.eventSourceUrl === "string" ? o.eventSourceUrl : undefined,
      userData: {
        email: typeof o.email === "string" ? o.email : undefined,
        phone: typeof o.phone === "string" ? o.phone : undefined,
        firstName: typeof o.firstName === "string" ? o.firstName : undefined,
        lastName: typeof o.lastName === "string" ? o.lastName : undefined,
        country: typeof o.country === "string" ? o.country : undefined,
        state: typeof o.state === "string" ? o.state : undefined,
        zip: typeof o.zip === "string" ? o.zip : undefined,
        city: typeof o.city === "string" ? o.city : undefined,
        fbp: typeof o.fbp === "string" ? o.fbp : undefined,
        fbc: typeof o.fbc === "string" ? o.fbc : undefined,
        clientIpAddress: clientIp(request),
        clientUserAgent: request.headers.get("user-agent"),
      },
      customData,
    },
  ]);

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
