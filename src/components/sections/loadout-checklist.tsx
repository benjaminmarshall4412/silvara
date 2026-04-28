import Image from "next/image";

type LoadoutRow = { title: string; highlight?: boolean };

const rows: LoadoutRow[] = [
  { title: "Boots & insoles dialed for the job" },
  { title: "Wash day that matches your shift count" },
  { title: "No damp re-wear between days" },
  { title: "Fiber spec — silver-active crew sock", highlight: true },
];

export function LoadoutChecklist() {
  return (
    <section
      id="loadout"
      className="scroll-mt-24 border-b-4 border-foreground bg-background px-4 py-12 md:px-6 md:py-16"
      aria-labelledby="loadout-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <div className="relative aspect-[5/6] w-full max-h-[420px] overflow-hidden border-4 border-foreground lg:max-h-none">
              <Image
                src="/serious.jpg"
                alt="Work kit flat lay — boots and essentials with SILVARA"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Checklist
            </p>
            <h2
              id="loadout-heading"
              className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl"
            >
              Serious work kit
            </h2>
            <p className="mt-3 max-w-xl text-base leading-snug text-foreground/90">
              Four lines. Most crews skip the last.
            </p>

            <ul className="mt-8 space-y-0 border-4 border-foreground">
              {rows.map((row) => (
                <li
                  key={row.title}
                  className={`flex items-center gap-4 border-b-4 border-foreground px-4 py-4 last:border-b-0 md:px-5 md:py-5 ${
                    row.highlight ? "bg-accent/25" : "bg-background"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-accent text-sm font-extrabold text-accent-foreground">
                    ✓
                  </span>
                  <span className="font-heading text-base font-extrabold uppercase leading-tight md:text-lg">
                    {row.title}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#loadouts"
              className="mt-6 inline-flex font-mono-label text-sm font-bold uppercase tracking-wide text-accent underline decoration-2 underline-offset-4"
            >
              Close the gap → loadouts
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
