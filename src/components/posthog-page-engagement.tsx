"use client";

import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { useEffect } from "react";

const SCROLL_BUCKETS = [25, 50, 75, 100] as const;

function scrollDepthPercent(): number {
  const el = document.documentElement;
  const scrollHeight = el.scrollHeight;
  const viewBottom = window.scrollY + window.innerHeight;
  if (scrollHeight <= 0) return 100;
  return Math.min(100, Math.round((100 * viewBottom) / scrollHeight));
}

/**
 * Scroll milestones + time-on-page for the current route. Resets on pathname change (App Router navigations).
 */
export function PosthogPageEngagement() {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname;
    const mountTs = Date.now();
    let visibleStart = Date.now();
    let visibleMs = 0;
    const bucketsHit = new Set<number>();
    let timeSent = false;

    const sendTimeOnPage = () => {
      if (timeSent) return;
      const now = Date.now();
      let visibleTotal = visibleMs;
      if (document.visibilityState === "visible") {
        visibleTotal += now - visibleStart;
      }
      const totalSeconds = Math.round((now - mountTs) / 1000);
      const visibleSeconds = Math.round(visibleTotal / 1000);
      if (totalSeconds < 1) return;
      timeSent = true;
      posthog.capture("time_on_page", {
        path,
        total_seconds: totalSeconds,
        visible_seconds: visibleSeconds,
      });
    };

    const maybeCaptureScrollBuckets = () => {
      const pct = scrollDepthPercent();
      for (const b of SCROLL_BUCKETS) {
        if (pct >= b && !bucketsHit.has(b)) {
          bucketsHit.add(b);
          posthog.capture("scroll_depth", {
            path,
            depth_percent: b,
          });
        }
      }
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = window.requestAnimationFrame(() => {
        scrollRaf = 0;
        maybeCaptureScrollBuckets();
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        visibleMs += Date.now() - visibleStart;
      } else {
        visibleStart = Date.now();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", sendTimeOnPage);

    queueMicrotask(() => {
      maybeCaptureScrollBuckets();
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", sendTimeOnPage);
      if (scrollRaf) {
        cancelAnimationFrame(scrollRaf);
      }
      sendTimeOnPage();
    };
  }, [pathname]);

  return null;
}
