"use client";

import { envPublic } from "@/lib/env.public";
import { usePromoEligibility } from "@/lib/promo-eligibility-context";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_DISMISSED = "silvara_promo_modal_dismissed";
const SHOW_DELAY_MS = 4500;

function noopSubscribe() {
  return () => {};
}

function getPromoPct(): number {
  const raw = Number(envPublic.promoPct);
  if (!Number.isFinite(raw)) return 15;
  if (raw <= 0) return 0;
  return Math.min(90, Math.round(raw));
}

export function EmailPromoModal() {
  const formId = useId();
  const pct = getPromoPct();
  const { state: promoState, refetch: refetchPromo } = usePromoEligibility();

  const isBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_DISMISSED, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isBrowser || pct <= 0) return;
    if (promoState?.claimedOnThisDevice) {
      try {
        localStorage.setItem(STORAGE_DISMISSED, "1");
      } catch {
        /* ignore */
      }
    }
  }, [isBrowser, pct, promoState?.claimedOnThisDevice]);

  useEffect(() => {
    if (!isBrowser || pct <= 0) return;
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_DISMISSED) === "1") return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isBrowser, pct]);

  useEffect(() => {
    if (!visible) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [visible, dismiss]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");
      setStatus("loading");
      try {
        const res = await fetch("/api/promo-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErrorMsg(data.error ?? "Something went wrong. Try again.");
          setStatus("error");
          return;
        }
        setStatus("done");
        void refetchPromo();
      } catch {
        setErrorMsg("Could not reach the server.");
        setStatus("error");
      }
    },
    [email, refetchPromo],
  );

  if (!isBrowser || pct <= 0 || !visible) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[110] duration-300"
      role="presentation"
      aria-hidden={false}
    >
      <button
        type="button"
        aria-label="Close promotion"
        className="bg-foreground/40 absolute inset-0 block w-full cursor-default border-none"
        onClick={dismiss}
      />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className="border-border animate-in zoom-in-95 bg-card text-card-foreground pointer-events-auto flex max-h-[min(560px,calc(100vh-2rem))] w-full max-w-md flex-col gap-5 overflow-y-auto border-4 border-foreground p-6 shadow-2xl duration-300"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${formId}-title`}
          onClick={(e) => e.stopPropagation()}
          aria-live="polite"
        >
          <div className="flex justify-between gap-3">
            <div>
              <p
                id={`${formId}-title`}
                className="font-heading text-lg font-extrabold uppercase leading-tight tracking-tight md:text-xl"
              >
                Claim {pct}% off your first order
              </p>
              <p className="text-muted-foreground mt-2 max-w-[32ch] text-sm leading-snug md:text-[0.9375rem]">
                Add your email and your {pct}% off will show at checkout when you&apos;re ready to
                pay.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 min-w-10 shrink-0 items-center justify-center border-2 bg-transparent font-mono text-xl leading-none"
              aria-label="Dismiss offer"
            >
              ×
            </button>
          </div>

          {status === "done" ? (
            <div className="space-y-4">
              <p className="text-sm leading-snug md:text-base">
                You&apos;re in. Your {pct}% off is saved and will apply when you check out.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="bg-primary text-primary-foreground border-border hover:opacity-90 w-full border-2 px-4 py-3 font-heading text-sm font-extrabold uppercase tracking-wide"
              >
                Got it
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <label htmlFor={`${formId}-email`} className="sr-only">
                Email
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@work.com"
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full border-2 px-3 py-2.5 font-mono text-sm outline-none focus-visible:ring-2"
              />
              {errorMsg ? (
                <p className="text-destructive font-mono text-xs uppercase tracking-wide" role="alert">
                  {errorMsg}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-accent text-accent-foreground border-border hover:bg-accent/90 disabled:opacity-50 border-2 px-4 py-3 font-heading text-sm font-extrabold uppercase tracking-wide"
              >
                {status === "loading" ? "Saving…" : `Claim ${pct}% off`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
