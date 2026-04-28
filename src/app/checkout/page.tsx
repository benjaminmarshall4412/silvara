"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { envPublic } from "@/lib/env.public";
import { useCart } from "@/lib/cart-context";
import { formatUsd, getProduct } from "@/lib/products";

export default function CheckoutPage() {
  const { lines, subtotalCents } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stripePromise = useMemo(
    () => loadStripe(envPublic.stripePublishableKey),
    [],
  );

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
          href="/#loadouts"
          className="mt-8 inline-flex h-12 cursor-pointer items-center border-4 border-foreground bg-accent px-6 font-heading text-sm font-extrabold uppercase text-accent-foreground"
        >
          Back to loadouts
        </Link>
      </div>
    );
  }

  async function startCheckout() {
    try {
      setIsCreatingSession(true);
      setErrorMessage(null);

      const response = await fetch("/api/stripe/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to start checkout")
      }

      if (!payload?.clientSecret) {
        throw new Error("Missing Stripe client secret")
      }

      setClientSecret(payload.clientSecret);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start checkout",
      );
    } finally {
      setIsCreatingSession(false);
    }
  }

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
                {formatUsd(p.priceCents * line.quantity)}
              </p>
            </div>
          );
        })}
        <div className="flex justify-between bg-muted px-4 py-4">
          <span className="font-mono-label text-xs uppercase tracking-widest">
            Total due
          </span>
          <span className="font-heading text-xl font-extrabold">
            {formatUsd(subtotalCents)}
          </span>
        </div>
      </div>

      {!clientSecret ? (
        <div className="mt-10 space-y-4">
          <Button
            type="button"
            size="lg"
            disabled={isCreatingSession}
            onClick={startCheckout}
            className="h-14 w-full rounded-none border-2 border-transparent bg-accent text-base font-extrabold uppercase tracking-wide text-accent-foreground hover:bg-accent/90"
          >
            {isCreatingSession ? "Starting secure checkout..." : "Continue to secure checkout"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Powered by Stripe. Taxes, payment, and billing details are handled
            on secure Stripe-hosted infrastructure.
          </p>
          {errorMessage ? (
            <p className="font-mono-label text-xs uppercase tracking-wide text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 border-4 border-foreground bg-background p-2 md:p-4">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      )}

      <Link
        href="/"
        className="mt-8 inline-block font-mono-label text-xs uppercase tracking-widest underline"
      >
        ← Continue shopping
      </Link>
    </div>
  );
}
