import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const stages = [
  { label: "Submit One Real Decision", state: "Open entry", detail: "The public start point. Submit one live decision under pressure.", href: "/diagnostics/fast", open: true },
  { label: "Personal Decision Audit", state: "Shown when earned", detail: "Used when the issue appears personal, mandate-related, or obligation-bound." },
  { label: "Constitutional Diagnostic", state: "Shown when earned", detail: "Used when governance readiness and authority structure must be tested." },
  { label: "Executive Reporting", state: "Shown when earned", detail: "Opens when the evidence supports a governed report." },
  { label: "Strategy Room", state: "Not a starting point", detail: "Execution intervention, available only when escalation is warranted." },
  { label: "Return Brief", state: "Triggered by record", detail: "Used when commitments are missed, delayed, or unresolved." },
  { label: "Counsel Review", state: "Qualified escalation", detail: "Reserved for conditions the system cannot responsibly model alone." },
  { label: "Boardroom and Oversight", state: "Institutional cases only", detail: "Later-stage governed surfaces for qualified institutional records." },
];

export default function EarnedProgressionBlock() {
  return (
    <SectionShell
      id="earned-progression"
      eyebrow="Earned progression"
      title="The next layer is earned by evidence."
      description="You do not choose the highest product. You submit evidence. The system determines what is warranted, what is blocked, and what is still premature."
    >
      <div className="mx-auto max-w-[900px] space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex gap-4 border border-white/[0.08] bg-white/[0.02] p-5">
            <span style={{ ...mono, fontSize: "10px", color: index === 0 ? `${HOMEPAGE_GOLD}CC` : "rgba(255,255,255,0.30)", width: "22px", flexShrink: 0 }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="text-[15px] leading-[1.4] text-white/82">{stage.label}</p>
                <span
                  className="inline-flex w-fit items-center gap-2"
                  style={{
                    ...mono,
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: stage.open ? `${HOMEPAGE_GOLD}CC` : "rgba(255,255,255,0.42)",
                  }}
                >
                  {stage.open ? null : <Lock className="h-3 w-3" />}
                  {stage.state}
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.8] text-white/58">{stage.detail}</p>
              {stage.open && stage.href ? (
                <div className="mt-4">
                  <Link
                    href={stage.href}
                    className="group inline-flex min-h-[44px] items-center gap-2 border px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: `${HOMEPAGE_GOLD}40`,
                      backgroundColor: `${HOMEPAGE_GOLD}10`,
                      color: "#F5F5F5",
                      ...mono,
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    Submit One Real Decision
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
