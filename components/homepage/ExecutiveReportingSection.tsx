import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono, serif } from "@/components/homepage/homepagePrimitives";

const fields = [
  { label: "Headline", value: "A single governed statement of the decision condition and its systemic risk." },
  { label: "Route", value: "The system's recommended path: diagnose, escalate, intervene, or defer." },
  { label: "Governance risk score", value: "A rated exposure indicator derived from evidence, authority gaps, and consequence range." },
  { label: "Top pressure points", value: "The specific structural failures driving the condition — not generic observations." },
  { label: "Correction priorities", value: "Ordered required moves with assigned timeframes and execution sequence." },
  { label: "Escalation recommendation", value: "Whether the case warrants board, counsel, or retained oversight — and why." },
];

export default function ExecutiveReportingSection() {
  return (
    <SectionShell
      id="executive-reporting"
      eyebrow="Executive Reporting"
      title="A governed report. Not a summary."
      description="When the Fast Diagnostic evidence reaches threshold, the system generates a structured executive report — a record with a named condition, a seriousness rating, and a required sequence of moves. It opens when earned, not on request."
    >
      <div className="mx-auto max-w-[900px]">
        <div
          className="border"
          style={{ borderColor: `${HOMEPAGE_GOLD}22`, backgroundColor: "rgba(201,169,110,0.015)" }}
        >
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.035)" }}>
            {fields.map((field) => (
              <div key={field.label} className="p-5" style={{ backgroundColor: "rgb(3,3,5)" }}>
                <p
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    color: `${HOMEPAGE_GOLD}90`,
                  }}
                >
                  {field.label}
                </p>
                <p className="mt-3 text-[13px] leading-[1.75] text-white/58">{field.value}</p>
              </div>
            ))}
          </div>
          <div
            className="flex flex-col items-start justify-between gap-5 border-t px-6 py-6 sm:flex-row sm:items-center"
            style={{ borderColor: `${HOMEPAGE_GOLD}14` }}
          >
            <p
              style={{
                ...serif,
                fontSize: "1rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.42)",
                maxWidth: "44ch",
              }}
            >
              The report is generated from your diagnostic evidence. It does not begin with a brief.
            </p>
            <Link
              href="/diagnostics/executive-reporting"
              className="group inline-flex min-h-[44px] items-center gap-3 border px-6 py-3 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: `${HOMEPAGE_GOLD}45`,
                backgroundColor: `${HOMEPAGE_GOLD}10`,
                color: "#F5F5F5",
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              See executive reporting format
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
