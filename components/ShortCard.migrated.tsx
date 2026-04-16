// components/ShortCard.migrated.tsx
// Migrated ShortCard using CardShell + design system tokens
// Preserves: fast, scan-friendly, low-friction character
// Lighter than Essays, faster than Vault

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CardShell } from '@/components/primitives/CardShell';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ShortCardModel = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
  views?: number;
  intensity?: 1 | 2 | 3 | 4 | 5;
  lineage?: string | null;
  coverImage?: string | null;
  metrics?: { likes?: number; saves?: number; views?: number };
  state?: { liked?: boolean; saved?: boolean };
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function normalizeCardSlug(slug: unknown): string {
  return safeString(slug)
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^shorts\//i, '');
}

/** One editorial word — adds depth, never competes with the title */
function intensityDescriptor(n?: number | null): string {
  switch (n) {
    case 1: return 'Foundational';
    case 2: return 'Considered';
    case 3: return 'Substantive';
    case 4: return 'Consequential';
    case 5: return 'Critical';
    default: return 'Substantive';
  }
}

/** Exactly 2 sentences. Executives scan. They do not read full paragraphs in card views. */
function executiveScan(text: string): string {
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, 2).join(' ').trim() || text.slice(0, 130);
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATED SHORT CARD
// ─────────────────────────────────────────────────────────────────────────────

export default function ShortCard({
  short,
  onClick,
  listMode = false,
}: {
  short: ShortCardModel;
  onClick?: () => void;
  listMode?: boolean;
}) {
  const routeSlug = normalizeCardSlug(short.slug);
  const href = `/shorts/${routeSlug}`;
  const title = safeString(short.title) || 'Untitled';
  const excerpt = executiveScan(safeString(short.excerpt));
  const category = safeString(short.category).trim().toUpperCase() || 'INTEL';
  const readTime = safeString(short.readTime).trim();
  const weight = intensityDescriptor(short.intensity);

  // Padding scale — tighter in list mode, more generous in grid
  const density = listMode ? 'compact' : 'balanced';

  return (
    <Link href={href} onClick={onClick} className="group block outline-none focus-visible:outline-none">
      <CardShell
        as="div"
        variant="default"
        density={density}
        interactive
        className={cn(
          'relative overflow-hidden transition-all duration-350',
          'hover:-translate-y-0.5 hover:shadow-[var(--ds-shadow-lg)]',
          // Shorts-specific: lighter border, faster feel
          'border-[var(--ds-border)]',
          // Top edge gold thread on hover
          'before:absolute before:inset-x-0 before:top-0 before:h-px before:opacity-0 before:transition-opacity before:duration-500',
          'before:bg-gradient-to-r before:from-transparent before:via-[var(--ds-accent)]/35 before:to-transparent',
          'group-hover:before:opacity-100',
          // Subtle atmospheric radial on hover
          'after:absolute after:inset-0 after:opacity-0 after:transition-opacity after:duration-500',
          'after:bg-[radial-gradient(ellipse_55%_35%_at_18%_12%,var(--ds-accent)/4%,transparent)]',
          'group-hover:after:opacity-100'
        )}
      >
        <div className="relative z-10">
          {/* ── META ROW ─────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">
            {/* Left: category + read time */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[8px] uppercase tracking-[0.40em] ds-accent">
                {category}
              </span>

              {readTime && (
                <>
                  <span className="text-[10px] ds-text-subtle">·</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.26em] ds-text-muted">
                    {readTime}
                  </span>
                </>
              )}
            </div>

            {/* Right: directional arrow in a sharp square */}
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center border border-[var(--ds-border)] transition-colors group-hover:border-[var(--ds-accent)]/25">
              <ArrowUpRight className="h-3 w-3 ds-text-muted transition-colors group-hover:ds-accent" />
            </div>
          </div>

          {/* ── TITLE ────────────────────────────────────────────────────── */}
          <h3 className={cn(
            'mt-4 font-serif font-light leading-[1.05] tracking-[-0.030em] ds-text transition-colors',
            listMode 
              ? 'text-[clamp(1.25rem,1.7vw,1.50rem)]' 
              : 'text-[clamp(1.45rem,1.9vw,1.80rem)]',
            'group-hover:text-[var(--ds-text)]' // Slightly brighter on hover
          )}>
            {title}
          </h3>

          {/* ── EXCERPT ──────────────────────────────────────────────────── */}
          {excerpt && (
            <p className={cn(
              'mt-3 font-serif font-light leading-[1.70] ds-text-muted transition-colors',
              'text-[clamp(0.90rem,1.05vw,0.98rem)] max-w-[32ch]',
              'group-hover:text-[var(--ds-text-muted)]' // Slightly brighter on hover
            )}>
              {excerpt}
            </p>
          )}

          {/* ── EDITORIAL FOOTER ─────────────────────────────────────────── */}
          <div className={cn(
            'mt-6 flex items-center gap-2.5',
            listMode ? 'mt-5' : 'mt-7'
          )}>
            {/* Extending gold rule */}
            <div className="h-px w-[18px] bg-gradient-to-r from-[var(--ds-accent)]/32 to-transparent transition-all duration-450 group-hover:w-[30px]" />
            
            {/* Editorial weight — one word, near invisible, deeply intentional */}
            <span className="font-mono text-[7px] uppercase tracking-[0.36em] ds-text-subtle">
              {weight}
            </span>
          </div>
        </div>
      </CardShell>
    </Link>
  );
}