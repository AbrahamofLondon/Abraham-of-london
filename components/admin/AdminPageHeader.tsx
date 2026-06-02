/**
 * components/admin/AdminPageHeader.tsx
 *
 * Standardised page header for admin console pages.
 * Provides consistent hierarchy: eyebrow → title → description → action row.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  /** Optional right-aligned slot — e.g. status badges or action buttons */
  actions?: React.ReactNode;
  /** Gradient accent colour class (e.g. "from-sky-400/8"). Defaults to sky. */
  accentFrom?: string;
  borderColor?: string;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  accentFrom = "from-sky-400/8",
  borderColor = "border-sky-400/15",
}: AdminPageHeaderProps) {
  return (
    <section className={`border ${borderColor} bg-gradient-to-br ${accentFrom} to-transparent p-5`}>
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-white/35">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="h-3 w-3 text-white/20" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-white/65 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-white/55">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="mb-1.5 text-[10px] font-mono uppercase tracking-[0.28em] text-sky-200/50">
              {eyebrow}
            </p>
          )}
          <h1 className="font-serif text-2xl text-white/95 leading-tight">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
