import fs from "node:fs/promises"
import path from "node:path"

import Stripe from "stripe"

function resolveRegion() {
  const fromArgv = process.argv.find((a) => a.startsWith("--region="))?.slice("--region=".length)
  const raw = (fromArgv ?? process.env.STRIPE_SYNC_REGION ?? "us").toLowerCase().trim()
  if (raw !== "us" && raw !== "uk") {
    throw new Error(`Invalid region "${raw}" — use us or uk (or STRIPE_SYNC_REGION).`)
  }
  return raw
}

const region = resolveRegion()
const secretEnvName = `STRIPE_SECRET_KEY_${region.toUpperCase()}`
const secretKey = process.env[secretEnvName]

if (!secretKey) {
  throw new Error(`Missing ${secretEnvName}`)
}

const stripe = new Stripe(secretKey)

/** UK storefront uses GBP; US unchanged (USD). */
const stripeCurrency = region === "uk" ? "gbp" : "usd"

/** Per-region catalog amounts (minor units) and lookup keys. Bump lookup key version when changing a live price. */
const CATALOG_BY_REGION = {
  us: [
    {
      bundleId: "single",
      productName: "SILVARA 1 PAIR",
      description: "Single pair trial pack",
      amount: 2000,
      lookupKey: "silvara_single_usd_onetime_v1",
      envKey: "STRIPE_PRICE_SINGLE_US",
    },
    {
      bundleId: "triple",
      productName: "SILVARA 3-PACK",
      description: "Main workweek rotation bundle",
      amount: 4800,
      lookupKey: "silvara_triple_usd_onetime_v2",
      envKey: "STRIPE_PRICE_TRIPLE_US",
    },
    {
      bundleId: "six",
      productName: "SILVARA 6-PACK",
      description: "Best per-pair value bundle",
      amount: 7200,
      lookupKey: "silvara_six_usd_onetime_v1",
      envKey: "STRIPE_PRICE_SIX_US",
    },
    {
      bundleId: "rotation",
      productName: "SILVARA FRESH ROTATION",
      description: "Subscription resupply shipment",
      amount: 3800,
      lookupKey: "silvara_rotation_usd_subscription_v1",
      recurring: { interval: "month", interval_count: 2 },
      envKey: "STRIPE_PRICE_ROTATION_US",
    },
  ],
  uk: [
    {
      bundleId: "single",
      productName: "SILVARA 1 PAIR",
      description: "Single pair trial pack",
      amount: 1599,
      lookupKey: "silvara_single_uk_gbp_onetime_v2",
      envKey: "STRIPE_PRICE_SINGLE_UK",
    },
    {
      bundleId: "triple",
      productName: "SILVARA 3-PACK",
      description: "Main workweek rotation bundle",
      amount: 3600,
      lookupKey: "silvara_triple_uk_gbp_onetime_v3",
      envKey: "STRIPE_PRICE_TRIPLE_UK",
    },
    {
      bundleId: "six",
      productName: "SILVARA 6-PACK",
      description: "Best per-pair value bundle",
      amount: 7200,
      lookupKey: "silvara_six_uk_gbp_onetime_v1",
      envKey: "STRIPE_PRICE_SIX_UK",
    },
    {
      bundleId: "rotation",
      productName: "SILVARA FRESH ROTATION",
      description: "Subscription resupply shipment",
      amount: 3800,
      lookupKey: "silvara_rotation_uk_gbp_subscription_v1",
      recurring: { interval: "month", interval_count: 2 },
      envKey: "STRIPE_PRICE_ROTATION_UK",
    },
  ],
}

const catalog = CATALOG_BY_REGION[region]

async function getOrCreateProduct(item) {
  const existing = await stripe.products.list({
    active: true,
    limit: 100,
  })

  const found = existing.data.find((product) => product.metadata?.bundle_id === item.bundleId)
  if (found) return found

  return stripe.products.create({
    name: item.productName,
    description: item.description,
    metadata: {
      bundle_id: item.bundleId,
      managed_by: "silvara-script",
      storefront_region: region,
    },
  })
}

async function getOrCreatePrice(item, productId) {
  const existing = await stripe.prices.list({
    active: true,
    lookup_keys: [item.lookupKey],
    limit: 1,
  })

  if (existing.data.length > 0) return existing.data[0]

  const params = {
    product: productId,
    unit_amount: item.amount,
    currency: stripeCurrency,
    lookup_key: item.lookupKey,
    metadata: {
      bundle_id: item.bundleId,
      managed_by: "silvara-script",
      storefront_region: region,
    },
  }
  // One-time prices must omit `recurring`; Stripe rejects `recurring: null`.
  if (item.recurring) {
    params.recurring = item.recurring
  }
  return stripe.prices.create(params)
}

async function run() {
  const envLines = []

  for (const item of catalog) {
    const product = await getOrCreateProduct(item)
    const price = await getOrCreatePrice(item, product.id)
    envLines.push(`${item.envKey}=${price.id}`)
  }

  const outputPath = path.join(process.cwd(), `stripe-price-ids.${region}.local.txt`)
  const output = `# Region: ${region} (${secretEnvName})\n${envLines.join("\n")}\n`

  await fs.writeFile(outputPath, output, "utf8")

  console.log(`Stripe catalog synced (${region}, currency=${stripeCurrency}).`)
  console.log("")
  console.log(envLines.join("\n"))
  console.log("")
  console.log(`Saved to ${outputPath}`)
}

run().catch((error) => {
  console.error("Failed to sync Stripe catalog", error)
  process.exitCode = 1
})
