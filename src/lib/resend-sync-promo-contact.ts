import { Resend } from "resend";

let resendSingleton: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

function isLikelyDuplicateContact(error: {
  message: string;
  statusCode: number | null;
}): boolean {
  const m = error.message.toLowerCase();
  return (
    error.statusCode === 409 ||
    m.includes("already exist") ||
    m.includes("duplicate") ||
    m.includes("unique")
  );
}

/**
 * Upserts a Resend Audience contact for the promo modal.
 *
 * Env:
 * - `RESEND_API_KEY` — required for any sync
 * - `RESEND_PROMO_SEGMENT_ID` — optional; segment UUID from Resend → Audience → Segments
 *
 * Custom Contact Properties (e.g. signup_path) must exist in the Resend dashboard first;
 * we only sync email + segment so setup works out of the box. Region/path remain in Neon.
 */
export async function syncPromoSignupToResend(input: { email: string }): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const segmentId = process.env.RESEND_PROMO_SEGMENT_ID?.trim();
  const segments = segmentId ? [{ id: segmentId }] : undefined;
  const email = input.email.trim().toLowerCase();

  try {
    const created = await resend.contacts.create({
      email,
      unsubscribed: false,
      ...(segments ? { segments } : {}),
    });

    if (!created.error) return;

    if (!isLikelyDuplicateContact(created.error)) {
      console.error("[syncPromoSignupToResend] create", created.error);
      return;
    }

    const updated = await resend.contacts.update({
      email,
      unsubscribed: false,
    });
    if (updated.error) {
      console.error("[syncPromoSignupToResend] update", updated.error);
      return;
    }

    if (segmentId) {
      const added = await resend.contacts.segments.add({
        email,
        segmentId,
      });
      if (added.error && !isLikelyDuplicateContact(added.error)) {
        console.error("[syncPromoSignupToResend] add segment", added.error);
      }
    }
  } catch (err) {
    console.error("[syncPromoSignupToResend]", err);
  }
}
