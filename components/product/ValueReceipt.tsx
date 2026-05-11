/**
 * components/product/ValueReceipt.tsx
 *
 * Shared value receipt component for all paid/governed surfaces.
 * Shows what the user receives, what access state applies,
 * and what next step is earned.
 *
 * Usage:
 *   <ValueReceipt
 *     price="£49"
 *     deliveryFormat="Interactive instrument + PDF dossier"
 *     includes={["Mandate clarity reading", "Obligation conflict map"]}
 *     memoryWrite={true}
 *     dossierIncluded={true}
 *     accessPosture="paid"
 *     nextAdmissibleMove="Executive Reporting if institutional consequence present"
 *     estimatedTime="12 minutes"
 *   />
 */

import * as React from "react";
import { FileText, Clock, ShieldCheck, ArrowRight, Lock, Unlock } from "lucide-react";

const GOLD = "#C9A96E";
const EMERALD = "#6EE7B7";
const AMBER = "#F59E0B";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export type AccessPosture = "free" | "paid" | "earned" | "restricted" | "retained";

export type ValueReceiptProps = {
  /** Price display string, e.g. "£49", "Free", "Contracted monthly" */
  price?: string;
  /** Delivery format description */
  deliveryFormat?: string;
  /** List of what this surface produces */
  includes?: string[];
  /** Whether it writes to Decision Centre memory */
  memoryWrite?: boolean;
  /** Whether a dossier/PDF is included */
  dossierIncluded?: boolean;
  /** Access posture */
  accessPosture?: AccessPosture;
  /** Next admissible move text */
  nextAdmissibleMove?: string;
  /** Estimated completion time */
  estimatedTime?: string;
  /** Whether to show compact variant */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
};

function postureLabel(posture: AccessPosture): { label: string; color: string; icon: React.ReactNode } {
  switch (posture) {
    case "free":
      return { label: "Free signal", color: "rgba(255,255,255,0.35)", icon: null };
    case "paid":
      return { label: "Paid instrument", color: GOLD, icon: <Lock style={{ width: 10, height: 10, color: GOLD }} /> };
    case "earned":
      return { label: "Earned escalation", color: EMERALD, icon: <ShieldCheck style={{ width: 10, height: 10, color: EMERALD }} /> };
    case "restricted":
      return { label: "Restricted — architect material", color: AMBER, icon: <Lock style={{ width: 10, height: 10, color: AMBER }} /> };
    case "retained":
      return { label: "Retained oversight", color: EMERALD, icon: <ShieldCheck style={{ width: 10, height: 10, color: EMERALD }} /> };
  }
}

export default function ValueReceipt({
  price,
  deliveryFormat,
  includes,
  memoryWrite,
  dossierIncluded,
  accessPosture,
  nextAdmissibleMove,
  estimatedTime,
  compact,
  className,
}: ValueReceiptProps) {
  const posture = accessPosture ? postureLabel(accessPosture) : null;

  const content = (
    <div style={{
      border: `1px solid rgba(255,255,255,0.08)`,
      backgroundColor: "rgba(255,255,255,0.015)",
      padding: compact ? "0.75rem" : "1rem",
    }}>
      {/* Access posture badge */}
      {posture && (
        <div className="flex items-center gap-1.5" style={{ marginBottom: "0.5rem" }}>
          {posture.icon}
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: posture.color }}>
            {posture.label}
          </span>
        </div>
      )}

      {/* Price + Time row */}
      {(price || estimatedTime) && (
        <div className="flex items-center gap-3" style={{ marginBottom: "0.5rem" }}>
          {price && (
            <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.50)" }}>
              {price}
            </span>
          )}
          {estimatedTime && (
            <span className="flex items-center gap-1" style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.25)" }}>
              <Clock style={{ width: 9, height: 9 }} />
              {estimatedTime}
            </span>
          )}
        </div>
      )}

      {/* Delivery format */}
      {deliveryFormat && (
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.30)", marginBottom: "0.5rem" }}>
          {deliveryFormat}
        </p>
      )}

      {/* Includes list */}
      {includes && includes.length > 0 && (
        <div style={{ marginBottom: "0.5rem" }}>
          {!compact && (
            <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.25rem" }}>
              Produces
            </p>
          )}
          <div className={compact ? "" : "space-y-1"}>
            {includes.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span style={{ color: GOLD, fontSize: "10px", marginTop: 1 }}>→</span>
                <span style={{ fontSize: compact ? "11px" : "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.50)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory + Dossier indicators */}
      <div className="flex flex-wrap gap-3" style={{ marginBottom: "0.5rem" }}>
        {memoryWrite !== undefined && (
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.10em", color: memoryWrite ? `${EMERALD}88` : "rgba(255,255,255,0.15)" }}>
            {memoryWrite ? "✓ Writes to Decision Centre memory" : "✗ No memory write"}
          </span>
        )}
        {dossierIncluded !== undefined && (
          <span className="flex items-center gap-1" style={{ ...mono, fontSize: "6px", letterSpacing: "0.10em", color: dossierIncluded ? `${EMERALD}88` : "rgba(255,255,255,0.15)" }}>
            {dossierIncluded ? <FileText style={{ width: 9, height: 9, color: EMERALD }} /> : null}
            {dossierIncluded ? "PDF dossier included" : "No dossier"}
          </span>
        )}
      </div>

      {/* Next admissible move */}
      {nextAdmissibleMove && (
        <div className="flex items-start gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
          <ArrowRight style={{ width: 10, height: 10, color: GOLD, marginTop: 2, flexShrink: 0 }} />
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: `${GOLD}AA` }}>
            {nextAdmissibleMove}
          </span>
        </div>
      )}
    </div>
  );

  if (compact) return content;

  return (
    <div className={className}>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginBottom: "0.5rem" }}>
        Value receipt
      </p>
      {content}
    </div>
  );
}
