"use client";

/**
 * CategoryFrontDoor — the governed decision intelligence category claim.
 *
 * Declares the category. Shows the refusal engine. Proves governance.
 * Routes buyers into the right path. No SaaS template. No coaching funnel.
 *
 * Vocabulary: decision authority, contradiction, evidence, consequence,
 * restriction, refusal, governed action, execution risk, accountability,
 * outcome memory, admissibility, intervention.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, XCircle, AlertTriangle, CheckCircle } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─────────────────────────────────────────────────────────────────────────────
// REFUSAL ENGINE DEMO — deterministic, no API dependency
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_STEPS = [
  { label: "Finding", status: "pass" as const, detail: "Evidence quality: sufficient. Decision statement is specific enough for governed review." },
  { label: "Contradiction", status: "warn" as const, detail: "Stated authority: CEO. Stated blocker: 'waiting for board approval.' Authority claimed exceeds authority exercised." },
  { label: "Consequence test", status: "restrict" as const, detail: "RESTRICT — decision authority unclear. Execution owner absent. Financial exposure stated without evidence." },
  { label: "Projection", status: "pass" as const, detail: "If authority is confirmed and owner assigned: structural improvement is likely within 30 days." },
  { label: "Required action", status: "action" as const, detail: "Assign one accountable owner. Confirm authority in writing. Re-submit with evidence of financial exposure." },
  { label: "Follow-up", status: "pending" as const, detail: "This decision will be tracked. The system verifies whether intervention worked at 14 and 30 days." },
];

function DemoStep({ step, index, visible }: { step: typeof DEMO_STEPS[0]; index: number; visible: boolean }) {
  const icon = step.status === "pass" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400/70" />
    : step.status === "warn" ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
    : step.status === "restrict" ? <XCircle className="w-3.5 h-3.5 text-red-400/70" />
    : step.status === "action" ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400/70" />
    : <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />;

  const borderColor = step.status === "restrict" ? "border-red-500/20" : step.status === "warn" ? "border-amber-500/15" : "border-white/8";

  return (
    <div
      className={`border ${borderColor} bg-white/[0.02] p-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
          {step.label}
        </span>
      </div>
      <p className="text-sm leading-6 text-zinc-400">{step.detail}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function CategoryFrontDoor() {
  const [demoVisible, setDemoVisible] = React.useState(false);
  const demoRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = demoRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setDemoVisible(true); observer.disconnect(); } },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HERO — CATEGORY CLAIM                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-start sm:items-center justify-center px-6 pt-[132px] sm:pt-24" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="max-w-[720px] text-center">
          <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "1.5rem" }}>
            Decision Infrastructure by Abraham of London
          </div>

          <h1
            style={{
              ...serif,
              fontSize: "clamp(2.4rem, 7vw, 4.2rem)",
              lineHeight: 1.04,
              color: "#F5F5F5",
              letterSpacing: "-0.02em",
              fontStyle: "italic",
            }}
          >
            The decision system that can refuse to proceed.
          </h1>

          <p className="mt-6 mx-auto max-w-[56ch] text-[15px] leading-[1.85]" style={{ color: "rgba(255,255,255,0.48)" }}>
            Decision Infrastructure by Abraham of London tests serious decisions against evidence,
            authority, consequence, and execution reality. If the case is not ready, the system
            can refuse to proceed.
          </p>

          <p className="mt-8 mx-auto max-w-[44ch] text-[13px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.32)" }}>
            Submit one decision under pressure. The system will return its first finding. No account required.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/diagnostics/fast"
              className="group inline-flex items-center gap-3 border px-7 py-4 min-h-[48px] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: `${GOLD}60`,
                backgroundColor: `${GOLD}18`,
                color: "#F5F5F5",
                ...mono,
                fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase",
              }}
            >
              Test a decision
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#refusal-engine"
              style={{ ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}
            >
              See the governed review
            </a>
          </div>

          {/* ── Hero micro-proof: compact governance sequence ── */}
          <div className="mt-10 mx-auto max-w-[480px] border border-white/[0.06] bg-white/[0.015] px-5 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {[
                { label: "Evidence tested", color: "rgba(110,231,183,0.50)" },
                { label: "Contradiction found", color: "rgba(251,191,36,0.50)" },
                { label: "Directive: RESTRICT", color: "rgba(248,113,113,0.55)" },
                { label: "Action required", color: "rgba(255,255,255,0.30)" },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: step.color }} />
                  <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: step.color }}>{step.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-2.5 text-center text-[11px] leading-[1.6]" style={{ ...mono, letterSpacing: "0.04em", color: "rgba(255,255,255,0.14)" }}>
              This system tests the decision, not just the user.
            </p>
          </div>

          <p className="mt-6 mx-auto max-w-[48ch] text-[11px] leading-[1.7]" style={{ ...mono, letterSpacing: "0.06em", color: "rgba(255,255,255,0.16)" }}>
            An earned-access decision institution. No generic output. No sale if the case is not ready.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. REFUSAL ENGINE DEMONSTRATION                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="refusal-engine" className="px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="max-w-[680px] mx-auto">
          <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.75rem" }}>
            How a decision is governed
          </div>
          <p style={{ ...serif, fontSize: "clamp(1.4rem, 4vw, 2rem)", lineHeight: 1.15, color: "rgba(255,255,255,0.88)", fontStyle: "italic" }}>
            A sample decision enters the system. Watch it get restricted.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-500">
            Input: &ldquo;We need to restructure the leadership team, but the board hasn&rsquo;t formally approved the mandate and the CEO wants to move before Q3.&rdquo;
          </p>

          <div ref={demoRef} className="mt-8 space-y-3">
            {DEMO_STEPS.map((step, i) => (
              <DemoStep key={step.label} step={step} index={i} visible={demoVisible} />
            ))}
          </div>

          <p className="mt-6 text-xs text-zinc-600 leading-5" style={mono}>
            This is a demonstration. Live decisions are tested against evidence quality,
            authority clarity, consequence exposure, and execution readiness.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. CATEGORY DIFFERENTIATION                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[800px] mx-auto">
          <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.75rem" }}>
            Governed Decision Intelligence
          </div>
          <p style={{ ...serif, fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)", lineHeight: 1.2, color: "rgba(255,255,255,0.85)", fontStyle: "italic", maxWidth: "36ch" }}>
            Not another assessment. Not another dashboard. Decision infrastructure.
          </p>

          <div className="mt-10 grid gap-px md:grid-cols-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {[
              { what: "Assessment tools", does: "produce scores.", miss: "No one governs what happens after the score." },
              { what: "Consultants", does: "produce recommendations.", miss: "No one tracks whether the recommendation was executed." },
              { what: "BI platforms", does: "show dashboards.", miss: "No one detects that the decision behind the data has not been taken." },
              { what: "AI copilots", does: "generate suggestions.", miss: "No one refuses to proceed when the logic is unsound." },
            ].map((item) => (
              <div key={item.what} className="p-5" style={{ backgroundColor: "rgb(3,3,5)" }}>
                <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                  {item.what} {item.does}
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.miss}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-5 border" style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}05` }}>
            <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
              Decision Infrastructure by Abraham of London
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Governs the decision itself. Tests logic before action. Detects contradiction across evidence.
              Refuses invalid structure. Tracks execution. Verifies outcomes. Compounds intelligence across every interaction.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. PRODUCT LADDER — accumulated intelligence                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[680px] mx-auto">
          <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.75rem" }}>
            One accumulated intelligence journey
          </div>
          <p style={{ ...serif, fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)", lineHeight: 1.2, color: "rgba(255,255,255,0.85)", fontStyle: "italic", maxWidth: "36ch" }}>
            Each stage adds evidence. Nothing resets.
          </p>

          <div className="mt-10 space-y-1">
            {[
              { stage: "01", name: "Fast Diagnostic", desc: "First contradiction signal", href: "/diagnostics/fast", free: true },
              { stage: "02", name: "Purpose Alignment", desc: "Identity and mandate coherence", href: "/diagnostics/purpose-alignment", free: true },
              { stage: "03", name: "Constitutional Diagnostic", desc: "Authority and pressure structure", href: "/diagnostics/constitutional-diagnostic", free: true },
              { stage: "04", name: "Team Assessment", desc: "Perception gap and operating reality", href: "/diagnostics/team-assessment", free: true },
              { stage: "05", name: "Enterprise Assessment", desc: "Organisational fragility and exposure", href: "/diagnostics/enterprise-assessment", free: true },
              { stage: "06", name: "Executive Reporting", desc: "Priced consequence and required action", href: "/diagnostics/executive-reporting", free: false },
              { stage: "07", name: "Strategy Room", desc: "Governed intervention path", href: "/strategy-room", free: false },
              { stage: "08", name: "Return Brief", desc: "Outcome verification and decision memory", href: null, free: false },
            ].map((item) => (
              <div key={item.stage} className="flex items-start gap-4 p-4 border border-white/[0.04] hover:border-white/[0.08] transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.01)" }}>
                <span style={{ ...mono, fontSize: "12px", color: `${GOLD}50`, width: "1.5rem", flexShrink: 0 }}>{item.stage}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.href ? (
                      <Link href={item.href} className="text-sm font-medium text-white/80 hover:text-white transition-colors">{item.name}</Link>
                    ) : (
                      <span className="text-sm font-medium text-white/50">{item.name}</span>
                    )}
                    {item.free && <span style={{ ...mono, fontSize: "8px", color: "rgba(110,231,183,0.50)" }}>Free</span>}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                </div>
                {item.href && <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. PROOF OF GOVERNANCE                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[800px] mx-auto">
          <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.75rem" }}>
            How the system refuses nonsense
          </div>

          <div className="mt-6 grid gap-px md:grid-cols-2 lg:grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            {[
              { name: "Contradiction Memory", desc: "Accumulates contradictions across assessments. Unresolved tensions compound in severity over time." },
              { name: "Evidence Quality", desc: "Grades input on clarity, context, and consequence. Below threshold: the system restricts progression." },
              { name: "Governed Output", desc: "Prevents fabricated claims. Multiple constraint checks ensure output is grounded in your evidence." },
              { name: "Cross-Assessment Review", desc: "Detects where different stages of evidence point in conflicting directions." },
              { name: "Consequence Projection", desc: "Tests what happens if you escalate, replace an owner, or force a deadline — before committing." },
              { name: "Outcome Verification", desc: "14 and 30-day follow-up. Classifies whether intervention resolved, improved, stabilised, or worsened the condition." },
            ].map((item) => (
              <div key={item.name} className="p-5" style={{ backgroundColor: "rgb(3,3,5)" }}>
                <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70` }}>{item.name}</div>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. BUYER PATHWAYS                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Individual leaders */}
            <div className="border border-white/8 bg-white/[0.02] p-6 flex flex-col">
              <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                For individual leaders
              </div>
              <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.3, color: "rgba(255,255,255,0.80)", marginTop: "0.75rem", fontStyle: "italic", flex: 1 }}>
                Test a decision you are about to make.
              </p>
              <Link
                href="/diagnostics/fast"
                className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 py-3 border text-sm transition-colors hover:bg-white/5"
                style={{ borderColor: `${GOLD}35`, color: `${GOLD}CC`, ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                Start Fast Diagnostic <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Operators and teams */}
            <div className="border border-white/8 bg-white/[0.02] p-6 flex flex-col">
              <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
                For operators and executive teams
              </div>
              <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.3, color: "rgba(255,255,255,0.80)", marginTop: "0.75rem", fontStyle: "italic", flex: 1 }}>
                Expose where stated strategy and operating reality disagree.
              </p>
              <Link
                href="/diagnostics/enterprise-assessment"
                className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 py-3 border text-sm transition-colors hover:bg-white/5"
                style={{ borderColor: `${GOLD}35`, color: `${GOLD}CC`, ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                Run Enterprise Assessment <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Boards and high-stakes */}
            <div className="border p-6 flex flex-col" style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}04` }}>
              <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70` }}>
                For boards, founders, and high-stakes interventions
              </div>
              <p style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.3, color: "rgba(255,255,255,0.80)", marginTop: "0.75rem", fontStyle: "italic", flex: 1 }}>
                Commission an Executive Report or Strategy Room review.
              </p>
              <Link
                href="/diagnostics/executive-reporting"
                className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 py-3 border text-sm transition-colors hover:bg-white/5"
                style={{ borderColor: `${GOLD}50`, color: `${GOLD}CC`, ...mono, fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase" }}
              >
                Enter Executive Reporting <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 7. TRUST SECTION                                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-16" style={{ backgroundColor: "rgb(3,3,5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[680px] mx-auto">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Human review available on request for any reading.",
              "Evidence quality is graded. Weak input triggers restriction, not fabrication.",
              "The system does not invent certainty. Confidence bands are always visible.",
              "Outcome evidence at 14 and 30 days improves future judgment.",
              "Every governed recommendation is auditable and challengeable.",
              "No sale if the case is not ready. The system can refuse.",
            ].map((line) => (
              <div key={line} className="flex gap-2 text-sm leading-6 text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-1" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 8. FINAL CTA                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-24 text-center" style={{ backgroundColor: "rgb(3,3,5)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ ...serif, fontSize: "clamp(1.3rem, 4vw, 2rem)", lineHeight: 1.2, color: "rgba(255,255,255,0.75)", fontStyle: "italic", maxWidth: "32ch", margin: "0 auto" }}>
          Bring one decision the organisation cannot afford to get wrong.
        </p>
        <div className="mt-8">
          <Link
            href="/diagnostics/fast"
            className="group inline-flex items-center gap-3 border px-8 py-5 min-h-[52px] transition-all duration-200 hover:-translate-y-0.5"
            style={{
              borderColor: `${GOLD}60`,
              backgroundColor: `${GOLD}18`,
              color: "#F5F5F5",
              ...mono,
              fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase",
            }}
          >
            Test a decision
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  );
}
