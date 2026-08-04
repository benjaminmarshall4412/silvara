import { NextResponse } from "next/server";

import { notifyNtfy } from "@/lib/ntfy";
import { getPostHogClient } from "@/lib/posthog-server";
import { isSiteRegion } from "@/lib/site-region";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TOPICS = [
  "first-pair-guarantee",
  "order-help",
  "other",
] as const;

type ContactTopic = (typeof TOPICS)[number];

function isTopic(value: unknown): value is ContactTopic {
  return typeof value === "string" && (TOPICS as readonly string[]).includes(value);
}

function topicLabel(topic: ContactTopic): string {
  switch (topic) {
    case "first-pair-guarantee":
      return "First Pair Guarantee";
    case "order-help":
      return "Order help";
    default:
      return "Other";
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  if (!obj) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot — bots fill this; humans never see it.
  if (typeof obj.company === "string" && obj.company.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  const email = typeof obj.email === "string" ? obj.email.trim() : "";
  const orderRef =
    typeof obj.orderRef === "string" ? obj.orderRef.trim().slice(0, 80) : "";
  const message =
    typeof obj.message === "string" ? obj.message.trim().slice(0, 2000) : "";
  const topic = isTopic(obj.topic) ? obj.topic : null;
  const region =
    typeof obj.region === "string" && isSiteRegion(obj.region) ? obj.region : null;

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }
  if (!topic) {
    return NextResponse.json({ error: "Choose a topic." }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json(
      { error: "Tell us a bit more (at least a short sentence)." },
      { status: 400 },
    );
  }

  const ntfyBody = [
    `From: ${name} <${email}>`,
    region ? `Region: ${region.toUpperCase()}` : null,
    orderRef ? `Order / session: ${orderRef}` : null,
    `Topic: ${topicLabel(topic)}`,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  await notifyNtfy({
    title: `Contact · ${topicLabel(topic)}`,
    message: ntfyBody,
    priority: topic === "first-pair-guarantee" ? 4 : 3,
    tags: ["envelope", topic === "first-pair-guarantee" ? "package" : "speech_balloon"],
  });

  try {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: email.toLowerCase(),
      event: "contact_form_submitted",
      properties: {
        topic,
        region,
        has_order_ref: Boolean(orderRef),
      },
    });
    await posthog.shutdown();
  } catch {
    /* analytics must never block support */
  }

  return NextResponse.json({ ok: true });
}
