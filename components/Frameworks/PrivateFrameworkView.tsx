// components/Frameworks/PrivateFrameworkView.tsx — HARRODS-GRADE DOSSIER (PRODUCTION)
// No type leaks, no bad props, no circular imports.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Eye,
  Shield,
  Activity,
  Download,
  Printer,
  ChevronRight,
  FileText,
  ClipboardCheck,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";

import { DecisionMemo } from "@/components/Frameworks/DecisionMemo";
import { AuditLog } from "@/components/Frameworks/AuditLog";
import { RiskMatrix } from "@/components/Frameworks/RiskMatrix";
import { TacticalTimeline } from "@/components/Frameworks/TacticalTimeline";
import { PreMortemWorkspace } from "@/components/Frameworks/PreMortemWorkspace";
import { DossierAnnotation } from "@/components/Frameworks/DossierAnnotation";

import ProtectedFrameworkShell from "@/components/Frameworks/ProtectedFrameworkShell";

import type { User } from "@/types/auth";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";
import type { Framework } from "@/lib/resources/strategic-frameworks";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const LIBRARY_HREF = "/resources/strategic-frameworks";

type AccentType = "gold" | "emerald" | "blue" | "rose" | "indigo";

const accentMap: Record<AccentType, string> = {
  gold: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent text-amber-200 shadow-[0_0_30px_-8px_rgba(245,158,11,0.3)]",
  emerald:
    "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent text-emerald-200 shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)]",
  blue: "border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent text-sky-200 shadow-[0_0_30px_-8px_rgba(14,165,233,0.3)]",
  rose: "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent text-rose-200 shadow-[0_0_30px_-8px_rgba(244,63,94,0.3)]",
  indigo:
    "border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent text-indigo-200 shadow-[0_0_30px_-8px_rgba(99,102,241,0.3)]",
};

function accentClass(accent?: string): string {
  if (!accent) return accentMap.gold;
  const a = accent as AccentType;
  return a in accentMap ? accentMap[a] : accentMap.gold;
}

function safeJoin(value: unknown, sep = " • "): string {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(sep);
  if (typeof value === "string") return value;
  return "";
}

function canonicalHrefForFramework(slug: string) {
  return `${SITE}${LIBRARY_HREF}/${encodeURIComponent(slug)}`;
}

interface PrivateFrameworkViewProps {
  framework: Framework;
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  onPrivateReady?: () => void;
}

const PrivateFrameworkView: React.FC<PrivateFrameworkViewProps> = ({
  framework,
  user,
  innerCircleAccess,
  onPrivateReady,
}) => {
  const hasAccess =
    Boolean(innerCircleAccess?.hasAccess) || user?.role === "admin" || user?.role === "editor";

  React.useEffect(() => {
    if (hasAccess) onPrivateReady?.();
  }, [hasAccess, onPrivateReady]);

  if (!hasAccess) return null;

  const canonicalHref = canonicalHrefForFramework(framework.slug);
  const badge = framework.tag || "Protocol";
  const canonRoot = framework.canonRoot || "The Canon";
  const oneLiner =
    framework.oneLiner ||
    "Institutional-grade strategic framework — built for leaders who carry weight, not spectators who consume ideas.";

  const tierLabel = safeJoin(framework.tier, " + ") || "PUBLIC";
  const failureModes = Array.isArray(framework.failureModes) ? framework.failureModes : [];
  const playbook = Array.isArray(framework.applicationPlaybook) ? framework.applicationPlaybook : [];

  const sections = [
    { id: "memo", label: "Memo", icon: FileText },
    { id: "risk", label: "Risk", icon: Shield },
    { id: "timeline", label: "Timeline", icon: Activity },
    { id: "premortem", label: "Pre-Mortem", icon: ClipboardCheck },
    { id: "notes", label: "Notes", icon: Eye },
  ] as const;

  return (
    <Layout title={`${framework.title} | Strategic Briefing`} className="bg-black min-h-screen print:bg-white">
      <Head>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={canonicalHref} />
      </Head>

      <ProtectedFrameworkShell>
        {/* PRINT LAYER (clean, no chrome) */}
        <div className="hidden print:block">
          <DecisionMemo framework={framework as any} />
        </div>

        {/* SCREEN LAYER */}
        <div className="print:hidden">
          {/* Command Bar */}
          <div className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="mx-auto max-w-7xl px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  Live_Dossier_Active
                </span>
              </div>

              <div className="flex items-center gap-8">
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/25 font-mono">
                    Analyst
                  </span>
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-tighter">
                    {user?.name || "Authorized User"} // {user?.role || "member"}
                  </span>
                </div>

                <Link
                  href={LIBRARY_HREF}
                  className="text-white/40 hover:text-white text-xs uppercase font-bold tracking-widest transition-colors"
                >
                  Close Brief
                </Link>
              </div>
            </div>
          </div>

          {/* Cover / Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.10),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.06),transparent_60%)]" />

            <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-12">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span
                      className={`inline-flex items-center rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${accentClass(
                        framework.accent
                      )}`}
                    >
                      {badge}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">
                      <Lock size={12} /> Classified Layer
                    </span>

                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50">
                      {canonRoot}
                    </span>
                  </div>

                  <h1 className="font-serif text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter leading-[0.9]">
                    {framework.title}
                  </h1>

                  <p className="mt-8 text-xl md:text-2xl text-white/45 font-serif italic border-l-2 border-amber-500/40 pl-8 py-2 max-w-4xl">
                    “{oneLiner}”
                  </p>

                  <div className="mt-10 flex flex-wrap gap-3">
                    <a
                      href="#memo"
                      className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/20 transition-colors"
                    >
                      Open Decision Memo <ChevronRight size={14} className="ml-2" />
                    </a>

                    {framework.artifactHref ? (
                      <a
                        href={framework.artifactHref}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:border-white/20 transition-colors"
                      >
                        <Download size={14} className="mr-2" />
                        Download Package
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined") window.print();
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:border-white/20 transition-colors"
                    >
                      <Printer size={14} className="mr-2" />
                      Print Dossier
                    </button>
                  </div>
                </div>

                {/* Snapshot Card */}
                <div className="lg:w-[360px]">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                        Snapshot
                      </div>
                      <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                        Live <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/35">Tier</div>
                        <div className="mt-1 text-white font-semibold">{tierLabel}</div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/35">Slug</div>
                        <div className="mt-1 text-white/70 font-mono text-xs break-all">{framework.slug}</div>
                      </div>

                      <div className="pt-2">
                        <div className="text-[10px] uppercase tracking-widest text-white/35 mb-3">Navigation</div>
                        <div className="grid grid-cols-2 gap-2">
                          {sections.map((s) => {
                            const Icon = s.icon;
                            return (
                              <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-white/55 hover:text-white hover:border-white/20 transition-colors"
                              >
                                <Icon size={12} className="text-amber-500/80" />
                                {s.label}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-white/10 pt-6">
                      <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35 mb-4">
                        Audit Feed
                      </div>
                      <AuditLog slug={framework.slug} userName={user?.name || "Analyst"} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Body */}
          <div className="mx-auto max-w-7xl px-6 pb-24 grid lg:grid-cols-4 gap-16">
            {/* MAIN */}
            <main className="lg:col-span-3 space-y-20">
              {/* Decision Memo */}
              <section id="memo" className="scroll-mt-28">
                <div className="mb-10 flex items-center gap-4">
                  <span className="h-px bg-amber-500/20 flex-1" />
                  <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <FileText size={14} /> Decision Memo
                  </h2>
                  <span className="h-px bg-amber-500/20 flex-1" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
                  <DecisionMemo framework={framework as any} />
                </div>
              </section>

              {/* Risk Matrix */}
              <section id="risk" className="scroll-mt-28">
                <div className="mb-10 flex items-center gap-4">
                  <span className="h-px bg-amber-500/20 flex-1" />
                  <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Shield size={14} /> Risk Matrix
                  </h2>
                  <span className="h-px bg-amber-500/20 flex-1" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
                  <RiskMatrix failureModes={failureModes} />
                </div>
              </section>

              {/* Tactical Timeline */}
              <section id="timeline" className="scroll-mt-28">
                <div className="mb-10 flex items-center gap-4">
                  <span className="h-px bg-amber-500/20 flex-1" />
                  <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity size={14} /> Tactical Timeline
                  </h2>
                  <span className="h-px bg-amber-500/20 flex-1" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
                  <TacticalTimeline playbook={framework.applicationPlaybook} />
                </div>
              </section>

              {/* Pre-Mortem */}
              <section id="premortem" className="scroll-mt-28">
                <div className="mb-10 flex items-center gap-4">
                  <span className="h-px bg-amber-500/20 flex-1" />
                  <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <ClipboardCheck size={14} /> Pre-Mortem Workspace
                  </h2>
                  <span className="h-px bg-amber-500/20 flex-1" />
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
                  <PreMortemWorkspace failureModes={failureModes} />
                </div>
              </section>

              {/* Notes / Annotations */}
              <section id="notes" className="scroll-mt-28">
                <div className="mb-10 flex items-center gap-4">
                  <span className="h-px bg-amber-500/20 flex-1" />
                  <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3">
                    <Eye size={14} /> Dossier Annotations
                  </h2>
                  <span className="h-px bg-amber-500/20 flex-1" />
                </div>

                <DossierAnnotation
                  resourceId={framework.slug}
                  user={user ?? { name: "Analyst" }}
                />
              </section>
            </main>

            {/* SIDEBAR */}
            <aside className="lg:col-span-1">
              <div className="sticky top-28 space-y-8">
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
                  <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Eye size={14} className="text-amber-500" /> Intelligence
                  </h4>

                  <div className="space-y-6">
                    <div>
                      <span className="block text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                        Institutional Tier
                      </span>
                      <span className="text-amber-200 text-sm font-bold uppercase tracking-tight">{tierLabel}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                        Canon Root
                      </span>
                      <span className="text-zinc-300 text-sm italic">“{canonRoot}”</span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                        Reference
                      </span>
                      <span className="text-white/60 font-mono text-xs break-all">{framework.slug}</span>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/5 pt-6">
                    <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35 mb-4">
                      Activity Log
                    </div>
                    <AuditLog slug={framework.slug} userName={user?.name || "Analyst"} />
                  </div>
                </div>

                {framework.artifactHref ? (
                  <a
                    href={framework.artifactHref}
                    className="group flex items-center justify-between w-full bg-white text-black p-5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-2xl"
                  >
                    <span className="flex items-center gap-3">
                      <Download size={16} />
                      Download Package
                    </span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                  }}
                  className="w-full border border-white/10 bg-white/[0.03] p-5 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest"
                >
                  <Printer size={14} />
                  Print Dossier
                </button>

                <Link
                  href={LIBRARY_HREF}
                  className="w-full border border-white/10 bg-white/[0.03] p-5 rounded-xl text-white/70 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest"
                >
                  Close Brief <ChevronRight size={14} />
                </Link>
              </div>
            </aside>
          </div>

          {/* Print rules */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  html, body { background: #fff !important; }
                  a { color: #000 !important; text-decoration: none !important; }
                }
              `,
            }}
          />
        </div>
      </ProtectedFrameworkShell>
    </Layout>
  );
};

export default PrivateFrameworkView;