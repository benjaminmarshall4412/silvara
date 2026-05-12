import "server-only";

import type { HogQLRow } from "@/lib/posthog-analytics-types";

export type ParsedHogQL = {
  columns: string[];
  rows: HogQLRow[];
};

function parseHogQLResponse(json: unknown): ParsedHogQL | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  const results = j.results;
  const columns = j.columns;
  if (!Array.isArray(results) || !Array.isArray(columns)) return null;
  const colNames = columns.map((c) => String(c));
  const rows: HogQLRow[] = [];
  for (const row of results) {
    if (!Array.isArray(row)) continue;
    const obj: HogQLRow = {};
    colNames.forEach((c, i) => {
      const v = row[i];
      if (v === null || v === undefined) obj[c] = null;
      else if (typeof v === "number" || typeof v === "string") obj[c] = v;
      else if (typeof v === "bigint") obj[c] = Number(v);
      else obj[c] = String(v);
    });
    rows.push(obj);
  }
  return { columns: colNames, rows };
}

export type PostHogQueryConfig = {
  host: string;
  projectId: string;
  personalApiKey: string;
};

export function getPostHogQueryConfig(): PostHogQueryConfig | null {
  const host = (
    process.env.POSTHOG_QUERY_HOST ?? "https://us.posthog.com"
  ).replace(/\/$/, "");
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  if (!projectId || !personalApiKey) return null;
  return { host, projectId, personalApiKey };
}

export async function runPostHogHogQL(
  config: PostHogQueryConfig,
  query: string,
  name: string,
): Promise<{ ok: true; data: ParsedHogQL } | { ok: false; status: number; message: string }> {
  const url = `${config.host}/api/projects/${config.projectId}/query/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.personalApiKey}`,
    },
    body: JSON.stringify({
      query: { kind: "HogQLQuery", query },
      name,
    }),
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    return {
      ok: false,
      status: res.status,
      message: res.ok ? "Invalid JSON from PostHog" : text.slice(0, 200),
    };
  }
  if (!res.ok) {
    const detail =
      json && typeof json === "object" && "detail" in json
        ? String((json as { detail: unknown }).detail)
        : text.slice(0, 300);
    return { ok: false, status: res.status, message: detail || res.statusText };
  }
  const parsed = parseHogQLResponse(json);
  if (!parsed) {
    return {
      ok: false,
      status: 500,
      message: "Unexpected PostHog response shape (missing columns/results)",
    };
  }
  return { ok: true, data: parsed };
}
