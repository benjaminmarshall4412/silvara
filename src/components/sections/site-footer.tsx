import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-foreground bg-surface-inverse px-4 py-12 text-background md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-heading text-2xl font-extrabold uppercase">
            SILVARA
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-background/90 md:text-base">
            Odor control for people on their feet all day. Silver-infused yarn.
            Bundles and rotation resupply—built for shifts and work boots, not
            vanity packaging.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <Link
            href="/checkout"
            className="font-mono-label text-sm font-bold uppercase tracking-wide text-background hover:underline"
          >
            Checkout
          </Link>
          <p className="font-mono-label text-xs uppercase tracking-wide text-background/75">
            © {new Date().getFullYear()} SILVARA
          </p>
        </div>
      </div>
    </footer>
  );
}
