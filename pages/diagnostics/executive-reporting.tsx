import { useEffect } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import ExecutiveReportingPaywall from "@/components/diagnostics/ExecutiveReportingPaywall";
import { enforceExecutiveReportingAccess } from "@/lib/diagnostics/executive-reporting-enforcement";
import { trackExecGateView } from "@/lib/analytics/journey-client";

export default function ExecutiveReportingEntryPage() {
  const router = useRouter();
  const checkoutCancelled = router.query.checkout === "cancelled";
  const accessRequired = router.query.access === "required";

  useEffect(() => {
    trackExecGateView();
  }, []);

  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="Governed executive reporting. The flagship brief that translates diagnostic evidence into financial exposure, institutional constraint, and a governed priority stack."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta
          name="description"
          content="Executive Reporting is the first consequence interpretation layer in the Abraham of London diagnostic ladder."
        />
      </Head>

      <main className="min-h-screen bg-[#050505] px-6 py-24 text-white lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-200/70">
              Flagship · Executive Reporting
            </div>
            <h1 className="mt-4 font-serif text-4xl font-light leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
              The governed executive brief.
              <span className="block text-white/35">Position. Consequence. Priority.</span>
            </h1>
            <p className="mt-5 max-w-2xl font-serif text-lg leading-8 text-white/52">
              Executive Reporting is the flagship output of the diagnostic system. It takes accumulated
              constitutional evidence — tension signals, failure modes, authority posture, institutional
              strain — and produces a board-grade position: financial exposure, institutional constraint,
              governed priority stack, and trajectory outlook where evidence supports it.
            </p>
          </div>

          {/* What it uses / what it produces / who it is for */}
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="border border-white/10 bg-white/[0.025] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/70">What it uses</p>
              <p className="mt-3 text-sm leading-6 text-white/58">
                Constitutional diagnostic evidence, team assessment findings, enterprise pressure readings,
                and a structured executive intake. Evidence quality is assessed and surfaced in the report.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.025] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/70">What it produces</p>
              <p className="mt-3 text-sm leading-6 text-white/58">
                A constitutional position statement, financial exposure estimate, governed priority stack,
                failure mode identification, and directed next action. PDF briefing available for board distribution.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[0.025] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/70">Who it is for</p>
              <p className="mt-3 text-sm leading-6 text-white/58">
                Executives, board members, and institutional principals who need structured interpretation
                before making consequential decisions. Not a general assessment — a governed brief for serious conditions.
              </p>
            </div>
          </div>

          <ExecutiveReportingPaywall
            price={95}
            ctaHref="/diagnostics/executive-reporting/run"
            checkoutPriceCode="executive_reporting"
            primaryCtaLabel="Begin Executive Reporting intake"
            secondaryHref="/diagnostics"
            secondaryLabel="Return to diagnostic ladder"
            eyebrow="Executive Reporting · £95"
            title="Where diagnostic evidence becomes a governed position."
            description="The diagnostic ladder accumulates structural evidence. Executive Reporting translates that evidence into consequence: financial exposure, institutional constraint, and the priority decisions that follow."
            sampleLines={[
              {
                label: "Position statement",
                value: "Execution coherence collapsing under governance drift",
              },
              {
                label: "Financial exposure",
                value: "£420,000 estimated loss over 6 months",
              },
              {
                label: "Priority stack",
                value: "Re-establish authority clarity → collapse redundant reporting → stabilise execution cadence",
              },
            ]}
          />

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.025] p-6 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
                Anonymized sample report
              </p>
              <h2 className="mt-4 max-w-3xl font-serif text-3xl font-light leading-tight text-white md:text-4xl">
                Execution coherence collapsing under governance drift
              </h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/42">
                    Priority Stack
                  </p>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-white/72">
                    <li>1. Re-establish authority clarity at decision layer</li>
                    <li>2. Collapse redundant reporting structures</li>
                    <li>3. Stabilise execution cadence</li>
                  </ol>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
                    Financial Exposure
                  </p>
                  <div className="mt-4 font-serif text-3xl text-white">
                    £420,000
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Estimated loss over 6 months from delay, duplicated reporting load,
                    and execution drag.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-6 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/42">
                How evidence escalates
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/38">
                    Diagnostic ladder (Stages 1–3)
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Constitutional routing, team perception gaps, enterprise pressure mapping.
                    Tension accumulates across stages. Evidence builds.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/70">
                    Executive Reporting (Stage 4)
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Interpretation layer. Takes accumulated evidence, adds executive intake,
                    produces financial exposure, governed priority stack, and a position that
                    can be acted on or escalated to Strategy Room.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {(checkoutCancelled || accessRequired) && (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/75">
                {checkoutCancelled ? "Session cancelled" : "Access required"}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
                {checkoutCancelled
                  ? "No payment was taken. You can return to the free ladder or restart Executive Reporting when ready."
                  : "Executive Reporting is the consequence interpretation layer. Complete checkout to continue into the intake."}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
            <span>One-time report — no subscription</span>
            <span>Derived from your specific evidence</span>
            <span>Deterministic logic — no generic output</span>
          </div>

          <div className="mt-4 border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/38">
              Commercial access
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              £95 one-time access. Payment is processed through Stripe and returns directly
              to the Executive Reporting intake. Also available through Inner Circle access
              without per-report cost.
            </p>
          </div>
        </div>

          {/* External Conditions */}
          <section className="mt-10 mb-8">
            <div className="border border-white/8 bg-white/[0.02] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/28">
                External conditions
              </p>
              <p className="mt-3 max-w-2xl font-serif text-sm leading-6 text-white/45">
                Executive Reporting prices internal consequence. External market conditions affect the urgency and magnitude of that consequence.
              </p>
              <a
                href="/artifacts/global-market-intelligence-report-q1-2026"
                className="mt-3 inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.22em] text-amber-200/70 transition-all hover:text-amber-200/90"
              >
                Global Market Intelligence &middot; &pound;59
                <ArrowRight className="h-2.5 w-2.5" />
              </a>
            </div>
          </section>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const accessDecision = await enforceExecutiveReportingAccess({
    email: typeof ctx.query.email === "string" ? ctx.query.email : null,
    subjectId: typeof ctx.query.subjectId === "string" ? ctx.query.subjectId : null,
    campaignId: typeof ctx.query.campaignId === "string" ? ctx.query.campaignId : null,
    intakeMode: typeof ctx.query.intakeMode === "string" ? ctx.query.intakeMode : "ladder",
    sponsoredDirect: ctx.query.sponsoredDirect === "true",
    sponsorNameOrSeat: typeof ctx.query.sponsor === "string" ? ctx.query.sponsor : null,
    monitoringAccountId:
      typeof ctx.query.monitoringAccountId === "string" ? ctx.query.monitoringAccountId : null,
    monitoringContext: ctx.query.monitoring === "true",
  });

  if (!accessDecision.allowed) {
    return {
      redirect: {
        destination: `${accessDecision.requiredPath || "/diagnostics/constitutional-diagnostic"}?executive=blocked`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};
