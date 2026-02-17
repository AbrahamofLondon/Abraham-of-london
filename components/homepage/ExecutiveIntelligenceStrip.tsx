"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PenTool,
  Workflow,
  Shield,
  Scale,
  Target,
  Activity,
  ChevronRight,
} from "lucide-react";

type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string | null;
  slug?: string | null;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

function toDateLabel(input?: LooseShort["date"]): string {
  if (!input) return "PENDING";
  const d = input instanceof Date ? input : new Date(String(input));
  if (!Number.isFinite(d.getTime())) return "PENDING";
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
}

function getHref(s: LooseShort): string {
  if (s.url) return s.url;
  if (s.slug) return `/shorts/${String(s.slug).replace(/^\/+/, "")}`;
  const raw = s._raw?.flattenedPath || s._raw?.sourceFileName;
  if (raw) return `/shorts/${String(raw).replace(/\.mdx?$/, "")}`;
  return "/shorts";
}

const rails = [
  { label: "Cadence", icon: <Workflow className="h-3 w-3" /> },
  { label: "Controls", icon: <Shield className="h-3 w-3" /> },
  { label: "Decision Rights", icon: <Scale className="h-3 w-3" /> },
  { label: "Mandate", icon: <Target className="h-3 w-3" /> },
] as const;

export default function ExecutiveIntelligenceStrip({
  shorts,
  viewAllHref = "/shorts",
}: {
  shorts: LooseShort[];
  viewAllHref?: string;
}): React.ReactElement | null {
  const [sessionId, setSessionId] = useState<string>("");

  // Always treat input as untrusted
  const items: LooseShort[] = Array.isArray(shorts) ? shorts.slice(0, 6) : [];

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(7).toUpperCase());
  }, []);

  // ✅ Strictly guarantee lead exists (fixes TS error)
  const lead = items.length > 0 ? items[0] : null;
  if (!lead) return null;

  const rest = items.slice(1);

  return (
    <section className="relative bg-black py-24 lg:py-32 overflow-hidden">
      {/* 1. Technical Background Architecture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* --- Header Section --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/80">
                Live Intelligence Feed
              </span>
            </div>

            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-white tracking-tight leading-[0.95]">
              Field notes <br />
              <span className="text-white/20 italic">for deployment.</span>
            </h2>

            <div className="mt-10 flex flex-wrap gap-2">
              {rails.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-white/40"
                >
                  <span className="text-amber-500/50">{r.icon}</span>
                  {r.label}
                </div>
              ))}
            </div>
          </div>

          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-amber-500 hover:text-white transition-colors"
          >
            Full Archive <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* --- Intelligence Grid --- */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* A. THE LEAD BRIEF (High Signal) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <Link href={getHref(lead)} className="group relative block h-full">
              <div className="relative h-full flex flex-col p-10 md:p-12 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent overflow-hidden transition-all duration-500 group-hover:border-amber-500/30">
                {/* Meta Header */}
                <div className="flex items-center justify-between mb-16">
                  <div className="px-3 py-1 rounded border border-amber-500/20 bg-amber-500/5 text-[9px] font-mono text-amber-400">
                    PRIORITY: HIGH // {lead.readTime || "5 MIN"}
                  </div>
                  <div className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                    {toDateLabel(lead.date)}
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="font-serif text-4xl md:text-5xl font-medium text-white leading-tight mb-6 group-hover:text-amber-50 transition-colors">
                    {lead.title || "Untitled"}
                  </h3>
                  <p className="text-lg font-light text-white/40 leading-relaxed max-w-xl group-hover:text-white/60 transition-colors">
                    {lead.excerpt || lead.description || ""}
                  </p>
                </div>

                {/* Footer Interaction */}
                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/60 group-hover:text-amber-500">
                    Initialize Briefing
                  </span>
                  <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-all">
                    <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>

                {/* Aesthetic Layer */}
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                  <PenTool className="h-32 w-32 -rotate-12 text-amber-500" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* B. THE TRIAGE FEED (Sidebar) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {rest.map((s, idx) => (
              <motion.div
                key={`${getHref(s)}:${idx}`}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={getHref(s)} className="group block">
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20 flex items-start gap-6">
                    <div className="flex-shrink-0 font-mono text-[10px] text-amber-500/40 group-hover:text-amber-500 pt-1">
                      0{idx + 2}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                          {toDateLabel(s.date)}
                        </span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                      <h4 className="text-lg font-bold text-white/80 group-hover:text-white truncate transition-colors">
                        {s.title || "Untitled"}
                      </h4>
                      <p className="mt-1 text-xs text-white/30 line-clamp-1 group-hover:text-white/50 transition-colors">
                        {s.excerpt || s.description || ""}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-4">
                      <ChevronRight className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- System Footer --- */}
        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
            End of Current Feed // Session ID: {sessionId || "SYNCHRONIZING..."}
          </p>
          <div className="flex items-center gap-6">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500/50" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              Uptime: 99.9%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}