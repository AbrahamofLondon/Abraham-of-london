// components/Breadcrumb.tsx
import Link from "next/link";

type Crumb = { href?: string; label: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-deepCharcoal/70">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {c.href && !last ? (
                <Link href={c.href} className="hover:text-deepCharcoal">
                  {c.label}
                </Link>
              ) : (
                <span className="text-deepCharcoal/70">{c.label}</span>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
