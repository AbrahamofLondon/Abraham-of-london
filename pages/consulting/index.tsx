/* pages/consulting/index.tsx — ADVISORY & STRATEGY (INTEGRITY MODE) */
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Users as UsersIcon,
  Target as TargetIcon,
  BookOpen as BookOpenIcon,
  ArrowRight,
  CheckCircle,
  Globe,
  ShieldCheck,
  FileText,
  Library,
  ScrollText,
  GraduationCap,
  Building2,
  Hammer,
  Cpu,
  Map,
  Workflow,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  Landmark,
  Network,
  Shield,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

export default function ConsultingPage(): JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <Layout 
      title="Advisory & Strategy" 
      description="Board-level strategic counsel rooted in conviction, documented method, and deployable frameworks." 
      className="bg-black text-cream"
    >
      {/* HERO: STRATEGIC WEIGHT */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.header 
            className="max-w-3xl" 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={reduceMotion ? { duration: 0.01 } : { duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Private Advisory</p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy for those who <span className="block text-gold/90">carry the weight.</span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              I work with leaders who refuse to outsource responsibility — founders, boards, and builders navigating high-stakes complexity.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/contact?source=consulting&intent=consultation" className="group relative inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80">
                Request Consultation
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/resources/strategic-frameworks" className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15">
                View Frameworks
                <Library className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.header>
        </div>
      </section>

      {/* MANDATE & FUNNEL */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
        <div className="mt-16">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* AREAS OF ENGAGEMENT */}
      <section className="relative bg-zinc-950 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">Engagement Domains</h2>
            <p className="mt-4 text-gray-400">Formal advisory focused on consequence, culture, and long-term legitimacy.</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              { icon: UsersIcon, title: "Board Strategy", desc: "Governance, operating cadence, and decision hygiene for C-suite leadership." },
              { icon: TargetIcon, title: "Founder Advisory", desc: "Confidential sounding board for decision-makers navigating scale or crisis." },
              { icon: Globe, title: "Frontier Markets", desc: "Specialist execution strategy for operators engaging African growth markets." }
            ].map((p, i) => (
              <div key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-8 hover:border-gold/30 transition-all">
                <p.icon className="mb-6 h-10 w-10 text-gold/80" />
                <h3 className="mb-4 font-serif text-xl font-semibold text-cream group-hover:text-gold">{p.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOARD OUTCOMES */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">Deliverables</p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">What boards actually pay for</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-5">
            {[
              { title: "Risk containment", icon: ShieldCheck },
              { title: "Legitimacy", icon: GraduationCap },
              { title: "Execution cadence", icon: Workflow },
              { title: "Alignment", icon: Network },
              { title: "Strategic focus", icon: TargetIcon }
            ].map((o, i) => (
              <div key={i} className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 hover:border-gold/25 transition-all text-center">
                <o.icon className="mx-auto mb-4 h-6 w-6 text-gold" />
                <h3 className="font-serif text-sm font-semibold text-white">{o.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METHODOLOGY & FIT */}
      <section className="bg-zinc-950 py-20 lg:py-32 border-t border-gold/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-white">How I Work</h2>
              <p className="mt-6 text-lg text-gray-400">The work is structured, documented, and accountable — anchored in conviction.</p>
              <div className="mt-12 space-y-8">
                {[
                  { step: "Initial Call", desc: "45 minutes to understand context, stakes, and fit." },
                  { step: "Diagnostic", desc: "Define the real problem with evidence and constraints." },
                  { step: "Engagement", desc: "Scope, cadence, and success measures. Documented." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">{i + 1}</div>
                    <div>
                      <h4 className="font-bold uppercase tracking-widest text-cream">{s.step}</h4>
                      <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-12">
              <ShieldCheck className="mb-6 h-10 w-10 text-gold" />
              <h3 className="font-serif text-2xl font-semibold text-cream">Is this for you?</h3>
              <ul className="mt-8 space-y-4">
                {[
                  "Carry responsibility for others' livelihoods",
                  "Want strategy that respects both Faith and Data",
                  "Prefer documented decisions over vibes"
                ].map((line, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-medium text-cream/90">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold" /> {line}
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Link href="/contact?source=consulting&intent=context-note" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/50 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:bg-gold hover:text-black">
                  Share Context Note <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-center text-[10px] uppercase tracking-tighter text-gray-500">strictly confidential · limited mandates available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="bg-black py-16 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex flex-col gap-3 sm:flex-row justify-center">
            <Link href="/contact?source=consulting&intent=consultation" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/50 px-8 py-4 text-xs font-bold uppercase tracking-widest text-gold hover:bg-gold hover:text-black transition-all">
              Request Consultation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/canon/volume-i-foundations-of-purpose" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-8 py-4 text-xs font-bold uppercase tracking-widest text-black hover:bg-gold/80 transition-all">
              Read Volume I Preview <BookOpenIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}