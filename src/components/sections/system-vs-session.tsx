import Image from "next/image";

export function SystemVsSession() {
  return (
    <section
      id="system"
      className="scroll-mt-24 border-b-4 border-foreground bg-muted px-4 py-12 md:px-6 md:py-16"
      aria-labelledby="system-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          30-second read
        </p>
        <h2
          id="system-heading"
          className="font-heading mt-2 max-w-3xl text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl"
        >
          Junk drawer vs workweek
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-snug text-foreground md:text-lg">
          You budget boots, insoles, and wash day — then grab whatever cotton was
          dry? That is the gap.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="flex flex-col border-4 border-foreground bg-background">
            <div className="relative aspect-[16/7] w-full min-h-[160px] overflow-hidden border-b-4 border-foreground">
              <Image
                src="/session.jpg"
                alt="Junk drawer mindset — mismatched socks and work bag chaos"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="p-5 md:p-6">
              <h3 className="font-heading text-xl font-extrabold uppercase">
                Junk drawer
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-snug text-foreground/90 md:text-base">
                <li>• Whatever was dry from the laundry pile.</li>
                <li>• Wet ≠ smell. Bacteria = smell.</li>
                <li>• Sock never got a real spec.</li>
              </ul>
            </div>
          </article>

          <article className="flex flex-col border-4 border-foreground bg-surface-inverse text-background">
            <div className="relative aspect-[16/7] w-full min-h-[160px] overflow-hidden border-b-4 border-background">
              <Image
                src="/system.jpg"
                alt="Workweek setup — work boots and SILVARA crew socks, ordered flat lay"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-95"
              />
            </div>
            <div className="p-5 md:p-6">
              <h3 className="font-heading text-xl font-extrabold uppercase text-background">
                Workweek system
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-snug text-background/95 md:text-base">
                <li>• Boots + sock spec matched to the shift.</li>
                <li>• Silver-active yarn on the fiber.</li>
                <li>• Enough clean pairs — no damp re-wear.</li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
