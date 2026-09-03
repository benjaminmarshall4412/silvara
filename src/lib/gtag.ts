/** Google Ads gtag (global site tag). */

export type GtagCommand = "js" | "config" | "event";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag(...args);
}

/** Fire a Google Ads conversion (optional `send_to` from the event snippet in Ads). */
export function gtagReportConversion(
  sendTo: string,
  options?: {
    value?: number;
    currency?: string;
    transactionId?: string;
    email?: string | null;
  },
) {
  const email = options?.email?.trim().toLowerCase();
  if (email) {
    gtag("set", "user_data", { email });
  }
  gtag("event", "conversion", {
    send_to: sendTo,
    ...(options?.value != null ? { value: options.value } : {}),
    ...(options?.currency ? { currency: options.currency } : {}),
    ...(options?.transactionId ? { transaction_id: options.transactionId } : {}),
  });
}
