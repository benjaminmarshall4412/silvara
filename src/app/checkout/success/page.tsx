import { Suspense } from "react"

import { SuccessContent } from "./success-content"

function SuccessFallback() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-20">
      <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
        Loading confirmation...
      </p>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <SuccessContent />
    </Suspense>
  )
}
