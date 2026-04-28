import Image from "next/image";

const bullets = [
  "Sweat is mostly water — smell is microbes.",
  "Long shifts: wet fiber + heat = growth in the boot.",
  "We target bacteria on the sock — not perfume.",
];

export function FailureMode() {
  return (
    <section
      id="failure-mode"
      className="scroll-mt-24 border-b-4 border-foreground bg-muted px-4 py-12 md:px-6 md:py-16"
      aria-labelledby="failure-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="relative aspect-square w-full max-w-md overflow-hidden border-4 border-foreground lg:col-span-5 lg:max-w-none">
            <Image
              src="/closeup.jpg"
              alt="Macro of damp heather grey crew sock knit — wet fiber after a long shift, bacterial odor context"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="lg:col-span-7">
            <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Problem
            </p>
            <h2
              id="failure-heading"
              className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl lg:text-5xl"
            >
              Wet ≠ smell.
              <br />
              Bacteria = smell.
            </h2>
            <ul className="mt-6 space-y-3 text-base leading-snug text-foreground md:text-lg">
              {bullets.map((b) => (
                <li key={b} className="border-l-4 border-accent pl-4">
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-6 font-mono-label text-sm font-semibold uppercase tracking-wide text-accent">
              Functional claim · not cosmetic
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
