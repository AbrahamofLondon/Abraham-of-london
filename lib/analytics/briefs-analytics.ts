// lib/analytics/briefs-analytics.ts
// Analytics events for the Intelligence Briefs publication system.
// Fires to GA4 + Plausible. Does not send content or personal data.

import { trackEvent } from "@/lib/analytics";

export type BriefEventProps = {
  slug: string;
  series: string | null;
  briefId: string | null;
  season?: string | null;
  editorialCluster?: string | null;
};

export type BriefCTAProps = BriefEventProps & {
  destination: string;
  destinationLabel: string;
};

export function trackBriefViewed(props: BriefEventProps): void {
  trackEvent({
    action: "brief_viewed",
    category: "intelligence_briefs",
    label: props.slug,
    value: props.series === "institutional-alpha" ? 1 : props.series === "sovereign-intelligence" ? 2 : 0,
  });

  if (typeof window !== "undefined" && (window as any).plausible) {
    (window as any).plausible("brief_viewed", {
      props: {
        slug: props.slug,
        series: props.series ?? "unknown",
        brief_id: props.briefId ?? "",
        season: props.season ?? "",
        cluster: props.editorialCluster ?? "",
      },
    });
  }
}

export function trackBriefSeriesViewed(series: string): void {
  trackEvent({
    action: "brief_series_viewed",
    category: "intelligence_briefs",
    label: series,
  });

  if (typeof window !== "undefined" && (window as any).plausible) {
    (window as any).plausible("brief_series_viewed", { props: { series } });
  }
}

export function trackBriefToProductClick(props: BriefCTAProps): void {
  trackEvent({
    action: "brief_to_product_click",
    category: "intelligence_briefs",
    label: `${props.slug} → ${props.destination}`,
  });

  if (typeof window !== "undefined" && (window as any).plausible) {
    (window as any).plausible("brief_to_product_click", {
      props: {
        slug: props.slug,
        series: props.series ?? "unknown",
        destination: props.destination,
        destination_label: props.destinationLabel,
      },
    });
  }
}

export function trackBriefToCanonClick(props: BriefCTAProps): void {
  trackEvent({
    action: "brief_to_canon_click",
    category: "intelligence_briefs",
    label: `${props.slug} → ${props.destination}`,
  });

  if (typeof window !== "undefined" && (window as any).plausible) {
    (window as any).plausible("brief_to_canon_click", {
      props: {
        slug: props.slug,
        series: props.series ?? "unknown",
        canon_brief: props.destination,
      },
    });
  }
}

export function trackBriefToInnerCircleClick(props: BriefEventProps): void {
  trackEvent({
    action: "brief_to_inner_circle_click",
    category: "intelligence_briefs",
    label: props.slug,
  });

  if (typeof window !== "undefined" && (window as any).plausible) {
    (window as any).plausible("brief_to_inner_circle_click", {
      props: {
        slug: props.slug,
        series: props.series ?? "unknown",
        brief_id: props.briefId ?? "",
      },
    });
  }
}
