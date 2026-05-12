"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import posthog from "posthog-js";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getStripePublishableKeyForRegion } from "@/lib/env.public";
import { useCart } from "@/lib/cart-context";
import { usePromoEligibility } from "@/lib/promo-eligibility-context";
import { useSiteRegion } from "@/lib/site-region-context";
import { formatMoney, getProduct } from "@/lib/products";
import { useStripeCatalogPrices } from "@/lib/stripe-catalog-prices-context";
import { withSiteRegion } from "@/lib/site-region";

export default function CheckoutPage() {
  const region = useSiteRegion();
  const { unitAmountCentsByBundle, currency } = useStripeCatalogPrices();
  const home = withSiteRegion(region, "/");
  const loadouts = withSiteRegion(region, "/#loadouts");

  const { lines, subtotalCents } = useCart();
  const { state: promo } = usePromoEligibility();
  const linesKey = useMemo(() => JSON.stringify(lines), [lines]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  /** From create-intent — whether Stripe attached the email coupon (cookie + server env). */
  const [appliedPromoOnSession, setAppliedPromoOnSession] = useState<
    boolean | null
  >(null);

  /** Estimated savings whenever the promo cookie qualifies — Stripe applies same rules when coupon id is configured. */
  const eligiblePromo =
    !!(promo && promo.pct > 0 && promo.claimedOnThisDevice);

  const pct = promo?.pct ?? 0;
  const discountCents =
    eligiblePromo && pct > 0 ? Math.round(subtotalCents * (pct / 100)) : 0;
  const estimatedTotalAfterPromo = Math.max(0, subtotalCents - discountCents);
  const publishableKey = getStripePublishableKeyForRegion(region);
  const stripeCouponEnvName =
    region === "us"
      ? "STRIPE_EMAIL_PROMO_COUPON_ID_US"
      : "STRIPE_EMAIL_PROMO_COUPON_ID_UK";
  const publishableEnvName =
    region === "us"
      ? "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_US"
      : "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_UK";

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const loadCheckoutSession = useCallback(
    async (signal?: AbortSignal) => {
      setSessionError(null);
      setAppliedPromoOnSession(null);
      try {
        const response = await fetch("/api/stripe/create-intent", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-posthog-distinct-id": posthog.get_distinct_id(),
          },
          body: JSON.stringify({ lines, region }),
          signal,
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to start checkout");
        }

        if (!payload?.clientSecret) {
          throw new Error("Missing Stripe client secret");
        }

        setAppliedPromoOnSession(
          typeof payload.appliedPromoDiscount === "boolean"
            ? payload.appliedPromoDiscount
            : null,
        );
        setClientSecret(payload.clientSecret);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "Unable to start checkout";
        posthog.capture("checkout_session_error", { error_message: message, region });
        posthog.captureException(error);
        setSessionError(message);
      }
    },
    [lines, region],
  );

  useEffect(() => {
    setSessionError(null);
  }, [linesKey]);

  useEffect(() => {
    if (lines.length === 0 || !publishableKey || clientSecret)
      return;
    const controller = new AbortController();
    void loadCheckoutSession(controller.signal);
    return () => controller.abort();
  }, [linesKey, clientSecret, lines.length, loadCheckoutSession, publishableKey]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="font-heading text-3xl font-extrabold uppercase">
          Cart empty
        </h1>
        <p className="mt-4 text-muted-foreground">
          Add a loadout or rotation from the home page.
        </p>
        <Link
          href={loadouts}
          className="mt-8 inline-flex h-12 cursor-pointer items-center border-4 border-foreground bg-accent px-6 font-heading text-sm font-extrabold uppercase text-accent-foreground"
        >
          Back to loadouts
        </Link>
      </div>
    );
  }

  const showCheckoutSpinner =
    publishableKey &&
    !clientSecret &&
    !sessionError &&
    lines.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
        Checkout
      </p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold uppercase md:text-4xl">
        Order summary
      </h1>

      <div className="mt-10 border-4 border-foreground">
        {lines.map((line) => {
          const p = getProduct(line.id);
          if (!p) return null;
          const unit = unitAmountCentsByBundle[line.id] ?? p.priceCents;
          return (
            <div
              key={line.id}
              className="flex justify-between border-b-2 border-foreground px-4 py-4 last:border-b-0"
            >
              <div>
                <p className="font-heading font-extrabold uppercase">
                  {p.name} × {line.quantity}
                </p>
                {p.isSubscription && (
                  <p className="mt-1 font-mono-label text-[0.65rem] uppercase text-muted-foreground">
                    Rotation · per shipment
                  </p>
                )}
              </div>
              <p className="font-mono-label text-sm font-medium">
                {formatMoney(unit * line.quantity, currency)}
              </p>
            </div>
          );
        })}
        {discountCents > 0 ? (
          <div className="border-border flex justify-between border-t-2 border-dashed px-4 py-3">
            <span className="font-mono-label text-xs uppercase tracking-widest">Subtotal</span>
            <span className="font-mono-label text-sm font-medium">{formatMoney(subtotalCents, currency)}</span>
          </div>
        ) : null}
        {discountCents > 0 ? (
          <div className="flex justify-between px-4 py-3">
            <span className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
              First-order savings · −{promo?.pct ?? 0}%
            </span>
            <span className="font-mono-label text-sm font-medium text-foreground">
              −{formatMoney(discountCents, currency)}
            </span>
          </div>
        ) : null}
        <div className="flex justify-between bg-muted px-4 py-4">
          <span className="font-mono-label text-xs uppercase tracking-widest">
            {discountCents > 0 ? "Estimated total" : "Total due"}
          </span>
          <span className="font-heading text-xl font-extrabold">
            {formatMoney(discountCents > 0 ? estimatedTotalAfterPromo : subtotalCents, currency)}
          </span>
        </div>
      </div>
      {promo && promo.pct > 0 && !eligiblePromo ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Add your email using the {promo.pct}% offer on the site first — totals here will reflect savings
          after you qualify.
        </p>
      ) : null}

      {eligiblePromo &&
      discountCents > 0 &&
      promo &&
      !promo.discountWillApplyAtCheckout ? (
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          Estimates assume your signup offer. Stripe will apply it at payment when{" "}
          <code className="text-foreground">{stripeCouponEnvName}</code> matches your signup coupon on the server.
        </p>
      ) : null}

      {!publishableKey ? (
        <div className="mt-10 border-4 border-foreground bg-muted px-4 py-4">
          <p className="font-mono-label text-xs font-bold uppercase tracking-wide text-foreground">
            Stripe publishable key missing
          </p>
          <p className="mt-2 text-sm leading-snug text-foreground">
            Add <code className="text-foreground">{publishableEnvName}</code> to your{" "}
            <code className="text-foreground">.env</code> file, then restart{" "}
            <code className="text-foreground">npm run dev</code>. Client env vars load when the Next dev server starts.
          </p>
        </div>
      ) : null}

      {showCheckoutSpinner ? (
        <div className="border-foreground mt-10 border-4 px-6 py-8 text-center">
          <p className="font-mono-label animate-pulse text-xs uppercase tracking-widest text-muted-foreground">
            Opening secure checkout…
          </p>
        </div>
      ) : sessionError ? (
        <div className="mt-10 space-y-4">
          <p className="font-mono-label text-xs uppercase tracking-wide text-red-700">
            {sessionError}
          </p>
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-none border-2 border-transparent bg-accent text-base font-extrabold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
            onClick={() => {
              setSessionError(null);
              void loadCheckoutSession();
            }}
          >
            Try again
          </Button>
        </div>
      ) : clientSecret && stripePromise ? (
        <div className="mt-8 space-y-3">
          <p className="text-xs text-muted-foreground">
            Powered by Stripe. Taxes, payment, and billing details are handled on secure
            Stripe-hosted infrastructure.
          </p>
          {eligiblePromo &&
          discountCents > 0 &&
          appliedPromoOnSession === false ? (
            <div
              role="alert"
              className="border-foreground text-foreground bg-muted border-4 px-4 py-3 font-mono-label text-[0.65rem] leading-relaxed uppercase tracking-wide"
            >
              Stripe is charging list price ({formatMoney(subtotalCents, currency)}) because the automatic coupon
              was not attached. Set{" "}
              <span className="text-foreground">{stripeCouponEnvName}</span> in{" "}
              <span className="text-foreground">.env</span> to your Stripe coupon id (starts with{" "}
              <span className="normal-case">coupon_</span>
              ), matching the same percent as{" "}
              <span className="text-foreground">NEXT_PUBLIC_SILVARA_PROMO_PCT</span>. Restart the
              server and open checkout again after completing the email promo in this browser so the
              promo cookie is sent.
            </div>
          ) : null}
          <div className="border-foreground bg-[#f8f7f5] border-4 p-2 md:p-4">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      ) : (
        <div className="mt-8 border-4 border-foreground bg-muted px-4 py-4">
          <p className="text-sm">
            Checkout session started but Stripe could not load — add{" "}
            <code className="text-foreground">{publishableEnvName}</code>
            and restart the dev server.
          </p>
        </div>
      )}

      <Link
        href={home}
        className="mt-8 inline-block font-mono-label text-xs uppercase tracking-widest underline"
      >
        ← Continue shopping
      </Link>
    </div>
  );
}
