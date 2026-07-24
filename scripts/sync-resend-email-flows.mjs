/**
 * Create SILVARA marketing templates + Resend Automations via API.
 *
 * Usage:
 *   node --env-file=.env scripts/sync-resend-email-flows.mjs
 *   node --env-file=.env scripts/sync-resend-email-flows.mjs --enable
 *
 * Default: creates templates (published) and automations as **disabled**.
 * Pass --enable to create automations already enabled (review first recommended).
 *
 * Requires: RESEND_API_KEY
 * Optional: RESEND_FROM (default marketing@silvara.org)
 */
import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY?.trim()
if (!apiKey) {
  console.error("Missing RESEND_API_KEY")
  process.exit(1)
}

const FROM =
  process.env.RESEND_FROM?.trim() || "SILVARA <marketing@silvara.org>"
/** Prefer production storefront for email CTAs (local .env often has localhost). */
const SITE = (
  process.env.RESEND_SITE_URL ||
  (process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")
    ? "https://silvara.org"
    : process.env.NEXT_PUBLIC_SITE_URL) ||
  "https://silvara.org"
).replace(/\/$/, "")
const SHOP_URL = `${SITE}/gift`
const STORE_URL = `${SITE}/us`
const ENABLE = process.argv.includes("--enable")

const resend = new Resend(apiKey)

const UNSUB =
  '<p style="margin:24px 0 0;font-size:12px;color:#888;"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Unsubscribe</a></p>'

function layout({ preheader, bodyHtml, ctaLabel, ctaUrl }) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f5f2eb;font-family:Georgia,serif;color:#2a1f18;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2eb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffaf3;border:2px solid #2a1f18;padding:28px 24px;">
<tr><td style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#2a1f18;">SILVARA</td></tr>
<tr><td style="padding-top:20px;font-size:16px;line-height:1.55;color:#2a1f18;">${bodyHtml}</td></tr>
<tr><td style="padding-top:28px;">
<a href="${ctaUrl}" style="display:inline-block;background:#b4532a;color:#fffaf3;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:14px 22px;border:2px solid #2a1f18;">${escapeHtml(ctaLabel)}</a>
</td></tr>
<tr><td style="padding-top:28px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#6b5a4e;">SILVARA<br/>Less odor. More wear.</td></tr>
<tr><td>${UNSUB}</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function p(text) {
  return `<p style="margin:0 0 14px;">${escapeHtml(text)}</p>`
}

function paras(...lines) {
  return lines.map(p).join("")
}

/** @type {Array<{alias:string,name:string,subject:string,preheader:string,ctaLabel:string,ctaUrl:string,htmlBody:string}>} */
const TEMPLATES = [
  // Promo
  {
    alias: "silvara-promo-01-welcome",
    name: "SILVARA Promo 01 — Welcome",
    subject: "Meet the sock built for less odor",
    preheader: "Silver-ion fiber, placed where odor starts.",
    ctaLabel: "Shop SILVARA",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Hey,",
      "Most odor products treat the shoe after the smell has already started.",
      "SILVARA takes a different approach.",
      "Our lightweight crew socks use silver-ion fiber inside the yarn to help control odor at the sock.",
      "They are thin, comfortable, and made for work, training, travel, and everyday wear.",
      "Available in black and white marl.",
      "Questions? Just reply to this email — we’re happy to help.",
    ),
  },
  {
    alias: "silvara-promo-02-12h",
    name: "SILVARA Promo 02 — Gift angle",
    subject: "A gift they will actually use",
    preheader: "Better than another item that sits in a drawer.",
    ctaLabel: "Shop the socks",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Most gifts are forgotten within a week.",
      "Good socks get used constantly.",
      "SILVARA socks are made for anyone who works long shifts, trains, travels, wears work boots, or simply wants their feet to smell less at the end of the day.",
      "It is a simple gift with a clear purpose.",
      "Black and white marl available.",
    ),
  },
  {
    alias: "silvara-promo-03-24h",
    name: "SILVARA Promo 03 — Why silver",
    subject: "Why put silver inside a sock?",
    preheader: "The material is built directly into the yarn.",
    ctaLabel: "See how it works",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Foot odor does not begin in the shoe.",
      "It begins with moisture and bacteria around the foot.",
      "That is why SILVARA uses silver-ion fiber inside the sock itself.",
      "The material is part of the yarn, not a spray or coating you need to apply again later.",
      "The result is a thin everyday sock built to help control odor during long days.",
    ),
  },
  {
    alias: "silvara-promo-04-48h",
    name: "SILVARA Promo 04 — Hard days",
    subject: "Made for the days that ruin normal socks",
    preheader: "Work, training, travel, and long hours on your feet.",
    ctaLabel: "Shop SILVARA",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Long shifts. Hot shoes. Work boots. Training sessions. Hours of travel.",
      "These are the situations SILVARA was built for.",
      "The socks are lightweight enough for everyday use, while silver-ion fiber helps control odor where it starts.",
    ),
  },
  {
    alias: "silvara-promo-05-72h",
    name: "SILVARA Promo 05 — Try without guessing",
    subject: "Try SILVARA without guessing",
    preheader: "Wear them in your normal routine.",
    ctaLabel: "Try SILVARA",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "You should not have to guess whether a new product will work for you.",
      "Try SILVARA during your normal routine — work, training, travel, or anywhere odor usually becomes a problem.",
      "Questions about fit or wear? Reply to this email and we will help.",
    ),
  },
  // Browse
  {
    alias: "silvara-browse-01-2h",
    name: "SILVARA Browse 01 — Still looking",
    subject: "Still looking at SILVARA?",
    preheader: "Here is the main difference.",
    ctaLabel: "View the socks",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "You were checking out SILVARA.",
      "Here is the simple version.",
      "Normal socks absorb sweat and odor. SILVARA adds silver-ion fiber directly into the yarn to help control odor at the sock.",
      "They are thin, comfortable, and built for everyday wear.",
    ),
  },
  {
    alias: "silvara-browse-02-24h",
    name: "SILVARA Browse 02 — Not thick",
    subject: "Not another thick performance sock",
    preheader: "Lightweight enough to wear every day.",
    ctaLabel: "Return to SILVARA",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Odor-control socks do not need to feel thick or bulky.",
      "SILVARA socks are made to fit into your normal rotation.",
      "Wear them with work boots, sneakers, dress shoes, or everyday shoes.",
      "Less odor should not require changing how you dress.",
    ),
  },
  {
    alias: "silvara-browse-03-48h",
    name: "SILVARA Browse 03 — One last look",
    subject: "One last look",
    preheader: "Silver-ion socks in black and white marl.",
    ctaLabel: "Shop SILVARA",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Still deciding?",
      "SILVARA socks are built for people who deal with foot odor after work, training, travel, or long days in closed shoes.",
      "Choose black or white marl.",
      "Questions? Reply anytime.",
    ),
  },
  // Cart
  {
    alias: "silvara-cart-01-2h",
    name: "SILVARA Cart 01 — Left something",
    subject: "You left something in your cart",
    preheader: "Your SILVARA socks are still waiting.",
    ctaLabel: "Return to cart",
    ctaUrl: STORE_URL,
    htmlBody: paras(
      "Hey,",
      "You added SILVARA socks to your cart but did not finish checking out.",
      "Your items are still waiting.",
      "Silver-ion fiber. Lightweight construction. Built for less odor.",
    ),
  },
  {
    alias: "silvara-cart-02-24h",
    name: "SILVARA Cart 02 — Still thinking",
    subject: "Still thinking it over?",
    preheader: "Finish when you are ready.",
    ctaLabel: "Complete your order",
    ctaUrl: STORE_URL,
    htmlBody: paras(
      "Trying a new product can feel like a gamble.",
      "Wear SILVARA during your normal routine and see how they feel.",
      "Questions before you buy? Reply to this email.",
      "Your cart is still available below.",
    ),
  },
  {
    alias: "silvara-cart-03-48h",
    name: "SILVARA Cart 03 — Final reminder",
    subject: "A final reminder about your cart",
    preheader: "Finish your SILVARA order when you are ready.",
    ctaLabel: "Return to cart",
    ctaUrl: STORE_URL,
    htmlBody: paras(
      "This is the last reminder about the SILVARA socks in your cart.",
      "They are built for work, training, travel, and everyday wear, with silver-ion fiber inside the yarn to help control odor.",
      "You can finish your order below.",
    ),
  },
  // Post-purchase
  {
    alias: "silvara-order-01-confirm",
    name: "SILVARA Order 01 — Confirm",
    subject: "We received your SILVARA order",
    preheader: "Your order is being prepared.",
    ctaLabel: "Visit SILVARA",
    ctaUrl: STORE_URL,
    htmlBody: paras(
      "Hey,",
      "Thank you for your order.",
      "We received it and are preparing it now. You will get another update when it ships (if your carrier provides one).",
      "Questions about your order? Reply to this email and we will help.",
    ),
  },
  {
    alias: "silvara-order-02-care",
    name: "SILVARA Order 02 — Care",
    subject: "How to care for your SILVARA socks",
    preheader: "A few steps to keep them in good condition.",
    ctaLabel: "Shop SILVARA",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "Your SILVARA socks should be with you soon — or already on your feet.",
      "For best results: machine wash cold, tumble dry low, and do not bleach.",
      "Let the socks dry completely between wears, and put them into your normal rotation on the days that usually cause the most odor.",
    ),
  },
  {
    alias: "silvara-order-03-review",
    name: "SILVARA Order 03 — Feedback",
    subject: "How are your SILVARA socks performing?",
    preheader: "Your feedback helps us improve the product.",
    ctaLabel: "Reply with feedback",
    ctaUrl: `mailto:marketing@silvara.org?subject=${encodeURIComponent("SILVARA sock feedback")}`,
    htmlBody: paras(
      "Hey,",
      "You have had some time to try your SILVARA socks.",
      "How did they perform during work, training, travel, or everyday wear?",
      "Hit reply with honest feedback — it helps us improve and helps other customers know what to expect.",
      "Thank you for trying SILVARA.",
    ),
  },
  {
    alias: "silvara-order-04-restock",
    name: "SILVARA Order 04 — Restock",
    subject: "Ready to add another pair?",
    preheader: "Build a rotation for work, travel, and everyday wear.",
    ctaLabel: "Add another pair",
    ctaUrl: SHOP_URL,
    htmlBody: paras(
      "One pair is useful.",
      "A full rotation means you can wear SILVARA more often without waiting for laundry day.",
      "Add more pairs for work, training, travel, or everyday use.",
      "Available in black and white marl.",
    ),
  },
]

async function ensureTemplate(t) {
  const html = layout({
    preheader: t.preheader,
    bodyHtml: t.htmlBody,
    ctaLabel: t.ctaLabel,
    ctaUrl: t.ctaUrl,
  })

  const existing = await resend.templates.list({ limit: 100 })
  if (existing.error) throw existing.error
  const found = (existing.data?.data ?? existing.data ?? []).find(
    (row) => row.alias === t.alias || row.name === t.name,
  )

  if (found?.id) {
    const updated = await resend.templates.update(found.id, {
      name: t.name,
      alias: t.alias,
      from: FROM,
      subject: t.subject,
      html,
    })
    if (updated.error) throw updated.error
    const pub = await resend.templates.publish(found.id)
    if (pub.error) throw pub.error
    console.log(`  updated+published ${t.alias} (${found.id})`)
    return found.id
  }

  const created = await resend.templates.create({
    name: t.name,
    alias: t.alias,
    from: FROM,
    subject: t.subject,
    html,
  })
  if (created.error) throw created.error
  const id = created.data?.id
  if (!id) throw new Error(`No id for template ${t.alias}`)
  const pub = await resend.templates.publish(id)
  if (pub.error) throw pub.error
  console.log(`  created+published ${t.alias} (${id})`)
  return id
}

function chain(keys) {
  const connections = []
  for (let i = 0; i < keys.length - 1; i++) {
    connections.push({ from: keys[i], to: keys[i + 1] })
  }
  return connections
}

async function createAutomation({ name, eventName, steps }) {
  const list = await resend.automations.list({ limit: 100 })
  if (list.error) throw list.error
  const rows = list.data?.data ?? list.data ?? []
  const existing = rows.find((a) => a.name === name)
  if (existing) {
    console.log(`  skip automation (exists): ${name} (${existing.id})`)
    return existing.id
  }

  const keys = steps.map((s) => s.key)
  const { data, error } = await resend.automations.create({
    name,
    status: ENABLE ? "enabled" : "disabled",
    steps,
    connections: chain(keys),
  })
  if (error) throw error
  console.log(
    `  created automation ${name} (${data?.id}) [${ENABLE ? "enabled" : "disabled"}]`,
  )
  return data?.id
}

function sendStep(key, templateId) {
  return {
    key,
    type: "send_email",
    config: {
      template: { id: templateId },
      from: FROM,
    },
  }
}

function delayStep(key, duration) {
  return { key, type: "delay", config: { duration } }
}

async function main() {
  console.log(`From: ${FROM}`)
  console.log(`Shop: ${SHOP_URL}`)
  console.log(`Automations will be: ${ENABLE ? "ENABLED" : "disabled (review in dashboard)"}`)
  console.log("\nTemplates…")

  /** @type {Record<string,string>} */
  const ids = {}
  for (const t of TEMPLATES) {
    ids[t.alias] = await ensureTemplate(t)
  }

  console.log("\nAutomations…")

  await createAutomation({
    name: "SILVARA — Promo welcome (5 emails)",
    eventName: "silvara.promo_signup",
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { eventName: "silvara.promo_signup" },
      },
      sendStep("promo_01", ids["silvara-promo-01-welcome"]),
      delayStep("d12", "12 hours"),
      sendStep("promo_02", ids["silvara-promo-02-12h"]),
      delayStep("d12b", "12 hours"),
      sendStep("promo_03", ids["silvara-promo-03-24h"]),
      delayStep("d24", "24 hours"),
      sendStep("promo_04", ids["silvara-promo-04-48h"]),
      delayStep("d24b", "24 hours"),
      sendStep("promo_05", ids["silvara-promo-05-72h"]),
    ],
  })

  await createAutomation({
    name: "SILVARA — Browse abandonment",
    eventName: "silvara.product_viewed",
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { eventName: "silvara.product_viewed" },
      },
      delayStep("d2", "2 hours"),
      sendStep("b01", ids["silvara-browse-01-2h"]),
      delayStep("d22", "22 hours"),
      sendStep("b02", ids["silvara-browse-02-24h"]),
      delayStep("d24", "24 hours"),
      sendStep("b03", ids["silvara-browse-03-48h"]),
    ],
  })

  await createAutomation({
    name: "SILVARA — Cart abandonment",
    eventName: "silvara.cart_abandoned",
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { eventName: "silvara.cart_abandoned" },
      },
      delayStep("d2", "2 hours"),
      sendStep("c01", ids["silvara-cart-01-2h"]),
      delayStep("d22", "22 hours"),
      sendStep("c02", ids["silvara-cart-02-24h"]),
      delayStep("d24", "24 hours"),
      sendStep("c03", ids["silvara-cart-03-48h"]),
    ],
  })

  await createAutomation({
    name: "SILVARA — Post-purchase",
    eventName: "silvara.order_completed",
    steps: [
      {
        key: "start",
        type: "trigger",
        config: { eventName: "silvara.order_completed" },
      },
      sendStep("o01", ids["silvara-order-01-confirm"]),
      delayStep("d5", "5 days"),
      sendStep("o02", ids["silvara-order-02-care"]),
      delayStep("d9", "9 days"),
      sendStep("o03", ids["silvara-order-03-review"]),
      delayStep("d30", "30 days"),
      sendStep("o04", ids["silvara-order-04-restock"]),
    ],
  })

  console.log("\nDone.")
  console.log(
    ENABLE
      ? "Automations are enabled."
      : "Open Resend → Automations, review, then enable each flow.",
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
