import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const MethodPage: NextPage = () => {
  return (
    <Layout
      title="Method | Abraham of London"
      description="How the diagnostic intelligence system works — from signal detection to governed intervention."
      canonicalUrl="/method"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="description" content="How the Abraham of London diagnostic intelligence system works — from signal detection through constitutional analysis to governed intervention." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
          <div className="max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "8px", letterSpacing: "0.28em", color: `${GOLD}90` }}
            >
              Method
            </p>

            <h1
              className="mt-6"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "clamp(2.5rem, 6vw, 4rem)",
                lineHeight: 0.95,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              How this system thinks.
            </h1>

            <p
              className="mt-5"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "1.15rem",
                lineHeight: 1.6,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.42)",
                maxWidth: "56ch",
              }}
            >
              Not a personality test. Not a sentiment survey. A structured diagnostic
              engine built to surface what is actually wrong — and what it will cost
              if left unresolved.
            </p>
          </div>

          {/* Principle strip */}
          <div
            className="mt-16 grid gap-6 md:grid-cols-3"
            style={{ maxWidth: "72rem" }}
          >
            {[
              {
                label: "Signal detection",
                body: "Every diagnostic begins by measuring structural condition — not opinion, not mood. The system captures how decisions are actually being made, where authority is exercised, and where execution has drifted from governance.",
              },
              {
                label: "Constitutional analysis",
                body: "Inputs are evaluated against a constitutional framework: clarity of purpose, coherence of execution, readiness for intervention. The system routes each case to the appropriate depth of analysis based on what the signal actually warrants.",
              },
              {
                label: "Governed interpretation",
                body: "Results are not generated freely. Every output passes through governance constraints that prevent overreach, premature escalation, or recommendations the situation does not justify. The system will refuse to interpret beyond what the evidence supports.",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  padding: "1.5rem",
                }}
              >
                <p
                  className="font-mono uppercase"
                  style={{
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    color: `${GOLD}80`,
                    marginBottom: "1rem",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 300,
                    fontSize: "0.97rem",
                    lineHeight: 1.78,
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Diagnostic ladder */}
          <div className="mt-20 max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}70`, marginBottom: "1.5rem" }}
            >
              The diagnostic ladder
            </p>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                lineHeight: 1.78,
                color: "rgba(255,255,255,0.55)",
                marginBottom: "2rem",
              }}
            >
              The system operates as an escalation ladder. Each stage increases in depth,
              precision, and commercial commitment. You begin with free signal detection
              and escalate only if the situation justifies it.
            </p>

            <div className="space-y-4">
              {[
                {
                  stage: "Stage 1",
                  name: "Purpose Alignment",
                  access: "Free",
                  desc: "Personal diagnostic. Identifies where your own decisions are breaking down and why.",
                },
                {
                  stage: "Stage 2",
                  name: "Constitutional Diagnostic",
                  access: "Free",
                  desc: "Institutional diagnostic. Measures structural condition across governance, authority, and execution coherence.",
                },
                {
                  stage: "Stage 3",
                  name: "Team & Enterprise Assessment",
                  access: "Free",
                  desc: "Extends the diagnosis to team dynamics and enterprise-level pressure. Confirms or challenges the initial signal.",
                },
                {
                  stage: "Stage 4",
                  name: "Executive Reporting",
                  access: "£95",
                  desc: "The first paid interpretation layer. Translates structural strain into financial exposure, institutional consequence, and a governed priority stack.",
                },
                {
                  stage: "Stage 5",
                  name: "Strategy Room",
                  access: "£395",
                  desc: "Governed intervention logic. Moves from diagnosis to an ordered path of institutional correction.",
                },
              ].map((s) => (
                <div
                  key={s.stage}
                  className="flex gap-5"
                  style={{
                    borderLeft: `2px solid ${s.access === "Free" ? "rgba(255,255,255,0.08)" : `${GOLD}40`}`,
                    paddingLeft: "1.25rem",
                    paddingTop: "0.5rem",
                    paddingBottom: "0.5rem",
                  }}
                >
                  <div style={{ minWidth: "4.5rem" }}>
                    <p className="font-mono uppercase" style={{ fontSize: "7px", letterSpacing: "0.26em", color: "rgba(255,255,255,0.28)" }}>
                      {s.stage}
                    </p>
                    <p className="font-mono uppercase" style={{ fontSize: "7px", letterSpacing: "0.20em", color: s.access === "Free" ? "rgba(110,231,183,0.55)" : `${GOLD}90`, marginTop: "4px" }}>
                      {s.access}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 650, color: "rgba(255,255,255,0.78)" }}>
                      {s.name}
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginTop: "0.4rem" }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Governance principles */}
          <div className="mt-20 max-w-3xl">
            <p
              className="font-mono uppercase"
              style={{ fontSize: "7.5px", letterSpacing: "0.28em", color: `${GOLD}70`, marginBottom: "1.5rem" }}
            >
              Governance principles
            </p>

            <div className="space-y-6">
              {[
                {
                  principle: "The system will not escalate beyond what the evidence supports.",
                  detail: "If a situation warrants only a diagnostic reading, the system will not recommend paid interpretation. Commercial commitment is gated by signal strength, not sales pressure.",
                },
                {
                  principle: "Outputs are governed, not generated.",
                  detail: "Every recommendation passes through constitutional constraints. The system can refuse to produce output if the inputs do not meet the threshold for responsible interpretation.",
                },
                {
                  principle: "Accuracy is measured, not assumed.",
                  detail: "Users are invited to evaluate whether the diagnostic accurately reflected their situation. This feedback loop is a design feature, not an afterthought.",
                },
                {
                  principle: "The method is disclosed. The implementation is not.",
                  detail: "You are entitled to understand how this system thinks. You are not entitled to its scoring thresholds, routing logic, or proprietary analytical models.",
                },
              ].map((g) => (
                <div key={g.principle}>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>
                    {g.principle}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.72, color: "rgba(255,255,255,0.40)", marginTop: "0.5rem" }}>
                    {g.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20">
            <Link
              href="/diagnostics/purpose-alignment"
              className="inline-flex items-center gap-2 border-b pb-1 transition-colors hover:border-white/45"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8.5px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(245,245,245,0.70)",
                borderColor: "rgba(255,255,255,0.20)",
              }}
            >
              Begin the diagnostic
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default MethodPage;
