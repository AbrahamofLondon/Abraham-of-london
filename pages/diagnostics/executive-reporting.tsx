import Head from "next/head";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";
import ExecutiveReportingPaywall from "@/components/diagnostics/ExecutiveReportingPaywall";

export default function ExecutiveReportingEntryPage() {
  const router = useRouter();
  const checkoutCancelled = router.query.checkout === "cancelled";
  const accessRequired = router.query.access === "required";

  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="The first paid interpretation layer in the diagnostic ladder. Translate structural strain into financial exposure, strategic consequence, and a priority stack."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta
          name="description"
          content="Executive Reporting is the first paid interpretation layer in the Abraham of London diagnostic ladder."
        />
      </Head>

      <main className="min-h-screen bg-[#050505] px-6 py-24 text-white lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-200/70">
              Paid interpretation layer
            </div>
            <h1 className="mt-4 font-serif text-4xl font-light leading-[0.98] tracking-[-0.04em] text-white md:text-6xl">
              Free diagnosis has established the signal.
              <span className="block text-white/35">Executive Reporting prices the consequence.</span>
            </h1>
            <p className="mt-5 max-w-2xl font-serif text-lg leading-8 text-white/52">
              Executive Reporting is the first serious commercial step in the ladder. It translates
              constitutional strain into financial exposure, institutional constraint, and a governed
              priority stack.
            </p>
          </div>

          <ExecutiveReportingPaywall
            price={95}
            ctaHref="/diagnostics/executive-reporting/run"
            checkoutPriceCode="executive_reporting"
            primaryCtaLabel="Run Executive Reporting"
            secondaryHref="/diagnostics"
            secondaryLabel="Return to free ladder"
            eyebrow="Executive Reporting · £95"
            title="The first moment diagnosis becomes commercial interpretation."
            description="The free ladder shows what is structurally wrong. Executive Reporting turns that signal into consequence: financial exposure, board-level implications, and the next move that can be acted on."
            sampleLines={[
              {
                label: "Report headline",
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
                What changes in Stage 4
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/38">
                    Stages 1-3
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/62">
                    Signal detection: constitutional strain, team divergence, enterprise pressure.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/70">
                    Stage 4
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Interpretation: financial exposure, institutional constraint, and priority decisions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {(checkoutCancelled || accessRequired) && (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/75">
                {checkoutCancelled ? "Checkout cancelled" : "Payment required"}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/58">
                {checkoutCancelled
                  ? "No payment was taken. You can return to the free ladder or restart Executive Reporting when ready."
                  : "Executive Reporting is the paid interpretation layer. Complete checkout to continue into the intake."}
              </p>
            </div>
          )}

          {/* Paywall credibility reinforcement */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
            <span>One-time analysis — no subscription</span>
            <span>Generated from your actual inputs</span>
            <span>No generic output</span>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/38">
              Secure checkout
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              Checkout opens through Stripe. Successful payment returns directly
              to the Executive Reporting intake. The commercial step does not
              interrupt the diagnostic journey.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
