/** Shared types for PostHog HogQL row payloads (used by server query + admin UI). */
export type HogQLRow = Record<string, string | number | null>;
