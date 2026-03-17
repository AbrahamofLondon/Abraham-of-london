"use client";

import * as React from "react";
import { ChevronRight, Navigation } from "lucide-react";
import { classNames } from "@/lib/utils/safe"; // adjust import if using clsx/tailwind-merge

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef?: React.RefObject<HTMLElement>;
  className?: string;
  maxHeadings?: number;
  delayMs?: number;
}

function getHeadingLevel(heading: Element): number {
  const tag = (heading as HTMLElement)?.tagName?.toUpperCase() || "";
  const match = tag.match(/^H([1-6])$/);
  return match ? Number(match[1]) : 2;
}

function makeId(text: string, index: number): string {
  const base = String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
  return base || `section-${index}`;
}

function collectHeadings(root: HTMLElement | null, maxHeadings: number = 50): Heading[] {
  if (!root) return [];

  const selector = "h2, h3, h4, h5";
  const elements = Array.from(root.querySelectorAll(selector));
  const used = new Set<string>();
  const extracted: Heading[] = [];

  for (let i = 0; i < elements.length && extracted.length < maxHeadings; i++) {
    const el = elements[i] as HTMLElement;
    if (el.closest("[data-toc-root='true']")) continue;

    const text = (el.textContent || "").trim();
    if (!text) continue;

    let id = el.id?.trim();
    if (!id) {
      id = makeId(text, i);
      if (!el.id) el.id = id;
    }

    let uniqueId = id;
    let suffix = 2;
    while (used.has(uniqueId)) {
      uniqueId = `${id}-${suffix}`;
      suffix++;
    }
    used.add(uniqueId);

    extracted.push({
      id: uniqueId,
      text,
      level: getHeadingLevel(el),
    });
  }

  return extracted;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  contentRef,
  className = "",
  maxHeadings = 50,
  delayMs = 300,
}) => {
  const [headings, setHeadings] = React.useState<Heading[]>([]);
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const root =
      contentRef?.current ||
      document.querySelector(".aol-mdx-content") ||
      document.querySelector(".prose-hardened") ||
      document.querySelector("main") ||
      document.body;

    if (!root) return;

    let timeoutId: NodeJS.Timeout;

    const syncHeadings = () => {
      const next = collectHeadings(root as HTMLElement, maxHeadings);
      setHeadings(next);
    };

    timeoutId = setTimeout(syncHeadings, delayMs);

    const observer = new MutationObserver(syncHeadings);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["id"],
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [contentRef, maxHeadings, delayMs]);

  React.useEffect(() => {
    if (!headings.length) return;

    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);

    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        // FIXED: null check before accessing [0]
        if (visible.length > 0 && visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-18% 0% -70% 0%",
        threshold: [0.05, 0.2, 0.5],
      }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [headings]);

  const scrollToHeading = React.useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;

    const offset = 120;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });

    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  }, []);

  if (!headings.length) return null;

  return (
    <aside className={classNames("my-10", className)} data-toc-root="true">
      <nav className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30">
              <Navigation className="h-4 w-4 text-amber-200/70" />
            </span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                In This Article
              </div>
              <div className="mt-1 text-xs text-white/45">{headings.length} sections</div>
            </div>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
            {(headings.findIndex((h) => h.id === activeId) + 1) || 0} of {headings.length}
          </div>
        </div>

        <div className="px-4 py-4">
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-2">
            {headings.map((h) => {
              const isActive = activeId === h.id;
              const indent =
                h.level === 3 ? "pl-6" : h.level === 4 ? "pl-10" : h.level >= 5 ? "pl-14" : "";

              return (
                <li key={h.id} className={indent}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => scrollToHeading(h.id, e)}
                    className={classNames(
                      "group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        : "border-transparent text-white/70 hover:bg-white/[0.03] hover:text-white"
                    )}
                  >
                    <span
                      className={classNames(
                        "h-2.5 w-2.5 rounded-full transition-colors",
                        isActive ? "bg-amber-400" : "bg-white/20 group-hover:bg-white/30"
                      )}
                    />
                    <span className="line-clamp-2 flex-1 leading-relaxed">{h.text}</span>
                    {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0 text-amber-300/80" />}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/45">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400/70 animate-pulse" />
              <span>Currently reading</span>
            </div>
            <div className="max-w-[45%] truncate font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">
              {activeId ? headings.find((x) => x.id === activeId)?.text || "—" : "—"}
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export const SafeTableOfContents: React.FC<TableOfContentsProps> = (props) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <TableOfContents {...props} />;
};

export default TableOfContents;