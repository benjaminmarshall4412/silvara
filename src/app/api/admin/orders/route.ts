import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { listAdminOrders } from "@/lib/admin-orders";
import { SILVARA_ADMIN_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";
import { isShippingLabelConfigured } from "@/lib/easypost/label";

export async function GET() {
  const store = await cookies();
  if (!verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orders, warnings } = await listAdminOrders(50);
  return NextResponse.json({
    orders,
    shippingLabelsConfigured: isShippingLabelConfigured(),
    warnings: warnings.length ? warnings : undefined,
  });
}
