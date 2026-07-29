import "server-only";

import { Resend } from "resend";

import { formatMoney } from "@/lib/products";

export type OrderConfirmLine = {
  name: string;
  quantity: number;
  colorLabel?: string;
};

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Transactional “we got your order” email — sent on every paid checkout.
 * Separate from the Resend post-purchase automation drip (first order only).
 */
export async function sendOrderConfirmationEmail(input: {
  to: string;
  customerName?: string | null;
  amountTotal: number | null;
  currency: string | null;
  sessionId: string;
  lines: OrderConfirmLine[];
  shippingLines?: string[];
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const to = input.to.trim().toLowerCase();
  if (!to.includes("@")) return;

  const from =
    process.env.RESEND_ORDER_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "SILVARA <orders@silvara.org>";

  const currency = (input.currency ?? "usd").toUpperCase();
  const total =
    input.amountTotal != null
      ? formatMoney(input.amountTotal, currency)
      : "—";
  const hello = input.customerName?.trim()
    ? `Hey ${escapeHtml(input.customerName.trim().split(/\s+/)[0]!)},`
    : "Hey,";

  const itemRows =
    input.lines.length > 0
      ? input.lines
          .map((l) => {
            const detail = [l.colorLabel, `Qty ${l.quantity}`]
              .filter(Boolean)
              .join(" · ");
            return `<tr>
              <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;font-size:15px;">
                <strong>${escapeHtml(l.name)}</strong>
                ${detail ? `<br/><span style="color:#6b5a4e;font-size:13px;">${escapeHtml(detail)}</span>` : ""}
              </td>
            </tr>`;
          })
          .join("")
      : `<tr><td style="padding:10px 0;font-size:15px;">Your SILVARA order</td></tr>`;

  const shipBlock =
    input.shippingLines && input.shippingLines.length > 0
      ? `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b5a4e;">Ships to</p>
         <p style="margin:0;font-size:14px;line-height:1.5;">${input.shippingLines.map(escapeHtml).join("<br/>")}</p>`
      : "";

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f2eb;font-family:Georgia,serif;color:#2a1f18;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2eb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf3;border:2px solid #2a1f18;padding:28px 24px;">
<tr><td style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">SILVARA</td></tr>
<tr><td style="padding-top:20px;font-size:16px;line-height:1.55;">
<p style="margin:0 0 14px;">${hello}</p>
<p style="margin:0 0 14px;">Thank you for your order. We received it and are preparing it now.</p>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
</td></tr>
<tr><td style="padding-top:16px;font-size:16px;"><strong>Total paid: ${escapeHtml(total)}</strong></td></tr>
<tr><td>${shipBlock}</td></tr>
<tr><td style="padding-top:18px;font-size:13px;color:#6b5a4e;line-height:1.5;">
Questions? Reply to this email — we’re happy to help.<br/>
<span style="font-family:Arial,sans-serif;font-size:11px;">Order ${escapeHtml(input.sessionId)}</span>
</td></tr>
<tr><td style="padding-top:28px;font-family:Arial,sans-serif;font-size:13px;color:#6b5a4e;">SILVARA<br/>Less odor. More wear.</td></tr>
</table>
</td></tr></table>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "We received your SILVARA order",
      html,
    });
    if (error) {
      console.error("[order-confirmation-email]", error);
    }
  } catch (err) {
    console.error("[order-confirmation-email]", err);
  }
}
