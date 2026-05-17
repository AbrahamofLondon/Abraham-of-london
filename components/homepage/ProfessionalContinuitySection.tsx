import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const continuityPoints = [
  {
    label: "Active case continuity",
    value: "Keep more governed cases active beyond the free limit without losing the readable record of what came before.",
  },
  {
    label: "Return Briefs",
    value: "Reopen a live governed record when the condition returns, stalls, or requires structured re-engagement.",
  },
  {
    label: "Defensible sharing",
    value: "Export client-safe evidence and share reviewer-safe case views when the record needs scrutiny beyond one operator.",
  },
  {
    label: "Organisation workspace",
    value: "Carry governed work across collaborators without turning the case into an unstructured chat thread.",
  },
];

export default function ProfessionalContinuitySection() {
  return (
    <SectionShell
      id="professional-continuity"
      eyebrow="Professional continuity"
      title="Professional keeps governed cases alive."
      description="Free entry creates the first trusted record. Professional preserves continuity once live cases need to remain active, return, travel, and be reviewed over time."
    >
      <div className="mx-auto max-w-[900px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {continuityPoints.map((point) => (
            <div
              key={point.label}
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
                {point.label}
              </p>
              <p className="mt-3 text-[15px] leading-[1.8] text-white/68">{point.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/pricing"
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
            View Professional continuity
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/provenance/demo"
            className="inline-flex min-h-[44px] items-center border border-white/[0.10] px-5 py-3"
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.44)",
            }}
          >
            View provenance demo
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}
