import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Eye, Clock } from "lucide-react";

import Layout from "@/components/Layout";
import { buildWatchViewModel } from "@/lib/diagnostics/watch-state";

type Props = {
  vm: ReturnType<typeof buildWatchViewModel>;
};

const AMBER = "#F59E0B";

export default function DiagnosticWatchPage({ vm }: Props) {
  return (
    <Layout
      title="WATCH — Governed Observation | Abraham of London"
      description="WATCH classification: structural signal detected but escalation is not yet justified. Governed observation with defined monitoring cadence."
      canonicalUrl="/diagnostics/watch"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className="min-h-screen bg-[#050505] px-6 py-24 text-white lg:px-12">
        <section className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Eye style={{ width: "14px", height: "14px", color: `${AMBER}AA` }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${AMBER}CC`,
              }}
            >
              WATCH · Governed observation
            </span>
          </div>

          <h1 className="font-serif text-4xl font-light leading-[0.98] tracking-[-0.04em] text-white md:text-5xl">
            The system is reading a condition.
            <span className="block mt-1" style={{ color: `${AMBER}CC` }}>
              Escalation is not yet justified.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl font-serif text-lg leading-8 text-white/52">
            {vm.escalationNotJustifiedBecause}
          </p>

          {/* Conditions being watched */}
          <div className="mt-10 border border-white/10 bg-white/[0.025] p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
              Conditions under observation
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/45">
              The diagnostic system has identified the following structural conditions. They are being
              tracked, not dismissed, but they do not yet justify executive intervention.
            </p>
            <ul className="mt-5 space-y-3">
              {vm.watchedConditions.map((condition) => (
                <li key={condition} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: `${AMBER}88` }} />
                  <span className="text-sm leading-6 text-white/65">{condition}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What must change */}
          <div className="mt-5 border border-white/10 bg-white/[0.025] p-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/42">
              What must change before escalation
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Escalation into Executive Reporting requires either: a WATCH condition that degrades on
              reassessment, a new diagnostic stage revealing structural failure not visible at the current
              level, or a material change in institutional condition that shifts the evidence base. The
              path to escalation remains open — it is governed by evidence, not gatekept by policy.
            </p>
          </div>

          {/* Monitoring cadence */}
          <div className="mt-5 border border-amber-400/20 bg-amber-400/[0.05] p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock style={{ width: "14px", height: "14px", color: `${AMBER}AA` }} />
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/70">
                Recommended monitoring cadence: {vm.cadence}
              </h2>
            </div>
            <p className="text-sm leading-6 text-white/55">
              Re-run the relevant diagnostic stage in {vm.cadence === "monthly" ? "30" : "60–90"} days.
              If the reading holds or improves, the system is self-correcting. If it degrades,
              the next step is Executive Reporting — the evidence will then support escalation.
            </p>
          </div>

          {/* Next valid steps */}
          <div className="mt-8 space-y-3">
            <Link
              href={vm.nextValidMove}
              className="flex items-center justify-between border border-amber-400/20 bg-amber-400/[0.04] p-5 transition-all hover:bg-amber-400/[0.08]"
            >
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-200/80">
                  Recommended next step
                </span>
                <p className="mt-1 font-serif text-base text-white/75">
                  {vm.nextValidMove.includes("executive-reporting")
                    ? "View Executive Reporting — if conditions have changed materially"
                    : "Re-enter the diagnostic ladder — reassess after monitoring period"}
                </p>
              </div>
              <ArrowRight style={{ width: "14px", height: "14px", color: AMBER, flexShrink: 0 }} />
            </Link>
            <Link
              href="/diagnostics"
              className="flex items-center justify-between border border-white/8 p-5 transition-all hover:bg-white/[0.02]"
            >
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
                  Return to diagnostic system
                </span>
                <p className="mt-1 font-serif text-base text-white/55">
                  View the full staged evidence ladder
                </p>
              </div>
              <ArrowRight style={{ width: "14px", height: "14px", color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
            </Link>
          </div>

          <p
            className="mt-8"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.24)",
            }}
          >
            WATCH is a governed classification — not a dead end · Escalation opens when evidence supports it
          </p>
        </section>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const q = ctx.query;
  return {
    props: {
      vm: buildWatchViewModel({
        source: typeof q.source === "string" ? q.source : null,
        state: typeof q.state === "string" ? q.state : null,
        score: typeof q.score === "string" ? Number(q.score) : null,
        nextRoute: typeof q.next === "string" ? q.next : null,
      }),
    },
  };
};
