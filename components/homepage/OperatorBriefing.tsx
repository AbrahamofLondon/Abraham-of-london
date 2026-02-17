/* components/homepage/OperatorBriefing.tsx */
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ScrollText,
  Terminal,
  Fingerprint,
  FileSearch,
  Lock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

type FeaturedCard = {
  title: string;
  href: string;
  excerpt?: string | null;
  dateISO?: string | null;
  theme?: string | null;
  kind?: string | null;
};

type BriefLine = {
  id: string;
  title: string;
  body: string;
};

export default function OperatorBriefing({
  featured,
}: {
  featured: FeaturedCard | null;
}): React.ReactElement | null {
  if (!featured) return null;

  const ref = `AOL-SYS-${(featured.theme || "CORE").toUpperCase().replace(/\s+/g, "-")}`;

  const lines: BriefLine[] = [
    {
      id: "STRAT-01",
      title: "Scrutiny-Ready Architecture.",
      body: "If it can’t survive hostile cross-examination, it isn’t strategy — it’s theatre. We build for audit, not applause.",
    },
    {
      id: "OPS-04",
      title: "The Engine of Cadence.",
      body: "Institutional performance isn’t a spark; it’s a rhythm. Routines and decision rights make excellence the default.",
    },
    {
      id: "ETHIC-09",
      title: "Load-Bearing Integrity.",
      body: "Integrity is not a slogan. It’s proven in controls, incentives, and accountability loops under pressure.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-technical mask-radial-fade opacity-[0.10]" />
        <div className="absolute left-1/2 top-[-260px] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[180px]" />
        <div className="absolute inset-0 bg-[url('/assets/images/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
          {/* Left */}
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded-md border border-white/10 bg-white/5">
              <Terminal className="h-3 w-3 text-amber-500/70" />
              <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">
                Status: Operational
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-white/15" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
                Briefing
              </span>
            </div>

            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-amber-500/70">
              Operational Briefing
            </div>

            <h2 className="mt-6 font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.05] tracking-tight">
              {featured.title}
            </h2>

            <p className="mt-6 text-lg font-light leading-relaxed text-white/40 max-w-md">
              {featured.excerpt
                ? featured.excerpt
                : "Doctrine, frameworks, and deployables — engineered for governance and execution."}
            </p>

            <p className="mt-5 text-sm font-mono text-amber-500/50 uppercase tracking-widest">
              Doctrine over noise.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href={featured.href}
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-amber-500 px-8 py-4 text-sm font-black text-black hover:bg-amber-400 transition-all"
              >
                Open Briefing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/canon"
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                <ScrollText className="h-4 w-4 text-amber-400" />
                The Canon
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-7">
            <div className="relative group">
              <div className="absolute -inset-4 border border-white/[0.03] rounded-[40px] pointer-events-none" />

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-1">
                <div className="bg-black/90 rounded-[22px] p-8 md:p-10 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-8 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Fingerprint className="h-6 w-6 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
                          Governance Protocol
                        </h3>
                        <p className="text-[10px] font-mono text-white/30 uppercase mt-1">
                          Ref: {ref}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5">
                      <ShieldCheck className="h-3 w-3 text-amber-500/80" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400">
                        Institutional Grade
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {lines.map((line) => (
                      <div
                        key={line.id}
                        className="group/line relative p-6 rounded-2xl border border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-amber-500/15 transition-all duration-300"
                      >
                        <div className="flex items-start gap-5">
                          <span className="mt-1 font-mono text-[10px] text-amber-500/40 group-hover/line:text-amber-500 transition-colors">
                            {line.id}
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-white mb-2 tracking-wide">
                              {line.title}
                            </h4>
                            <p className="text-sm font-light leading-relaxed text-white/50 group-hover/line:text-white/70 transition-colors">
                              {line.body}
                            </p>
                          </div>
                        </div>

                        {/* corner tick */}
                        <div className="pointer-events-none absolute right-0 top-0 p-4 opacity-0 transition-opacity group-hover/line:opacity-100">
                          <div className="w-7 h-[1px] bg-amber-500/25" />
                          <div className="absolute right-4 top-4 h-7 w-[1px] bg-amber-500/25" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <FileSearch className="h-5 w-5 text-white/20" />
                      <p className="text-xs text-white/40 max-w-[260px]">
                        Access the repository of artifacts and strategic frameworks.
                      </p>
                    </div>

                    <Link
                      href="/downloads/vault"
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Access Vault
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.35em] text-white/30">
                sys-check-ok
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}