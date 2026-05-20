import { getPrisma } from "@/lib/prisma";
import type { SiteRegion } from "@/lib/site-region";

export function normalizeSignupEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function findEmailSignup(email: string) {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma.emailSignup.findUnique({
    where: { email: normalizeSignupEmail(email) },
  });
}

/** True when this address has completed at least one checkout we recorded. */
export async function emailHasPurchased(email: string): Promise<boolean> {
  const row = await findEmailSignup(email);
  return row?.firstOrderAt != null;
}

/**
 * Creates or updates promo signup row. Returns whether to fire `silvara.promo_signup`
 * (only when welcome automation has never been sent for this email).
 */
export async function upsertPromoSignup(input: {
  email: string;
  region: SiteRegion;
  pathname: string;
}): Promise<{ shouldSendPromoAutomation: boolean; isReturningEmail: boolean }> {
  const prisma = getPrisma();
  const email = normalizeSignupEmail(input.email);
  if (!prisma) {
    return { shouldSendPromoAutomation: true, isReturningEmail: false };
  }

  try {
    const existing = await prisma.emailSignup.findUnique({ where: { email } });
    if (existing) {
      await prisma.emailSignup.update({
        where: { email },
        data: {
          region: input.region,
          pathname: input.pathname,
        },
      });
      return {
        shouldSendPromoAutomation: existing.promoAutomationSentAt == null,
        isReturningEmail: true,
      };
    }

    await prisma.emailSignup.create({
      data: {
        email,
        region: input.region,
        pathname: input.pathname,
      },
    });
    return { shouldSendPromoAutomation: true, isReturningEmail: false };
  } catch (err) {
    console.error("[upsertPromoSignup]", err);
    return { shouldSendPromoAutomation: false, isReturningEmail: false };
  }
}

export async function markPromoAutomationSent(email: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const normalized = normalizeSignupEmail(email);
  try {
    await prisma.emailSignup.update({
      where: { email: normalized },
      data: { promoAutomationSentAt: new Date() },
    });
  } catch (err) {
    console.error("[markPromoAutomationSent]", err);
  }
}

/**
 * Records first order for this email. Returns whether to fire `silvara.order_completed`
 * (only on the first recorded purchase).
 */
export async function recordFirstOrderIfNeeded(input: {
  email: string;
  region: SiteRegion | null;
}): Promise<{ shouldSendOrderAutomation: boolean }> {
  const prisma = getPrisma();
  const email = normalizeSignupEmail(input.email);
  if (!prisma) {
    return { shouldSendOrderAutomation: true };
  }

  const region = input.region ?? "us";
  const now = new Date();

  try {
    const existing = await prisma.emailSignup.findUnique({ where: { email } });
    if (!existing) {
      await prisma.emailSignup.create({
        data: {
          email,
          region,
          pathname: `/${region}`,
          firstOrderAt: now,
        },
      });
      return { shouldSendOrderAutomation: true };
    }

    if (existing.firstOrderAt != null) {
      return { shouldSendOrderAutomation: false };
    }

    await prisma.emailSignup.update({
      where: { email },
      data: { firstOrderAt: now },
    });
    return { shouldSendOrderAutomation: true };
  } catch (err) {
    console.error("[recordFirstOrderIfNeeded]", err);
    return { shouldSendOrderAutomation: false };
  }
}
