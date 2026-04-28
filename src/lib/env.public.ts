function requiredPublic(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const fallbackSiteUrl = "http://localhost:3000"

export const envPublic = {
  stripePublishableKey: requiredPublic("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl,
}
