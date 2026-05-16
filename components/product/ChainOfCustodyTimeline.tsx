/**
 * components/product/ChainOfCustodyTimeline.tsx
 *
 * Client-safe chain of custody timeline component.
 *
 * Renders governed lifecycle milestones in chronological order.
 * No raw internal event labels. No actor IDs. No suppression field names.
 * No protected notes.
 *
 * Fallback: "No chain-of-custody timeline is available yet for this record."
 *
 * Usage:
 *   <ChainOfCustodyTimeline entries={entries} />
 */

import * as React from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChainOfCustodyCategory =
  | "CASE_CREATED"
  | "ASSESSMENT"
  | "REVIEW"
  | "DELIVERY"
  | "OUTCOME"
  | "RETURN_BRIEF"
  | "ANCHOR";

export type ChainOfCustodyEntry = {
  /** Category drives icon and colour */
  category: ChainOfCustodyCategory;
  /** Client-safe display label — no internal event names */
  label: string;
  /** ISO timestamp — omit if not yet occurred */
  occurredAt?: string | null;
  /** Short plain-English description */
  description?: string | null;
  /** Whether this entry is still pending */
  pending?: boolean;
};

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  ChainOfCustodyCategory,
  { colour: string; pendingColour: string }
> = {
  CASE_CREATED: { colour: `${GOLD}BB`, pendingColour: `${GOLD}44` },
  ASSESSMENT: { colour: "rgba(100,180,255,0.8)", pendingColour: "rgba(100,180,255,0.3)" },
  REVIEW: { colour: `${GOLD}99`, pendingColour: `${GOLD}33` },
  DELIVERY: { colour: "rgba(100,220,140,0.8)", pendingColour: "rgba(100,220,140,0.3)" },
  OUTCOME: { colour: "rgba(100,220,140,0.9)", pendingColour: "rgba(100,220,140,0.3)" },
  RETURN_BRIEF: { colour: `${GOLD}BB`, pendingColour: `${GOLD}33` },
  ANCHOR: { colour: "rgba(200,160,255,0.8)", pendingColour: "rgba(200,160,255,0.3)" },
};

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export type ChainOfCustodyTimelineProps = {
  entries: ChainOfCustodyEntry[];
  /** Optional heading — defaults to "Chain of custody" */
  heading?: string;
  /** Whether to show the section heading */
  showHeading?: boolean;
};

export default function ChainOfCustodyTimeline({
  entries,
  heading = "Chain of custody",
  showHeading = true,
}: ChainOfCustodyTimelineProps) {
  if (!entries || entries.length === 0) {
    return (
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(255,255,255,0.01)",
        }}
        aria-label="Chain of custody timeline"
      >
        {showHeading && (
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              marginBottom: "0.75rem",
            }}
          >
            {heading}
          </p>
        )}
        <p
          style={{
            ...serif,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          No chain-of-custody timeline is available yet for this record.
        </p>
      </section>
    );
  }

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.01)",
        padding: "1rem 1.25rem",
      }}
      aria-label="Chain of custody timeline"
    >
      {showHeading && (
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: `${GOLD}88`,
            marginBottom: "1rem",
          }}
        >
          {heading}
        </p>
      )}

      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {entries.map((entry, index) => {
          const config = CATEGORY_CONFIG[entry.category];
          const colour = entry.pending ? config.pendingColour : config.colour;
          const isLast = index === entries.length - 1;

          return (
            <li
              key={`${entry.category}-${index}`}
              style={{
                display: "flex",
                gap: "0.75rem",
                paddingBottom: isLast ? 0 : "1rem",
              }}
            >
              {/* Timeline spine */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {/* Node */}
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    border: `1.5px solid ${colour}`,
                    backgroundColor: entry.pending
                      ? "transparent"
                      : `${colour}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {!entry.pending ? (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: colour,
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        border: `1px solid ${colour}`,
                      }}
                    />
                  )}
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    style={{
                      width: "1px",
                      flex: 1,
                      minHeight: "1rem",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      marginTop: "2px",
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingTop: "1px", flex: 1 }}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p
                    style={{
                      ...serif,
                      fontSize: "0.9rem",
                      lineHeight: 1.4,
                      color: entry.pending
                        ? "rgba(255,255,255,0.35)"
                        : "rgba(255,255,255,0.78)",
                    }}
                  >
                    {entry.label}
                  </p>

                  {entry.pending && (
                    <span
                      style={{
                        ...mono,
                        fontSize: "6px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        padding: "0.1rem 0.35rem",
                      }}
                    >
                      Pending
                    </span>
                  )}
                </div>

                {entry.description && (
                  <p
                    style={{
                      ...serif,
                      fontSize: "0.82rem",
                      lineHeight: 1.55,
                      color: "rgba(255,255,255,0.38)",
                      marginTop: "0.2rem",
                    }}
                  >
                    {entry.description}
                  </p>
                )}

                {entry.occurredAt && !entry.pending && (
                  <p
                    style={{
                      ...mono,
                      fontSize: "6.5px",
                      letterSpacing: "0.1em",
                      color: "rgba(255,255,255,0.22)",
                      marginTop: "0.25rem",
                    }}
                  >
                    {formatDate(entry.occurredAt)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds a chain-of-custody timeline from a governed case.
 * Uses only client-safe fields — no internal event labels or actor IDs.
 */
export function buildChainOfCustodyFromCase(caseData: {
  createdAt: string;
  updatedAt?: string | null;
  sourceType?: string | null;
  primaryFinding?: string | null;
  provenanceHash?: string | null;
  returnBriefTriggered?: boolean;
  outcomeStatus?: string | null;
}): ChainOfCustodyEntry[] {
  const entries: ChainOfCustodyEntry[] = [];

  // Case created
  entries.push({
    category: "CASE_CREATED",
    label: "Governed case created",
    occurredAt: caseData.createdAt,
    description: caseData.sourceType
      ? `Origin: ${caseData.sourceType.replace(/_/g, " ").toLowerCase()}`
      : "Case record opened.",
  });

  // Assessment recorded
  if (caseData.primaryFinding) {
    entries.push({
      category: "ASSESSMENT",
      label: "Assessment recorded",
      occurredAt: caseData.createdAt,
      description: caseData.primaryFinding.slice(0, 120),
    });
  }

  // Review (if updated after creation)
  if (
    caseData.updatedAt &&
    caseData.updatedAt !== caseData.createdAt
  ) {
    entries.push({
      category: "REVIEW",
      label: "Case reviewed and updated",
      occurredAt: caseData.updatedAt,
    });
  }

  // Provenance anchor (if hash exists)
  if (caseData.provenanceHash) {
    entries.push({
      category: "ANCHOR",
      label: "Provenance hash recorded",
      occurredAt: caseData.createdAt,
      description: "Internal chain anchoring applied. Hash verifiable on demand.",
    });
  }

  // Return Brief
  if (caseData.returnBriefTriggered) {
    entries.push({
      category: "RETURN_BRIEF",
      label: "Return Brief generated",
      occurredAt: caseData.updatedAt ?? caseData.createdAt,
    });
  }

  // Outcome
  if (caseData.outcomeStatus) {
    const isResolved =
      caseData.outcomeStatus === "RESOLVED" || caseData.outcomeStatus === "resolved";
    entries.push({
      category: "OUTCOME",
      label: isResolved ? "Outcome recorded" : "Outcome pending",
      occurredAt: isResolved ? (caseData.updatedAt ?? caseData.createdAt) : null,
      pending: !isResolved,
    });
  } else {
    entries.push({
      category: "OUTCOME",
      label: "Outcome not yet recorded",
      pending: true,
    });
  }

  return entries;
}
