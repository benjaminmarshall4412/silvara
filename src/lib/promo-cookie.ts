import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import "server-only";

/** HttpOnly cookie: email promo eligibility for auto-applied Stripe coupon */
export const SILVARA_PROMO_COOKIE_NAME = "silvara_promo_eligible";

function signingSecret(): string {
  const explicit = process.env.PROMO_COOKIE_SECRET;
  if (explicit && explicit.length >= 24) return explicit;
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) return "silvara-dev-promo-signing-fallback";
  return createHash("sha256").update(`silvara:promo:${sk}`).digest("hex");
}

/** Mint cookie value (signed expiry). Not secret-bound to email so we tie trust to signup endpoint only + HMAC */
export function mintPromoEligibleToken(): string {
  const expSec = Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60;
  const payload = JSON.stringify({ v: 1 as const, exp: expSec });
  const b64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", signingSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyPromoEligibleToken(raw: string | undefined): boolean {
  if (!raw?.includes(".")) return false;
  const [b64, sig] = raw.split(".", 2);
  if (!b64 || !sig) return false;
  try {
    const secret = signingSecret();
    const expected = createHmac("sha256", secret).update(b64).digest("base64url");
    const ab = Buffer.from(sig);
    const bb = Buffer.from(expected);
    if (ab.length !== bb.length) return false;
    if (!timingSafeEqual(ab, bb)) return false;
    const json = Buffer.from(b64, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { v?: number; exp?: number };
    if (parsed.v !== 1 || typeof parsed.exp !== "number") return false;
    return parsed.exp >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
