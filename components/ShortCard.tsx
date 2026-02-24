/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ShortCard.tsx — BRAND EQUITY UNIT (Quiet. Expensive. Recognisable.)

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Eye, Shield, Sparkles } from "lucide-react";

type Intensity = 1 | 2 | 3 | 4 | 5;

export type ShortCardData = {
  slug: string;
  title: string;
  excerpt?: string | null;
  category?: string | null;
  readTime?: string | null;
  views?: number;
  intensity?: Intensity;
  lineage?: string | null;
  coverImage?: string | null;
};

type Props = {
  short: ShortCardData;
  onClick?: () => void;
  className?: string;
};

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function cleanSlugForURL(slug: string): string {
  if (!slug) return "";
  return slug
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//i, "")
    .replace(/\/+/g, "/")
    .trim();
}

const SignalStrength = ({ level = 3 }: { level?: Intensity }) => {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {bars.map((b) => (
        <span
          key={b}
          className={`h-3 w-[2px] rounded-full ${
            b <= level ? "bg-amber-500/80" : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
};

export default function ShortCard({ short, onClick, className = "" }: Props) {
  const slug = cleanSlugForURL(safeString(short.slug));
  const href = `/shorts/${slug}`;

  const title = safeString(short.title) || "Untitled";
  const excerpt = safeString(short.excerpt) || "A short note from the archive.";
  const category = safeString(short.category) || "Intel";
  const readTime = safeString(short.readTime) || "2 min";
  const views = Number(short.views || 0);
  const intensity = (short.intensity || 3) as Intensity;
  const lineage = safeString(short.lineage);
  const coverImage = safeString(short.coverImage);

  return (
    <Link href={href} className={`group block ${className}`} onClick={onClick}>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className={[
          "relative overflow-hidden rounded-3xl",
          "border border-white/[0.06]",
          "bg-white/[0.012]",
          "shadow-[0_10px_30px_-15px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.03)]",
          "hover:border-amber-500/20 hover:bg-white/[0.02]",
          "transition-colors duration-500",
        ].join(" ")}
      >
        {/* Signature spine line — recognisable brand cue */}
        <div className="pointer-events-none absolute inset-y-0 left-7 w-px bg-gradient-to-b from-amber-500/0 via-white/10 to-amber-500/0 opacity-60 group-hover:opacity-90 transition-opacity" />

        {/* Foil edge (top) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

        {/* Cover image (optional) */}
        {coverImage ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover opacity-[0.10] group-hover:opacity-[0.16] transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
          </div>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,158,11,0.10),transparent_52%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.05),transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_95%,rgba(245,158,11,0.06),transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
          </div>
        )}

        {/* Content */}
        <div className="relative p-8">
          {/* Top band */}
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-xl">
              <Shield className="h-3.5 w-3.5 text-amber-500/60" />
              <span className="font-mono text-[9px] tracking-[0.45em] uppercase text-white/30">
                Entry_{category}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <SignalStrength level={intensity} />
            </div>

            <div className="flex items-center gap-2">
              {lineage ? (
                <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/5 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500/35" />
                  <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-amber-500/50">
                    {lineage}
                  </span>
                </div>
              ) : null}

              <ArrowUpRight className="h-5 w-5 text-white/10 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-8 font-serif italic text-[1.9rem] leading-[1.05] text-white/85 group-hover:text-white transition-colors">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="mt-5 text-[1.02rem] leading-relaxed text-white/45 font-light line-clamp-3">
            {excerpt}
          </p>

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-6">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-white/25">
                <Clock className="h-3.5 w-3.5 text-white/20" />
                {readTime}
              </div>

              {views > 0 ? (
                <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.35em] text-white/20">
                  <Eye className="h-3.5 w-3.5 text-white/15" />
                  {views.toLocaleString()}
                </div>
              ) : null}
            </div>

            {/* Micro “living” dot — signature subtle movement */}
            <motion.div
              aria-hidden
              animate={{ opacity: [0.18, 0.72, 0.18] }}
              transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut" }}
              className="h-1.5 w-1.5 rounded-full bg-amber-500/40 group-hover:bg-amber-500/75 transition-colors"
            />
          </div>
        </div>
      </motion.article>
    </Link>
  );
}