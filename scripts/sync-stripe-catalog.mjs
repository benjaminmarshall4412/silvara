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

/** US keys unchanged — matches existing Stripe dashboard prices from earlier syncs. */
const LOOKUP_KEYS = {
  us: {
    single: "silvara_single_usd_onetime_v1",
    triple: "silvara_triple_usd_onetime_v1",
    six: "silvara_six_usd_onetime_v1",
    rotation: "silvara_rotation_usd_subscription_v1",
  },
  uk: {
    single: "silvara_single_uk_usd_onetime_v1",
    triple: "silvara_triple_uk_usd_onetime_v1",
    six: "silvara_six_uk_usd_onetime_v1",
    rotation: "silvara_rotation_uk_usd_subscription_v1",
  },
}[region]

const catalog = [
  {
    bundleId: "single",
    productName: "SILVARA 1 PAIR",
    description: "Single pair trial pack",
    amount: 1800,
    lookupKey: LOOKUP_KEYS.single,
    envKey: `STRIPE_PRICE_SINGLE_${region.toUpperCase()}`,
  },
  {
    bundleId: "triple",
    productName: "SILVARA 3-PACK",
    description: "Main workweek rotation bundle",
    amount: 4200,
    lookupKey: LOOKUP_KEYS.triple,
    envKey: `STRIPE_PRICE_TRIPLE_${region.toUpperCase()}`,
  },
  {
    bundleId: "six",
    productName: "SILVARA 6-PACK",
    description: "Best per-pair value bundle",
    amount: 7200,
    lookupKey: LOOKUP_KEYS.six,
    envKey: `STRIPE_PRICE_SIX_${region.toUpperCase()}`,
  },
  {
    bundleId: "rotation",
    productName: "SILVARA FRESH ROTATION",
    description: "Subscription resupply shipment",
    amount: 3800,
    lookupKey: LOOKUP_KEYS.rotation,
    recurring: { interval: "month", interval_count: 2 },
    envKey: `STRIPE_PRICE_ROTATION_${region.toUpperCase()}`,
  },
]

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
    currency: "usd",
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

  console.log(`Stripe catalog synced (${region}).`)
  console.log("")
  console.log(envLines.join("\n"))
  console.log("")
  console.log(`Saved to ${outputPath}`)
}

run().catch((error) => {
  console.error("Failed to sync Stripe catalog", error)
  process.exitCode = 1
})
