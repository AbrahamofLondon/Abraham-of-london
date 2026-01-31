/* @/components/homepage/InstitutionalHero.tsx */
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Shield, Layers, Vault, BookOpen, Fingerprint } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function InstitutionalHero(): JSX.Element {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-black">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6 lg:px-8 lg:pt-20 lg:pb-12">
        {/* Top strip */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-white/5 px-4 py-2 backdrop-blur">
            <Shield className="h-4 w-4 text-amber-300" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-amber-200">
              Institutional operating system
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Dossiers
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Governance cadence
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Deployable assets
            </span>
          </div>
        </div>

        {/* Main */}
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white"
            >
              Strategy that survives pressure.
              <span className="block text-amber-200/90 mt-2">
                Built as a system — not a vibe.
              </span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease, delay: 0.05 }}
              className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-white/70"
            >
              Dossiers, frameworks, and governance discipline — derived from the Canon and engineered for builders:
              founders, boards, and institutions that refuse fragility.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease, delay: 0.1 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/resources/strategic-frameworks"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-black shadow-xl shadow-amber-900/20 hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Strategic Frameworks
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/downloads/vault"
                className="inline-flex items-center gap-3 rounded-2xl border border-amber-400/25 bg-white/5 px-6 py-3 text-sm font-bold text-amber-200 hover:border-amber-400/40 hover:bg-white/10 transition-all"
              >
                <Vault className="h-4 w-4 text-amber-300" />
                The Vault
              </Link>

              <Link
                href="/books/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 hover:border-white/20 hover:bg-white/10 transition-all"
              >
                <BookOpen className="h-4 w-4 text-amber-300" />
                Architecture of Human Purpose
              </Link>

              {/* NEW CTA: Ultimate Purpose of Man */}
              <Link
                href="/blog/ultimate-purpose-of-man"
                className="inline-flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 px-6 py-3 text-sm font-bold text-emerald-200 hover:border-emerald-400/40 hover:bg-emerald-500/10 transition-all"
              >
                <Fingerprint className="h-4 w-4 text-emerald-400" />
                Ultimate Purpose of Man
              </Link>
            </motion.div>
          </div>

          {/* Right: Proof tiles */}
          <div className="lg:col-span-4">
            <div className="grid gap-3">
              <ProofTile
                icon={<Layers className="h-4 w-4 text-amber-300" />}
                title="Canon → Offshoots"
                body="One spine. Many deployments: frameworks, vault assets, briefings."
              />
              <ProofTile
                icon={<Shield className="h-4 w-4 text-amber-300" />}
                title="Governance posture"
                body="Decision systems, cadence, accountability — not motivational noise."
              />
              <ProofTile
                icon={<Vault className="h-4 w-4 text-amber-300" />}
                title="Deployable artifacts"
                body="Templates, playbooks, and operator packs designed for execution."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}): JSX.Element {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur hover:border-white/15 hover:bg-white/[0.05] transition-all">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="mt-1 text-sm text-white/60 leading-relaxed">{body}</div>
        </div>
      </div>
    </div>
  );
}