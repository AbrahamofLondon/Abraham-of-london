import Link from "next/link";
import { ArrowRight, Hash } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const claims = [
  {
    label: "Chain-anchored record",
    value: "Each governed decision produces a merkle root. Subsequent records reference the prior root — forming a tamper-evident chain.",
  },
  {
    label: "Provenance hash",
    value: "A chain hash is derived from the record contents and the prior root. If any field is altered, the hash breaks. The break is visible.",
  },
  {
    label: "What it is not",
    value: "Not a blockchain claim. Not a third-party timestamp. The internal chain is live. External WORM anchoring is architected but not yet active.",
  },
  {
    label: "What it establishes",
    value: "A durable, inspectable record of what was decided, under what evidence, by whom, and when — in sequence. The record does not depend on the operator's continued assurance.",
  },
];

export default function ProvenanceThesisSection() {
  return (
    <SectionShell
      id="provenance-thesis"
      eyebrow="Provenance"
      title="Every governed decision leaves a chain-anchored record."
      description="The provenance layer is not a feature. It is the condition under which a decision can be said to have a governed record at all — one that cannot be revised after the fact without the revision being visible."
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
