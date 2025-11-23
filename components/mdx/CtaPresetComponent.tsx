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
  className?: string;
  maxItems?: number; // New: Limit items per section
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

const getBadgeColor = (badge: LinkItem["badge"]) => {
  const colors = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    popular: "bg-purple-100 text-purple-800 border-purple-200",
    featured: "bg-amber-100 text-amber-800 border-amber-200",
    free: "bg-green-100 text-green-800 border-green-200",
  };
  return colors[badge] || "bg-gray-100 text-gray-800 border-gray-200";
};

const LinkItemComponent: React.FC<{ item: LinkItem }> = ({ item }) => {
  const href = item.href || "#";
  const external = item.external ?? isExternal(href);

  const content = (
    <div className="group block rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-softGold hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {item.icon && <span className="text-base">{item.icon}</span>}
            <span className="font-medium text-sm text-deepCharcoal truncate">
              {item.label}
            </span>
          </div>
          {item.sub && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.sub}</p>
          )}
        </div>
        {item.badge && (
          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 ${getBadgeColor(item.badge)}`}>
            {item.badge}
          </span>
        )}
      </div>
      
      {external && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>External link</span>
        </div>
      )}
    </div>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline hover:no-underline"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className="no-underline hover:no-underline">
      {content}
    </Link>
  );
};

const Section: React.FC<{
  title: string;
  items?: LinkItem[] | null;
  maxItems?: number;
}> = ({ title, items, maxItems }) => {
  if (!items || items.length === 0) return null;

  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  const hasMore = maxItems && items.length > maxItems;

  return (
    <section className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </h4>
      <ul className="grid gap-3">
        {displayItems.map((item, index) => (
          <li key={`${item.href}:${item.label}:${index}`}>
            <LinkItemComponent item={item} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <p className="text-xs text-gray-400 text-center">
          +{items.length - maxItems} more items
        </p>
      )}
    </section>
  );
};

const CtaPresetComponent: React.FC<Props> = ({
  presetKey,
  title,
  description,
  compact = false,
  className = "",
  maxItems,
}) => {
  const rawKey = (presetKey ?? "").toString().trim().toLowerCase();
  const view: CTAPreset | null = getCtaPreset(rawKey);

  const hasReads = view?.reads && view.reads.length > 0;
  const hasDownloads = view?.downloads && view.downloads.length > 0;
  const hasActions = view?.actions && view.actions.length > 0;
  const hasRelated = view?.related && view.related.length > 0;
  const hasFeatured = view?.featured;

  const hasAny = hasReads || hasDownloads || hasActions || hasRelated || hasFeatured;

  // If there is no preset and no custom copy, render nothing
  if (!view && !title && !description) {
    return null;
  }

  const shellTitle = title || view?.title || "Resources";
  const shellDescription = description || view?.description || null;

  const padding = compact ? "p-4" : "p-6";
  const gridLayout = compact ? "grid gap-4" : "grid gap-6 md:grid-cols-2";

  return (
    <div
      className={[
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        padding,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-deepCharcoal sm:text-xl">
          {shellTitle}
        </h3>
        {shellDescription && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            {shellDescription}
          </p>
        )}
        {!view && presetKey && (
          <div className="mt-3 rounded-md bg-amber-50 p-3">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Preset "{presetKey}" not found. Showing generic resources panel.
            </p>
          </div>
        )}
      </div>

      {hasAny ? (
        <div className={gridLayout}>
          {/* Featured item first if it exists */}
          {hasFeatured && (
            <section className="md:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
                Featured
              </h4>
              <LinkItemComponent item={view!.featured!} />
            </section>
          )}
          
          <Section 
            title="Recommended Reads" 
            items={view?.reads ?? null} 
            maxItems={maxItems}
          />
          <Section 
            title="Downloads" 
            items={view?.downloads ?? null} 
            maxItems={maxItems}
          />
          
          {!compact && (
            <>
              <Section 
                title="Take Action" 
                items={view?.actions ?? null} 
                maxItems={maxItems}
              />
              <Section 
                title="Related Resources" 
                items={view?.related ?? null} 
                maxItems={maxItems}
              />
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg">📭</div>
          <p className="mt-2 text-sm text-gray-500">No resources available for this preset.</p>
        </div>
      )}
    </div>
  );
};

export default CtaPresetComponent;