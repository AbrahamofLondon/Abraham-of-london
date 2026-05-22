/**
 * components/admin/outbound/OutboundDraftPreview.tsx
 *
 * Shows the resolved draft content for admin review before publishing.
 * Includes: post text with character count, link, and provider-specific metadata.
 * Read-only — does not handle submission.
 */

import * as React from "react";
import { Link2, Image, Hash } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundDraftPreviewProps = {
  title: string;
  text: string;
  link: string | null;
  /** Character count (provider may use weighted counting, e.g. X) */
  charCount: number;
  /** Maximum character count for this provider */
  maxChars: number;
  /** Optional image path (Facebook) */
  imagePath?: string | null;
  /** Optional provider label shown as context */
  providerLabel?: string;
  /** Optional slug shown as reference */
  slug?: string;
};

// ─── Char bar ─────────────────────────────────────────────────────────────────

function CharBar({ count, max }: { count: number; max: number }) {
  const pct = Math.min((count / max) * 100, 100);
  const over = count > max;
  const nearLimit = pct >= 85;

  const barColour = over
    ? "bg-rose-500"
    : nearLimit
      ? "bg-amber-500"
      : "bg-emerald-500";

  const textColour = over
    ? "text-rose-400"
    : nearLimit
      ? "text-amber-400"
      : "text-emerald-400";

  return (
    <div className="mt-2">
      <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-end">
        <span className={`font-mono text-[10px] ${textColour}`}>
          {count}/{max}
          {over && " — over limit"}
        </span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundDraftPreview({
  title,
  text,
  link,
  charCount,
  maxChars,
  imagePath,
  providerLabel,
  slug,
}: OutboundDraftPreviewProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-widest text-white/40">
          Draft Preview{providerLabel ? ` — ${providerLabel}` : ""}
        </h3>
        {slug && (
          <span className="flex items-center gap-1 font-mono text-[9px] text-white/25">
            <Hash className="h-2.5 w-2.5" />
            {slug}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mb-2 text-[11px] font-semibold text-white/60 uppercase tracking-wide">{title}</p>

      {/* Post text */}
      <div className="rounded-lg border border-white/8 bg-black/20 p-4">
        <pre className="whitespace-pre-wrap font-sans text-[12px] text-white/80 leading-relaxed">
          {text}
        </pre>
      </div>

      {/* Char count */}
      <CharBar count={charCount} max={maxChars} />

      {/* Link */}
      {link && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-[11px] text-blue-300 hover:text-blue-200 transition-colors"
          >
            {link}
          </a>
        </div>
      )}

      {/* Image path */}
      {imagePath && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2">
          <Image className="h-3.5 w-3.5 shrink-0 text-white/30" />
          <span className="truncate font-mono text-[10px] text-white/40">{imagePath}</span>
        </div>
      )}
    </div>
  );
}
