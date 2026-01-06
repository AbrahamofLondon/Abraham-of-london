// components/mdx/CTAPreset.tsx
import * as React from "react";
import type { CTAKey } from "./cta-presets";
import { CTA } from "./ctas";

export interface CTAPresetProps {
  presetKey: CTAKey;
  className?: string;
  compact?: boolean;
}

export function CTAPreset({ presetKey, className, compact }: CTAPresetProps) {
  return <CTA presetKey={presetKey} className={className} compact={compact} />;
}
