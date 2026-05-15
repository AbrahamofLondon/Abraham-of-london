import Link from "next/link";
import { ArrowRight, Hash } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const claims = [
  {
    label: "Chain carried forward",
    value: "Provenance travels with the decision — not added later as paperwork. Evidence posture, review state, delivery status, and outcome record are carried forward as part of the decision's operating memory.",
  },
  {
    label: "Hash-verifiable accountability",
    value: "Each governed decision carries forward a hash-verifiable accountability chain: evidence posture, review state, delivery status, outcome record, and internal chain anchor remain linked as the case moves. If the recorded chain changes, the hash evidence changes with it.",
  },
  {
    label: "What it establishes",
    value: "A durable, inspectable record of what was decided, under what evidence, by whom, and when — in sequence. The record does not depend on the operator's continued assurance.",
  },
  {
    label: "Honest boundary",
    value: "Not a blockchain claim. Not a third-party timestamp. The internal chain is live. External WORM anchoring is architected but not yet active.",
  },
];

export default function ProvenanceThesisSection() {
  return (
    <SectionShell
      id="provenance-thesis"
      eyebrow="Provenance"
      title="Provenance travels with the decision."
      description="The chain is not appended after the fact. It is carried forward as the decision moves through evidence, reporting, intervention, and oversight. Every governed decision has an accountable chain — inspectable, hash-verifiable, and not dependent on the operator's continued assurance."
    >
      <div className="mx-auto max-w-[900px]">
        <div className="space-y-3">
          {claims.map((claim) => (
            <div
              key={claim.label}
              className="flex gap-5 border border-white/[0.06] bg-white/[0.01] p-5"
            >
              <Hash
                style={{
                  width: 13,
                  height: 13,
                  color: `${HOMEPAGE_GOLD}66`,
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}80`,
                  }}
                >
                  {claim.label}
                </p>
                <p className="mt-3 text-[15px] leading-[1.8] text-white/62">{claim.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Static sample preview ─────────────────────────────────────── */}
        <div
          className="mt-6 border border-white/[0.07] bg-white/[0.01] p-5"
        >
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "14px",
            }}
          >
            Sample provenance record
          </p>

          {/* Status + hash row */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(110,231,183,0.72)",
                backgroundColor: "rgba(110,231,183,0.05)",
                border: "1px solid rgba(110,231,183,0.15)",
                padding: "0.2rem 0.55rem",
              }}
            >
              Chain intact
            </span>
            <span
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.08em",
                color: `${HOMEPAGE_GOLD}AA`,
              }}
            >
              aef3c2b7d12e…b7d91e
            </span>
          </div>

          {/* Field grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {[
              { label: "Merkle root", value: "9f2a4c…e31d87" },
              { label: "Prior root", value: "8a14bc…f20c53" },
              { label: "Chain status", value: "LINKED" },
              { label: "Scope", value: "OVERSIGHT_CYCLE" },
              { label: "Computed", value: "14 May 2026" },
              { label: "Anchor", value: "VERIFIED" },
            ].map((row) => (
              <div key={row.label}>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                  }}
                >
                  {row.label}
                </p>
                <p
                  style={{
                    ...mono,
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.58)",
                    marginTop: "3px",
                  }}
                >
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-6 border-l-2 px-5 py-4"
          style={{ borderColor: `${HOMEPAGE_GOLD}30`, backgroundColor: `${HOMEPAGE_GOLD}04` }}
        >
          <p
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.30)",
              marginBottom: "6px",
            }}
          >
            Boundary note
          </p>
          <p className="text-[14px] leading-[1.75] text-white/48">
            External WORM and third-party anchoring are architected but not yet live. The internal
            chain-of-custody record is active. No claim of external immutability is made.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/provenance/sample-export"
            className="group inline-flex min-h-[44px] items-center gap-3 border px-6 py-3 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: `${HOMEPAGE_GOLD}40`,
              backgroundColor: `${HOMEPAGE_GOLD}0C`,
              color: "#F5F5F5",
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            View provenance sample
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
