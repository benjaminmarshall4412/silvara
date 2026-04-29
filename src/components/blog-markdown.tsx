import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";

const p = "text-base leading-relaxed text-foreground/95 md:text-[1.05rem]";
const h2 =
  "font-heading mt-12 border-b-2 border-foreground pb-2 text-2xl font-extrabold uppercase tracking-tight text-foreground first:mt-0 md:text-3xl";
const h3 = "font-heading mt-8 text-xl font-bold uppercase tracking-tight text-foreground md:text-2xl";
const list = "ml-6 list-disc space-y-2 pl-2 text-base leading-relaxed marker:text-accent";
const hrmy = "my-10 border-t-4 border-border";

export function BlogMarkdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => <h2 className={h2}>{children}</h2>,
        h3: ({ children }) => <h3 className={h3}>{children}</h3>,
        p: ({ children }) => <p className={cn(p, "mt-5 first:mt-0")}>{children}</p>,
        ul: ({ children }) => <ul className={cn(list, "mt-4")}>{children}</ul>,
        ol: ({ children }) => <ol className={cn(list, "mt-4 list-decimal")}>{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
        hr: () => <hr className={hrmy} />,
        a: ({ href, children }) => (
          <a
            href={href}
            className="font-medium text-accent underline decoration-2 underline-offset-4 hover:text-foreground"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded-sm border border-foreground bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground">
            {children}
          </code>
        ),
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
