import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminOrder } from "@/lib/admin-orders";
import { SILVARA_ADMIN_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";
import {
  createUsps4x6Label,
  isShippingLabelConfigured,
} from "@/lib/easypost/label";
import { isSiteRegion } from "@/lib/site-region";

export async function POST(request: Request) {
  const store = await cookies();
  if (!verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isShippingLabelConfigured()) {
    return NextResponse.json(
      {
        error: "easypost_not_configured",
        message:
          "Set EASYPOST_API_KEY and EASYPOST_FROM_STREET/CITY/STATE/ZIP when EasyPost approves your account.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const sessionId = typeof o.sessionId === "string" ? o.sessionId.trim() : "";
  const region = isSiteRegion(o.region) ? o.region : null;
  if (!sessionId || !region) {
    return NextResponse.json(
      { error: "sessionId and region required" },
      { status: 400 },
    );
  }
  if (region !== "us") {
    return NextResponse.json(
      { error: "USPS domestic labels are US-only" },
      { status: 400 },
    );
  }

  const order = await getAdminOrder(sessionId, region);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const label = await createUsps4x6Label(order);
    return NextResponse.json({
      trackingNumber: label.trackingNumber,
      postage: label.postage,
      service: label.service,
      carrier: label.carrier,
      pdfBase64: label.pdfBase64,
      labelUrl: label.labelUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create label";
    console.error("[easypost-label]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
