import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createAdminSessionCookieValue,
  isAdminConfigured,
  SILVARA_ADMIN_COOKIE,
  verifyAdminPassword,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin is not configured. Set SILVARA_ADMIN_SECRET (at least 12 characters) in your environment.",
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
  const password =
    body &&
    typeof body === "object" &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const value = createAdminSessionCookieValue();
  if (!value) {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  const store = await cookies();
  store.set(SILVARA_ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
