import { NextResponse } from "next/server"

import { envServer } from "@/lib/env.server"
import { stripe } from "@/lib/stripe/server"

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 })
  }

  if (!envServer.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET in server environment" },
      { status: 500 },
    )
  }

  const body = await request.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      envServer.stripeWebhookSecret,
    )
  } catch (error) {
    console.error("[stripe] invalid webhook signature", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      console.info("[stripe] checkout.session.completed", {
        sessionId: session.id,
        mode: session.mode,
        amountTotal: session.amount_total,
        customerEmail: session.customer_details?.email,
      })
      break
    }
    case "invoice.paid": {
      const invoice = event.data.object
      console.info("[stripe] invoice.paid", {
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        customerId:
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id,
      })
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object
      console.info(`[stripe] ${event.type}`, {
        subscriptionId: subscription.id,
        status: subscription.status,
      })
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
