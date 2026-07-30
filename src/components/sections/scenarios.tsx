import Image from "next/image";

const cases = [
  {
    title: "Warehouse & picks",
    line: "Concrete, pallets, 10k steps before lunch — heat and friction all day.",
    imageSrc: "/warehouse.png",
    imageAlt:
      "Warehouse floor and pallets — long shifts on concrete in work boots",
  },
  {
    title: "Trades & job site",
    line: "Boots, ladders, dust — toe box packed; thin crew keeps stack low.",
    imageSrc: "/tradejob.png",
    imageAlt: "Job site and trades — boots, ladders, and dust on the shift",
  },
  {
    title: "Retail & kitchens",
    line: "Hard floors, non-stop — same socks tomorrow if you do not rotate clean.",
    imageSrc: "/retailkitchen.png",
    imageAlt: "Retail or kitchen shift on hard floors — non-stop on your feet",
  },
  {
    title: "Locker & gear bag",
    line: "Warm bag, no airflow — less bacterial load left in the fabric.",
    imageSrc: "/lockerbag.png",
    imageAlt: "Locker and gear bag — socks packed after a warm shift",
  },
] as const;

export function Scenarios() {
  return (
    <section
      className="scroll-mt-24 border-b-4 border-foreground bg-surface-inverse px-4 py-12 text-background md:px-6 md:py-16"
      aria-labelledby="scenarios-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-background/55">
          Built for the shift
        </p>
        <h2
          id="scenarios-heading"
          className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl"
        >
          Where cheap socks fail
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <article
              key={c.title}
              className="flex flex-col border-4 border-background"
            >
              <div className="relative aspect-[20/11] w-full overflow-hidden border-b-4 border-l-0 border-r-0 border-t-0 border-background">
                <Image
                  src={c.imageSrc}
                  alt={c.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-heading text-base font-extrabold uppercase text-background">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-snug text-background/95">
                  {c.line}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
