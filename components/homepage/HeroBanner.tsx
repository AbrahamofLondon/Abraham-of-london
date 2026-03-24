"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Button from "@/components/ui/Button";
import {
  Terminal,
  Shield,
  ArrowRight,
  ChevronRight,
  FileText,
  BriefcaseBusiness,
  Sparkles,
} from "lucide-react";

const RAIL_LINKS = [
  { href: "/canon", label: "Canon", tag: "DOC-01", desc: "Doctrine & Method" },
  { href: "/blog", label: "Essays", tag: "INT-02", desc: "Literary Intelligence" },
  { href: "/vault/briefs", label: "Briefs", tag: "SEC-03", desc: "Vault Intelligence" },
  { href: "/ventures", label: "Ventures", tag: "PTR-04", desc: "Execution Arms" },
  { href: "/shorts", label: "Shorts", tag: "SIG-05", desc: "Short-form Signal" },
];

const SIGNALS = [
  {
    label: "Doctrine",
    value: "Canon",
    icon: FileText,
  },
  {
    label: "Execution",
    value: "Ventures",
    icon: BriefcaseBusiness,
  },
  {
    label: "Intelligence",
    value: "Vault",
    icon: Shield,
  },
];

export const HeroBanner = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => {
  const { scrollY } = useScroll();

  const yMain = useTransform(scrollY, [0, 600], [0, -48]);
  const yImage = useTransform(scrollY, [0, 600], [0, 34]);
  const railY = useTransform(scrollY, [0, 600], [0, -18]);
  const opacity = useTransform(scrollY, [0, 420], [1, 0.18]);

  const titleWords = React.useMemo(() => title.split(" "), [title]);

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#05070B] pt-28 text-white lg:pt-36">
      {/* Background foundation */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,169,106,0.12),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(201,169,106,0.07),transparent_20%),linear-gradient(180deg,#07090d_0%,#05070b_45%,#040508_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.02))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/45 to-transparent" />
      </div>

      {/* Vertical perimeter lines */}
      <div className="pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-white/6 lg:block xl:left-10" />
      <div className="pointer-events-none absolute inset-y-0 right-6 hidden w-px bg-white/6 lg:block xl:right-10" />

      <motion.div
        style={{ opacity }}
        className="relative z-10 mx-auto max-w-[1600px] px-6 lg:px-10 2xl:px-14"
      >
        {/* Top command bar */}
        <div className="mb-10 flex flex-col gap-4 border-b border-white/8 pb-6 lg:mb-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#C9A96A]/30 bg-[#C9A96A]/8">
              <Terminal className="h-4 w-4 text-[#D4B06A]" />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#D4B06A]">
                Institutional OS
              </span>
              <span className="hidden text-white/20 lg:inline">/</span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/38">
                Strategic Architecture Platform
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-white/36">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live Platform
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              London
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
              2026 Edition
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Left rail */}
          <motion.aside
            style={{ y: railY }}
            className="hidden lg:col-span-2 lg:flex"
          >
            <div className="flex w-full flex-col justify-between border-r border-white/8 pr-7 xl:pr-9">
              <div>
                <div className="mb-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/32">
                    Navigation Index
                  </p>
                  <div className="mt-3 h-px w-16 bg-gradient-to-r from-[#C9A96A]/60 to-transparent" />
                </div>

                <nav className="space-y-5" aria-label="Hero rail navigation">
                  {RAIL_LINKS.map((item, idx) => (
                    <Link
                      key={item.tag}
                      href={item.href}
                      className="group block transition-transform duration-200 hover:translate-x-1"
                    >
                      <div className="mb-1 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.22em] text-[#C9A96A]/60 group-hover:text-[#D4B06A]">
                        <span>Index_{idx + 1}</span>
                        <span className="text-white/18">/</span>
                        <span>{item.tag}</span>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <h3 className="font-serif text-[1.65rem] leading-none tracking-tight text-white/92 transition-colors group-hover:text-[#F2E7D0]">
                          {item.label}
                        </h3>
                        <ChevronRight className="h-4 w-4 translate-y-[-2px] text-white/18 transition-all group-hover:translate-x-0.5 group-hover:text-[#D4B06A]" />
                      </div>

                      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/24 group-hover:text-white/40">
                        {item.desc}
                      </p>
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="mt-10 border-t border-white/8 pt-5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
                  Signal
                </p>
                <p className="mt-2 max-w-[15rem] text-sm leading-6 text-white/48">
                  Doctrine, intelligence, and execution under one operating frame.
                </p>
              </div>
            </div>
          </motion.aside>

          {/* Main content */}
          <motion.div
            style={{ y: yMain }}
            className="lg:col-span-6 xl:col-span-6"
          >
            <div className="max-w-4xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/8 px-4 py-2">
                <Sparkles className="h-3.5 w-3.5 text-[#D4B06A]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D4B06A]">
                  Abraham of London
                </span>
              </div>

              <h1 className="max-w-5xl font-serif text-[3.3rem] font-medium leading-[0.92] tracking-[-0.04em] text-white sm:text-[4.5rem] md:text-[5.4rem] lg:text-[6.15rem] xl:text-[7rem]">
                {titleWords.map((word, i) => {
                  const normalized = word.toLowerCase().replace(/[^\w]/g, "");
                  const isLondon = normalized === "london";

                  return (
                    <span
                      key={`${word}-${i}`}
                      className={
                        isLondon
                          ? "font-light italic text-[#C9A96A]"
                          : "text-white"
                      }
                    >
                      {word}{" "}
                    </span>
                  );
                })}
              </h1>

              {subtitle && (
                <div className="mt-8 max-w-2xl border-l border-[#C9A96A]/35 pl-6 lg:pl-8">
                  <p className="text-lg leading-8 text-white/58 md:text-[1.18rem] md:leading-9">
                    {subtitle}
                  </p>
                </div>
              )}

              {/* CTA lane */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Button
                  href="/canon"
                  className="group inline-flex items-center justify-center gap-3 rounded-none border border-[#C9A96A]/30 bg-[#F4EFE6] px-8 py-4 text-[11px] font-black uppercase tracking-[0.26em] text-black transition-all duration-200 hover:bg-[#C9A96A] hover:text-black"
                >
                  Explore Canon
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>

                <Button
                  href="/vault"
                  className="group inline-flex items-center justify-center gap-3 rounded-none border border-white/12 bg-white/[0.04] px-8 py-4 text-[11px] font-black uppercase tracking-[0.26em] text-white transition-all duration-200 hover:border-[#C9A96A]/40 hover:bg-white/[0.07]"
                >
                  <Shield className="h-4 w-4 text-[#D4B06A]" />
                  Open Vault
                </Button>

                <Button
                  href="/ventures"
                  className="group inline-flex items-center justify-center gap-3 rounded-none border border-white/10 bg-transparent px-8 py-4 text-[11px] font-black uppercase tracking-[0.26em] text-white/78 transition-all duration-200 hover:border-white/20 hover:text-white"
                >
                  Strategic Ventures
                </Button>
              </div>

              {/* Metrics / signal row */}
              <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SIGNALS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="group rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm transition-all duration-200 hover:border-[#C9A96A]/20 hover:bg-white/[0.045]"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-[#D4B06A]" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/34">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-3 font-serif text-2xl text-white/92">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right visual command block */}
          <motion.div
            style={{ y: yImage }}
            className="lg:col-span-4 xl:col-span-4"
          >
            <div className="relative mx-auto max-w-[34rem] lg:mx-0">
              <div className="relative overflow-hidden border border-white/10 bg-[#0A0D12] shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
                <div className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[#C9A96A]/45 to-transparent" />

                <div className="relative aspect-[4/5]">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London institutional portrait"
                    fill
                    priority
                    className="object-cover object-center opacity-[0.84]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.28)_40%,rgba(0,0,0,0.66)_100%)]" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                  <div className="absolute inset-[18px] border border-white/8" />
                </div>

                {/* Top file strip */}
                <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/72">
                    Active Dossier
                  </span>
                </div>

                {/* Bottom command card */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                  <div className="border border-white/10 bg-black/58 p-4 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4B06A]">
                          Secure File // AOFL-09
                        </p>
                        <h3 className="mt-2 font-serif text-2xl leading-tight text-white">
                          Strategic leadership,
                          <br />
                          doctrine, and execution.
                        </h3>
                      </div>

                      <div className="hidden shrink-0 border-l border-white/10 pl-4 sm:block">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
                          Status
                        </p>
                        <p className="mt-2 text-sm text-white/72">Operational</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating support card */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/34">
                    Position
                  </p>
                  <p className="mt-2 font-serif text-xl text-white/92">
                    Advisory-led platform
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/34">
                    Mandate
                  </p>
                  <p className="mt-2 font-serif text-xl text-white/92">
                    Build what endures
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Lower command strip */}
        <div className="mt-14 border-t border-white/8 pt-6 lg:mt-16">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4B06A]">
                Doctrine
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                Structured thought, articulated principles, and written architecture.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4B06A]">
                Intelligence
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                Essays, briefs, and distilled signals for leaders and builders.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#D4B06A]">
                Execution
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
                Ventures, systems, and strategic assets designed for durable impact.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroBanner;