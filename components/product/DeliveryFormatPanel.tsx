/**
 * components/product/DeliveryFormatPanel.tsx
 *
 * Standardised delivery format display for all surfaces.
 * Shows what format the output takes and what the user receives.
 */

import * as React from "react";
import { FileText, Monitor, BookOpen, Layers, Shield } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type DeliveryFormat = "interactive_instrument" | "pdf_dossier" | "combined" | "bundle" | "governed_methodology_run" | "governed_brief" | "command_surface" | "retained_surface";

const FORMAT_CONFIG: Record<DeliveryFormat, { label: string; icon: React.ReactNode; description: string }> = {
  interactive_instrument: {
    label: "Interactive instrument",
    icon: <Monitor style={{ width: 12, height: 12 }} />,
    description: "Guided question flow with scored output.",
  },
  pdf_dossier: {
    label: "PDF dossier",
    icon: <FileText style={{ width: 12, height: 12 }} />,
    description: "Downloadable governed document.",
  },
  combined: {
    label: "Interactive + PDF dossier",
    icon: <Layers style={{ width: 12, height: 12 }} />,
    description: "Complete the instrument, download the dossier.",
  },
  bundle: {
    label: "Instrument bundle",
    icon: <BookOpen style={{ width: 12, height: 12 }} />,
    description: "Multiple instruments in one purchase.",
  },
  governed_methodology_run: {
    label: "Governed methodology run",
    icon: <Shield style={{ width: 12, height: 12 }} />,
    description: "Structured diagnostic with checkpoint follow-up.",
  },
  governed_brief: {
    label: "Governed brief",
    icon: <FileText style={{ width: 12, height: 12 }} />,
    description: "Executive-readable intelligence document.",
  },
  command_surface: {
    label: "Command surface",
    icon: <Monitor style={{ width: 12, height: 12 }} />,
    description: "Live governed operating console.",
  },
  retained_surface: {
    label: "Retained surface",
    icon: <Shield style={{ width: 12, height: 12 }} />,
    description: "Ongoing oversight with cadence and memory.",
  },
};

type Props = {
  format: DeliveryFormat;
  compact?: boolean;
};

export default function DeliveryFormatPanel({ format, compact }: Props) {
  const config = FORMAT_CONFIG[format];
  if (!config) return null;

  return (
    <div className="flex items-center gap-2">
      <span style={{ color: `${GOLD}88`, flexShrink: 0 }}>{config.icon}</span>
      <div>
        <span style={{ ...mono, fontSize: compact ? "6px" : "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>
          {config.label}
        </span>
        {!compact && (
          <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
            {config.description}
          </p>
        )}
      </div>
    </div>
  );
}
