// components/mdx/CTAPreset.tsx - FIXED VERSION
import * as React from "react";
import type { CTAKey } from "./cta-presets";
import { CTA } from "./ctas";

export interface CTAPresetProps {
  presetKey: CTAKey;
  className?: string;
  compact?: boolean;
}

export function CTAPreset({ presetKey, className, compact }: CTAPresetProps) {
  // Create props object without undefined values for exactOptionalPropertyTypes
  const ctaProps: Record<string, any> = {
    presetKey,
  };

  // Only add className if it's defined
  if (className !== undefined) {
    ctaProps.className = className;
  }

  // Only add compact if it's defined (use false as default when undefined)
  ctaProps.compact = compact !== undefined ? compact : false;

  return <CTA {...ctaProps} />;
}