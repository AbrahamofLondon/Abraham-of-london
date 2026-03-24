/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ShortCard.tsx — QUIET ARCHIVE CARD (CONTROLLED MINIMALISM)

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type ShortCardModel = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
  views?: number;
  intensity?: 1 | 2 | 3 | 4 | 5;
  lineage?: string | null;
  coverImage?: string | null;
  metrics?: {
    likes?: number;
    saves?: number;
    views?: number;
  };
  state?: {
    liked?: boolean;
    saved?: boolean;
  };
};

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeCardSlug(slug: unknown): string {
  return safeString(slug)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//i, "");
}

function categoryLabel(raw?: string | null): string {
  const value = safeString(raw).trim();
  return value ? value.toUpperCase() : "INTEL";
}

export default function ShortCard({
  short,
  onClick,
}: {
  short: ShortCardModel;
  onClick?: () => void;
}) {
  const routeSlug = normalizeCardSlug(short.slug);
  const href = `/shorts/${routeSlug}`;

  const category = categoryLabel(short.category);
  const readTime = safeString(short.readTime || "");
  const title = safeString(short.title) || "Untitled";
  const excerpt = safeString(short.excerpt);

  return (
    <Link href={href} onClick={onClick} className="group block">
      <article
        className={[
          "relative overflow-hidden",
          "border border-white/[0.08]",
          "bg-[linear-gradient(180deg,rgba(8,8,9,0.965)_0%,rgba(4,4,5,0.995)_100%)]",
          "transition-all duration-500 ease-out",
          "hover:border-[#C9A96A]/18",
          "hover:shadow-[0_16px_34px_rgba(0,0,0,0.2)]",
          "hover:-translate-y-[1px]",
        ].join(" ")}
      >
        {/* atmospheric structure only */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(201,169,106,0.045),transparent_26%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.02),transparent_18%)]" />
          <div className="absolute inset-y-0 left-[45%] w-[16%] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.025)_50%,transparent_100%)] opacity-[0.05] blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* ghost watermark */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[12%] select-none font-serif text-[6rem] font-semibold leading-none tracking-[-0.06em] text-white/[0.015] blur-[1px]">
            Shorts
          </div>
        </div>

        <div className="relative z-10 p-7 md:p-8">
          {/* meta rail */}
          <div className="mb-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D2AF6B]">
                {category}
              </span>

              {readTime ? (
                <>
                  <span className="text-white/[0.14]">•</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/34">
                    {readTime}
                  </span>
                </>
              ) : null}
            </div>

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-white/22 transition-all duration-500 group-hover:border-[#C9A96A]/20 group-hover:text-[#D2AF6B]">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* content */}
          <div className="max-w-[29ch]">
            <h3 className="font-serif text-[1.85rem] font-medium leading-[1.08] tracking-[-0.03em] text-[#E6C27A] transition-colors duration-500 group-hover:text-[#F0D79B]">
              {title}
            </h3>

            <p className="mt-6 text-[15px] leading-7 text-white/55 transition-colors duration-500 group-hover:text-white/68">
              {excerpt}
            </p>
          </div>

          {/* archive footer */}
          <div className="mt-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-[#C9A96A]/28 to-transparent" />
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/20">
                Archive note
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/14 transition-colors duration-500 group-hover:text-white/22">
                Indexed
              </span>

              <span className="translate-y-[1px] select-none font-serif text-[12px] italic tracking-[-0.02em] text-white/[0.07] transition-colors duration-500 group-hover:text-white/[0.1]">
                abrahamoflondon
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}