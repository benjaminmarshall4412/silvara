import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const SILVARA_ADMIN_COOKIE = "silvara_admin_sess";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function getSecret(): string | undefined {
  const s = process.env.SILVARA_ADMIN_SECRET?.trim();
  return s && s.length >= 12 ? s : undefined;
}

function signPayload(payloadJson: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadJson).digest("base64url");
}

export function createAdminSessionCookieValue(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const payload = JSON.stringify({
    exp: Date.now() + COOKIE_MAX_AGE_SEC * 1000,
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = signPayload(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export function verifyAdminSessionCookie(value: string | undefined): boolean {
  if (!value) return false;
  const secret = getSecret();
  if (!secret) return false;
  const dot = value.indexOf(".");
  if (dot === -1) return false;
  const payloadB64 = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!payloadB64 || !sig) return false;
  const expected = signPayload(payloadB64, secret);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  const a = Buffer.from(password.trim(), "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAdminConfigured(): boolean {
  return Boolean(getSecret());
}
