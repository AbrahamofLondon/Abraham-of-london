// types/download-cta.ts — CTA TYPES (Production Grade)

import type * as React from "react";

export interface CTADetail {
  label: string;
  value: string;
  icon: string;
}

export interface DownloadCTAProps {
  title: string;
  badge: string;
  details: CTADetail[];
  features: string[];
  steps: string[];
  buttonText: string;

  /**
   * Use a type-safe MouseEvent signature for anchors.
   * If your CTA uses <button>, change HTMLAnchorElement accordingly.
   */
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;

  href: string;
}