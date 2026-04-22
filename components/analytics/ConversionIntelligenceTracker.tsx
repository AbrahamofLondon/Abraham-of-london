"use client";

import * as React from "react";

import {
  trackCtaDwell,
  trackExitAfterHover,
  trackRepeatedScroll,
} from "@/lib/analytics/journey-client";

function targetName(element: Element): string {
  const label =
    element.getAttribute("aria-label") ||
    element.textContent ||
    element.getAttribute("href") ||
    element.getAttribute("type") ||
    "cta";
  return label.replace(/\s+/g, " ").trim().slice(0, 96) || "cta";
}

export default function ConversionIntelligenceTracker() {
  React.useEffect(() => {
    let hoveredTarget: string | null = null;
    let hoverStartedAt = 0;
    let scrollCount = 0;
    let lastScrollAt = 0;

    function closestCta(event: Event): Element | null {
      const target = event.target;
      if (!(target instanceof Element)) return null;
      return target.closest("a,button");
    }

    function onPointerEnter(event: Event) {
      const cta = closestCta(event);
      if (!cta) return;
      hoveredTarget = targetName(cta);
      hoverStartedAt = Date.now();
    }

    function onPointerLeave(event: Event) {
      const cta = closestCta(event);
      if (!cta || !hoverStartedAt) return;
      const durationMs = Date.now() - hoverStartedAt;
      if (durationMs >= 900) trackCtaDwell(targetName(cta), durationMs);
      hoveredTarget = null;
      hoverStartedAt = 0;
    }

    function onScroll() {
      const now = Date.now();
      if (now - lastScrollAt < 1200) {
        scrollCount += 1;
      } else {
        scrollCount = 1;
      }
      lastScrollAt = now;
      if (scrollCount === 4) trackRepeatedScroll(scrollCount);
    }

    function onPageHide() {
      if (hoveredTarget) trackExitAfterHover(hoveredTarget);
    }

    document.addEventListener("pointerover", onPointerEnter, true);
    document.addEventListener("pointerout", onPointerLeave, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("pointerover", onPointerEnter, true);
      document.removeEventListener("pointerout", onPointerLeave, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
