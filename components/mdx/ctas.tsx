// components/mdx/ctas.tsx
import React from "react";
import type { CTAKey } from "./cta-presets";
import CtaPresetComponent from "./CtaPresetComponent";

/**
 * Props for the CTA block used inside MDX or pages.
 */
export type CTAProps = {
  /** Which preset to render (e.g., 'fatherhood', 'leadership', 'brotherhood', 'mentorship', 'free-resources', 'premium', 'community', 'newsletter') */
  presetKey?: CTAKey | string;
  /** Optional title override */
  title?: string;
  /** Optional description override */
  description?: string;
  /** Optional compact mode if you add alternative layouts in future */
  compact?: boolean;
  /** Optional wrapper className */
  className?: string;
};

/**
 * CTA – primary call-to-action panel driven by cta-presets.
 * Safe to use in MDX: <CTA presetKey="fatherhood" />
 */
export const CTA: React.FC<CTAProps> = ({
  presetKey,
  title,
  description,
  compact,
  className,
}) => {
  // Wrapper for future layout variations; for now we just pass through.
  return (
    <div className={className}>
      <CtaPresetComponent
        presetKey={presetKey}
        title={title}
        description={description}
        compact={compact}
      />
    </div>
  );
};

/**
 * Aliases for semantic clarity if you want distinct tags in MDX.
 * All of these currently render the same component/preset pipeline.
 */
export const FatherhoodCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="fatherhood" {...props} />
);

export const LeadershipCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="leadership" {...props} />
);

export const BrotherhoodCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="brotherhood" {...props} />
);

export const MentorshipCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="mentorship" {...props} />
);

export const FreeResourcesCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="free-resources" {...props} />
);

export const PremiumCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="premium" {...props} />
);

export const CommunityCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="community" {...props} />
);

export const NewsletterCTA: React.FC<Omit<CTAProps, "presetKey">> = (props) => (
  <CTA presetKey="newsletter" {...props} />
);

export default CTA;
