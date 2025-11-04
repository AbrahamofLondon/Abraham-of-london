import Link from "next/link";

type LinkItem = { href: string; label: string; sub?: string };

// 1. Explicitly define the union type for the preset keys
type PresetKey = "leadership" | "founders";

export type EventResourcesProps =
  | {
      preset: PresetKey;
      title?: never;
      reads?: never;
      downloads?: never;
      className?: string;
    }
  | {
      preset?: never;
      title?: string;
      reads?: LinkItem[];
      downloads?: LinkItem[];
      className?: string;
    };

// 2. Define the expected structure for a single preset's data
type PresetData = {
  title: string;
  reads: LinkItem[];
  downloads: LinkItem[];
};

// 3. Define PRESETS with a clear Record type
const PRESETS: Record<PresetKey, PresetData> = {
  leadership: {
    title: "Leadership Tools & Further Reading",
    reads: [
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home", sub: "Order under pressure" },
      { href: "/blog/the-brotherhood-code", label: "The Brotherhood Code", sub: "Build a band of standards" },
      { href: "/blog/kingdom-strategies-for-a-loving-legacy", label: "Loving Legacy, Real Standards" },
    ],
    downloads: [
      { href: "/downloads/Leadership_Playbook.pdf", label: "Leadership Playbook (30•60•90)" },
      { href: "/downloads/Weekly_Operating_Rhythm.pdf", label: "Weekly Operating Rhythm" },
      { href: "/downloads/Board_Update_Onepager.pdf", label: "Board Update One-Pager" },
    ],
  },
  founders: {
    title: "Founder’s Toolkit",
    reads: [
      { href: "/blog/reclaiming-the-narrative", label: "Reclaiming the Narrative", sub: "Signal over noise" },
      { href: "/blog/out-of-context-truth", label: "Out of Context Truth", sub: "Clarity under fire" },
      { href: "/blog/leadership-begins-at-home", label: "Leadership Begins at Home" },
    ],
    downloads: [
      { href: "/downloads/Entrepreneur_Operating_Pack.pdf", label: "Entrepreneur Operating Pack" },
      { href: "/downloads/Entrepreneur_Survival_Checklist.pdf", label: "Entrepreneur Survival Checklist" },
      { href: "/downloads/Communication_Script_BPF.pdf", label: "Communication Script (B•P•F)" },
    ],
  },
};

function isInternal(href = "") {
  return href.startsWith("/") && !href.endsWith(".pdf");
}

export default function EventResources(props: EventResourcesProps) {
  const data =
    "preset" in props && props.preset
      ? PRESETS[props.preset]
      : {
          title: props.title ?? "Resources",
          reads: props.reads ?? [],
          downloads: props.downloads ?? [],
        };

  const reads = (data.reads ?? []).filter(Boolean);
  const downloads = (data.downloads ?? []).filter(Boolean);

  if (!reads.length && !downloads.length) return null;

  return (
    <section
      className={`mt-12 rounded-xl border border-lightGrey bg-warmWhite/60 p-5 md:p-6 shadow-card ${("className" in props && props.className) || ""}`}
      aria-labelledby="event-resources-title"
    >
      <h3 id="event-resources-title" className="mb-4 font-serif text-2xl text-forest">
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
