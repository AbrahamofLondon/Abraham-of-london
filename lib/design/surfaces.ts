import type { CSSProperties } from "react";

import { colors, radii, shadows } from "@/lib/design/tokens";

const grainSvg =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const crispHairlineRule: CSSProperties = {
  backgroundImage: `linear-gradient(to right, transparent, ${colors.border.goldRule}, transparent)`,
};

export const subtleHairlineRule: CSSProperties = {
  backgroundImage: `linear-gradient(to right, transparent, ${colors.border.default}, transparent)`,
};

export const pageBaseSurface: CSSProperties = {
  backgroundColor: colors.bg.base,
  color: colors.text.primary,
};

export const heroVoidSurface: CSSProperties = {
  backgroundColor: colors.bg.void,
  color: colors.text.primary,
};

export const standardPanelSurface: CSSProperties = {
  backgroundColor: colors.bg.panel,
  border: `1px solid ${colors.border.default}`,
  borderRadius: radii.panel,
  boxShadow: shadows.panel,
};

export const goldPanelSurface: CSSProperties = {
  backgroundColor: "rgba(201, 169, 110, 0.07)",
  backgroundImage:
    "linear-gradient(180deg, rgba(201, 169, 110, 0.06) 0%, rgba(14, 14, 18, 0.96) 100%)",
  border: `1px solid ${colors.border.gold}`,
  borderRadius: radii.panel,
  boxShadow: `${shadows.panel}, ${shadows.goldPanel}`,
};

export const ghostPanelSurface: CSSProperties = {
  backgroundColor: colors.bg.lifted,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: radii.panel,
  boxShadow: "0 18px 48px -30px rgba(0, 0, 0, 0.9)",
};

export const primaryCtaSurface: CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  border: "1px solid rgba(255, 255, 255, 0.96)",
  color: colors.bg.void,
  boxShadow: "0 20px 50px -28px rgba(255, 255, 255, 0.24)",
};

export const secondaryCtaSurface: CSSProperties = {
  backgroundColor: colors.bg.panel,
  border: `1px solid ${colors.border.default}`,
  color: colors.text.body,
  boxShadow: "0 18px 42px -30px rgba(0, 0, 0, 0.88)",
};

export const tertiaryCtaSurface: CSSProperties = {
  backgroundColor: "transparent",
  border: `1px solid ${colors.border.subtle}`,
  color: colors.text.muted,
};

export const grainOverlay: CSSProperties = {
  backgroundImage: grainSvg,
  backgroundSize: "180px 180px",
};

export const goldAtmosphere: CSSProperties = {
  background: "radial-gradient(ellipse at center, rgba(201, 169, 110, 0.12) 0%, rgba(201, 169, 110, 0.04) 34%, transparent 72%)",
  borderRadius: "50%",
  filter: "blur(120px)",
};

export const whiteAtmosphere: CSSProperties = {
  background: "radial-gradient(circle at center, rgba(255, 255, 255, 0.018) 0%, transparent 66%)",
  borderRadius: "50%",
  filter: "blur(90px)",
};

export const gradientSeparator: CSSProperties = {
  background: `linear-gradient(to top, ${colors.bg.base}, transparent)`,
};

export const pageFrameRule: CSSProperties = {
  background: `linear-gradient(to right, transparent, ${colors.border.goldRule}, transparent)`,
};

export const textContrast = {
  heading: "rgba(255, 255, 255, 0.94)",
  body: colors.text.body,
  muted: colors.text.muted,
  dim: colors.text.dim,
  faint: colors.text.faint,
} as const;
