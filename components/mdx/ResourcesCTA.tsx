// components/mdx/ResourcesCTA.tsx
import Link from "next/link";
import { CTA_PRESETS, getCtaPreset, type LinkItem } from "./cta-presets";

export type ResourcesCTAProps =
  | {
      /** Use a preset key from CTA_PRESETS (e.g., "fatherhood") */
      preset: keyof typeof CTA_PRESETS | string;
      title?: never;
      reads?: never;
      downloads?: never;
      className?: string;
    }
  | {
      /** Manual mode */
      preset?: never;
      title?: string;
      reads?: LinkItem[];
      downloads?: LinkItem[];
      className?: string;
    };

// Internal posts (these slugs exist)
const defaultReads: LinkItem[] = [
  { href: "/blog/reclaiming-the-narrative", label: "Reclaiming the Narrative", sub: "Court-season clarity" },
  { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Build your band of brothers" },
  { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Lead from the inside out" },
];

// PDFs that exist today
const defaultDownloads: LinkItem[] = [
  { href: "/downloads/Mentorship_Starter_Kit.pdf", label: "Mentorship Starter Kit" },
  { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
  { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
];

function isInternal(href = "") {
  return href.startsWith("/") && !href.endsWith(".pdf");
}

export default function ResourcesCTA(props: ResourcesCTAProps) {
  const presetKey = "preset" in props ? props.preset : undefined;
  const preset = presetKey ? getCtaPreset(String(presetKey)) : null;

  const data = preset
    ? preset
    : {
        title: ("title" in props && props.title) || "Further Reading & Tools",
        reads: ("reads" in props && props.reads) || defaultReads,
        downloads: ("downloads" in props && props.downloads) || defaultDownloads,
      };

  if (!data) return null;

  const reads = (data.reads ?? []).filter(Boolean);
  const downloads = (data.downloads ?? []).filter(Boolean);

  return (
    <section
      className={`mt-12 rounded-xl border border-lightGrey bg-warmWhite/60 p-5 md:p-6 shadow-card ${("className" in props && props.className) || ""}`}
      aria-labelledby="resources-cta-title"
    >
      <h3 id="resources-cta-title" className="mb-4 font-serif text-2xl text-forest">
        {data.title}
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        {!!reads.length && (
          <div>
            <h4 className="mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase">
              Further Reading
            </h4>
            <ul className="space-y-2">
              {reads.map((r) => (
                <li key={r.href}>
                  {isInternal(r.href) ? (
                    <Link href={r.href} className="luxury-link text-forest" prefetch={false}>
                      {r.label}
                    </Link>
                  ) : (
                    <a href={r.href} className="luxury-link text-forest" target="_blank" rel="noopener noreferrer">
                      {r.label}
                    </a>
                  )}
                  {r.sub && <span className="ml-2 text-sm text-[color:var(--color-on-secondary)/0.7]">— {r.sub}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!downloads.length && (
          <div>
            <h4 className="mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase">
              Downloads
            </h4>
            <ul className="space-y-2">
              {downloads.map((d) => (
                <li key={d.href}>
                  <a href={d.href} className="luxury-link text-forest" rel="noopener" download>
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
