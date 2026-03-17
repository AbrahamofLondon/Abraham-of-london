// components/FeatureGrid.tsx
import * as React from "react";

export type FeatureGridItem = {
  title: string;
  description?: string;
  content?: string;
  icon?: string;
  color?: string;
};

export type FeatureGridProps = {
  columns?: number;
  features?: FeatureGridItem[];
  items?: FeatureGridItem[];
  className?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getResolvedItems(props: FeatureGridProps): FeatureGridItem[] {
  if (Array.isArray(props.features) && props.features.length > 0) {
    return props.features;
  }
  if (Array.isArray(props.items) && props.items.length > 0) {
    return props.items;
  }
  return [];
}

export default function FeatureGrid({
  columns = 2,
  features,
  items,
  className,
}: FeatureGridProps) {
  const resolvedItems = getResolvedItems({ features, items, columns, className });

  if (!resolvedItems.length) return null;

  const safeColumns = Math.max(1, Math.min(columns, 3));

  return (
    <div className={cn("my-10", className)}>
      <div
        className={cn(
          "grid gap-6",
          safeColumns === 1 && "grid-cols-1",
          safeColumns === 2 && "grid-cols-1 md:grid-cols-2",
          safeColumns >= 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {resolvedItems.map((item, index) => {
          const accent = item.color || "#b8923f";
          const body = item.description || item.content || "";

          return (
            <div
              key={`${item.title}-${index}`}
              className={cn(
                "group relative overflow-hidden rounded-[1.75rem]",
                "border border-stone-200/80 bg-white/85 p-6",
                "shadow-[0_20px_60px_-35px_rgba(0,0,0,0.18)]",
                "dark:border-white/10 dark:bg-white/[0.04]",
              )}
              style={{
                borderTopColor: accent,
                borderTopWidth: "3px",
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/8 to-transparent dark:via-white/10" />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  {item.icon ? (
                    <div
                      className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 text-xl shadow-sm dark:border-white/10"
                      style={{
                        backgroundColor: `${accent}18`,
                        color: accent,
                      }}
                    >
                      <span aria-hidden>{item.icon.startsWith("/") ? "◈" : item.icon}</span>
                    </div>
                  ) : null}

                  <h3 className="font-serif text-2xl leading-tight text-stone-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>

                <div className="shrink-0 rounded-full border border-stone-200/80 bg-stone-50 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.24em] text-stone-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-stone-700 dark:text-white/70">
                {body}
              </p>

              <div
                className="mt-6 h-px w-16 transition-all duration-300 group-hover:w-24"
                style={{ backgroundColor: accent }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}