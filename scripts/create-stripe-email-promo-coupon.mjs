/**
 * Creates a Stripe Coupon for the email-signup / first-checkout discount.
 * Matches checkout behavior: percent off, applied once per customer (typical first order).
 *
 * Usage:
 *   node --env-file=.env scripts/create-stripe-email-promo-coupon.mjs --region=us
 *   node --env-file=.env scripts/create-stripe-email-promo-coupon.mjs --region=uk --pct=15
 *
 * Env:
 *   STRIPE_SECRET_KEY_US | STRIPE_SECRET_KEY_UK
 *   NEXT_PUBLIC_SILVARA_PROMO_PCT (default 15 if unset)
 */

import Stripe from "stripe"

function resolveRegion() {
  const fromArgv = process.argv.find((a) => a.startsWith("--region="))?.slice("--region=".length)
  const raw = (fromArgv ?? "us").toLowerCase().trim()
  if (raw !== "us" && raw !== "uk") {
    throw new Error(`Invalid region "${raw}" — use us or uk.`)
  }
  return raw
}

function resolvePct() {
  const fromArgv = process.argv.find((a) => a.startsWith("--pct="))?.slice("--pct=".length)
  if (fromArgv) {
    const n = Number(fromArgv)
    if (!Number.isFinite(n) || n < 1 || n > 99) {
      throw new Error(`Invalid --pct (use 1–99): ${fromArgv}`)
    }
    return Math.round(n)
  }
  const raw = process.env.NEXT_PUBLIC_SILVARA_PROMO_PCT ?? "15"
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1 || n > 99) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SILVARA_PROMO_PCT (use 1–99): ${JSON.stringify(raw)}`,
    )
  }
  return Math.round(n)
}

const region = resolveRegion()
const pct = resolvePct()
const secretEnvName = `STRIPE_SECRET_KEY_${region.toUpperCase()}`
const secretKey = process.env[secretEnvName]

if (!secretKey) {
  throw new Error(`Missing ${secretEnvName}`)
}

const stripe = new Stripe(secretKey)

/** Stripe coupon `name` max length is 40 characters. */
function couponDisplayName(regionCode, percentOff) {
  const name = `SILVARA email promo ${percentOff}% (${regionCode.toUpperCase()})`
  if (name.length > 40) {
    throw new Error(`Coupon name too long (${name.length}/40): ${name}`)
  }
  return name
}

async function run() {
  const coupon = await stripe.coupons.create({
    name: couponDisplayName(region, pct),
    percent_off: pct,
    duration: "once",
    metadata: {
      managed_by: "silvara-script",
      purpose: "email_promo_checkout",
      storefront_region: region,
    },
  })

  const envName =
    region === "us"
      ? "STRIPE_EMAIL_PROMO_COUPON_ID_US"
      : "STRIPE_EMAIL_PROMO_COUPON_ID_UK"

  console.log("")
  console.log(`Created coupon in Stripe (${region} account): ${coupon.id}`)
  console.log("")
  console.log(`Add to .env / Vercel:`)
  console.log(`${envName}=${coupon.id}`)
  console.log("")
  console.log(
    "Redeploy after updating env. Percent should match NEXT_PUBLIC_SILVARA_PROMO_PCT.",
  )
  console.log("")
}

run().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
