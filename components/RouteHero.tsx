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

/**
 * Adapter that takes a hero-banner config and feeds it into the
 * globally-constrained HeroSection.
 */
export default function RouteHero(props: RouteHeroProps): JSX.Element {
  let config: HeroBannerConfig;

  if (props.bannerKey) {
    config = heroBannersApi.getByKey(props.bannerKey);
  } else if (props.routePath) {
    config = heroBannersApi.getForRoute(props.routePath);
  } else {
    config = heroBannersApi.defaultHero;
  }

  const {
    title,
    subtitle,
    description,
    backgroundImage,
    primaryCta,
    secondaryCta,
  } = config;

  const eyebrow = subtitle;
  const subtitleBody = description ?? subtitle ?? "";

  return (
    <HeroSection
      title={title}
      subtitle={subtitleBody}
      eyebrow={eyebrow}
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
      coverImage={backgroundImage}
      coverAspect="cover-wide"
      coverFit="cover"
      coverPosition="center"
    />
  );
}
