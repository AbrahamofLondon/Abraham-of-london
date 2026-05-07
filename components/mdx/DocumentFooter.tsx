/* components/mdx/DocumentFooter.tsx — INSTITUTIONAL ALIGNMENT (PREMIUM EDITION) */
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Terminal,
  FileText,
  Fingerprint,
  Scale,
  Scroll,
  Crown,
  Eye,
  Lock,
  Feather,
  Compass,
} from "lucide-react";
import type { TierDirective } from "@/lib/resources/tier-metadata";

export interface DocumentFooterProps {
  children?: React.ReactNode;
  version?: string;
  id?: string;
  series?: string;
  backLink?: string;
  backText?: string;
  className?: string;
  directive?: TierDirective;
  watermarkId?: string | null;
  forensicFooter?: string | null;
  classification?: string | null;
  issuedTo?: string | null;
  issuedAt?: string | null;
}

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatIssuedAt(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return (
    d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

function getClassificationTone(classification?: string | null): {
  wrapper: string;
  text: string;
  accent: string;
} {
  const cls = safeStr(classification).toLowerCase();

  if (cls.includes("top") || cls.includes("secret")) {
    return {
      wrapper: "border-red-500/30 bg-red-500/5",
      text: "text-red-400",
      accent: "from-red-500/25",
    };
  }

  if (cls.includes("restricted")) {
    return {
      wrapper: "border-orange-500/30 bg-orange-500/5",
      text: "text-orange-400",
      accent: "from-orange-500/20",
    };
  }

  if (cls.includes("confidential")) {
    return {
      wrapper: "border-amber-500/30 bg-amber-500/5",
      text: "text-amber-400",
      accent: "from-amber-500/20",
    };
  }

  if (cls.includes("member")) {
    return {
      wrapper: "border-blue-500/30 bg-blue-500/5",
      text: "text-blue-400",
      accent: "from-blue-500/20",
    };
  }

  return {
    wrapper: "border-emerald-500/30 bg-emerald-500/5",
    text: "text-emerald-400",
    accent: "from-emerald-500/20",
  };
}

function MetaCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div className="relative bg-black/80 p-6 backdrop-blur-sm print:p-4 group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Icon
            className={`h-3 w-3 ${
              highlight ? "text-amber-400" : "text-white/20"
            }`}
          />
          <span className="font-mono text-[7px] font-bold uppercase tracking-[0.3em] text-white/30">
            {label}
          </span>
        </div>

        <span
          className={`block font-mono text-xs font-medium tracking-tight break-all ${
            highlight ? "text-amber-400" : "text-white/80"
          }`}
        >
          {value}
        </span>

        <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export default function DocumentFooter({
  children,
  version,
  id,
  series,
  backLink = "/vault/briefs",
  backText = "Return to Registry Index",
  className = "",
  directive,
  watermarkId,
  forensicFooter,
  classification,
  issuedTo,
  issuedAt,
}: DocumentFooterProps) {
  const currentYear = new Date().getFullYear();
  const formattedDate = formatIssuedAt(issuedAt);

  const resolvedId = safeStr(id) || "AOL-75-REF";
  const resolvedSeries = safeStr(series) || "Intelligence Brief";
  const resolvedVersion = safeStr(version) || "1.0.0";
  const resolvedWatermarkId = safeStr(watermarkId) || "UNRESTRICTED";
  const resolvedClassification = safeStr(classification);
  const resolvedIssuedTo = safeStr(issuedTo);
  const resolvedForensicFooter = safeStr(forensicFooter);

  const classificationTone = getClassificationTone(resolvedClassification);

  return (
    <footer
      className={`relative mt-32 pt-20 border-t border-white/10 ${className} print:mt-16 print:border-black/10`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/5 to-transparent blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      {directive ? (
        <section className="relative mb-20 overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] via-white/[0.01] to-transparent shadow-[0_0_80px_rgba(245,158,11,0.04)]">
          <div className="absolute top-0 left-0 w-20 h-20 border-t border-l border-amber-500/30" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b border-r border-amber-500/30" />

          <div className="relative p-10 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full" />
                <Crown className="relative h-5 w-5 text-amber-400" />
              </div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-amber-400/80">
                {directive.displayTier} • OPERATIONAL MANDATE
              </span>
            </div>

            <p className="font-serif text-xl md:text-2xl text-white/90 leading-relaxed max-w-4xl italic border-l-2 border-amber-500/40 pl-6">
              “{directive.mandate}”
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {directive.focusNodes.map((node) => (
                <div
                  key={node}
                  className="border border-white/8 bg-white/[0.02] px-4 py-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/50"
                >
                  {node}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Scale className="h-4 w-4 text-amber-400/60" />
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/40">
                Risk Level • {directive.riskLevel}
              </span>
            </div>

            <div className="absolute top-6 right-6 opacity-5">
              <Scale className="h-16 w-16 text-amber-500" />
            </div>
          </div>
        </section>
      ) : null}

      {resolvedClassification ? (
        <section
          className={`relative mb-12 overflow-hidden border ${classificationTone.wrapper} p-4 flex items-center justify-between`}
        >
          <div
            className={`absolute inset-y-0 left-0 w-24 bg-gradient-to-r ${classificationTone.accent} to-transparent opacity-60`}
          />
          <div className="relative flex items-center gap-3">
            <ShieldCheck className={`h-4 w-4 ${classificationTone.text}`} />
            <span
              className={`font-mono text-[10px] font-bold uppercase tracking-[0.3em] ${classificationTone.text}`}
            >
              {resolvedClassification}
            </span>
          </div>
          <div className="relative flex items-center gap-2">
            <Lock className="h-3 w-3 opacity-50" />
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-50">
              Institutional Eyes Only
            </span>
          </div>
        </section>
      ) : null}

      <section className="relative mb-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
          <MetaCard label="Document ID" value={resolvedId} icon={FileText} />
          <MetaCard label="Series" value={resolvedSeries} icon={Scroll} />
          <MetaCard label="Revision" value={resolvedVersion} icon={Terminal} />
          <MetaCard
            label="Watermark ID"
            value={resolvedWatermarkId}
            icon={Fingerprint}
            highlight={resolvedWatermarkId !== "UNRESTRICTED"}
          />
        </div>
      </section>

      {resolvedForensicFooter ? (
        <section className="relative mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent blur-2xl" />

          <div className="relative border border-amber-500/10 bg-black/40 p-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full" />
                <Fingerprint className="relative h-4 w-4 text-amber-400/80" />
              </div>
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-amber-400/60">
                Forensic Attribution • Chain of Custody
              </span>
            </div>

            <div className="grid gap-4 font-mono text-[9px] leading-relaxed">
              <code className="block text-white/40 break-all bg-white/[0.02] p-4 border border-white/5">
                {resolvedForensicFooter}
              </code>

              {resolvedIssuedTo || formattedDate ? (
                <div className="flex flex-wrap gap-6 pt-2">
                  {resolvedIssuedTo ? (
                    <div className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-white/20" />
                      <span className="text-white/30">
                        Issued to:{" "}
                        <span className="text-white/50">{resolvedIssuedTo}</span>
                      </span>
                    </div>
                  ) : null}

                  {formattedDate ? (
                    <div className="flex items-center gap-2">
                      <Compass className="h-3 w-3 text-white/20" />
                      <span className="text-white/30">
                        Issued at:{" "}
                        <span className="text-white/50">{formattedDate}</span>
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative mb-16 max-w-4xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-6 w-px bg-gradient-to-b from-transparent via-amber-500/40 to-transparent" />
          <span className="font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-white/30">
            Institutional Disclosure
          </span>
        </div>

        <div className="pl-8 border-l border-white/10">
          <p className="text-[11px] leading-relaxed text-white/40 font-sans tracking-wide">
            This dossier represents a strategic synthesis for institutional
            alignment. It is not financial, legal, or tax advice. Execution of
            strategies contained herein should be performed in coordination with
            licensed fiduciaries.
          </p>
          <p className="mt-3 text-[9px] font-mono text-white/20">
            © {currentYear} Abraham of London • All rights reserved •
            Institutional Registry
          </p>
        </div>
      </section>

      {children ? <div className="relative mb-12">{children}</div> : null}

      <section className="relative flex flex-col sm:flex-row justify-between items-center gap-6 py-8 border-t border-white/5 print:hidden">
        <Link
          href={backLink}
          className="group flex items-center gap-3 text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/40 hover:text-amber-400 transition-all"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <ArrowLeft className="relative h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>{backText}</span>
        </Link>

        <div className="flex gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-white/10 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileText className="relative h-4 w-4 text-white/20 hover:text-white/40 cursor-pointer transition-colors" />
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldCheck className="relative h-4 w-4 text-emerald-500/30 hover:text-emerald-500/60 cursor-pointer transition-colors" />
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Feather className="relative h-4 w-4 text-white/20 hover:text-amber-400/40 cursor-pointer transition-colors" />
          </div>
        </div>
      </section>

      <div className="hidden print:block mt-8 text-center">
        <p className="text-[7px] font-mono text-gray-400">
          ABRAHAM OF LONDON • {resolvedId} •{" "}
          {new Date().toISOString().split("T")[0]}
        </p>
      </div>
    </footer>
  );
}