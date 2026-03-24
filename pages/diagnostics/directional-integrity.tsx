/* ============================================================================
   FILE: pages/diagnostics/directional-integrity.tsx
   STRATEGY: High-Fidelity Forensic Assessment Interface
============================================================================ */

import React, { useMemo, useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Compass,
  Anchor,
  Zap,
  Fingerprint,
  Activity,
  Target,
  Clock,
} from "lucide-react";

import Layout from "@/components/Layout";

const SECTIONS = [
  {
    id: "identity",
    title: "Identity & Mandate",
    icon: ShieldCheck,
    description:
      "Assessing the clarity of your core assignment and current priorities.",
    questions: [
      "I can clearly state my current mandate in one sentence.",
      "My priorities reflect that mandate, not my mood.",
      "I am not operating from confusion or borrowed direction.",
    ],
  },
  {
    id: "decision",
    title: "Decision Integrity",
    icon: Compass,
    description:
      "Evaluating the quality and alignment of recent executive choices.",
    questions: [
      "My recent major decisions align with my stated values.",
      "I am not making reactive choices under pressure.",
      "I can explain why I am doing what I am doing.",
    ],
  },
  {
    id: "environment",
    title: "Environmental Alignment",
    icon: Anchor,
    description:
      "Measuring the impact of your immediate surroundings and relationships.",
    questions: [
      "My relationships reinforce my direction, not dilute it.",
      "I am not tolerating environments that produce confusion.",
      "My inputs are curated, not chaotic.",
    ],
  },
  {
    id: "behaviour",
    title: "Operational Behaviour",
    icon: Activity,
    description:
      "Tracking the translation of intent into measurable daily habits.",
    questions: [
      "My daily habits move me toward long-term outcomes.",
      "My calendar reflects what I claim matters.",
      "I am producing measurable outputs, not just activity.",
    ],
  },
  {
    id: "order",
    title: "Emotional & Internal Order",
    icon: Target,
    description:
      "Gauging stability and regulation under institutional pressure.",
    questions: [
      "My emotional state is regulated under pressure.",
      "I am not driven by fear, comparison, or validation.",
      "I recover quickly from disruption without losing direction.",
    ],
  },
  {
    id: "legacy",
    title: "Legacy Orientation",
    icon: Clock,
    description:
      "Analyzing the long-term structural value of current work.",
    questions: [
      "I am building something that outlasts immediate comfort.",
      "My current actions contribute to a long-term structure.",
      "I am increasing responsibility, not retreating into ease.",
    ],
  },
] as const;

const FORENSIC_DATE = new Date().toLocaleDateString("en-GB");

const DirectionalIntegrityPage: NextPage = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const totalQuestions = useMemo(
    () => SECTIONS.reduce((sum, section) => sum + section.questions.length, 0),
    []
  );

  const completedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems]
  );

  const progressPercentage =
    totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  const handleToggle = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Layout
      title="Directional Integrity Assessment | Abraham of London"
      description="A governed diagnostic instrument for mandate, decisions, and legacy posture."
      fullWidth
    >
      <Head>
        <link
          rel="canonical"
          href="https://www.abrahamoflondon.org/diagnostics/directional-integrity"
        />
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-brand-obsidian pb-32 pt-20 selection:bg-brand-amber/30">
        <div className="aol-grain pointer-events-none absolute inset-0 z-0 opacity-[0.015]" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-12">
          <header className="mb-24 border-b border-white/5 pb-16">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 text-brand-amber"
            >
              <div className="h-px w-12 bg-current opacity-40" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em]">
                Purpose Alignment System
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="mt-10 font-serif text-5xl font-light leading-[1.1] tracking-tight text-brand-cream md:text-7xl lg:text-8xl"
            >
              Directional Integrity <br />
              <span className="italic opacity-40">Assessment</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 max-w-2xl text-lg font-light leading-relaxed text-brand-cream/50 md:text-xl"
            >
              Assess mandate, decisions, environment, behaviour, emotional
              order, and legacy posture through a governed diagnostic
              instrument.
            </motion.p>
          </header>

          <div className="sticky top-24 z-50 mb-20">
            <div className="rounded-sm border border-white/10 bg-brand-obsidian/90 p-6 backdrop-blur-2xl shadow-premium">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                <span className="text-brand-cream/40">
                  Diagnostic Integrity Signal
                </span>
                <span className="text-brand-amber">
                  {completedCount} / {totalQuestions} Cleared
                </span>
              </div>

              <div className="mt-4 h-[2px] w-full bg-white/5">
                <motion.div
                  className="h-full bg-brand-amber shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-32">
            {SECTIONS.map((section) => {
              const Icon = section.icon;

              return (
                <motion.section
                  key={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="group relative"
                >
                  <div className="flex flex-col gap-12 lg:flex-row lg:gap-24">
                    <div className="lg:w-1/3">
                      <div className="flex h-14 w-14 items-center justify-center border border-white/10 bg-white/[0.02] text-brand-amber/40 transition-all group-hover:border-brand-amber/30 group-hover:text-brand-amber">
                        <Icon size={24} strokeWidth={1} />
                      </div>

                      <h2 className="mt-8 font-serif text-3xl font-light text-brand-cream">
                        {section.title}
                      </h2>

                      <p className="mt-4 text-sm leading-relaxed text-brand-cream/30">
                        {section.description}
                      </p>
                    </div>

                    <div className="flex-1 space-y-4">
                      {section.questions.map((question, qIdx) => {
                        const qId = `${section.id}-${qIdx}`;
                        const isChecked = Boolean(checkedItems[qId]);

                        return (
                          <button
                            key={qId}
                            type="button"
                            onClick={() => handleToggle(qId)}
                            className={`flex w-full items-start gap-6 border p-8 text-left transition-all duration-500 ${
                              isChecked
                                ? "border-brand-amber/40 bg-brand-amber/[0.03]"
                                : "border-white/5 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]"
                            }`}
                          >
                            <div
                              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center border transition-all ${
                                isChecked
                                  ? "border-brand-amber bg-brand-amber"
                                  : "border-white/20"
                              }`}
                            >
                              {isChecked ? (
                                <Zap
                                  size={10}
                                  className="fill-brand-obsidian text-brand-obsidian"
                                />
                              ) : null}
                            </div>

                            <span
                              className={`text-base font-light leading-relaxed transition-colors ${
                                isChecked
                                  ? "text-brand-cream"
                                  : "text-brand-cream/40"
                              }`}
                            >
                              {question}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.section>
              );
            })}
          </div>

          <section className="mt-40 border-t border-white/10 pt-20">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-cream/40">
              Strategic Observations
            </h3>

            <textarea
              placeholder="Record drift observations or correction priorities..."
              className="mt-8 w-full border border-white/5 bg-white/[0.02] p-8 font-serif text-xl font-light text-brand-cream placeholder:text-brand-cream/10 transition-colors focus:border-brand-amber/30 focus:outline-none focus:ring-0"
              rows={4}
            />
          </section>

          <footer className="mt-32 border-t border-white/10 pt-20">
            <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
              <div className="max-w-xs text-center md:text-left">
                <div className="font-mono text-[9px] uppercase tracking-widest text-brand-cream/30">
                  Verification Status
                </div>
                <div className="mt-2 text-sm italic text-brand-cream/50">
                  Complete all domains to generate your institutional alignment
                  score.
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex items-center gap-6 bg-brand-cream px-16 py-7 font-mono text-[10px] uppercase tracking-[0.4em] text-brand-obsidian transition-all hover:bg-brand-amber"
              >
                Score and Save
                <Fingerprint
                  size={18}
                  className="transition-transform group-hover:rotate-12"
                />
              </motion.button>
            </div>

            <div className="forensic-trace mt-32 flex flex-col gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-brand-cream opacity-30 md:flex-row md:justify-between">
              <span>TRN-AOL-2026-DIAG-INTEGRITY</span>
              <span>EST. EDEN // RECTO-VERSO ALIGNMENT</span>
              <span>{FORENSIC_DATE}</span>
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export default DirectionalIntegrityPage;