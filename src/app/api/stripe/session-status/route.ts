import { NextResponse } from "next/server"

import { stripe } from "@/lib/stripe/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return NextResponse.json({
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email ?? null,
    })
  } catch (error) {
    console.error("[stripe] failed to fetch session status", error)
    return NextResponse.json(
      { error: "Unable to load session status" },
      { status: 400 },
    )
  }
}
