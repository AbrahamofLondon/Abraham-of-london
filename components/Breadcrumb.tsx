// components/Breadcrumb.tsx
import Link from "next/link";
import * as React from "react";

export type Crumb = { href?: string; label: string };

type Props = {
  items: Crumb[];
  className?: string;
  separator?: React.ReactNode; // e.g. "ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âº"
  ariaLabel?: string;
};

export default function Breadcrumb({
  items,
  className = "",
  separator = "/",
  ariaLabel = "Breadcrumb",
}: Props) {
  if (!items?.length) return null;

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-on-secondary)/0.7]">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          const key = `${c.label}-${i}`;
          return (
            <li key={key} className="flex items-center gap-2 min-w-0">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="hover:text-deepCharcoal max-w-[18ch] truncate"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className="text-[color:var(--color-on-secondary)/0.7] max-w-[22ch] truncate"
                  aria-current={last ? "page" : undefined}
                  title={c.label}
                >
                  {c.label}
                </span>
              )}
              {!last && <span aria-hidden="true">{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Optional: JSON-LD for SEO breadcrumbs.
 * Place this in the page <Head> alongside the visual <Breadcrumb />.
 */
export function BreadcrumbJsonLd({
  items,
  siteUrl,
}: {
  items: Crumb[];
  siteUrl: string; // e.g. https://www.abrahamoflondon.org
}) {
  if (!items?.length) return null;

  const itemListElement = items.map((c, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: c.label,
    item: c.href
      ? c.href.startsWith("http")
        ? c.href
        : `${siteUrl}${c.href.startsWith("/") ? "" : "/"}${c.href}`
      : undefined,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
