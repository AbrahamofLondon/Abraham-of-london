import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const pilotTerms = [
  {
    label: "Scope",
    value: "One real decision submitted under its actual conditions. Not a scenario. Not a hypothetical.",
  },
  {
    label: "What is returned",
    value: "A named condition, consequence path, required move, and future review point. The record is retained.",
  },
  {
    label: "Operator role",
    value: "Material findings that require human review are routed through operator confirmation before they affect institutional memory.",
  },
  {
    label: "Access",
    value: "Selective. Entry is through the diagnostic surface. Escalation to retained oversight is earned, not assumed.",
  },
];

export default function OperatorPilotBlock() {
  return (
    <SectionShell
      id="operator-pilot"
      eyebrow="Selective Operator Pilot"
      title="A controlled proof around one real decision."
      description="The Selective Operator Pilot is a controlled proof around one real decision. Not a product trial. Not a discovery call. A governed diagnostic that creates a real record."
    >
      <div className="mx-auto max-w-[900px]">
        <div
          className="border"
          style={{ borderColor: `${HOMEPAGE_GOLD}28`, backgroundColor: "rgba(201,169,110,0.02)" }}
        >
          {/* Terms grid */}
          <div className="grid gap-px sm:grid-cols-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {pilotTerms.map((term) => (
              <div
                key={term.label}
                className="p-6"
                style={{ backgroundColor: "rgb(3,3,5)" }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}99`,
                  }}
                >
                  {term.label}
                </p>
                <p className="mt-3 text-[14px] leading-[1.8] text-white/68">{term.value}</p>
              </div>
            ))}
          </div>

          {/* CTA footer */}
          <div
            className="flex flex-col items-start justify-between gap-5 border-t px-6 py-6 sm:flex-row sm:items-center"
            style={{ borderColor: `${HOMEPAGE_GOLD}18` }}
          >
            <p
              style={{
                ...serif,
                fontSize: "1.05rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.48)",
                maxWidth: "42ch",
              }}
            >
              Entry through evidence. The record follows the decision, not the other way around.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/diagnostics/fast"
                className="group inline-flex min-h-[48px] items-center gap-3 border px-7 py-3 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: `${HOMEPAGE_GOLD}55`,
                  backgroundColor: `${HOMEPAGE_GOLD}14`,
                  color: "#F5F5F5",
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                Start with an admissible decision
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/engagements/selective-pilot"
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.34)",
                  whiteSpace: "nowrap",
                }}
              >
                Read Pilot Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
