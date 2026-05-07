import Stripe from "stripe";

import { getStripeSecretKeyForRegion } from "@/lib/env.server";
import type { SiteRegion } from "@/lib/site-region";

const clients = new Map<SiteRegion, Stripe>();

export function getStripeForRegion(region: SiteRegion): Stripe {
  let client = clients.get(region);
  if (!client) {
    client = new Stripe(getStripeSecretKeyForRegion(region));
    clients.set(region, client);
  }
  return client;
}
