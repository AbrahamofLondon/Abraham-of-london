import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const features = [
  {
    label: "Governance cadence",
    value: "Retained Oversight preserves governance cadence across cycles so live cases, review windows, and escalation posture remain visible instead of resetting each period.",
  },
  {
    label: "Sponsor-safe visibility",
    value: "Sponsors receive role-safe visibility into cadence posture, active attention, brief status, and continuity without exposing raw respondent text or operator notes.",
  },
  {
    label: "Outcome verification",
    value: "Each cycle preserves delivery control, outcome posture, and the review trail needed to distinguish what was completed, blocked, or still unresolved.",
  },
  {
    label: "Institutional memory",
    value: "Named conditions, required moves, dissenting positions, and missed commitments remain in memory so later reviews inherit the accountable record.",
  },
];

export default function RetainedOversightSection() {
  return (
    <SectionShell
      id="retained-oversight"
      eyebrow="Retained Oversight"
      title="Governance cadence remains live across cycles."
      description="Retained Oversight preserves governance cadence across cycles: sponsor-safe visibility, delivery control, outcome verification, and institutional memory."
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
              <p className="mt-3 text-[15px] leading-[1.8] text-white/68">{feature.value}</p>
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
