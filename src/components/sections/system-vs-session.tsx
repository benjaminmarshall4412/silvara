import Image from "next/image";
import Link from "next/link";

import { blogPosts } from "@/lib/blog";
import { cn } from "@/lib/utils";

function formatBlogDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SystemVsSession() {
  return (
    <section
      id="system"
      className="scroll-mt-24 border-b-4 border-foreground bg-muted px-4 py-12 md:px-6 md:py-16"
      aria-labelledby="system-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-mono-label text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Field notes
        </p>
        <h2
          id="system-heading"
          className="font-heading mt-2 max-w-3xl text-3xl font-extrabold uppercase leading-tight tracking-tight md:text-4xl"
        >
          Junk drawer vs workweek
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-snug text-foreground md:text-lg">
          You budget boots, insoles, and wash day — then grab whatever cotton was
          dry? That is the gap. Tap through for full reads.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={cn(
                "group flex flex-col border-4 border-foreground outline-offset-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground",
                post.theme === "inverse"
                  ? "bg-surface-inverse text-background hover:bg-surface-inverse/92"
                  : "bg-background hover:bg-background/92",
              )}
              aria-labelledby={`blog-card-${post.slug}`}
            >
              <div
                className={cn(
                  "relative aspect-[16/7] w-full min-h-[160px] overflow-hidden border-b-4 border-foreground",
                  post.theme === "inverse" && "border-background opacity-95",
                )}
              >
                <Image
                  src={post.imageSrc}
                  alt={post.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 md:p-6">
                <span
                  className={cn(
                    "font-mono-label text-[0.65rem] font-bold uppercase tracking-[0.2em]",
                    post.theme === "inverse"
                      ? "text-background/65"
                      : "text-muted-foreground",
                  )}
                >
                  {post.eyebrow} · {formatBlogDate(post.date)}
                </span>
                <span
                  id={`blog-card-${post.slug}`}
                  className="font-heading mt-2 text-xl font-extrabold uppercase leading-snug md:text-2xl"
                >
                  {post.title}
                </span>
                <p
                  className={cn(
                    "mt-3 flex-1 text-sm leading-snug md:text-[0.95rem]",
                    post.theme === "inverse" ? "text-background/90" : "text-foreground/90",
                  )}
                >
                  {post.description}
                </p>
                <span className="font-mono-label mt-4 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-accent">
                  Read article →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center md:text-left">
          <Link
            href="/blog"
            className="font-mono-label text-sm font-semibold uppercase tracking-wide text-foreground underline decoration-2 underline-offset-4 hover:text-accent"
          >
            Browse all reads →
          </Link>
        </p>
      </div>
    </section>
  );
}
