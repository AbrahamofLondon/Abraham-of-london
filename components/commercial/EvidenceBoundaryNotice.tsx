import * as React from "react";

export type EvidenceBoundaryVariant =
  | "decision_support"
  | "advisory_review"
  | "board_facing_draft"
  | "diagnostic_pending_authority";

type EvidenceBoundaryNoticeProps = {
  variant: EvidenceBoundaryVariant;
  className?: string;
};

const GOLD = "#C9A96E";

const variantText: Record<EvidenceBoundaryVariant, { label: string; body: string; cannotClaim: string[] }> = {
  decision_support: {
    label: "Evidence-limited decision support",
    body:
      "This is evidence-limited decision-support material. It is designed to structure judgement, expose risk, and support review. It is not independently verified authority evidence and does not grant validated product authority.",
    cannotClaim: [
      "It does not independently verify the buyer's evidence.",
      "It does not certify that a decision is correct.",
      "It does not restore or grant product authority.",
    ],
  },
  advisory_review: {
    label: "Evidence-limited advisory review",
    body:
      "This is evidence-limited decision-support material. It is designed to structure judgement, expose risk, and support review. It is not independently verified authority evidence and does not grant validated product authority.",
    cannotClaim: [
      "It does not replace buyer-side due diligence.",
      "It does not guarantee outcome, adoption, or execution.",
      "It does not convert user-supplied material into verified evidence.",
    ],
  },
  board_facing_draft: {
    label: "Evidence-limited board-facing draft",
    body:
      "This is evidence-limited decision-support material. It is designed to structure judgement, expose risk, and support review. It is not independently verified authority evidence and does not grant validated product authority.",
    cannotClaim: [
      "It is draft material for review, not verified evidence for reliance.",
      "It must not be presented as approved evidence without separate review.",
      "It does not remove the need for source-document checks.",
    ],
  },
  diagnostic_pending_authority: {
    label: "Diagnostic authority pending review",
    body:
      "This is evidence-limited decision-support material. It is designed to structure judgement, expose risk, and support review. It is not independently verified authority evidence and does not grant validated product authority.",
    cannotClaim: [
      "It does not claim current restored diagnostic authority.",
      "It does not create external proof of product value.",
      "It remains bounded by the evidence supplied by the buyer.",
    ],
  },
};

export default function EvidenceBoundaryNotice({
  variant,
  className,
}: EvidenceBoundaryNoticeProps) {
  const copy = variantText[variant];

  return (
    <section
      className={className}
      aria-label="Evidence boundary"
      style={{
        border: `1px solid ${GOLD}33`,
        background: "rgba(201,169,110,0.055)",
        padding: "18px 20px",
      }}
    >
      <p
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}CC`,
          marginBottom: "8px",
        }}
      >
        {copy.label}
      </p>
      <p style={{ color: "rgba(255,255,255,0.76)", fontSize: "14px", lineHeight: 1.75 }}>
        {copy.body}
      </p>
      <ul style={{ marginTop: "12px", display: "grid", gap: "7px" }}>
        {copy.cannotClaim.map((item) => (
          <li
            key={item}
            style={{
              color: "rgba(255,255,255,0.58)",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
