// ============================================================================
// FILE: pages/consulting/index.tsx
// MVP CONSULTING — Advisory & Strategy (Integrity Mode)
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Library,
  ShieldCheck,
  Users as UsersIcon,
  Target as TargetIcon,
  Globe,
  Workflow,
  Network,
  GraduationCap,
  Mic2,
  BookOpen as BookOpenIcon,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

type Pill = { icon: React.ComponentType<any>; title: string; desc: string };

type Deliverable = { title: string; icon: React.ComponentType<any> };

const DOMAINS: Pill[] = [
  {
    icon: UsersIcon,
    title: "Board strategy",
    desc: "Governance, operating cadence, decision hygiene, and legitimacy under scrutiny.",
  },
  {
    icon: TargetIcon,
    title: "Founder advisory",
    desc: "Confidential counsel for scale, crisis, and high-stakes trade-offs.",
  },
  {
    icon: Globe,
    title: "Frontier markets",
    desc: "Execution strategy for operators engaging African growth markets with real constraints.",
  },
];

const DELIVERABLES: Deliverable[] = [
  { title: "Risk containment", icon: ShieldCheck },
  { title: "Legitimacy", icon: GraduationCap },
  { title: "Execution cadence", icon: Workflow },
  { title: "Alignment", icon: Network },
  { title: "Strategic focus", icon: TargetIcon },
];

const HOW: Array<{ step: string; desc: string }> = [
  { step: "Initial call", desc: "45 minutes to understand context, stakes, and fit." },
  { step: "Diagnostic", desc: "Define the real problem with evidence, constraints, and decision owners." },
  { step: "Engagement", desc: "Scope, cadence, success measures — documented. No ambiguity." },
];

export default function ConsultingPage(): JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="Advisory & Strategy"
      description="Board-level strategic counsel rooted in conviction, documented method, and deployable frameworks."
      className="bg-black text-white"
    >
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.16),transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.header
            className="max-w-3xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">Private advisory</p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy for those who{" "}
              <span className="block text-amber-500/90">carry the weight.</span>
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-white/45 sm:text-xl">
              I work with leaders who refuse to outsource responsibility — founders, boards, and builders navigating
              high-stakes complexity.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/contact?source=consulting&intent=consultation"
                className="group inline-flex items-center justify-center rounded-xl bg-amber-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-amber-400"
              >
                Request consultation
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-8 py-4 text-xs font-black uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-500/15"
              >
                View frameworks
                <Library className="ml-2 h-4 w-4" />
              </Link>
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.28em] text-white/35">
              documented method · discreet delivery · limited mandates
            </p>
          </motion.header>
        </div>
      </section>

      {/* MANDATE */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
        <div className="mt-14">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* DOMAINS */}
      <section className="relative bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">Engagement domains</h2>
            <p className="mt-4 text-white/45">Formal advisory focused on consequence, culture, and long-term legitimacy.</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {DOMAINS.map((p, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-amber-500/30"
              >
                <p.icon className="mb-6 h-10 w-10 text-amber-500/80" />
                <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-amber-200">{p.title}</h3>
                <p className="text-sm leading-relaxed text-white/45">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DELIVERABLES */}
      <section className="bg-black py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">Deliverables</p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">What boards actually pay for</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {DELIVERABLES.map((o, i) => (
              <div
                key={i}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center transition-all hover:border-amber-500/25"
              >
                <o.icon className="mx-auto mb-4 h-6 w-6 text-amber-500" />
                <h3 className="font-serif text-sm font-semibold text-white">{o.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPEAKING */}
      <section id="speaking" className="bg-zinc-950 py-20 lg:py-28 border-t border-white/8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80 mb-6">
                Keynotes & appearances
              </p>
              <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl mb-6">Speaking & discourse</h2>
              <p className="text-lg text-white/45 leading-relaxed mb-8">
                I speak on institutional governance, frontier market architecture, and the intersection of principle and
                profit — to catalyze action, not applause.
              </p>

              <div className="space-y-4">
                {[
                  "Keynote addresses for boards and leadership forums",
                  "Private executive retreat facilitation",
                  "Strategic roundtables & panel discourse",
                  "Institutional guest lectures",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/75">
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-black p-8 lg:p-12">
                <Mic2 className="mb-6 h-10 w-10 text-amber-500" />
                <h3 className="font-serif text-2xl font-semibold text-white mb-4">Engage for speaking</h3>
                <p className="text-white/45 text-sm mb-8 italic">
                  “Thought leadership is secondary to structural clarity. I speak to move decisions.”
                </p>
                <Link
                  href="/contact?intent=speaking-engagement"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                >
                  Submit speaking enquiry <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW I WORK + FIT */}
      <section className="bg-black py-20 lg:py-28 border-t border-amber-500/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-white">How I work</h2>
              <p className="mt-6 text-lg text-white/45">
                Structured, documented, accountable — anchored in conviction.
              </p>

              <div className="mt-10 space-y-8">
                {HOW.map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 font-mono text-sm font-bold text-amber-200">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-black uppercase tracking-widest text-white/80">{s.step}</h4>
                      <p className="mt-1 text-sm text-white/45">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 lg:p-12">
              <ShieldCheck className="mb-6 h-10 w-10 text-amber-500" />
              <h3 className="font-serif text-2xl font-semibold text-white">Is this for you?</h3>
              <ul className="mt-8 space-y-4">
                {[
                  "You carry responsibility for other people’s livelihoods",
                  "You want strategy that respects both faith and data",
                  "You prefer documented decisions over vibes",
                ].map((line, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-white/85">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {line}
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Link
                  href="/contact?source=consulting&intent=context-note"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/55 py-4 text-xs font-black uppercase tracking-widest text-amber-200 transition-all hover:bg-amber-500 hover:text-black"
                >
                  Share context note <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.24em] text-white/40">
                  strictly confidential · limited mandates
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black py-14 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Link
              href="/contact?source=consulting&intent=consultation"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/55 px-8 py-4 text-xs font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500 hover:text-black transition-all"
            >
              Request consultation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/canon/volume-i-foundations-of-purpose"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-xs font-black uppercase tracking-widest text-black hover:bg-amber-400 transition-all"
            >
              Read Volume I preview <BookOpenIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}