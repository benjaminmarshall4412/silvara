import fs from "node:fs/promises"
import path from "node:path"

import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY")
}

const stripe = new Stripe(secretKey)

const catalog = [
  {
    bundleId: "single",
    productName: "SILVARA 1 PAIR",
    description: "Single pair trial pack",
    amount: 1800,
    lookupKey: "silvara_single_usd_onetime_v1",
    recurring: null,
    envKey: "STRIPE_PRICE_SINGLE",
  },
  {
    bundleId: "triple",
    productName: "SILVARA 3-PACK",
    description: "Main workweek rotation bundle",
    amount: 4200,
    lookupKey: "silvara_triple_usd_onetime_v1",
    recurring: null,
    envKey: "STRIPE_PRICE_TRIPLE",
  },
  {
    bundleId: "six",
    productName: "SILVARA 6-PACK",
    description: "Best per-pair value bundle",
    amount: 7200,
    lookupKey: "silvara_six_usd_onetime_v1",
    recurring: null,
    envKey: "STRIPE_PRICE_SIX",
  },
  {
    bundleId: "rotation",
    productName: "SILVARA FRESH ROTATION",
    description: "Subscription resupply shipment",
    amount: 3800,
    lookupKey: "silvara_rotation_usd_subscription_v1",
    recurring: { interval: "month", interval_count: 2 },
    envKey: "STRIPE_PRICE_ROTATION",
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

  return stripe.prices.create({
    product: productId,
    unit_amount: item.amount,
    currency: "usd",
    lookup_key: item.lookupKey,
    recurring: item.recurring,
    metadata: {
      bundle_id: item.bundleId,
      managed_by: "silvara-script",
    },
  })
}

async function run() {
  const envLines = []

  for (const item of catalog) {
    const product = await getOrCreateProduct(item)
    const price = await getOrCreatePrice(item, product.id)
    envLines.push(`${item.envKey}=${price.id}`)
  }

  const outputPath = path.join(process.cwd(), "stripe-price-ids.local.txt")
  const output = `${envLines.join("\n")}\n`

  await fs.writeFile(outputPath, output, "utf8")

  console.log("Stripe catalog synced.")
  console.log("")
  console.log(output.trim())
  console.log("")
  console.log(`Saved to ${outputPath}`)
}

run().catch((error) => {
  console.error("Failed to sync Stripe catalog", error)
  process.exitCode = 1
})
