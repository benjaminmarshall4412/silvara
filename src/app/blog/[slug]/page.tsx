import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogMarkdown } from "@/components/blog-markdown";
import {
  blogPosts,
  getPostMeta,
  loadPostMarkdown,
} from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

function formatBlogDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostMeta(slug);
  if (!post) return {};
  return {
    title: `${post.title} · SILVARA`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const meta = getPostMeta(slug);
  const raw = await loadPostMarkdown(slug);

  if (!meta || raw === null || raw.trim() === "") {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <p className="font-mono-label text-[0.65rem] uppercase tracking-[0.28em] text-muted-foreground">
        <Link href="/blog" className="hover:text-foreground">
          Field notes
        </Link>
        {" · "}
        {meta.eyebrow}
      </p>
      <time
        className="mt-2 block font-mono-label text-xs text-muted-foreground"
        dateTime={meta.date}
      >
        {formatBlogDate(meta.date)}
      </time>
      <h1 className="font-heading mt-4 max-w-[22ch] text-3xl font-extrabold uppercase leading-[0.97] tracking-tight text-foreground md:text-5xl md:leading-[0.95]">
        {meta.title}
      </h1>
      <div className="blog-post mt-10">
        <BlogMarkdown source={raw.trim()} />
      </div>
      <div className="mt-16 border-t-4 border-foreground pt-8">
        <Link
          href="/#loadouts"
          className="inline-flex min-h-12 cursor-pointer items-center border-4 border-transparent bg-accent px-6 font-heading text-sm font-extrabold uppercase tracking-wide text-accent-foreground hover:bg-accent/90 md:text-base"
        >
          Shop loadouts
        </Link>
        <Link
          href="/blog"
          className="ml-6 font-mono-label text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          All reads
        </Link>
      </div>
    </article>
  );
}
