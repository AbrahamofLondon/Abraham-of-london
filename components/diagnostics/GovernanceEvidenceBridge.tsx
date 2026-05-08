import * as React from "react";

import type {
  AssessmentEvidenceCapture,
  AssessmentEvidenceCaptureField,
} from "@/lib/product/evidence-capture-contract";

const GOLD = "#C9A96E";

export type GovernanceEvidencePrompt = {
  field: AssessmentEvidenceCaptureField;
  prompt: string;
  optional?: boolean;
  helper?: string;
};

export default function GovernanceEvidenceBridge({
  title,
  intro,
  prompts,
  value,
  onChange,
  missingFields = [],
}: {
  title: string;
  intro: string;
  prompts: GovernanceEvidencePrompt[];
  value: AssessmentEvidenceCapture;
  onChange: (field: AssessmentEvidenceCaptureField, nextValue: string) => void;
  missingFields?: AssessmentEvidenceCaptureField[];
}) {
  const missingSet = new Set(missingFields);

  return (
    <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}05`, padding: "1.5rem" }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
          marginBottom: "0.8rem",
        }}
      >
        {title}
      </div>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "1.04rem",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.78)",
          maxWidth: "60ch",
        }}
      >
        {intro}
      </p>

      <p
        style={{
          marginTop: "0.55rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.95rem",
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.52)",
          maxWidth: "62ch",
        }}
      >
        This is not more input. This is what prevents the system from recommending what has already failed.
      </p>

      <p
        style={{
          marginTop: "0.55rem",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "6.5px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.34)",
        }}
      >
        Use organisational language only. Do not include names, allegations, or protected characteristics.
      </p>

      <div className="mt-6 space-y-4">
        {prompts.map((prompt, index) => {
          const missing = missingSet.has(prompt.field);
          return (
            <label
              key={prompt.field}
              style={{
                display: "block",
                border: missing ? "1px solid rgba(252,165,165,0.30)" : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: missing ? "rgba(120,28,28,0.08)" : "rgba(255,255,255,0.02)",
                padding: "1rem",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.34)",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: prompt.optional ? "rgba(255,255,255,0.34)" : `${GOLD}85`,
                  }}
                >
                  {prompt.optional ? "Optional" : "Required"}
                </span>
              </div>

              <div
                style={{
                  marginTop: "0.75rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.84)",
                }}
              >
                {prompt.prompt}
              </div>

              {prompt.helper ? (
                <div
                  style={{
                    marginTop: "0.45rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.46)",
                  }}
                >
                  {prompt.helper}
                </div>
              ) : null}

              <textarea
                value={value[prompt.field] ?? ""}
                onChange={(event) => onChange(prompt.field, event.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  marginTop: "0.85rem",
                  resize: "vertical",
                  minHeight: "112px",
                  border: missing ? "1px solid rgba(252,165,165,0.30)" : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(3,3,5,0.78)",
                  padding: "0.9rem 1rem",
                  color: "rgba(255,255,255,0.84)",
                  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
                  fontSize: "0.94rem",
                  lineHeight: 1.6,
                  outline: "none",
                }}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}
