import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SILVARA_ADMIN_COOKIE, verifyAdminSessionCookie } from "@/lib/admin-session";
import type { HogQLRow } from "@/lib/posthog-analytics-types";
import { getPostHogQueryConfig, runPostHogHogQL } from "@/lib/posthog-query-api";

/** All SILVARA + PostHog events we surface in the multi-series chart (extend as you add captures). */
const SILVARA_TRACKED_EVENTS = [
  "$pageview",
  "$pageleave",
  "$exception",
  "product_viewed",
  "product_added_to_cart",
  "cart_viewed",
  "cart_item_quantity_changed",
  "cart_item_removed",
  "checkout_started",
  "checkout_session_created",
  "checkout_session_error",
  "order_confirmed",
  "order_completed",
  "scroll_depth",
  "time_on_page",
  "odor_landing_viewed",
  "odor_goal_selected",
  "odor_cta_clicked",
  "odor_sticky_cta_clicked",
  "promo_modal_shown",
  "promo_modal_dismissed",
  "promo_email_submitted",
  "promo_signup_completed",
  "subscription_invoice_paid",
  "subscription_cancelled",
] as const;

const Q_PAGEVIEWS = `
SELECT toDate(timestamp) AS day, count() AS c
FROM events
WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY day
ORDER BY day ASC
`.trim();

const Q_VISITORS = `
SELECT toDate(timestamp) AS day, uniq(distinct_id) AS visitors
FROM events
WHERE timestamp >= now() - INTERVAL 14 DAY
GROUP BY day
ORDER BY day ASC
`.trim();

const Q_FUNNEL = `
SELECT toDate(timestamp) AS day, event, count() AS c
FROM events
WHERE timestamp >= now() - INTERVAL 14 DAY
  AND event IN (${SILVARA_TRACKED_EVENTS.map((e) => `'${e.replace(/'/g, "''")}'`).join(", ")})
GROUP BY day, event
ORDER BY day ASC, event ASC
`.trim();

const Q_TOP = `
SELECT event, count() AS c
FROM events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY event
ORDER BY c DESC
LIMIT 48
`.trim();

const Q_TOP_PATHS = `
SELECT
  ifNull(nullIf(toString(properties.$pathname), ''), '(not set)') AS path,
  count() AS c
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY path
ORDER BY c DESC
LIMIT 14
`.trim();

const Q_TOP_BROWSERS = `
SELECT
  ifNull(nullIf(toString(properties.$browser), ''), '(not set)') AS browser,
  count() AS c
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY browser
ORDER BY c DESC
LIMIT 10
`.trim();

const Q_UTM_SOURCES = `
SELECT
  ifNull(nullIf(toString(properties.utm_source), ''), '(direct / none)') AS utm_source,
  count() AS c
FROM events
WHERE event = '$pageview'
  AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY utm_source
ORDER BY c DESC
LIMIT 12
`.trim();

const Q_SCROLL_BUCKETS = `
SELECT
  ifNull(toString(properties.depth_percent), '(unknown)') AS depth_percent,
  count() AS c
FROM events
WHERE event = 'scroll_depth'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY depth_percent
ORDER BY c DESC
`.trim();

const Q_FUNNEL_TOTALS = `
SELECT event, count() AS c
FROM events
WHERE timestamp >= now() - INTERVAL 7 DAY
  AND event IN (
    'product_viewed',
    'product_added_to_cart',
    'cart_viewed',
    'checkout_started',
    'checkout_session_created',
    'order_confirmed',
    'order_completed'
  )
GROUP BY event
`.trim();

const Q_PURCHASES = `
SELECT
  toDate(timestamp) AS day,
  count() AS orders,
  sum(coalesce(toFloat(properties.amount_total), 0)) AS revenue_cents
FROM events
WHERE event = 'order_completed'
  AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY day
ORDER BY day ASC
`.trim();

const Q_EXCEPTIONS = `
SELECT toDate(timestamp) AS day, count() AS c
FROM events
WHERE event = '$exception'
  AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY day
ORDER BY day ASC
`.trim();

const Q_TIME_ON_PAGE = `
SELECT
  toDate(timestamp) AS day,
  count() AS sessions,
  round(avg(coalesce(toFloat(properties.visible_seconds), 0)), 1) AS avg_visible_sec
FROM events
WHERE event = 'time_on_page'
  AND timestamp >= now() - INTERVAL 14 DAY
GROUP BY day
ORDER BY day ASC
`.trim();

async function runNamed(
  config: NonNullable<ReturnType<typeof getPostHogQueryConfig>>,
  sql: string,
  name: string,
  warnings: string[],
  label: string,
): Promise<HogQLRow[]> {
  const r = await runPostHogHogQL(config, sql, name);
  if (!r.ok) {
    warnings.push(`${label}: ${r.message}`);
    return [];
  }
  return r.data.rows;
}

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

  const warnings: string[] = [];

  const [
    pageviews,
    visitors,
    funnel,
    top,
    topPaths,
    topBrowsers,
    utmSources,
    scrollBuckets,
    funnelTotals,
    purchases,
    exceptions,
    timeOnPage,
  ] = await Promise.all([
    runNamed(config, Q_PAGEVIEWS, "silvara_admin_pageviews", warnings, "Pageviews"),
    runNamed(config, Q_VISITORS, "silvara_admin_visitors", warnings, "Visitors"),
    runNamed(config, Q_FUNNEL, "silvara_admin_funnel", warnings, "Storefront series"),
    runNamed(config, Q_TOP, "silvara_admin_top_events", warnings, "Top events"),
    runNamed(config, Q_TOP_PATHS, "silvara_admin_paths", warnings, "Top paths"),
    runNamed(config, Q_TOP_BROWSERS, "silvara_admin_browsers", warnings, "Browsers"),
    runNamed(config, Q_UTM_SOURCES, "silvara_admin_utm", warnings, "UTM sources"),
    runNamed(config, Q_SCROLL_BUCKETS, "silvara_admin_scroll", warnings, "Scroll depth"),
    runNamed(config, Q_FUNNEL_TOTALS, "silvara_admin_funnel_totals", warnings, "Funnel totals"),
    runNamed(config, Q_PURCHASES, "silvara_admin_purchases", warnings, "Purchases"),
    runNamed(config, Q_EXCEPTIONS, "silvara_admin_exceptions", warnings, "Exceptions"),
    runNamed(config, Q_TIME_ON_PAGE, "silvara_admin_time_on_page", warnings, "Time on page"),
  ]);

  const anyData =
    pageviews.length +
      visitors.length +
      funnel.length +
      top.length +
      topPaths.length +
      topBrowsers.length +
      utmSources.length +
      scrollBuckets.length +
      funnelTotals.length +
      purchases.length +
      exceptions.length +
      timeOnPage.length >
    0;

  if (!anyData && warnings.length > 0) {
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
    pageviewsByDay: pageviews,
    visitorsByDay: visitors,
    conversionByDay: funnel,
    topEvents: top,
    topPaths,
    topBrowsers,
    utmSources,
    scrollDepthBuckets: scrollBuckets,
    funnelTotalsLast7d: funnelTotals,
    purchasesByDay: purchases,
    exceptionsByDay: exceptions,
    timeOnPageByDay: timeOnPage,
    warnings: warnings.length ? warnings : undefined,
  });
}
