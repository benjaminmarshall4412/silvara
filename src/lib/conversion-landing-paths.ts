export type ConversionLandingKind = "gift" | "odor";

export function getConversionLandingKind(
  pathname: string | null | undefined,
): ConversionLandingKind | null {
  const match = /^\/(?:us|uk)\/(gift|odor)\/?$/.exec(pathname ?? "");
  return (match?.[1] as ConversionLandingKind | undefined) ?? null;
}

export function isConversionLandingPath(
  pathname: string | null | undefined,
): boolean {
  return getConversionLandingKind(pathname) !== null;
}

/** Cart, payment, and confirmation steps — nothing may interrupt or distract here. */
export function isCheckoutPath(pathname: string | null | undefined): boolean {
  return /^\/(?:us|uk)\/checkout(?:\/.*)?$/.test(pathname ?? "");
}

/** Any page where an interstitial would cost a sale. */
export function isPurchaseCriticalPath(
  pathname: string | null | undefined,
): boolean {
  return isConversionLandingPath(pathname) || isCheckoutPath(pathname);
}
