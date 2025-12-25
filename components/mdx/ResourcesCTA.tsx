// components/mdx/ResourcesCTA.tsx
import * as React from "react";
import Link from "next/link";
import {
  getCtaPreset,
  type CTAKey,
  type CTAPreset,
  type LinkItem,
} from "@/components/mdx/cta-presets";

type ResourcesCTAProps = {
  /** Preset key - can be CTAKey or string in MDX: <ResourcesCTA preset="fatherhood" /> */
  preset?: CTAKey | string;
  /** Optional overrides from MDX */
  titleOverride?: string;
  descriptionOverride?: string;
  className?: string;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

function LinkChip({ item }: { item: LinkItem }) {
  const href = item.href || "#";
  const label = item.label || href;
  const sub = item.sub;
  const badge = item.badge;
  const external = item.external ?? isExternal(href);

  const content = (
    <div className="flex flex-col gap-0.5 rounded-xl border border-lightGrey/70 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:border-softGold/60 hover:bg-warmWhite/80">
      <div className="flex items-center gap-2">
        {item.icon ? (
          <span className="text-lg leading-none">{item.icon}</span>
        ) : null}
        <span className="text-sm font-semibold text-deepCharcoal">{label}</span>
        {badge && (
          <span className="ml-auto inline-flex items-center rounded-full bg-softGold/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-softGold">
            {badge}
          </span>
        )}
      </div>
      {sub && <p className="text-[0.75rem] text-gray-600">{sub}</p>}
    </div>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="block no-underline">
      {content}
    </Link>
  );
}

function Section({ title, items }: { title: string; items?: LinkItem[] }) {
  if (!items || !items.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, idx) => (
          <LinkChip key={`${item.href}-${idx}`} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ResourcesCTA(props: ResourcesCTAProps) {
  const { preset, titleOverride, descriptionOverride, className = "" } = props;

  const rawKey = (preset ?? "").toString().trim().toLowerCase();
  const config: CTAPreset | null = getCtaPreset(rawKey);

  // Fail-safe: if preset is unknown or missing, render nothing so MDX doesn't explode.
  if (!config) return null;

  const title = titleOverride || config.title;
  const description = descriptionOverride || config.description;

  const hasReads = config.reads && config.reads.length > 0;
  const hasDownloads = config.downloads && config.downloads.length > 0;
  const hasActions = config.actions && config.actions.length > 0;
  const hasRelated = config.related && config.related.length > 0;

  const hasAny =
    hasReads || hasDownloads || hasActions || hasRelated || !!config.featured;

  if (!hasAny) return null;

  const tone =
    config.theme === "fatherhood"
      ? "border-softGold/40 bg-warmWhite/80"
      : config.theme === "brotherhood"
        ? "border-forest/30 bg-forest/3"
        : config.theme === "leadership"
          ? "border-deepCharcoal/25 bg-slate-900/2"
          : "border-lightGrey bg-white/80";

  return (
    <section
      className={[
        "my-10 rounded-3xl border px-5 py-6 shadow-sm backdrop-blur-sm sm:px-6 sm:py-7",
        tone,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline">
        <div className="flex-1">
          <h2 className="font-serif text-xl font-semibold text-deepCharcoal sm:text-2xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-gray-700">
              {description}
            </p>
          )}
        </div>

        {config.featured && (
          <div className="mt-2 sm:mt-0">
            <LinkChip item={config.featured} />
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {hasReads && (
          <Section title="Recommended reading" items={config.reads} />
        )}
        {hasDownloads && <Section title="Downloads" items={config.downloads} />}
        {hasActions && <Section title="Next steps" items={config.actions} />}
        {hasRelated && (
          <Section title="Related resources" items={config.related} />
        )}
      </div>
    </section>
  );
}
