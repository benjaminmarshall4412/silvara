import Link from "next/link";

import { blogPosts } from "@/lib/blog";

export const metadata = {
  title: "Field notes · SILVARA",
  description:
    "Reads on socks for long shifts, work boots, and what silver actually does in fabric.",
};

function formatBlogDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <p className="font-mono-label text-xs uppercase tracking-[0.2em] text-muted-foreground">
        SILVARA
      </p>
      <h1 className="font-heading mt-2 text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl">
        Field notes
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground/90 md:text-lg">
        Junk-drawer guesswork vs a workweek system — longer reads on what holds up in boots.
      </p>
      <ul className="mt-12 space-y-0 border-4 border-foreground">
        {blogPosts.map((post) => (
          <li
            key={post.slug}
            className="border-b-4 border-foreground bg-background last:border-b-0"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-2 px-5 py-6 transition-colors hover:bg-muted md:px-6 md:py-8"
            >
              <span className="font-mono-label text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                {post.eyebrow} · {formatBlogDate(post.date)}
              </span>
              <span className="font-heading text-xl font-extrabold uppercase tracking-tight group-hover:text-accent md:text-2xl">
                {post.title}
              </span>
              <span className="max-w-[60ch] text-sm leading-snug text-foreground/85 md:text-base">
                {post.description}
              </span>
              <span className="font-mono-label text-xs font-semibold uppercase tracking-widest text-accent">
                Read →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/#loadouts"
        className="mt-12 inline-block font-mono-label text-xs uppercase tracking-widest text-foreground underline decoration-foreground/40 underline-offset-4 hover:text-accent"
      >
        ← Back to shop
      </Link>
    </div>
  );
}
