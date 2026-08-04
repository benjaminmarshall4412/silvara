"use client";

import posthog from "posthog-js";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useSiteRegion } from "@/lib/site-region-context";
import { cn } from "@/lib/utils";

const TOPICS = [
  { value: "first-pair-guarantee", label: "First Pair Guarantee" },
  { value: "order-help", label: "Order help" },
  { value: "other", label: "Something else" },
] as const;

type Props = {
  /** Prefill topic when opened from the guarantee section. */
  defaultTopic?: (typeof TOPICS)[number]["value"];
  className?: string;
};

export function ContactForm({
  defaultTopic = "first-pair-guarantee",
  className,
}: Props) {
  const region = useSiteRegion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [topic, setTopic] = useState<(typeof TOPICS)[number]["value"]>(
    defaultTopic,
  );
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          orderRef,
          topic,
          message,
          company,
          region,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? "Could not send. Try again.");
        setStatus("error");
        return;
      }
      posthog.capture("contact_form_submitted", { topic, region });
      setStatus("done");
      setMessage("");
      setOrderRef("");
    } catch {
      setErrorMsg("Could not reach the server.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        className={cn(
          "rounded-none border border-[#21130e]/15 bg-[#fffaf2] p-6 sm:p-8",
          className,
        )}
      >
        <p className="font-heading text-2xl font-extrabold uppercase">
          Message sent
        </p>
        <p className="mt-3 text-base leading-relaxed text-[#5c514a]">
          We’ll get back to you by email. If this is a First Pair Guarantee
          request, include your order email and keep the two unused pairs ready
          to ship back.
        </p>
      </div>
    );
  }

  const fieldClass =
    "mt-1.5 w-full min-h-11 rounded-none border border-[#21130e]/20 bg-white px-3 text-base text-[#21130e] outline-none focus-visible:border-[#b84a2d] focus-visible:ring-2 focus-visible:ring-[#b84a2d]/25";

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "relative rounded-none border border-[#21130e]/15 bg-[#fffaf2] p-6 sm:p-8",
        className,
      )}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[#5c514a]">
          Name
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm font-semibold text-[#5c514a]">
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-[#5c514a]">
        Topic
        <select
          name="topic"
          value={topic}
          onChange={(e) =>
            setTopic(e.target.value as (typeof TOPICS)[number]["value"])
          }
          className={fieldClass}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-semibold text-[#5c514a]">
        Order email or Stripe receipt (optional)
        <input
          type="text"
          name="orderRef"
          value={orderRef}
          onChange={(e) => setOrderRef(e.target.value)}
          placeholder="Helps us find your order faster"
          className={fieldClass}
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-[#5c514a]">
        Message
        <textarea
          name="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={cn(fieldClass, "min-h-[8rem] resize-y py-2.5")}
        />
      </label>

      {/* Honeypot */}
      <label className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0">
        Company
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </label>

      {errorMsg ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={status === "loading"}
        className="mt-5 h-12 w-full rounded-none border-0 bg-[#b84a2d] text-sm font-extrabold uppercase tracking-wide text-white hover:bg-[#a23e25] sm:w-auto sm:px-8"
      >
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
