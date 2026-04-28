import "server-only"

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function optional(name: string): string | undefined {
  const value = process.env[name]
  if (!value) return undefined
  return value
}

export const envServer = {
  stripeSecretKey: required("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  stripePriceSingle: required("STRIPE_PRICE_SINGLE"),
  stripePriceTriple: required("STRIPE_PRICE_TRIPLE"),
  stripePriceSix: required("STRIPE_PRICE_SIX"),
  stripePriceRotation: required("STRIPE_PRICE_ROTATION"),
}
