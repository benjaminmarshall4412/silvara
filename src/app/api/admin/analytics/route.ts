import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SILVARA_ADMIN_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";
import { getPostHogQueryConfig, runPostHogHogQL } from "@/lib/posthog-query-api";

const Q_PAGEVIEWS = `
SELECT toDate(timestamp) AS day, count() AS c
FROM events
WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY day
ORDER BY day ASC
`.trim();

const Q_FUNNEL = `
SELECT toDate(timestamp) AS day, event, count() AS c
FROM events
WHERE timestamp >= now() - INTERVAL 14 DAY
  AND event IN (
    '$pageview',
    'product_viewed',
    'product_added_to_cart',
    'cart_viewed',
    'checkout_started',
    'checkout_session_created',
    'order_confirmed',
    'order_completed',
    'scroll_depth',
    'time_on_page',
    'promo_modal_shown',
    'promo_email_submitted',
    'promo_signup_completed'
  )
GROUP BY day, event
ORDER BY day ASC, event ASC
`.trim();

const Q_TOP = `
SELECT event, count() AS c
FROM events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY event
ORDER BY c DESC
LIMIT 32
`.trim();

export async function GET() {
  const store = await cookies();
  if (!verifyAdminSessionCookie(store.get(SILVARA_ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getPostHogQueryConfig();
  if (!config) {
    return NextResponse.json(
      {
        error: "missing_posthog",
        message:
          "Set POSTHOG_PROJECT_ID (numeric, from Project settings) and POSTHOG_PERSONAL_API_KEY (personal API key with Query read). Optional: POSTHOG_QUERY_HOST (default https://us.posthog.com).",
      },
      { status: 503 },
    );
  }

  const appHost = config.host.includes("eu.posthog")
    ? "https://eu.posthog.com"
    : "https://us.posthog.com";

  const [pageviews, funnel, top] = await Promise.all([
    runPostHogHogQL(config, Q_PAGEVIEWS, "silvara_admin_pageviews"),
    runPostHogHogQL(config, Q_FUNNEL, "silvara_admin_funnel"),
    runPostHogHogQL(config, Q_TOP, "silvara_admin_top_events"),
  ]);

  const warnings: string[] = [];
  if (!pageviews.ok) warnings.push(`Pageviews query: ${pageviews.message}`);
  if (!funnel.ok) warnings.push(`Conversion query: ${funnel.message}`);
  if (!top.ok) warnings.push(`Top events query: ${top.message}`);

  if (!pageviews.ok && !funnel.ok && !top.ok) {
    return NextResponse.json(
      {
        error: "all_queries_failed",
        messages: warnings,
        posthogProjectId: config.projectId,
        posthogAppHost: appHost,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    posthogProjectId: config.projectId,
    posthogAppHost: appHost,
    pageviewsByDay: pageviews.ok ? pageviews.data.rows : [],
    conversionByDay: funnel.ok ? funnel.data.rows : [],
    topEvents: top.ok ? top.data.rows : [],
    warnings: warnings.length ? warnings : undefined,
  });
}
