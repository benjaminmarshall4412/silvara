"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";

import { SILVARA_MARKETING_EMAIL_LS } from "@/lib/marketing-email-storage";
import { useSiteRegion } from "@/lib/site-region-context";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_DISMISSED = "silvara_fieldtest_modal_dismissed";
const SHOW_DELAY_MS = 4500;

function noopSubscribe() {
  return () => {};
}

/** Email capture modal — no discount. Field-test / early-access list. */
export function EmailPromoModal() {
  const formId = useId();
  const pathname = usePathname();
  const siteRegion = useSiteRegion();

  const isBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const shownLogged = useRef(false);

  useEffect(() => {
    if (!visible) return;
    if (shownLogged.current) return;
    shownLogged.current = true;
    posthog.capture("fieldtest_modal_shown");
  }, [visible]);

  const dismiss = useCallback((hadSubmitted?: boolean) => {
    if (!hadSubmitted) {
      posthog.capture("fieldtest_modal_dismissed");
    }
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_DISMISSED, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isBrowser) return;
    if (typeof window === "undefined") return;
    // Never interrupt Meta / gift landing conversion with the email modal
    if (/\/(us|uk)\/gift\/?$/.test(pathname ?? "")) return;
    try {
      if (localStorage.getItem(STORAGE_DISMISSED) === "1") return;
      // Legacy dismiss from the old 15% promo modal
      if (localStorage.getItem("silvara_promo_modal_dismissed") === "1") return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [isBrowser, pathname]);

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
          body: JSON.stringify({
            email: email.trim(),
            region: siteRegion,
            pathname,
          }),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErrorMsg(data.error ?? "Something went wrong. Try again.");
          setStatus("error");
          return;
        }
        setStatus("done");
        try {
          localStorage.setItem(
            SILVARA_MARKETING_EMAIL_LS,
            email.trim().toLowerCase(),
          );
        } catch {
          /* ignore */
        }
        posthog.capture("fieldtest_email_submitted");
        posthog.identify(email.trim(), { email: email.trim() });
      } catch {
        setErrorMsg("Could not reach the server.");
        setStatus("error");
      }
    },
    [email, pathname, siteRegion],
  );

  if (!isBrowser || !visible) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[110] duration-300"
      role="presentation"
      aria-hidden={false}
    >
      <button
        type="button"
        aria-label="Close"
        className="bg-foreground/40 absolute inset-0 block w-full cursor-default border-none"
        onClick={() => dismiss()}
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
                Join the SILVARA field-test list
              </p>
              <p className="text-muted-foreground mt-2 max-w-[36ch] text-sm leading-snug md:text-[0.9375rem]">
                Get real wear-test results, first access to new colors, and early
                access to future drops.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dismiss()}
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center border-2 bg-transparent font-mono text-xl leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          {status === "done" ? (
            <div className="space-y-4">
              <p className="text-sm leading-snug md:text-base">
                You&apos;re on the list. We&apos;ll only send useful updates —
                wear results, new colors, and drops.
              </p>
              <button
                type="button"
                onClick={() => dismiss(true)}
                className="bg-primary text-primary-foreground border-border hover:opacity-90 w-full cursor-pointer border-2 px-4 py-3 font-heading text-sm font-extrabold uppercase tracking-wide"
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
                <p
                  className="text-destructive font-mono text-xs uppercase tracking-wide"
                  role="alert"
                >
                  {errorMsg}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-accent text-accent-foreground border-border hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer border-2 px-4 py-3 font-heading text-sm font-extrabold uppercase tracking-wide"
              >
                {status === "loading" ? "Saving…" : "Join the list"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
