/**
 * components/product/AccessPostureBadge.tsx
 *
 * Standardised access posture badge for all surfaces.
 * Replaces vague "premium" or "upgrade" language with precise posture labels.
 */

import * as React from "react";
import { Lock, Unlock, ShieldCheck, EyeOff } from "lucide-react";
import type { AccessPosture } from "./ValueReceipt";

const GOLD = "#C9A96E";
const EMERALD = "#6EE7B7";
const AMBER = "#F59E0B";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const POSTURE_CONFIG: Record<AccessPosture, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  free: {
    label: "Free signal",
    color: "rgba(255,255,255,0.35)",
    icon: <Unlock style={{ width: 10, height: 10 }} />,
    description: "No payment required. Limited output.",
  },
  paid: {
    label: "Paid instrument",
    color: GOLD,
    icon: <Lock style={{ width: 10, height: 10, color: GOLD }} />,
    description: "One-time purchase. Full output delivered.",
  },
  earned: {
    label: "Earned escalation",
    color: EMERALD,
    icon: <ShieldCheck style={{ width: 10, height: 10, color: EMERALD }} />,
    description: "Unlocked by evidence, not payment.",
  },
  restricted: {
    label: "Restricted",
    color: AMBER,
    icon: <EyeOff style={{ width: 10, height: 10, color: AMBER }} />,
    description: "Architect material. Not publicly accessible.",
  },
  retained: {
    label: "Retained oversight",
    color: EMERALD,
    icon: <ShieldCheck style={{ width: 10, height: 10, color: EMERALD }} />,
    description: "Contracted monthly engagement.",
  },
};

type Props = {
  posture: AccessPosture;
  compact?: boolean;
};

export default function AccessPostureBadge({ posture, compact }: Props) {
  const config = POSTURE_CONFIG[posture];
  return (
    <div className="flex items-center gap-1.5" title={config.description} style={{ cursor: "default" }}>
      {config.icon}
      <span style={{
        ...mono,
        fontSize: compact ? "6px" : "7px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: config.color,
      }}>
        {config.label}
      </span>
    </div>
  );
}
