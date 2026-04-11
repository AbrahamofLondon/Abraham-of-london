import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import {
  Shield,
  BarChart3,
  FileText,
  ArrowRight,
  X,
  CheckCircle2,
  Target,
  Scale,
  Activity,
  Crown,
} from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const FADE_UP = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

/* ---- Demo data ---- */

const DEMO = {
  org: "Meridian Capital Group",
  issue: "Board governance breakdown — authority ambiguity across executive committee",
  posture: "DRIFTING",
  route: "DIAGNOSTIC",
  metrics: [
    { label: "Authority Clarity", value: 68, color: "text-amber-400" },
    { label: "Execution Trust", value: 41, color: "text-red-400" },
    { label: "Exposure Score", value: 78, color: "text-red-400" },
  ],
  findings: [
    { title: "Decision-rights ambiguity", desc: "Three board members hold overlapping authority over capital allocation. No single accountable sponsor exists for the transformation programme." },
    { title: "Trust gap between layers", desc: "Leadership rates execution trust at 68%. Operations teams rate it at 41%. This 27-point gap signals a fundamental perception disconnect." },
    { title: "Exposure without governance", desc: "Financial exposure is rated 78% but governance integrity sits at 52%. The organisation is carrying consequence without the structural discipline to contain it." },
  ],
};

const TIERS = [
  {
    name: "Diagnostic Report",
    price: "2,400",
    features: ["Constitutional diagnostic", "Domain analysis across 6 dimensions", "Priority stack and failure modes", "PDF output with forensic watermark"],
    highlighted: false,
  },
  {
    name: "Executive Reporting",
    price: "8,500",
    features: ["Full boardroom-grade report", "Intervention recommendations", "Governance and authority audit", "Quarterly reporting cadence"],
    highlighted: true,
  },
  {
    name: "Strategy Room",
    price: "24,000",
    features: ["Direct advisory engagement", "Mandate execution and tracking", "Sovereign-grade reporting", "Dedicated institutional strategist"],
    highlighted: false,
  },
];

const CASES = [
  {
    pattern: "Governance Trust Gap",
    text: "A FTSE 250 financial services group identified a 34-point trust gap between board and execution layers. The diagnostic surfaced that strategic intent was coherent at the top but systematically diluted through three layers of translation. Intervention re-sequenced the operating cadence and closed the gap within two quarters.",
  },
  {
    pattern: "Contested Authority",
    text: "A private equity-backed technology platform discovered its governance posture was CONTESTED — high execution capacity paired with weak governance discipline. The report revealed that speed was masking structural fragility. A governance reconstruction programme prevented a board-level crisis during the next funding round.",
  },
  {
    pattern: "Authority Ambiguity",
    text: "A family office managing £400M in assets used the diagnostic to surface a critical authority ambiguity between the principal and the operating committee. Decision rights had never been formally codified. The resulting doctrine eliminated 14 months of recurring escalation friction.",
  },
];

const STEPS = [
  { icon: FileText, label: "Submit your brief", desc: "A structured intake captures situation gravity, authority clarity, and consequence exposure." },
  { icon: Activity, label: "Analysis runs", desc: "Constitutional scoring, domain analysis, and governance audit execute against sovereign thresholds." },
  { icon: BarChart3, label: "Report delivered", desc: "A board-grade intelligence brief with governed recommendations and intervention priorities." },
];

/* ---- Page ---- */

export default function ExecutiveReportingPage() {
  const [showDemo, setShowDemo] = React.useState(false);

  return (
    <Layout title="Executive Reporting" description="Board-grade executive intelligence briefs for institutional decision-makers.">
      <Head>
        <meta name="description" content="Board-grade executive intelligence briefs for institutional decision-makers." />
        <link rel="canonical" href="/diagnostics/executive-reporting" />
      </Head>

      {/* ---- Hero ---- */}
      <motion.section {...FADE_UP} className="relative py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Link href="/diagnostics" className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 hover:text-white/50 transition-colors">
              Diagnostics
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/50">Executive Reporting</span>
          </div>

          <Crown className="h-8 w-8 text-amber-500/40 mx-auto mb-6" />

          <h1 className="font-serif text-5xl lg:text-6xl text-white/90 leading-tight tracking-tight">
            Executive Reporting
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/45 max-w-2xl mx-auto">
            Board-grade intelligence briefs that translate diagnostic signal into
            governed recommendations and institutional mandate.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/diagnostics/executive-reporting/run"
              className="inline-flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-8 py-4 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300 hover:bg-amber-500/[0.15] transition-colors">
              Run Your Diagnostic <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button onClick={() => setShowDemo(!showDemo)}
              className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40 hover:text-white/70 transition-colors">
              {showDemo ? "Close demo" : "See it in action"}
            </button>
          </div>
        </div>
      </motion.section>

      {/* ---- Demo ---- */}
      {showDemo && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="py-12 lg:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-8 lg:p-10 relative">
              <button onClick={() => setShowDemo(false)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors">
                <X className="h-5 w-5" />
              </button>

              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/60 block mb-2">
                Live Demo — Sample Report
              </span>
              <h2 className="font-serif text-2xl text-white/85">{DEMO.org}</h2>
              <p className="mt-2 text-sm text-white/40">{DEMO.issue}</p>

              <div className="mt-6 flex items-center gap-4">
                <span className="rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-300">
                  {DEMO.posture}
                </span>
                <span className="font-mono text-[8px] text-white/30">Route: {DEMO.route}</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {DEMO.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                    <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/30 block mb-2">{m.label}</span>
                    <span className={cn("font-serif text-3xl", m.color)}>{m.value}%</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4">
                <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 block">Key Findings</span>
                {DEMO.findings.map((f, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <h3 className="text-sm font-medium text-white/70">{f.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/40">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* ---- How It Works ---- */}
      <motion.section {...FADE_UP} className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">How It Works</span>
            <h2 className="mt-4 font-serif text-3xl text-white/85">Three steps to institutional clarity</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03] mb-5">
                    <Icon className="h-5 w-5 text-amber-500/60" />
                  </div>
                  <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25 mb-2">Step {i + 1}</div>
                  <h3 className="font-serif text-lg text-white/80">{step.label}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-white/40">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ---- Pricing ---- */}
      <motion.section {...FADE_UP} className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Engagement Tiers</span>
            <h2 className="mt-4 font-serif text-3xl text-white/85">Choose your level of engagement</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TIERS.map((tier, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn("rounded-2xl border p-8 flex flex-col",
                  tier.highlighted ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-white/[0.08] bg-white/[0.02]")}>
                <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">{tier.name}</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-3xl text-white/85">£{tier.price}</span>
                  <span className="font-mono text-[9px] text-white/30">+ VAT</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-500/50 mt-0.5 shrink-0" />
                      <span className="text-xs text-white/45">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.highlighted ? "/diagnostics/executive-reporting/run" : "/diagnostics"}
                  className={cn("mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-mono text-[9px] uppercase tracking-[0.2em] transition-all",
                    tier.highlighted
                      ? "border border-amber-500/30 bg-amber-500/[0.08] text-amber-300 hover:bg-amber-500/[0.15]"
                      : "border border-white/[0.08] text-white/40 hover:text-white/70")}>
                  {tier.highlighted ? "Get started" : "Learn more"} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ---- Case Patterns ---- */}
      <motion.section {...FADE_UP} className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Case Patterns</span>
            <h2 className="mt-4 font-serif text-3xl text-white/85">Structural problems the product has solved</h2>
          </div>
          <div className="space-y-6">
            {CASES.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
                <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/60">{c.pattern}</span>
                <p className="mt-3 text-sm leading-[1.8] text-white/50">{c.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ---- Final CTA ---- */}
      <motion.section {...FADE_UP} className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Shield className="h-8 w-8 text-amber-500/30 mx-auto mb-6" />
          <h2 className="font-serif text-3xl text-white/85">Ready for institutional clarity?</h2>
          <p className="mt-4 text-sm text-white/40 max-w-xl mx-auto">
            Begin with the diagnostic. The system will determine whether you qualify for
            executive reporting, strategy room engagement, or foundational correction.
          </p>
          <Link href="/diagnostics/executive-reporting/run"
            className="mt-8 inline-flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-8 py-4 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300 hover:bg-amber-500/[0.15] transition-colors">
            Run Your Diagnostic <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.section>

      {/* ---- Escalation Close ---- */}
      <div className="py-12 border-t border-white/[0.06] text-center">
        <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/25 mb-4">Next Layer</p>
        <Link href="/consulting/strategy-room" className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300/70 hover:text-amber-300 transition-colors">
          Strategy Room <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Layout>
  );
}
