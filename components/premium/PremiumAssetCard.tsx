"use client";

import * as React from "react";
import {
  ShieldCheck,
  FileText,
  Fingerprint,
  Lock,
  Sparkles,
  ScrollText,
  Layers3,
  BadgeCheck,
} from "lucide-react";
import PremiumAssetLaunchButton from "@/components/premium/PremiumAssetLaunchButton";

export type PremiumAssetCardProps = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  categorySlug?: string;
  classification?: string;
  tier?: string;
  docId?: string;
  version?: string;
  fileSize?: string;
  pageCount?: number;
  href?: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
  watermarkRequired?: boolean;
};

type ClassificationTone = {
  pill: string;
  edge: string;
  glow: string;
  panel: string;
  accentText: string;
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toneForClassification(classification?: string): ClassificationTone {
  const cls = String(classification || "").toLowerCase();

  if (cls.includes("top") || cls.includes("secret")) {
    return {
      pill: "border-red-500/30 bg-red-500/10 text-red-300",
      edge: "from-red-500/20",
      glow: "shadow-[0_0_80px_rgba(239,68,68,0.08)]",
      panel: "from-red-500/[0.05]",
      accentText: "text-red-300",
    };
  }

  if (cls.includes("restricted")) {
    return {
      pill: "border-orange-500/30 bg-orange-500/10 text-orange-300",
      edge: "from-orange-500/20",
      glow: "shadow-[0_0_80px_rgba(249,115,22,0.08)]",
      panel: "from-orange-500/[0.05]",
      accentText: "text-orange-300",
    };
  }

  if (cls.includes("confidential")) {
    return {
      pill: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      edge: "from-amber-500/20",
      glow: "shadow-[0_0_80px_rgba(251,191,36,0.08)]",
      panel: "from-amber-500/[0.05]",
      accentText: "text-amber-300",
    };
  }

  if (cls.includes("member")) {
    return {
      pill: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      edge: "from-blue-500/20",
      glow: "shadow-[0_0_80px_rgba(59,130,246,0.08)]",
      panel: "from-blue-500/[0.05]",
      accentText: "text-blue-300",
    };
  }

  return {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    edge: "from-emerald-500/20",
    glow: "shadow-[0_0_80px_rgba(16,185,129,0.08)]",
    panel: "from-emerald-500/[0.05]",
    accentText: "text-emerald-300",
  };
}

function categoryLabel(category: string, categorySlug?: string): string {
  const base = safeStr(categorySlug) || safeStr(category);
  if (!base) return "Strategic Asset";

  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildFallbackMonogram(title: string): string {
  const words = safeStr(title)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return "AoL";
  return words.map((w) => w[0]?.toUpperCase() || "").join("");
}

function MetaStat({
  label,
  value,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  emphasis?: boolean;
}) {
  return (
    <div className="relative bg-white/[0.025] p-4 transition-colors duration-300 group-hover:bg-white/[0.035]">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${emphasis ? "text-amber-300/80" : "text-white/25"}`} />
        <span className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
          {label}
        </span>
      </div>
      <div
        className={`text-sm leading-relaxed break-words ${
          emphasis ? "text-amber-200/90" : "text-white/82"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function PremiumAssetCard({
  id,
  title,
  subtitle,
  description,
  category,
  categorySlug,
  classification = "PUBLIC",
  tier = "public",
  docId,
  version,
  fileSize,
  pageCount,
  href,
  coverImage,
  tags = [],
  featured = false,
  watermarkRequired = false,
}: PremiumAssetCardProps) {
  const tone = toneForClassification(classification);
  const cleanTitle = safeStr(title) || "Untitled Asset";
  const cleanSubtitle = safeStr(subtitle);
  const cleanDescription = safeStr(description);
  const cleanCategory = categoryLabel(category, categorySlug);
  const cleanTier = safeStr(tier) || "public";
  const cleanClassification = safeStr(classification) || "PUBLIC";
  const cleanDocId = safeStr(docId) || "—";
  const cleanVersion = safeStr(version) || "—";
  const cleanFileSize = safeStr(fileSize) || "—";
  const monogram = buildFallbackMonogram(cleanTitle);

  const [imageFailed, setImageFailed] = React.useState(false);

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#06080d] text-white",
        "transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/20",
        "shadow-[0_20px_80px_rgba(0,0,0,0.35)]",
        tone.glow,
      ].join(" ")}
    >
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${tone.edge} via-amber-400/30 to-transparent`}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_26%)]"
      />
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.panel} via-transparent to-transparent opacity-80`}
      />

      <div className="relative">
        <div className="relative h-60 overflow-hidden border-b border-white/8 bg-black">
          {coverImage && !imageFailed ? (
            <>
              <img
                src={coverImage}
                alt={cleanTitle}
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            </>
          ) : (
            <div className="relative flex h-full w-full items-end bg-gradient-to-br from-[#0a0d14] via-[#10141d] to-[#050609] p-8">
              <div className="absolute right-6 top-6 text-[72px] font-serif italic leading-none text-white/[0.06]">
                {monogram}
              </div>
              <div className="relative">
                <div className="mb-3 inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-amber-300/90">
                  Abraham of London
                </div>
                <div className="max-w-[82%] font-serif text-3xl leading-tight text-white/95">
                  {cleanTitle}
                </div>
              </div>
            </div>
          )}

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {featured ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300">
                <Sparkles className="h-3 w-3" />
                Flagship
              </span>
            ) : null}

            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] ${tone.pill}`}
            >
              {cleanClassification}
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50">
              <Layers3 className="h-3.5 w-3.5" />
              {cleanCategory}
            </div>

            <h3 className="max-w-[90%] font-serif text-[28px] leading-tight text-white/95">
              {cleanTitle}
            </h3>

            {cleanSubtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
                {cleanSubtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[80%]">
              <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">
                Asset Brief
              </div>
              <p className="text-[15px] leading-7 text-white/72">{cleanDescription}</p>
            </div>

            <div className="hidden shrink-0 rounded-2xl border border-white/8 bg-white/[0.025] p-3 md:flex md:flex-col md:items-end">
              <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
                Access
              </div>
              <div className="mt-2 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/55">
                {watermarkRequired ? (
                  <Lock className="h-3.5 w-3.5 text-amber-300/70" />
                ) : (
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-300/70" />
                )}
                {cleanTier}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/8 bg-white/5">
            <MetaStat label="Document ID" value={cleanDocId} icon={FileText} />
            <MetaStat label="Revision" value={cleanVersion} icon={ScrollText} />
            <MetaStat label="File Size" value={cleanFileSize} icon={FileText} />
            <MetaStat
              label="Integrity"
              value={watermarkRequired ? "Watermarked" : "Open Distribution"}
              icon={watermarkRequired ? Fingerprint : ShieldCheck}
              emphasis={watermarkRequired}
            />
          </div>

          {tags.length > 0 || typeof pageCount === "number" ? (
            <div className="mt-5">
              <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
                Asset Markers
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {typeof pageCount === "number" ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55">
                    {pageCount} pages
                  </span>
                ) : null}

                {tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
              {watermarkRequired ? (
                <Lock className="h-3.5 w-3.5 text-amber-300/70" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" />
              )}
              {watermarkRequired ? "Traceable distribution" : "Open circulation"}
            </div>

            <PremiumAssetLaunchButton
              contentId={id}
              fallbackHref={href}
              variant="primary"
            >
              Open Asset
            </PremiumAssetLaunchButton>
          </div>
        </div>
      </div>
    </article>
  );
}