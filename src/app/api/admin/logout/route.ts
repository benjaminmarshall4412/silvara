import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SILVARA_ADMIN_COOKIE } from "@/lib/admin-session";

export async function POST() {
  const store = await cookies();
  store.delete(SILVARA_ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
