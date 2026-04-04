/* ============================================================================
   FILE: components/homepage/OGRFlagshipSection.tsx
   HOMEPAGE FLAGSHIP — OGR ENGINE (GEOMETRIC INTENT / CRISPER LUXURY)
============================================================================ */

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Terminal,
  Zap,
  Radar,
  ShieldCheck,
  Scale,
  Crown,
  CheckCircle2,
  Activity,
  Building2,
  Users,
  ScanSearch,
  Briefcase,
} from "lucide-react";

type SupportPath = {
  title: string;
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
};

const SUPPORT_PATHS: SupportPath[] = [
  {
    title: "Quick Diagnostic",
    href: "/purpose-alignment",
    label: "Individual",
    desc: "A lighter entry point for personal clarity, directional drift, and behavioural alignment.",
    icon: ScanSearch,
  },
  {
    title: "Team Alignment",
    href: "/diagnostics/team-alignment",
    label: "Team",
    desc: "A sharper reading of team coherence, execution friction, and communication drag.",
    icon: Users,
  },
  {
    title: "Enterprise Diagnostic",
    href: "/diagnostics/enterprise",
    label: "Enterprise",
    desc: "A deeper institutional reading where structural fragility, leadership variance, and operating weakness matter.",
    icon: Building2,
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[8%] top-[6%] h-[26rem] w-[26rem] rounded-full bg-amber-500/[0.035] blur-[120px]" />
      <div className="absolute right-[6%] top-[18%] h-[18rem] w-[18rem] rounded-full bg-white/[0.015] blur-[110px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.012)_48%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute inset-0 aol-grain opacity-[0.035]" />
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-500/28" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/60">
        {children}
      </span>
    </div>
  );
}

function SoftFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[28px] border border-white/[0.08] bg-white/[0.025]",
        "shadow-[0_24px_70px_-50px_rgba(0,0,0,0.92)]",
        className,
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-black/50 p-6 md:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.025),transparent_55%)]" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function HardFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-[30px] border border-amber-500/18",
        "bg-[linear-gradient(180deg,rgba(245,158,11,0.04)_0%,rgba(255,255,255,0.012)_100%)]",
        "shadow-[0_28px_90px_-55px_rgba(0,0,0,0.96)]",
        className,
      ].join(" ")}
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/70 p-7 md:p-9 lg:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/18 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(245,158,11,0.05),transparent_52%)]" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function ProofStripItem({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<any>;
  title: string;
  body: string;
}) {
  return (
    <div className="border-l border-white/8 pl-5 first:border-l-0 first:pl-0">
      <Icon className="h-4 w-4 text-amber-400/70" />
      <h3 className="mt-4 font-serif text-2xl text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/50">{body}</p>
    </div>
  );
}

function PathCard({
  item,
  compact = false,
}: {
  item: SupportPath;
  compact?: boolean;
}) {
  const Icon = item.icon;

  return (
    <SoftFrame className="h-full">
      <div className="flex items-start justify-between gap-4">
        <Icon className="h-6 w-6 text-amber-400/58 transition-colors" />
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-white/56">
          {item.label}
        </span>
      </div>

      <h4 className={`mt-6 font-serif text-white ${compact ? "text-xl" : "text-2xl"}`}>
        {item.title}
      </h4>

      <p className="mt-3 text-sm leading-relaxed text-white/46">{item.desc}</p>

      <Link
        href={item.href}
        className="group/link mt-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/66 transition-colors hover:text-amber-300"
      >
        <span>Open pathway</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
      </Link>
    </SoftFrame>
  );
}

export default function OGRFlagshipSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-black text-white">
      <AmbientField />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        {/* ----------------------------------------------------------------- */}
        {/* ACT I — FLAGSHIP HERO                                              */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-4xl">
              <RailLabel>Flagship Engine</RailLabel>

              <div className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2">
                <Crown className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                  Organic Geometric Resonance
                </span>
              </div>

              <motion.h2
                className="mt-8 max-w-[12ch] font-serif text-4xl font-light leading-[0.98] tracking-[-0.03em] text-white md:text-5xl lg:text-[4.15rem]"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.08 }}
              >
                Simulate pressure
                <span className="mt-2 block text-white/58">before commitment</span>
              </motion.h2>

              <motion.p
                className="mt-6 max-w-2xl text-base font-light leading-relaxed text-white/58 md:text-[1.04rem]"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.18 }}
              >
                The OGR Engine is the flagship diagnostic layer for modelling
                institutional friction, resonance, and decision certainty before
                action is taken and consequences harden.
              </motion.p>

              <motion.p
                className="mt-6 max-w-2xl text-sm leading-relaxed text-white/42"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.24 }}
              >
                Not another assessment. Not a soft survey. A decision-grade
                simulation environment for reading drag, exposing false clarity,
                and pressure-testing the next move.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-col gap-4 sm:flex-row"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.28 }}
              >
                <Link
                  href="/dashboard/live"
                  className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                >
                  <span>Enter OGR Terminal</span>
                  <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
                </Link>

                <Link
                  href="/diagnostics"
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  <span>How OGR fits the system</span>
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>

              <motion.div
                className="mt-10 h-px w-48 bg-gradient-to-r from-amber-500/30 to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.05, delay: 0.38 }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-5 lg:self-end"
            initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.14 }}
          >
            <HardFrame>
              <div className="mb-8 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                  OGR posture
                </span>
                <Terminal className="h-4 w-4 text-amber-500/50" />
              </div>

              <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/26">
                    Mode
                  </div>
                  <div className="mt-2 font-serif text-lg text-white/88">Live</div>
                </div>
                <div className="border-l border-white/6 pl-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/26">
                    Bias
                  </div>
                  <div className="mt-2 font-serif text-lg text-white/88">Friction</div>
                </div>
                <div className="border-l border-white/6 pl-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/26">
                    Output
                  </div>
                  <div className="mt-2 font-serif text-lg text-white/88">Certainty</div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {[
                  "Institutional friction simulation",
                  "Resonance and drag mapped together",
                  "Sovereign certainty before escalation",
                  "Cleaner pathway into mandate or correction",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-amber-400/70" />
                    <span className="text-sm text-white/58">{line}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-white/6 pt-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-amber-400/65" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/74">
                    Decision-grade diagnostic
                  </span>
                </div>
              </div>
            </HardFrame>
          </motion.div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT II — PROOF STRIP                                                */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-20 md:mt-24">
          <div className="mb-8">
            <RailLabel>Why OGR matters</RailLabel>
          </div>

          <SoftFrame>
            <div className="grid gap-6 md:grid-cols-3">
              <ProofStripItem
                icon={Radar}
                title="Expose drag"
                body="Surface the friction that quietly slows execution, distorts judgement, and inflates the cost of the next move."
              />
              <ProofStripItem
                icon={Scale}
                title="Test fit"
                body="Clarify whether the right response is correction, intervention, escalation, or restraint."
              />
              <ProofStripItem
                icon={ShieldCheck}
                title="Reduce false certainty"
                body="Distinguish confident language from decision-worthy confidence before capital, reputation, or structure are put at risk."
              />
            </div>
          </SoftFrame>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT III — SUPPORTING PATHWAYS                                       */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-20 border-t border-white/5 pt-16 md:mt-24 md:pt-20">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <RailLabel>Supporting pathways</RailLabel>
              <h3 className="mt-6 font-serif text-3xl text-white md:text-4xl">
                Other entry points into the system
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/46 md:text-lg">
                Lighter instruments for earlier-stage clarity. Useful when the
                matter needs reading, but not yet full simulation.
              </p>
            </div>

            <Link
              href="/diagnostics"
              className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-400/66 transition-colors hover:text-amber-300"
            >
              <span>View all diagnostics</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <PathCard item={SUPPORT_PATHS[0]} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.08 }}
                >
                  <PathCard item={SUPPORT_PATHS[1]} />
                </motion.div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.12 }}
                className="h-full"
              >
                <PathCard item={SUPPORT_PATHS[2]} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ACT IV — ESCALATION                                                  */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-20 border-t border-white/5 pt-16 md:mt-24 md:pt-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, x: reduceMotion ? 0 : -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <SoftFrame className="h-full">
                <RailLabel>Escalation logic</RailLabel>

                <h3 className="mt-7 max-w-[13ch] font-serif text-3xl text-white md:text-4xl">
                  When clarity becomes mandate
                </h3>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-white/48 md:text-lg">
                  OGR sharpens the reading. Advisory exists for the moments where
                  the consequence is already real and the decision environment
                  needs structure.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    "Use OGR when the next move still needs pressure-testing.",
                    "Use advisory when the cost of error is already material.",
                    "Use both when clarity and execution must meet in one disciplined chain.",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-amber-400/72" />
                      <span className="text-white/66">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </SoftFrame>
            </motion.div>

            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, x: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              <HardFrame className="h-full">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.34em] text-amber-300/82">
                    Private advisory pathway
                  </div>
                  <Briefcase className="h-5 w-5 text-amber-300/65" />
                </div>

                <h4 className="mt-6 font-serif text-2xl text-white">
                  Selective counsel for high-consequence decisions
                </h4>

                <p className="mt-4 text-sm leading-relaxed text-white/46">
                  Structured counsel for founder, leadership, and institutional
                  decision environments where the stakes justify tighter architecture.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Board and founder counsel",
                    "Decision environment design",
                    "Trade-off discipline and escalation logic",
                  ].map((line) => (
                    <div key={line} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-amber-400/60" />
                      <span className="text-sm text-white/62">{line}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/consulting"
                  className="group mt-8 inline-flex w-full items-center justify-center gap-3 border border-amber-500/25 bg-amber-500/[0.05] px-6 py-4 transition-colors hover:border-amber-500/55 hover:bg-amber-500/[0.08]"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/82">
                    View advisory
                  </span>
                  <ArrowRight className="h-4 w-4 text-amber-400/48 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
                </Link>
              </HardFrame>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}