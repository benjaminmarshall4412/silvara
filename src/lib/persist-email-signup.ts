import { getPrisma } from "@/lib/prisma";
import type { SiteRegion } from "@/lib/site-region";

/**
 * Stores a promo / marketing email capture in Neon (when `DATABASE_URL` is set).
 * Swallows errors so checkout promo UX still succeeds if the DB is down.
 */
export async function persistEmailSignup(input: {
  email: string;
  region: SiteRegion;
  pathname: string;
}): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  try {
    await prisma.emailSignup.create({
      data: {
        email: input.email.trim().toLowerCase(),
        region: input.region,
        pathname: input.pathname,
      },
    });
  } catch (err) {
    console.error("[persistEmailSignup]", err);
  }
}
