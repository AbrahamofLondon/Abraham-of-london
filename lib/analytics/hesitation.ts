/**
 * lib/analytics/hesitation.ts — Behavioural friction detection
 *
 * Detects: DOUBT, CONFUSION, OVERLOAD, PRICE_RESISTANCE
 * Tracks: scroll depth, cursor idle, CTA hover, exit patterns
 * Never throws. Never blocks. Fire-and-forget via sendBeacon.
 */

import { emitJourneyEvent } from "./journey-client";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type HesitationType = "DOUBT" | "CONFUSION" | "OVERLOAD" | "PRICE_RESISTANCE";

type HesitationConfig = {
  /** Page identifier for events */
  page: string;
  /** Scroll depth thresholds to track (0-100) */
  scrollThresholds?: number[];
  /** Idle timeout before hesitation fires (ms) */
  idleTimeout?: number;
  /** CTA hover timeout before doubt fires (ms) */
  ctaHoverTimeout?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Scroll Depth Tracker
// ─────────────────────────────────────────────────────────────────────────────

export function trackScrollDepth(page: string, thresholds: number[] = [50, 80, 90]) {
  if (typeof window === "undefined") return () => {};

  const fired = new Set<number>();

  function onScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    for (const t of thresholds) {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        emitJourneyEvent(`${page}_scroll_${t}` as any, { entryPath: page, evidenceDepth: t });
      }
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

// ─────────────────────────────────────────────────────────────────────────────
// Idle / Hesitation Detector
// ─────────────────────────────────────────────────────────────────────────────

export function trackHesitation(config: HesitationConfig) {
  if (typeof window === "undefined") return () => {};

  const { page, idleTimeout = 4000 } = config;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let lastActivity = Date.now();
  let scrollUpCount = 0;
  let lastScrollY = window.scrollY;
  let hesitationFired = false;

  function resetIdle() {
    lastActivity = Date.now();
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(checkIdle, idleTimeout);
  }

  function checkIdle() {
    if (hesitationFired) return;
    const idle = Date.now() - lastActivity;
    if (idle >= idleTimeout) {
      hesitationFired = true;
      const type: HesitationType = scrollUpCount >= 3 ? "CONFUSION" : "DOUBT";
      emitJourneyEvent(`${page}_hesitation` as any, {
        entryPath: page,
        buyerState: type,
        evidenceDepth: Math.round(idle / 1000),
      });
    }
  }

  function onScroll() {
    const currentY = window.scrollY;
    if (currentY < lastScrollY - 20) {
      scrollUpCount++;
      if (scrollUpCount >= 3 && !hesitationFired) {
        hesitationFired = true;
        emitJourneyEvent(`${page}_hesitation` as any, {
          entryPath: page,
          buyerState: "CONFUSION" as HesitationType,
          evidenceDepth: scrollUpCount,
        });
      }
    }
    lastScrollY = currentY;
    resetIdle();
  }

  function onMove() { resetIdle(); }
  function onClick() { resetIdle(); }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("click", onClick, { passive: true });
  resetIdle();

  return () => {
    if (idleTimer) clearTimeout(idleTimer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("click", onClick);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA Hover Doubt Detection
// ─────────────────────────────────────────────────────────────────────────────

export function trackCtaHover(
  element: HTMLElement | null,
  page: string,
  timeout = 3000,
) {
  if (!element || typeof window === "undefined") return () => {};

  let hoverTimer: ReturnType<typeof setTimeout> | null = null;
  let fired = false;

  function onEnter() {
    if (fired) return;
    hoverTimer = setTimeout(() => {
      fired = true;
      emitJourneyEvent(`${page}_cta_doubt` as any, {
        entryPath: page,
        buyerState: "DOUBT" as HesitationType,
      });
    }, timeout);
  }

  function onLeave() {
    if (hoverTimer) clearTimeout(hoverTimer);
  }

  function onClick() {
    if (hoverTimer) clearTimeout(hoverTimer);
  }

  element.addEventListener("mouseenter", onEnter);
  element.addEventListener("mouseleave", onLeave);
  element.addEventListener("click", onClick);

  return () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    element.removeEventListener("mouseenter", onEnter);
    element.removeEventListener("mouseleave", onLeave);
    element.removeEventListener("click", onClick);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exit-After-CTA-View Detection
// ─────────────────────────────────────────────────────────────────────────────

export function trackExitAfterCtaView(page: string, ctaSelector: string) {
  if (typeof window === "undefined") return () => {};

  let ctaVisible = false;
  let ctaVisibleTime = 0;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !ctaVisible) {
        ctaVisible = true;
        ctaVisibleTime = Date.now();
      }
    }
  }, { threshold: 0.5 });

  const el = document.querySelector(ctaSelector);
  if (el) observer.observe(el);

  function onBeforeUnload() {
    if (ctaVisible && Date.now() - ctaVisibleTime < 5000) {
      emitJourneyEvent(`${page}_exit_after_cta` as any, {
        entryPath: page,
        buyerState: "PRICE_RESISTANCE" as HesitationType,
        evidenceDepth: Math.round((Date.now() - ctaVisibleTime) / 1000),
      });
    }
  }

  window.addEventListener("beforeunload", onBeforeUnload);

  return () => {
    observer.disconnect();
    window.removeEventListener("beforeunload", onBeforeUnload);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Conviction State Machine
// ─────────────────────────────────────────────────────────────────────────────

export type ConvictionState =
  | "UNDEFINED"
  | "RECOGNISED"
  | "CLARIFIED"
  | "PRICED"
  | "COMMITTED";

const CONVICTION_KEY = "aol_conviction_state";

export function getConvictionState(): ConvictionState {
  if (typeof window === "undefined") return "UNDEFINED";
  try {
    return (sessionStorage.getItem(CONVICTION_KEY) as ConvictionState) || "UNDEFINED";
  } catch {
    return "UNDEFINED";
  }
}

export function advanceConviction(to: ConvictionState) {
  if (typeof window === "undefined") return;

  const order: ConvictionState[] = ["UNDEFINED", "RECOGNISED", "CLARIFIED", "PRICED", "COMMITTED"];
  const current = getConvictionState();
  const currentIdx = order.indexOf(current);
  const toIdx = order.indexOf(to);

  // Only advance, never regress
  if (toIdx > currentIdx) {
    try {
      sessionStorage.setItem(CONVICTION_KEY, to);
    } catch { /* ignore */ }

    emitJourneyEvent("conviction_advance" as any, {
      buyerState: to,
      evidenceDepth: toIdx,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Commitment Rate Calculator (server-side)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateCommitmentRate(
  homeLandings: number,
  strategyEntries: number,
): number {
  if (homeLandings === 0) return 0;
  return strategyEntries / homeLandings;
}
