// components/homepage/InstitutionalSections.tsx
// INSTITUTIONAL SECTIONS — 12/10 (Legible, bounded, premium finish)

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* =============================================================================
   INTERNAL: Hairline (shared)
============================================================================= */
function Hairline({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={[
        "h-px w-full",
        soft
          ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
          : "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent",
      ].join(" ")}
    />
  );
}

/* =============================================================================
   SECTION HEADER — readable think-tank editorial style (not faint)
============================================================================= */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  divider = true,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  divider?: boolean;
}) {
  const isCenter = align === "center";

  return (
    <div className={isCenter ? "text-center" : ""}>
      <div
        className={[
          "text-[10px] font-mono tracking-[0.34em] uppercase",
          "text-amber-400/85 mb-3",
          isCenter ? "text-center" : "",
        ].join(" ")}
      >
        {eyebrow}
      </div>

      <h2
        className={[
          "font-serif font-light tracking-tight",
          "text-white",
          isCenter ? "mx-auto" : "",
        ].join(" ")}
        style={{ fontSize: "clamp(1.9rem, 3.2vw, 3.1rem)", lineHeight: 1.12 }}
      >
        {title}
      </h2>

      {description && (
        <p
          className={[
            "mt-4 font-light leading-relaxed",
            "text-white/75",
            isCenter ? "mx-auto max-w-2xl" : "max-w-2xl",
          ].join(" ")}
          style={{ fontSize: "clamp(0.98rem, 1.05vw, 1.1rem)" }}
        >
          {description}
        </p>
      )}

      {divider ? (
        <div className={["mt-8", isCenter ? "mx-auto max-w-3xl" : "max-w-3xl"].join(" ")}>
          <Hairline />
        </div>
      ) : null}
    </div>
  );
}

/* =============================================================================
   PREMIUM FRAME — true boundaries + readable surface
============================================================================= */
export function PremiumFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl",
        "border border-white/12 bg-white/[0.05]",
        "shadow-[0_40px_120px_-80px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      {/* Subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(245,158,11,0.10)_0%,transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.07)_0%,transparent_55%)] pointer-events-none" />

      {/* Inner hairline for “institutional” finish */}
      <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" />

      <div className="relative bg-black/35 backdrop-blur-md">
        <div className="px-7 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}

/* =============================================================================
   NARRATIVE BRIDGE — visible pacing + real separation
============================================================================= */
export function NarrativeBridge({ text }: { text: string }) {
  return (
    <div className="relative bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <Hairline soft />
          </div>
          <p className="text-center text-[10px] font-mono tracking-[0.34em] uppercase text-white/60">
            {text}
          </p>
          <div className="flex-1">
            <Hairline soft />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   PROOF CARD — readable (no faint bodies)
============================================================================= */
export function ProofCard({
  title,
  body,
  index,
}: {
  title: string;
  body: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className="border-l border-amber-500/25 pl-6 py-4"
    >
      <div className="text-[10px] font-mono tracking-[0.28em] uppercase text-amber-400/80 mb-2">
        {String(index + 1).padStart(2, "0")}
      </div>

      <h3 className="font-serif text-lg md:text-xl text-white mb-2 leading-snug">
        {title}
      </h3>

      <p className="text-sm md:text-[15px] text-white/70 leading-relaxed">
        {body}
      </p>
    </motion.div>
  );
}

/* =============================================================================
   ACTION CARD — premium CTA with real contrast + boundaries
============================================================================= */
export function ActionCard({
  badge,
  title,
  body,
  href,
  label,
  variant = "default",
  index,
}: {
  badge: string;
  title: string;
  body: string;
  href: string;
  label: string;
  variant?: "default" | "primary";
  index: number;
}) {
  const isPrimary = variant === "primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
    >
      <Link
        href={href}
        className={[
          "group block rounded-2xl p-7 md:p-8 transition-all duration-500",
          "border bg-white/[0.05] hover:bg-white/[0.07]",
          isPrimary
            ? "border-amber-500/35 shadow-[0_0_0_1px_rgba(245,158,11,0.12)_inset]"
            : "border-white/12",
          "hover:-translate-y-[2px]",
        ].join(" ")}
      >
        <div
          className={[
            "text-[10px] font-mono tracking-[0.32em] uppercase mb-4",
            isPrimary ? "text-amber-300/90" : "text-white/65",
          ].join(" ")}
        >
          {badge}
        </div>

        <h3 className="font-serif text-2xl text-white mb-3 leading-tight">
          {title}
        </h3>

        <p className="text-sm md:text-[15px] text-white/70 leading-relaxed mb-6">
          {body}
        </p>

        <div className="flex items-center gap-2">
          <span
            className={[
              "text-[10px] font-mono tracking-[0.32em] uppercase",
              isPrimary ? "text-amber-300/90" : "text-white/70",
            ].join(" ")}
          >
            {label}
          </span>
          <ArrowRight
            className={[
              "h-4 w-4 transition-transform duration-300",
              isPrimary ? "text-amber-300/90" : "text-white/65",
              "group-hover:translate-x-1",
            ].join(" ")}
          />
        </div>
      </Link>
    </motion.div>
  );
}

/* =============================================================================
   FEATURED CARD — clean + legible
============================================================================= */
export function FeaturedCard({
  eyebrow,
  title,
  excerpt,
  href,
  index,
}: {
  eyebrow: string;
  title: string;
  excerpt?: string;
  href: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link
        href={href}
        className="group block rounded-xl border border-white/12 bg-white/[0.04] hover:bg-white/[0.06] transition-all duration-500 p-5"
      >
        <div className="text-[10px] font-mono tracking-[0.30em] uppercase text-amber-400/80 mb-2">
          {eyebrow}
        </div>

        <h4 className="font-serif text-lg text-white mb-2 group-hover:text-white transition-colors leading-snug">
          {title}
        </h4>

        {excerpt ? (
          <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        ) : null}

        <div className="mt-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />
        </div>
      </Link>
    </motion.div>
  );
}

/* =============================================================================
   STATS DISPLAY — clean metrics, readable labels
============================================================================= */
export function StatsDisplay({
  stats,
}: {
  stats: Array<{ label: string; value: number | string }>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-white/12 bg-white/[0.04] p-6 text-center"
        >
          <div className="font-serif text-3xl md:text-4xl font-light text-white mb-2">
            {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
          </div>

          <div className="text-[10px] font-mono tracking-[0.28em] uppercase text-white/65">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}