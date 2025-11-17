// components/mdx/CtaPresetComponent.tsx
import * as React from "react";
import Link from "next/link";
import {
  getCtaPreset,
  type CTAPreset,
  type LinkItem,
  type CTAKey,
} from "@/components/mdx/cta-presets";

type Props = {
  presetKey?: CTAKey | string;
  title?: string;
  description?: string;
  compact?: boolean;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

const Section: React.FC<{
  title: string;
  items?: LinkItem[] | null;
}> = ({ title, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </h4>
      <ul className="grid gap-2">
        {items.map((it) => {
          const href = it.href || "#";
          const external = it.external ?? isExternal(href);

          const content = (
            <div className="block rounded-lg border border-lightGrey/70 bg-white/90 p-3 text-left shadow-sm transition hover:border-softGold/60 hover:bg-warmWhite/90">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm text-deepCharcoal">
                  {it.label}
                </span>
                {it.badge ? (
                  <span className="ml-2 inline-flex items-center rounded-full border border-softGold/40 px-2 text-[10px] font-semibold uppercase tracking-wide text-softGold">
                    {it.badge}
                  </span>
                ) : null}
              </div>
              {it.sub ? (
                <p className="mt-1 text-xs text-gray-600">{it.sub}</p>
              ) : null}
            </div>
          );

          return (
            <li key={`${href}:${it.label}`}>
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  {content}
                </a>
              ) : (
                <Link href={href} prefetch={false} className="no-underline">
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const CtaPresetComponent: React.FC<Props> = ({
  presetKey,
  title,
  description,
  compact = false,
}) => {
  const rawKey = (presetKey ?? "").toString().trim().toLowerCase();
  const view: CTAPreset | null = getCtaPreset(rawKey);

  const hasReads = view?.reads && view.reads.length > 0;
  const hasDownloads = view?.downloads && view.downloads.length > 0;
  const hasActions = view?.actions && view.actions.length > 0;
  const hasRelated = view?.related && view.related.length > 0;

  const hasAny = hasReads || hasDownloads || hasActions || hasRelated;

  // If there is no preset and no custom copy, render nothing rather than
  // throwing MDX errors.
  if (!view && !title && !description) {
    return null;
  }

  const shellTitle = title || view?.title || "Resources";
  const shellDescription = description || view?.description || null;

  const padding = compact ? "p-4" : "p-5 sm:p-6";

  return (
    <div
      className={[
        "rounded-2xl border border-lightGrey bg-white/90 shadow-sm backdrop-blur-sm",
        padding,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-deepCharcoal">
          {shellTitle}
        </h3>
        {shellDescription && (
          <p className="mt-1 text-sm text-gray-600">{shellDescription}</p>
        )}
        {!view && (
          <p className="mt-2 text-[11px] text-amber-700">
            Preset not found. Showing a generic panel.
          </p>
        )}
      </div>

      {hasAny ? (
        <div className={compact ? "grid gap-4" : "grid gap-6 sm:grid-cols-2"}>
          <Section title="Recommended reads" items={view?.reads ?? null} />
          <Section title="Downloads" items={view?.downloads ?? null} />
          {!compact && (
            <>
              <Section title="Actions" items={view?.actions ?? null} />
              <Section title="Related" items={view?.related ?? null} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default CtaPresetComponent;