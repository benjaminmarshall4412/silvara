import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { setOrderPacked } from "@/lib/admin-orders";
import { SILVARA_ADMIN_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";
import { isSiteRegion } from "@/lib/site-region";

export async function PATCH(request: Request) {
  const store = await cookies();
  if (!verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const packed = o.packed === true;

  if (!sessionId || !region) {
    return NextResponse.json(
      { error: "sessionId and region required" },
      { status: 400 },
    );
  }

  try {
    const result = await setOrderPacked({ sessionId, region, packed });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update packed status";
    console.error("[admin-orders-packed]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
