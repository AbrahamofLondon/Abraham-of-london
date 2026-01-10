// components/mdx/ctas.tsx - FIXED VERSION
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

// Individual CTA components for specific presets
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

// ===== CTA STYLES (What mdx-components.tsx expects) =====
export const ctas = {
  primary: "bg-gold text-black hover:bg-amber-500",
  secondary: "bg-transparent border border-gold text-gold hover:bg-gold/10",
  subtle: "bg-transparent text-gold hover:text-amber-300",
  dark: "bg-charcoal text-cream hover:bg-slate-900",
  white: "bg-white text-black hover:bg-gray-100",
  gradient: "bg-gradient-to-r from-gold to-amber-500 text-black hover:from-amber-500 hover:to-gold",
} as const;

// ===== COMPONENT COLLECTION (for other uses) =====
export const ctaComponents = {
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
