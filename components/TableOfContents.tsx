// components/TableOfContents.tsx
import * as React from "react";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface TableOfContentsProps {
  items: TocItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  title?: string;
}

export function TableOfContents({
  items,
  activeId,
  onItemClick,
  title = "On this page",
}: TableOfContentsProps): JSX.Element | null {
  if (!items.length) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => {
          const id = item.id; // now actually used
          const isActive = id === activeId;

          return (
            <li key={id}>
              <button
                type="button"
                className={[
                  "w-full text-left text-xs transition-colors",
                  item.level > 1 ? "pl-4" : "",
                  item.level > 2 ? "pl-8" : "",
                  isActive
                    ? "text-forest font-semibold"
                    : "text-muted-foreground",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  onItemClick?.(id);
                  if (typeof document !== "undefined") {
                    const target = document.getElementById(id);
                    if (target) {
                      target.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }
                }}
              >
                {item.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default TableOfContents;
