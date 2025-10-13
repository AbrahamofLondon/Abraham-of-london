// components/mdx/ResourcesCTA.tsx
import Link from "next/link";

type LinkItem = { href: string; label: string; sub?: string };

export type ResourcesCTAProps = {
  title?: string;
  reads?: LinkItem[];
  downloads?: LinkItem[];
  className?: string;
};

const defaultReads: LinkItem[] = [
  { href: "/blog/reclaiming-the-narrative", label: "Reclaiming the Narrative", sub: "Court-season clarity" },
  { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Build your band of brothers" },
  { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Lead from the inside out" },
];

const defaultDownloads: LinkItem[] = [
  { href: "/downloads/Fathers_in_Family_Court_Practical_Pack.pdf", label: "Practical Pack (Family Court)" },
  { href: "/downloads/Brotherhood_Starter_Kit.pdf", label: "Brotherhood Starter Kit" },
  { href: "/downloads/Brotherhood_Leader_Guide_4_Weeks.pdf", label: "Leader Guide — First 4 Weeks" },
];

export default function ResourcesCTA({
  title = "Further Reading & Tools",
  reads = defaultReads,
  downloads = defaultDownloads,
  className,
}: ResourcesCTAProps) {
  return (
    <section
      className={`mt-12 rounded-xl border border-lightGrey bg-warmWhite/60 p-5 md:p-6 shadow-card ${className || ""}`}
      aria-labelledby="resources-cta-title"
    >
      <h3 id="resources-cta-title" className="mb-4 font-serif text-2xl text-forest">
        {title}
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wide text-deepCharcoal/70 uppercase">
            Further Reading
          </h4>
          <ul className="space-y-2">
            {reads.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="luxury-link text-forest"
                  prefetch={false}
                >
                  {r.label}
                </Link>
                {r.sub && <span className="ml-2 text-sm text-deepCharcoal/70">— {r.sub}</span>}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold tracking-wide text-deepCharcoal/70 uppercase">
            Downloads
          </h4>
          <ul className="space-y-2">
            {downloads.map((d) => (
              <li key={d.href}>
                <a
                  href={d.href}
                  className="luxury-link text-forest"
                  target="_self"
                  rel="noopener"
                >
                  {d.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
