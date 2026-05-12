import { PostHog } from "posthog-node";

const DEFAULT_POSTHOG_INGEST_HOST = "https://us.i.posthog.com";

export function getPostHogClient(): PostHog {
  return new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_INGEST_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}
