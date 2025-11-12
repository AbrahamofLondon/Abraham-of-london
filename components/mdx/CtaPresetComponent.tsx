// components/mdx/CtaPresetComponent.tsx
import React from "react";
import Link from "next/link";
import type { CTAPreset, LinkItem, CTAKey } from "./cta-presets";
import { getCtaPreset } from "./cta-presets";

type Props = {
  presetKey?: CTAKey | string;
  title?: string;
  description?: string;
  compact?: boolean;
};

const Section: React.FC<{ title: string; items?: LinkItem[] | null }> = ({
  title,
  items,
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h4>
      <ul className="grid gap-2">
        {items.map((it) => (
          <li key={`${it.href}:${it.label}`}>
            <Link
              href={it.href}
              target={it.external ? "_blank" : undefined}
              rel={it.external ? "noopener noreferrer" : undefined}
              prefetch={false}
              className="block rounded-lg border border-gray-200 p-3 transition hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <div className="flex items-start justify-between">
                <span className="font-medium text-deepCharcoal dark:text-cream">
                  {it.label}
                </span>
                {it.badge ? (
                  <span className="ml-2 inline-flex items-center rounded-full border px-2 text-[10px] uppercase tracking-wide">
                    {it.badge}
                  </span>
                ) : null}
              </div>
              {it.sub ? (
                <p className="mt-1 text-xs text-gray-600">{it.sub}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

const CtaPresetComponent: React.FC<Props> = ({
  presetKey,
  title,
  description,
}) => {
  const view: CTAPreset | null = getCtaPreset(presetKey || "") ?? null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/30">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title || view?.title || "Resources"}</h3>
        {description || view?.description ? (
          <p className="mt-1 text-sm text-gray-600">
            {description || view?.description}
          </p>
        ) : null}
        {!view ? (
          <p className="mt-2 text-xs text-amber-700">
            Preset not found. Showing a generic panel.
          </p>
        ) : null}
      </div>

      <div className="grid gap-6">
        <Section title="Recommended Reads" items={view?.reads ?? null} />
        <Section title="Downloads" items={view?.downloads ?? null} />
        <Section title="Actions" items={view?.actions ?? null} />
        <Section title="Related" items={view?.related ?? null} />
      </div>
    </div>
  );
};

export default CtaPresetComponent;