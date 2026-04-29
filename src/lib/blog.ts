import fs from "node:fs/promises";
import path from "node:path";

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  eyebrow: string;
  imageSrc: string;
  imageAlt: string;
  theme: "light" | "inverse";
};

export const blogPosts: BlogPostMeta[] = [
  {
    slug: "best-socks-12-hour-shifts",
    title: "Best Socks for 12-Hour Shifts: What Actually Works",
    description:
      "Why most socks fail mid-shift, which materials survive boots, construction details that matter, and how many pairs keeps you off the junk-drawer scramble.",
    date: "2026-02-01",
    eyebrow: "Junk drawer",
    imageSrc: "/session.jpg",
    imageAlt: "Messy gym bag — mismatched socks pulled from whatever was dry",
    theme: "light",
  },
  {
    slug: "silver-socks-gimmick-or-science",
    title: "Silver Socks: Marketing Gimmick or Legit Science?",
    description:
      "How silver ions behave against bacteria on fabric, coatings vs fibres, what to verify before buying, and when silver socks genuinely help.",
    date: "2026-03-01",
    eyebrow: "Workweek system",
    imageSrc: "/system.jpg",
    imageAlt: "Flat lay — ordered crew socks with boots nearby",
    theme: "inverse",
  },
];

export function getPostMeta(slug: string): BlogPostMeta | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export async function loadPostMarkdown(slug: string): Promise<string | null> {
  const filePath = path.join(
    process.cwd(),
    "src/content/blog",
    `${slug}.md`,
  );
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}
