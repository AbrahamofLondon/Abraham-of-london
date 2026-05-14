import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const features = [
  {
    label: "The system returns",
    value: "After a governed decision is recorded, the system issues a Return Brief at agreed intervals. Commitments are checked against the record.",
  },
  {
    label: "The record is not discarded",
    value: "Every named condition, required move, and dissenting position is retained. If a commitment is missed or delayed, the record surfaces it.",
  },
  {
    label: "Oversight brief",
    value: "Each return cycle produces a structured brief: what was committed, what has changed, what remains unresolved, and whether escalation is now warranted.",
  },
  {
    label: "Institutional cases",
    value: "Retained oversight is the appropriate layer when a decision has consequence that extends beyond the immediate principals — board, regulator, or counterparty.",
  },
];

export default function RetainedOversightSection() {
  return (
    <SectionShell
      id="retained-oversight"
      eyebrow="Retained Oversight"
      title="The system returns. Commitments are checked against the record."
      description="Retained oversight is not ongoing advice. It is a governed return cycle: the system comes back, compares what was committed against what happened, and names what is still unresolved."
    >
      <div className="mx-auto max-w-[900px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="border border-white/[0.07] bg-white/[0.015] p-5"
            >
              <p
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                  color: `${HOMEPAGE_GOLD}88`,
                }}
              >
                {feature.label}
              </p>
              <p className="mt-3 text-[14px] leading-[1.8] text-white/60">{feature.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/oversight"
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
            View oversight surface
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
