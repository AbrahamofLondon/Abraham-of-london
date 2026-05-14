import type * as React from "react";

import { typography } from "@/lib/design/tokens";

export const metadataLabelStyle: React.CSSProperties = {
  fontFamily: typography.fontFamily.mono,
  fontSize: "8px",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

export const microLabelStyle: React.CSSProperties = {
  ...metadataLabelStyle,
  letterSpacing: "0.18em",
};

export const metadataLabelClass =
  "font-mono text-[8px] uppercase tracking-[0.14em] text-white/45";

export const microLabelClass =
  "font-mono text-[8px] uppercase tracking-[0.18em] text-white/40";
