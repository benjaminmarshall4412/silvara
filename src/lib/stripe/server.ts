import Stripe from "stripe"

import { envServer } from "@/lib/env.server"

export const stripe = new Stripe(envServer.stripeSecretKey)
