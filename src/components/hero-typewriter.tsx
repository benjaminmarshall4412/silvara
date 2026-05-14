"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const WORDS = [
  "Silver yarn",
  "Not perfume",
  "Bacteria on fiber",
  "Thin crew fit",
  "Same sock every pack",
] as const;

const TYPE_MS = 72;
const DELETE_MS = 42;
const HOLD_MS = 2000;
const BETWEEN_MS = 380;

type Props = {
  className?: string;
};

export function HeroTypewriter({ className }: Props) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = WORDS[i % WORDS.length];
    let t: ReturnType<typeof setTimeout>;

    if (!deleting) {
      if (text.length < full.length) {
        t = setTimeout(() => setText(full.slice(0, text.length + 1)), TYPE_MS);
      } else {
        t = setTimeout(() => setDeleting(true), HOLD_MS);
      }
    } else if (text.length > 0) {
      t = setTimeout(() => setText((s) => s.slice(0, -1)), DELETE_MS);
    } else {
      t = setTimeout(() => {
        setDeleting(false);
        setI((n) => (n + 1) % WORDS.length);
      }, BETWEEN_MS);
    }

    return () => clearTimeout(t);
  }, [text, deleting, i]);

  return (
    <span
      className={cn(
        "mt-[0.12em] block w-full min-w-0 max-w-full text-balance leading-[0.98]",
        className,
      )}
      aria-hidden
    >
      <span className="inline-block min-h-[1.2em] w-full min-w-0 max-w-full break-words align-top">
        {text}
        <span
          className="ms-1 inline-block h-[0.72em] w-[0.1em] shrink-0 animate-pulse bg-current align-[-0.05em] opacity-90 sm:ms-1.5 sm:h-[0.75em] sm:w-[0.12em]"
          aria-hidden
        />
      </span>
    </span>
  );
}
