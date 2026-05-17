import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { SectionShell, HOMEPAGE_GOLD, mono } from "@/components/homepage/homepagePrimitives";

const stages: {
  label: string;
  state: string;
  detail: string;
  href?: string;
  open?: boolean;
  ctaLabel?: string;
}[] = [
  {
    label: "Fast Diagnostic",
    state: "Open entry",
    detail: "The public start point. Submit one live decision under pressure. The system names the condition, tests evidence and authority, and returns a structured finding.",
    href: "/diagnostics/fast",
    open: true,
    ctaLabel: "Run the Fast Diagnostic",
  },
  {
    label: "Professional",
    state: "Continuity layer",
    detail: "When cases need to remain active over time, Professional preserves continuity: more active governed cases, Return Briefs, client-safe evidence export, sharing, and organisation collaboration.",
    href: "/pricing",
    ctaLabel: "View Professional continuity",
  },
  {
    label: "Executive Reporting",
    state: "Earned by evidence",
    detail: "Opens when the Fast Diagnostic reaches evidential threshold. A governed report with a named condition, seriousness rating, governance risk score, and a required sequence of moves.",
    href: "/diagnostics/executive-reporting",
    ctaLabel: "See executive reporting format",
  },
  {
    label: "Strategy Room",
    state: "Earned through escalation",
    detail: "A structured intervention session, available only when the evidence record supports escalation. Not a starting point. Produces a binding session record with named authority and dissenting positions retained.",
  },
  {
    label: "Retained Oversight",
    state: "Institutional cases",
    detail: "An ongoing governed return cycle. The system returns at agreed intervals, compares what was committed against what happened, and names what remains unresolved.",
    href: "/oversight",
    ctaLabel: "View oversight surface",
  },
  {
    label: "Provenance",
    state: "Chain carried forward",
    detail: "Every governed decision carries its accountable chain forward: evidence posture, review state, delivery status, outcome record, and internal chain anchor. Provenance is not added later as paperwork; it travels with the decision.",
    href: "/provenance/sample-export",
    ctaLabel: "View provenance sample",
  },
  {
    label: "Return Brief",
    state: "Triggered by record",
    detail: "A Return Brief reopens the governed record when the condition remains active. It records what changed, what did not, what commitment was missed or completed, and what is now required.",
    href: "/return-brief",
    ctaLabel: "Understand Return Brief",
  },
  {
    label: "Counsel Review",
    state: "Qualified escalation",
    detail: "Reserved for conditions the system cannot responsibly model alone — where human professional judgement is required and the evidence record supports referral.",
  },
];

export default function EarnedProgressionBlock() {
  return (
    <SectionShell
      id="earned-progression"
      eyebrow="Earned progression"
      title="The next layer is earned by evidence."
      description="You do not choose the highest product. Free entry creates trust, Professional preserves continuity, and later layers open only when the evidence record warrants them."
    >
      <div className="mx-auto max-w-[900px] space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.label} className="flex gap-4 border border-white/[0.08] bg-white/[0.02] p-5">
            <span
              style={{
                ...mono,
                fontSize: "10px",
                color: index === 0 ? `${HOMEPAGE_GOLD}CC` : "rgba(255,255,255,0.28)",
                width: "22px",
                flexShrink: 0,
              }}
            >
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
                    color: stage.open ? `${HOMEPAGE_GOLD}CC` : "rgba(255,255,255,0.38)",
                  }}
                >
                  {stage.open ? null : <Lock className="h-3 w-3" />}
                  {stage.state}
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-[1.8] text-white/62">{stage.detail}</p>
              {stage.href ? (
                <div className="mt-4">
                  <Link
                    href={stage.href}
                    className="group inline-flex min-h-[44px] items-center gap-2 border px-5 py-3 transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: `${HOMEPAGE_GOLD}38`,
                      backgroundColor: stage.open ? `${HOMEPAGE_GOLD}10` : "transparent",
                      color: stage.open ? "#F5F5F5" : "rgba(255,255,255,0.48)",
                      ...mono,
                      fontSize: "9px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {stage.ctaLabel}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
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
