"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { useCart } from "@/lib/cart-context"

type SessionStatus = {
  status: string
  paymentStatus: string
  customerEmail: string | null
}

export function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const { clear } = useCart()
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    clear()
  }, [clear])

  useEffect(() => {
    if (!sessionId) return
    const sessionIdParam = sessionId

    let canceled = false

    async function loadStatus() {
      try {
        const response = await fetch(
          `/api/stripe/session-status?session_id=${encodeURIComponent(sessionIdParam)}`,
        )
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load payment status")
        }

        if (!canceled) {
          setSessionStatus(payload)
        }
      } catch (error) {
        if (!canceled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load payment status",
          )
        }
      }
    }

    void loadStatus()

    return () => {
      canceled = true
    }
  }, [sessionId])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-20">
      <p className="font-mono-label text-xs uppercase tracking-widest text-accent">
        Payment received
      </p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold uppercase md:text-4xl">
        Thanks - your order is confirmed
      </h1>
      <p className="mt-4 text-muted-foreground">
        Stripe sent your receipt by email. We will fulfill this order from the
        details in your Stripe checkout session.
      </p>

      {sessionStatus ? (
        <div className="mt-8 border-4 border-foreground bg-muted px-4 py-4 md:px-5">
          <p className="font-mono-label text-xs uppercase tracking-wide text-muted-foreground">
            Session status
          </p>
          <p className="mt-2 text-sm">
            Checkout: <strong>{sessionStatus.status}</strong>
          </p>
          <p className="text-sm">
            Payment: <strong>{sessionStatus.paymentStatus}</strong>
          </p>
          {sessionStatus.customerEmail ? (
            <p className="text-sm">
              Receipt: <strong>{sessionStatus.customerEmail}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-6 font-mono-label text-xs uppercase tracking-wide text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <Link
        href="/#loadouts"
        className="mt-10 inline-flex h-12 items-center border-4 border-foreground bg-accent px-6 font-heading text-sm font-extrabold uppercase text-accent-foreground"
      >
        Continue shopping
      </Link>
    </div>
  )
}
