import { PlaceholderImage } from "@/components/placeholder-image";

const cases = [
  {
    title: "Warehouse & picks",
    label: "FLOOR",
    line: "Concrete, pallets, 10k steps before lunch — heat and friction all day.",
  },
  {
    title: "Trades & job site",
    label: "SITE",
    line: "Boots, ladders, dust — toe box packed; thin crew keeps stack low.",
  },
  {
    title: "Retail & kitchens",
    label: "SHIFT",
    line: "Hard floors, non-stop — same socks tomorrow if you do not rotate clean.",
  },
  {
    title: "Locker & gear bag",
    label: "BAG",
    line: "Warm bag, no airflow — less bacterial load left in the fabric.",
  },
] as const;

export function Scenarios() {
  return (
    <section
      className="scroll-mt-24 border-b-4 border-foreground bg-surface-inverse px-4 py-12 text-background md:px-6 md:py-16"
      aria-labelledby="scenarios-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-background/80">
          On your feet all day
        </p>
        <h2
          id="scenarios-heading"
          className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl"
        >
          Where cheap socks lose
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <article
              key={c.title}
              className="flex flex-col border-4 border-background"
            >
              <PlaceholderImage
                width={400}
                height={220}
                label={c.label}
                sizes="(max-width: 640px) 100vw, 25vw"
                className="aspect-[20/11] w-full !border-background border-b-4 border-l-0 border-r-0 border-t-0"
              />
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
