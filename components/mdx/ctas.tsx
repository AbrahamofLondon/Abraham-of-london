// components/mdx/ctas.tsx
import * as React from "react";
import CtaPresetComponent from "./CtaPresetComponent";
import type { CTAKey } from "./cta-presets";

export type CTAProps = {
  presetKey?: CTAKey | string;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export const CTA: React.FC<CTAProps> = ({
  presetKey,
  title,
  description,
  compact,
  className,
}) => {
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

/**
 * If other code expects `ctas`, give it a stable object.
 */
export const ctas = {
  CTA,
  FatherhoodCTA,
  LeadershipCTA,
  BrotherhoodCTA,
  MentorshipCTA,
  FreeResourcesCTA,
  PremiumCTA,
  CommunityCTA,
  NewsletterCTA,
} as const;