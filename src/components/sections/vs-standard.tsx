import Image from "next/image";

const rows = [
  {
    metric: "Odor driver",
    standard: "Wet fiber → bacterial growth",
    silversocks: "Silver yarn vs odor bacteria on sock",
  },
  {
    metric: "Shift",
    standard: "Same boot, ignored sock",
    silversocks: "Spec for repeat days on hard floors",
  },
  {
    metric: "Profile",
    standard: "Thick / loose",
    silversocks: "Thin crew — room in the toe box",
  },
] as const;

export function VsStandard() {
  return (
    <section
      id="compare"
      className="scroll-mt-24 border-b-4 border-foreground bg-background px-4 py-12 md:px-6 md:py-16"
      aria-labelledby="compare-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Image
          src="/vs-compare-strip.png"
          alt="Typical thick crew sock beside SILVARA thin crew sock — same surface and lighting"
          width={1916}
          height={821}
          sizes="(max-width: 1200px) 100vw, 1152px"
          className="mb-8 w-full border-4 border-foreground bg-muted h-auto"
        />
        <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick contrast
        </p>
        <h2
          id="compare-heading"
          className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl"
        >
          vs the usual pack
        </h2>
        <div className="mt-6 overflow-x-auto border-4 border-foreground">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm md:text-base">
            <thead>
              <tr className="border-b-4 border-foreground bg-muted">
                <th
                  scope="col"
                  className="font-mono-label p-3 text-xs font-bold uppercase md:p-4 md:text-sm"
                >
                  —
                </th>
                <th
                  scope="col"
                  className="font-mono-label p-3 text-xs font-bold uppercase md:p-4 md:text-sm"
                >
                  Typical
                </th>
                <th
                  scope="col"
                  className="font-mono-label bg-accent p-3 text-xs font-bold uppercase text-accent-foreground md:p-4 md:text-sm"
                >
                  SILVARA
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.metric}
                  className="border-b-2 border-foreground last:border-b-0"
                >
                  <th
                    scope="row"
                    className="font-heading p-3 text-xs font-extrabold uppercase md:w-36 md:p-4 md:text-sm"
                  >
                    {r.metric}
                  </th>
                  <td className="p-3 text-muted-foreground md:p-4">
                    {r.standard}
                  </td>
                  <td className="border-l-2 border-foreground bg-muted/40 p-3 font-medium md:p-4">
                    {r.silversocks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
