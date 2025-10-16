// components/events/EventResources.tsx
import Link from "next/link";

type LinkItem = { href: string; label: string; sub?: string };

export default function EventResources({
  reads = [],
  downloads = [],
  className = "",
  title = "Event Resources",
}: {
  reads?: LinkItem[];
  downloads?: LinkItem[];
  className?: string;
  title?: string;
}) {
  const safeReads = (reads || []).filter(Boolean);
  const safeDownloads = (downloads || []).filter(Boolean);

  if (!safeReads.length && !safeDownloads.length) return null;

  const isInternal = (href = "") => href.startsWith("/") && !href.endsWith(".pdf");

  return (
    <section
      className={`mt-12 rounded-xl border border-lightGrey bg-warmWhite/60 p-5 md:p-6 shadow-card ${className}`}
      aria-labelledby="event-resources-title"
    >
      <h3 id="event-resources-title" className="mb-4 font-serif text-2xl text-forest">
        {title}
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        {!!safeReads.length && (
          <div>
            <h4 className="mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase">
              Further Reading
            </h4>
            <ul className="space-y-2">
              {safeReads.map((r) => (
                <li key={r.href}>
                  {isInternal(r.href) ? (
                    <Link href={r.href} prefetch={false} className="luxury-link text-forest">
                      {r.label}
                    </Link>
                  ) : (
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="luxury-link text-forest">
                      {r.label}
                    </a>
                  )}
                  {r.sub && <span className="ml-2 text-sm text-[color:var(--color-on-secondary)/0.7]">— {r.sub}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!safeDownloads.length && (
          <div>
            <h4 className="mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase">
              Downloads
            </h4>
            <ul className="space-y-2">
              {safeDownloads.map((d) => (
                <li key={d.href}>
                  <a href={d.href} className="luxury-link text-forest" download rel="noopener">
                    {d.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
