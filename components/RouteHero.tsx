// components/RouteHero.tsx
import * as React from "react";
import HeroSection from "@/components/homepage/HeroSection";
import heroBannersApi, {
  type HeroBannerKey,
  type HeroBannerConfig,
} from "@/lib/hero-banners";

export interface RouteHeroProps {
  /** Prefer this if you know which hero you want (e.g. "strategy", "books") */
  bannerKey?: HeroBannerKey;
  /** Optional: use this when you want automatic mapping from route path */
  routePath?: string;
}

// Function to get counts based on route
function getCountsForRoute(route?: string) {
  // Default counts
  const defaultCounts = {
    shorts: 82,
    canon: 13,
    briefs: 75,
    library: 0,
  };

  if (!route) return defaultCounts;

  // You can customize counts per route if needed
  if (route.includes('/canon')) {
    return {
      ...defaultCounts,
      canon: 13, // Maybe fetch actual canon count
    };
  }

  if (route.includes('/library')) {
    return {
      ...defaultCounts,
      library: 67, // Actual library count
    };
  }

  return defaultCounts;
}

/**
 * Adapter that takes a hero-banner config and passes counts to the
 * globally-constrained HeroSection.
 */
export default function RouteHero(props: RouteHeroProps): React.ReactElement {
  let config: HeroBannerConfig;

  if (props.bannerKey) {
    config = heroBannersApi.getByKey(props.bannerKey);
  } else if (props.routePath) {
    config = heroBannersApi.getForRoute(props.routePath);
  } else {
    config = heroBannersApi.defaultHero;
  }

  // Get counts based on the route
  const counts = getCountsForRoute(props.routePath);

  return <HeroSection counts={counts} />;
}