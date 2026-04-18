import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { MatchedPlaybook } from "@/lib/playbooks/types";

const GOLD = "#C9A96E";

export default function RecommendedPlaybooks({
  playbooks,
}: {
  playbooks: MatchedPlaybook[];
}) {
  if (!playbooks.length) return null;

  return (
    <div
      style={{
        border: `1px solid ${GOLD}18`,
        backgroundColor: `${GOLD}05`,
      }}
    >
      <div
        style={{
          padding: "0.85rem 1.25rem",
          borderBottom: `1px solid ${GOLD}12`,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
        }}
      >
        Matched playbooks
      </div>
      <div className="divide-y" style={{ borderColor: `${GOLD}12` }}>
        {playbooks.map((playbook) => (
          <div key={playbook.id} style={{ padding: "1rem 1.25rem" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1rem",
                    lineHeight: 1.5,
                    color: "rgba(255,255,255,0.78)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {playbook.title}
                </p>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.46)",
                  }}
                >
                  {playbook.summary}
                </p>
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  color: `${GOLD}AA`,
                  flexShrink: 0,
                }}
              >
                {Math.round(playbook.score)}
              </span>
            </div>
            {playbook.reasons.length > 0 && (
              <p
                style={{
                  marginTop: "0.55rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.36)",
                }}
              >
                Matched because {playbook.reasons[0].charAt(0).toLowerCase() + playbook.reasons[0].slice(1)}.
              </p>
            )}
            <Link
              href={playbook.href}
              className="inline-flex items-center gap-1.5 mt-3 transition-opacity hover:opacity-75"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
              }}
            >
              Review the playbooks
              <ArrowRight style={{ width: "10px", height: "10px" }} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
